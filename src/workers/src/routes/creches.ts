import { Hono } from 'hono';
import { z } from 'zod';
import type { Bindings, Variables } from '../index';
import { requireRole } from '../middleware/auth';

const crechesRoutes = new Hono<{ Bindings: Bindings; Variables: Variables }>();

// Validation schemas
const createCrecheSchema = z.object({
  nom: z.string().min(2),
  adresse: z.string().min(5),
  code_postal: z.string().length(5),
  ville: z.string().min(2),
  telephone: z.string().optional(),
  email: z.string().email().optional(),
  siret: z.string().optional(),
  capacite_max: z.number().int().positive().default(20),
  type_structure: z.enum(['micro_creche', 'creche_collective', 'creche_familiale', 'multi_accueil']).default('micro_creche'),
  horaires_ouverture: z.string().default('07:30'),
  horaires_fermeture: z.string().default('18:30'),
});

// Generate UUID
function generateId(): string {
  return crypto.randomUUID();
}

// List all creches
crechesRoutes.get('/', async (c) => {
  const user = c.get('user');

  let query = 'SELECT * FROM creches';
  let params: string[] = [];

  // If user is not admin, only show their creche
  if (user?.type === 'employe' && user.creche_id) {
    query += ' WHERE id = ?';
    params.push(user.creche_id);
  }

  const result = await c.env.DB.prepare(query).bind(...params).all();

  return c.json({
    success: true,
    data: result.results,
  });
});

// Get single creche
crechesRoutes.get('/:id', async (c) => {
  const id = c.req.param('id');
  const user = c.get('user');

  // Check access
  if (user?.type === 'employe' && user.creche_id && user.creche_id !== id) {
    return c.json({
      success: false,
      error: { code: 'FORBIDDEN', message: 'Access denied to this creche' },
    }, 403);
  }

  const creche = await c.env.DB.prepare('SELECT * FROM creches WHERE id = ?')
    .bind(id)
    .first();

  if (!creche) {
    return c.json({
      success: false,
      error: { code: 'NOT_FOUND', message: 'Creche not found' },
    }, 404);
  }

  // Get stats
  const stats = await c.env.DB.prepare(`
    SELECT
      (SELECT COUNT(*) FROM enfants WHERE creche_id = ? AND actif = 1) as total_enfants,
      (SELECT COUNT(*) FROM employes WHERE creche_id = ? AND actif = 1) as total_employes
  `).bind(id, id).first<{ total_enfants: number; total_employes: number }>();

  return c.json({
    success: true,
    data: {
      ...creche,
      stats,
    },
  });
});

// Create creche (admin only)
crechesRoutes.post('/', requireRole('directeur'), async (c) => {
  const body = await c.req.json();
  const parsed = createCrecheSchema.safeParse(body);

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
    INSERT INTO creches (id, nom, adresse, code_postal, ville, telephone, email, siret, capacite_max, type_structure, horaires_ouverture, horaires_fermeture)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).bind(
    id,
    data.nom,
    data.adresse,
    data.code_postal,
    data.ville,
    data.telephone || null,
    data.email || null,
    data.siret || null,
    data.capacite_max,
    data.type_structure,
    data.horaires_ouverture,
    data.horaires_fermeture
  ).run();

  return c.json({
    success: true,
    data: { id, ...data },
  }, 201);
});

// Update creche
crechesRoutes.put('/:id', requireRole('directeur'), async (c) => {
  const id = c.req.param('id');
  const body = await c.req.json();
  const parsed = createCrecheSchema.partial().safeParse(body);

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

  // Build dynamic update query
  const data = parsed.data;
  const updates: string[] = [];
  const values: (string | number | null)[] = [];

  for (const [key, value] of Object.entries(data)) {
    if (value !== undefined) {
      updates.push(`${key} = ?`);
      values.push(value);
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
    `UPDATE creches SET ${updates.join(', ')} WHERE id = ?`
  ).bind(...values).run();

  return c.json({
    success: true,
    message: 'Creche updated successfully',
  });
});

// Delete creche (soft delete by setting a flag, or hard delete)
crechesRoutes.delete('/:id', requireRole('directeur'), async (c) => {
  const id = c.req.param('id');

  // Check if creche exists
  const creche = await c.env.DB.prepare('SELECT id FROM creches WHERE id = ?')
    .bind(id)
    .first();

  if (!creche) {
    return c.json({
      success: false,
      error: { code: 'NOT_FOUND', message: 'Creche not found' },
    }, 404);
  }

  // Delete (cascade will handle related records)
  await c.env.DB.prepare('DELETE FROM creches WHERE id = ?').bind(id).run();

  return c.json({
    success: true,
    message: 'Creche deleted successfully',
  });
});

// Get creche employees
crechesRoutes.get('/:id/employes', async (c) => {
  const id = c.req.param('id');

  const result = await c.env.DB.prepare(
    'SELECT id, nom, prenom, email, telephone, role, photo_url, actif FROM employes WHERE creche_id = ?'
  ).bind(id).all();

  return c.json({
    success: true,
    data: result.results,
  });
});

// Get creche children
crechesRoutes.get('/:id/enfants', async (c) => {
  const id = c.req.param('id');
  const actif = c.req.query('actif');

  let query = 'SELECT id, prenom, nom, date_naissance, photo_url, allergies, actif FROM enfants WHERE creche_id = ?';
  const params: (string | number)[] = [id];

  if (actif !== undefined) {
    query += ' AND actif = ?';
    params.push(actif === 'true' ? 1 : 0);
  }

  const result = await c.env.DB.prepare(query).bind(...params).all();

  return c.json({
    success: true,
    data: result.results,
  });
});

export { crechesRoutes };
