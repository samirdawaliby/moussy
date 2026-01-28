import { Hono } from 'hono';
import { z } from 'zod';
import type { Bindings, Variables } from '../index';
import { requireRole } from '../middleware/auth';

const enfantsRoutes = new Hono<{ Bindings: Bindings; Variables: Variables }>();

// Validation schemas
const createEnfantSchema = z.object({
  creche_id: z.string(),
  prenom: z.string().min(2),
  nom: z.string().min(2),
  date_naissance: z.string(), // ISO date
  sexe: z.enum(['M', 'F']),
  allergies: z.array(z.string()).optional(),
  regime_alimentaire: z.enum(['normal', 'vegetarien', 'sans_porc', 'sans_gluten', 'autre']).default('normal'),
  medicaments: z.array(z.string()).optional(),
  medecin_traitant: z.string().optional(),
  medecin_telephone: z.string().optional(),
  type_contrat: z.enum(['regulier', 'occasionnel', 'urgence']).default('regulier'),
  heures_contrat_semaine: z.number().optional(),
  date_debut_contrat: z.string().optional(),
  date_fin_contrat: z.string().optional(),
});

const createParentSchema = z.object({
  type_parent: z.enum(['pere', 'mere', 'tuteur', 'autre']),
  nom: z.string().min(2),
  prenom: z.string().min(2),
  email: z.string().email(),
  telephone: z.string(),
  telephone_urgence: z.string().optional(),
  adresse: z.string().optional(),
  code_postal: z.string().optional(),
  ville: z.string().optional(),
  langue_preferee: z.string().default('fr'),
  autorisation_photos: z.boolean().default(false),
  autorisation_sortie: z.boolean().default(false),
});

function generateId(): string {
  return crypto.randomUUID();
}

// Get single enfant with full details
enfantsRoutes.get('/:id', async (c) => {
  const id = c.req.param('id');
  const user = c.get('user');

  // Get enfant
  const enfant = await c.env.DB.prepare(
    'SELECT * FROM enfants WHERE id = ?'
  ).bind(id).first();

  if (!enfant) {
    return c.json({
      success: false,
      error: { code: 'NOT_FOUND', message: 'Enfant not found' },
    }, 404);
  }

  // Check access - parents can only see their own children
  if (user?.type === 'parent') {
    const isParent = await c.env.DB.prepare(
      'SELECT id FROM parents WHERE enfant_id = ? AND id = ?'
    ).bind(id, user.id).first();

    if (!isParent) {
      return c.json({
        success: false,
        error: { code: 'FORBIDDEN', message: 'Access denied' },
      }, 403);
    }
  }

  // Get parents
  const parents = await c.env.DB.prepare(
    'SELECT id, type_parent, nom, prenom, email, telephone, langue_preferee FROM parents WHERE enfant_id = ?'
  ).bind(id).all();

  // Get personnes autorisees
  const personnesAutorisees = await c.env.DB.prepare(
    'SELECT id, nom, prenom, lien, telephone, photo_url FROM personnes_autorisees WHERE enfant_id = ?'
  ).bind(id).all();

  return c.json({
    success: true,
    data: {
      ...enfant,
      allergies: enfant.allergies ? JSON.parse(enfant.allergies as string) : [],
      medicaments: enfant.medicaments ? JSON.parse(enfant.medicaments as string) : [],
      parents: parents.results,
      personnes_autorisees: personnesAutorisees.results,
    },
  });
});

