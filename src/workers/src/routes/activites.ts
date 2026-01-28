import { Hono } from 'hono';
import { z } from 'zod';
import type { Bindings, Variables } from '../index';
import { requireRole } from '../middleware/auth';

const activitesRoutes = new Hono<{ Bindings: Bindings; Variables: Variables }>();

// Validation schemas
const repasDetailsSchema = z.object({
  type: z.enum(['petit_dejeuner', 'dejeuner', 'gouter', 'diner']),
  quantite: z.enum(['rien', 'peu', 'moyen', 'bien', 'tres_bien']),
  menu: z.string().optional(),
  biberon_ml: z.number().optional(),
});

const sommeilDetailsSchema = z.object({
  debut: z.string(),
  fin: z.string().optional(),
  qualite: z.enum(['agite', 'normal', 'bon', 'tres_bon']).optional(),
});

const changeDetailsSchema = z.object({
  etat: z.enum(['normal', 'mou', 'liquide']),
  creme: z.boolean().default(false),
  commentaire: z.string().optional(),
});

const activiteDetailsSchema = z.object({
  description: z.string(),
  participation: z.enum(['observateur', 'timide', 'active', 'tres_active']).optional(),
});

const soinDetailsSchema = z.object({
  type: z.enum(['medicament', 'temperature', 'soin']),
  description: z.string(),
});

const observationDetailsSchema = z.object({
  description: z.string(),
});

const createActiviteSchema = z.object({
  enfant_id: z.string(),
  type_activite: z.enum(['repas', 'sommeil', 'change', 'activite', 'soin', 'observation']),
  details: z.union([
    repasDetailsSchema,
    sommeilDetailsSchema,
    changeDetailsSchema,
    activiteDetailsSchema,
    soinDetailsSchema,
    observationDetailsSchema,
  ]),
  heure: z.string().optional(), // If not provided, use current time
});

function generateId(): string {
  return crypto.randomUUID();
}

function getToday(): string {
  return new Date().toISOString().split('T')[0];
}

function getCurrentTime(): string {
  return new Date().toTimeString().split(' ')[0].substring(0, 5);
}

// Create activity
activitesRoutes.post('/', requireRole('directeur', 'auxiliaire'), async (c) => {
  const body = await c.req.json();
  const parsed = createActiviteSchema.safeParse(body);

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

  const user = c.get('user');
  const { enfant_id, type_activite, details, heure } = parsed.data;
  const id = generateId();
  const today = getToday();
  const currentHeure = heure || getCurrentTime();

  await c.env.DB.prepare(`
    INSERT INTO activites (id, enfant_id, employe_id, date, heure, type_activite, details)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `).bind(
    id,
    enfant_id,
    user?.id || null,
    today,
    currentHeure,
    type_activite,
    JSON.stringify(details)
  ).run();

  return c.json({
    success: true,
    data: {
      id,
      enfant_id,
      type_activite,
      date: today,
      heure: currentHeure,
      details,
    },
  }, 201);
});

// Get activities for a child on a date
activitesRoutes.get('/enfant/:enfant_id', async (c) => {
  const enfantId = c.req.param('enfant_id');
  const date = c.req.query('date') || getToday();

  const result = await c.env.DB.prepare(`
    SELECT a.*, e.prenom as employe_prenom, e.nom as employe_nom
    FROM activites a
    LEFT JOIN employes e ON a.employe_id = e.id
    WHERE a.enfant_id = ? AND a.date = ?
    ORDER BY a.heure ASC
  `).bind(enfantId, date).all();

  return c.json({
    success: true,
    data: result.results.map((r: Record<string, unknown>) => ({
      ...r,
      details: r.details ? JSON.parse(r.details as string) : {},
      employe: r.employe_prenom ? `${r.employe_prenom} ${r.employe_nom}` : null,
    })),
  });
});

