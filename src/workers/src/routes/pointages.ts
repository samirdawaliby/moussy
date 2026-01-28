import { Hono } from 'hono';
import { z } from 'zod';
import type { Bindings, Variables } from '../index';
import { requireRole } from '../middleware/auth';

const pointagesRoutes = new Hono<{ Bindings: Bindings; Variables: Variables }>();

// Validation schemas
const arriveeSchema = z.object({
  enfant_id: z.string(),
  methode: z.enum(['manuel', 'qr_code', 'nfc']).default('manuel'),
  commentaire: z.string().optional(),
});

const departSchema = z.object({
  enfant_id: z.string(),
  personne_depart: z.string(),
  commentaire: z.string().optional(),
});

function generateId(): string {
  return crypto.randomUUID();
}

function getToday(): string {
  return new Date().toISOString().split('T')[0];
}

function getCurrentTime(): string {
  return new Date().toTimeString().split(' ')[0];
}

// Get today's presences
pointagesRoutes.get('/aujourd-hui', async (c) => {
  const user = c.get('user');
  const today = getToday();

  // Get creche_id from user context
  let crecheId = user?.creche_id;
  if (!crecheId) {
    return c.json({
      success: false,
      error: { code: 'NO_CRECHE', message: 'No creche associated with user' },
    }, 400);
  }

  // Get all children of the creche with today's pointage
  const result = await c.env.DB.prepare(`
    SELECT
      e.id,
      e.prenom,
      e.nom,
      e.photo_url,
      e.allergies,
      p.heure_arrivee,
      p.heure_depart,
      p.commentaire,
      CASE
        WHEN p.heure_arrivee IS NOT NULL AND p.heure_depart IS NULL THEN 'present'
        WHEN p.heure_arrivee IS NOT NULL AND p.heure_depart IS NOT NULL THEN 'parti'
        ELSE 'absent'
      END as statut
    FROM enfants e
    LEFT JOIN pointages p ON e.id = p.enfant_id AND p.date = ?
    WHERE e.creche_id = ? AND e.actif = 1
    ORDER BY e.prenom ASC
  `).bind(today, crecheId).all();

  // Get capacity
  const creche = await c.env.DB.prepare(
    'SELECT capacite_max FROM creches WHERE id = ?'
  ).bind(crecheId).first<{ capacite_max: number }>();

  const presents = result.results.filter((r: Record<string, unknown>) => r.statut === 'present').length;

  return c.json({
    success: true,
    data: {
      date: today,
      total_presents: presents,
      total_capacite: creche?.capacite_max || 0,
      enfants: result.results.map((r: Record<string, unknown>) => ({
        ...r,
        allergies: r.allergies ? JSON.parse(r.allergies as string) : [],
      })),
    },
  });
});

// Record arrival
pointagesRoutes.post('/arrivee', requireRole('directeur', 'auxiliaire'), async (c) => {
  const body = await c.req.json();
  const parsed = arriveeSchema.safeParse(body);

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
  const { enfant_id, methode, commentaire } = parsed.data;
  const today = getToday();
  const now = getCurrentTime();

  // Check if already pointed today
  const existing = await c.env.DB.prepare(
    'SELECT id FROM pointages WHERE enfant_id = ? AND date = ?'
  ).bind(enfant_id, today).first();

  if (existing) {
    return c.json({
      success: false,
      error: { code: 'ALREADY_POINTED', message: 'Child already has an arrival recorded today' },
    }, 409);
  }

  const id = generateId();

  await c.env.DB.prepare(`
    INSERT INTO pointages (id, enfant_id, date, heure_arrivee, employe_arrivee_id, methode_pointage, commentaire)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `).bind(id, enfant_id, today, now, user?.id || null, methode, commentaire || null).run();

  // Get employee name for response
  const employe = user?.id ? await c.env.DB.prepare(
    'SELECT nom, prenom FROM employes WHERE id = ?'
  ).bind(user.id).first<{ nom: string; prenom: string }>() : null;

  return c.json({
    success: true,
    data: {
      id,
      enfant_id,
      date: today,
      heure_arrivee: now,
      employe: employe ? `${employe.prenom} ${employe.nom}` : null,
    },
  }, 201);
});

// Record departure
pointagesRoutes.post('/depart', requireRole('directeur', 'auxiliaire'), async (c) => {
  const body = await c.req.json();
  const parsed = departSchema.safeParse(body);

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
  const { enfant_id, personne_depart, commentaire } = parsed.data;
  const today = getToday();
  const now = getCurrentTime();

  // Get today's pointage
  const pointage = await c.env.DB.prepare(
    'SELECT id, heure_depart FROM pointages WHERE enfant_id = ? AND date = ?'
  ).bind(enfant_id, today).first<{ id: string; heure_depart: string | null }>();

  if (!pointage) {
    return c.json({
      success: false,
      error: { code: 'NO_ARRIVAL', message: 'No arrival recorded today for this child' },
    }, 400);
  }

  if (pointage.heure_depart) {
    return c.json({
      success: false,
      error: { code: 'ALREADY_LEFT', message: 'Departure already recorded' },
    }, 409);
  }

  await c.env.DB.prepare(`
    UPDATE pointages
    SET heure_depart = ?, employe_depart_id = ?, personne_depart = ?, commentaire = COALESCE(commentaire || ' | ', '') || ?
    WHERE id = ?
  `).bind(now, user?.id || null, personne_depart, commentaire || '', pointage.id).run();

  return c.json({
    success: true,
    data: {
      id: pointage.id,
      enfant_id,
      date: today,
      heure_depart: now,
      personne_depart,
    },
  });
});

// Get pointage by ID
pointagesRoutes.get('/:id', async (c) => {
  const id = c.req.param('id');

  const pointage = await c.env.DB.prepare(`
    SELECT p.*, e.prenom, e.nom, e.photo_url
    FROM pointages p
    JOIN enfants e ON p.enfant_id = e.id
    WHERE p.id = ?
  `).bind(id).first();

  if (!pointage) {
    return c.json({
      success: false,
      error: { code: 'NOT_FOUND', message: 'Pointage not found' },
    }, 404);
  }

  return c.json({
    success: true,
    data: pointage,
  });
});

// Calculate presence hours for a month
pointagesRoutes.get('/heures/:enfant_id', async (c) => {
  const enfantId = c.req.param('enfant_id');
  const mois = c.req.query('mois'); // Format: 2024-01

  if (!mois) {
    return c.json({
      success: false,
      error: { code: 'MISSING_MONTH', message: 'Month parameter required (format: YYYY-MM)' },
    }, 400);
  }

  const result = await c.env.DB.prepare(`
    SELECT
      date,
      heure_arrivee,
      heure_depart,
      (julianday(heure_depart) - julianday(heure_arrivee)) * 24 as heures
    FROM pointages
    WHERE enfant_id = ?
      AND strftime('%Y-%m', date) = ?
      AND heure_depart IS NOT NULL
    ORDER BY date ASC
  `).bind(enfantId, mois).all();

  const totalHeures = result.results.reduce((sum: number, r: Record<string, unknown>) => {
    return sum + (r.heures as number || 0);
  }, 0);

  return c.json({
    success: true,
    data: {
      enfant_id: enfantId,
      mois,
      total_heures: Math.round(totalHeures * 100) / 100,
      jours: result.results.length,
      details: result.results,
    },
  });
});

export { pointagesRoutes };