// Create enfant
enfantsRoutes.post('/', requireRole('directeur', 'auxiliaire'), async (c) => {
  const body = await c.req.json();
  const parsed = createEnfantSchema.safeParse(body);

  if (!parsed.success) {
    return c.json({
      success: false,
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Invalid request body',
        details: parsed.error.flatten(),
      },
    }, 400);
  }

  const id = generateId();
  const data = parsed.data;

  await c.env.DB.prepare(`
    INSERT INTO enfants (
      id, creche_id, prenom, nom, date_naissance, sexe,
      allergies, regime_alimentaire, medicaments,
      medecin_traitant, medecin_telephone,
      type_contrat, heures_contrat_semaine,
      date_debut_contrat, date_fin_contrat
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).bind(
    id,
    data.creche_id,
    data.prenom,
    data.nom,
    data.date_naissance,
    data.sexe,
    data.allergies ? JSON.stringify(data.allergies) : null,
    data.regime_alimentaire,
    data.medicaments ? JSON.stringify(data.medicaments) : null,
    data.medecin_traitant || null,
    data.medecin_telephone || null,
    data.type_contrat,
    data.heures_contrat_semaine || null,
    data.date_debut_contrat || null,
    data.date_fin_contrat || null
  ).run();

  return c.json({
    success: true,
    data: { id, ...data },
  }, 201);
});

// Update enfant
enfantsRoutes.put('/:id', requireRole('directeur', 'auxiliaire'), async (c) => {
  const id = c.req.param('id');
  const body = await c.req.json();
  const parsed = createEnfantSchema.partial().safeParse(body);

  if (!parsed.success) {
    return c.json({
      success: false,
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Invalid request body',
        details: parsed.error.flatten(),
      },
    }, 400);
  }

  const data = parsed.data;
  const updates: string[] = [];
  const values: (string | number | null)[] = [];

  for (const [key, value] of Object.entries(data)) {
    if (value !== undefined) {
      updates.push(`${key} = ?`);
      if (key === 'allergies' || key === 'medicaments') {
        values.push(JSON.stringify(value));
      } else {
        values.push(value as string | number | null);
      }
    }
  }

  if (updates.length === 0) {
    return c.json({
      success: false,
      error: { code: 'NO_UPDATES', message: 'No fields to update' },
    }, 400);
  }

  updates.push('updated_at = CURRENT_TIMESTAMP');
  values.push(id);

  await c.env.DB.prepare(
    `UPDATE enfants SET ${updates.join(', ')} WHERE id = ?`
  ).bind(...values).run();

  return c.json({
    success: true,
    message: 'Enfant updated successfully',
  });
});

// Add parent to enfant
enfantsRoutes.post('/:id/parents', requireRole('directeur'), async (c) => {
  const enfantId = c.req.param('id');
  const body = await c.req.json();
  const parsed = createParentSchema.safeParse(body);

  if (!parsed.success) {
    return c.json({
      success: false,
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Invalid request body',
        details: parsed.error.flatten(),
      },
    }, 400);
  }

  const id = generateId();
  const data = parsed.data;

  await c.env.DB.prepare(`
    INSERT INTO parents (
      id, enfant_id, type_parent, nom, prenom, email, telephone,
      telephone_urgence, adresse, code_postal, ville,
      langue_preferee, autorisation_photos, autorisation_sortie
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).bind(
    id,
    enfantId,
    data.type_parent,
    data.nom,
    data.prenom,
    data.email,
    data.telephone,
    data.telephone_urgence || null,
    data.adresse || null,
    data.code_postal || null,
    data.ville || null,
    data.langue_preferee,
    data.autorisation_photos ? 1 : 0,
    data.autorisation_sortie ? 1 : 0
  ).run();

  return c.json({
    success: true,
    data: { id, enfant_id: enfantId, ...data },
  }, 201);
});

// Get enfant's pointages history
enfantsRoutes.get('/:id/pointages', async (c) => {
  const id = c.req.param('id');
  const mois = c.req.query('mois'); // Format: 2024-01

  let query = 'SELECT * FROM pointages WHERE enfant_id = ?';
  const params: string[] = [id];

  if (mois) {
    query += " AND strftime('%Y-%m', date) = ?";
    params.push(mois);
  }

  query += ' ORDER BY date DESC, heure_arrivee DESC';

  const result = await c.env.DB.prepare(query).bind(...params).all();

  return c.json({
    success: true,
    data: result.results,
  });
});

// Get enfant's activities for a date
enfantsRoutes.get('/:id/activites', async (c) => {
  const id = c.req.param('id');
  const date = c.req.query('date') || new Date().toISOString().split('T')[0];

  const result = await c.env.DB.prepare(
    'SELECT * FROM activites WHERE enfant_id = ? AND date = ? ORDER BY heure ASC'
  ).bind(id, date).all();

  return c.json({
    success: true,
    data: result.results.map((r: Record<string, unknown>) => ({
      ...r,
      details: r.details ? JSON.parse(r.details as string) : {},
    })),
  });
});

// Upload photo
enfantsRoutes.post('/:id/photo', requireRole('directeur', 'auxiliaire'), async (c) => {
  const id = c.req.param('id');

  const formData = await c.req.formData();
  const file = formData.get('photo') as File | null;

  if (!file) {
    return c.json({
      success: false,
      error: { code: 'NO_FILE', message: 'No photo file provided' },
    }, 400);
  }

  // Upload to R2
  const key = `photos/enfants/${id}/profile_${Date.now()}.jpg`;
  await c.env.STORAGE.put(key, file.stream(), {
    httpMetadata: { contentType: file.type },
  });

  // Update enfant with photo URL
  const photoUrl = `https://storage.moussy.fr/${key}`;
  await c.env.DB.prepare(
    'UPDATE enfants SET photo_url = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?'
  ).bind(photoUrl, id).run();

  return c.json({
    success: true,
    data: { photo_url: photoUrl },
  });
});

export { enfantsRoutes };