// Get all activities for a creche on a date
activitesRoutes.get('/creche/:creche_id', async (c) => {
  const crecheId = c.req.param('creche_id');
  const date = c.req.query('date') || getToday();

  const result = await c.env.DB.prepare(`
    SELECT
      a.*,
      enf.prenom as enfant_prenom,
      enf.nom as enfant_nom,
      enf.photo_url as enfant_photo,
      emp.prenom as employe_prenom,
      emp.nom as employe_nom
    FROM activites a
    JOIN enfants enf ON a.enfant_id = enf.id
    LEFT JOIN employes emp ON a.employe_id = emp.id
    WHERE enf.creche_id = ? AND a.date = ?
    ORDER BY a.heure DESC
  `).bind(crecheId, date).all();

  return c.json({
    success: true,
    data: result.results.map((r: Record<string, unknown>) => ({
      ...r,
      details: r.details ? JSON.parse(r.details as string) : {},
      enfant: {
        prenom: r.enfant_prenom,
        nom: r.enfant_nom,
        photo_url: r.enfant_photo,
      },
      employe: r.employe_prenom ? `${r.employe_prenom} ${r.employe_nom}` : null,
    })),
  });
});

// Get single activity
activitesRoutes.get('/:id', async (c) => {
  const id = c.req.param('id');

  const activite = await c.env.DB.prepare(`
    SELECT a.*, e.prenom as employe_prenom, e.nom as employe_nom
    FROM activites a
    LEFT JOIN employes e ON a.employe_id = e.id
    WHERE a.id = ?
  `).bind(id).first();

  if (!activite) {
    return c.json({
      success: false,
      error: { code: 'NOT_FOUND', message: 'Activity not found' },
    }, 404);
  }

  return c.json({
    success: true,
    data: {
      ...activite,
      details: activite.details ? JSON.parse(activite.details as string) : {},
      employe: activite.employe_prenom
        ? `${activite.employe_prenom} ${activite.employe_nom}`
        : null,
    },
  });
});

// Update activity
activitesRoutes.put('/:id', requireRole('directeur', 'auxiliaire'), async (c) => {
  const id = c.req.param('id');
  const body = await c.req.json();

  const { details, heure } = body;

  if (!details && !heure) {
    return c.json({
      success: false,
      error: { code: 'NO_UPDATES', message: 'No fields to update' },
    }, 400);
  }

  const updates: string[] = [];
  const values: (string | null)[] = [];

  if (details) {
    updates.push('details = ?');
    values.push(JSON.stringify(details));
  }

  if (heure) {
    updates.push('heure = ?');
    values.push(heure);
  }

  values.push(id);

  await c.env.DB.prepare(
    `UPDATE activites SET ${updates.join(', ')} WHERE id = ?`
  ).bind(...values).run();

  return c.json({
    success: true,
    message: 'Activity updated successfully',
  });
});

// Delete activity
activitesRoutes.delete('/:id', requireRole('directeur', 'auxiliaire'), async (c) => {
  const id = c.req.param('id');

  await c.env.DB.prepare('DELETE FROM activites WHERE id = ?').bind(id).run();

  return c.json({
    success: true,
    message: 'Activity deleted successfully',
  });
});

// Quick entry endpoints for common activities
activitesRoutes.post('/repas', requireRole('directeur', 'auxiliaire'), async (c) => {
  const body = await c.req.json();
  const { enfant_id, ...details } = body;

  // Redirect to main create endpoint
  return activitesRoutes.fetch(
    new Request(c.req.url, {
      method: 'POST',
      headers: c.req.raw.headers,
      body: JSON.stringify({
        enfant_id,
        type_activite: 'repas',
        details,
      }),
    }),
    c.env
  );
});

activitesRoutes.post('/sommeil', requireRole('directeur', 'auxiliaire'), async (c) => {
  const body = await c.req.json();
  const { enfant_id, ...details } = body;

  return activitesRoutes.fetch(
    new Request(c.req.url, {
      method: 'POST',
      headers: c.req.raw.headers,
      body: JSON.stringify({
        enfant_id,
        type_activite: 'sommeil',
        details,
      }),
    }),
    c.env
  );
});

activitesRoutes.post('/change', requireRole('directeur', 'auxiliaire'), async (c) => {
  const body = await c.req.json();
  const { enfant_id, ...details } = body;

  return activitesRoutes.fetch(
    new Request(c.req.url, {
      method: 'POST',
      headers: c.req.raw.headers,
      body: JSON.stringify({
        enfant_id,
        type_activite: 'change',
        details,
      }),
    }),
    c.env
  );
});

export { activitesRoutes };
