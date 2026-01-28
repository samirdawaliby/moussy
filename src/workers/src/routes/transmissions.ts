import { Hono } from 'hono';
import { z } from 'zod';
import type { Bindings, Variables } from '../index';
import { requireRole } from '../middleware/auth';

const transmissionsRoutes = new Hono<{ Bindings: Bindings; Variables: Variables }>();

// Validation schemas
const genererTransmissionSchema = z.object({
  enfant_id: z.string(),
  date: z.string().optional(), // ISO date, defaults to today
});

const traduireSchema = z.object({
  langue: z.string().length(2), // ISO code: en, es, ar, etc.
});

function generateId(): string {
  return crypto.randomUUID();
}

function getToday(): string {
  return new Date().toISOString().split('T')[0];
}

// Generate AI transmission for a child
transmissionsRoutes.post('/generer', requireRole('directeur', 'auxiliaire'), async (c) => {
  const body = await c.req.json();
  const parsed = genererTransmissionSchema.safeParse(body);

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

  const { enfant_id, date = getToday() } = parsed.data;

  // Get child info
  const enfant = await c.env.DB.prepare(
    'SELECT prenom, nom FROM enfants WHERE id = ?'
  ).bind(enfant_id).first<{ prenom: string; nom: string }>();

  if (!enfant) {
    return c.json({
      success: false,
      error: { code: 'NOT_FOUND', message: 'Child not found' },
    }, 404);
  }

  // Get all activities for the day
  const activites = await c.env.DB.prepare(`
    SELECT type_activite, heure, details
    FROM activites
    WHERE enfant_id = ? AND date = ?
    ORDER BY heure ASC
  `).bind(enfant_id, date).all();

  if (activites.results.length === 0) {
    return c.json({
      success: false,
      error: { code: 'NO_ACTIVITIES', message: 'No activities recorded for this day' },
    }, 400);
  }

  // Get pointage info
  const pointage = await c.env.DB.prepare(
    'SELECT heure_arrivee, heure_depart FROM pointages WHERE enfant_id = ? AND date = ?'
  ).bind(enfant_id, date).first<{ heure_arrivee: string; heure_depart: string | null }>();

  // Prepare context for AI
  const activitesFormatted = activites.results.map((a: Record<string, unknown>) => ({
    type: a.type_activite,
    heure: a.heure,
    details: a.details ? JSON.parse(a.details as string) : {},
  }));

  // Build prompt
  const prompt = `Tu es une auxiliaire de creche bienveillante et chaleureuse. Tu dois rediger un message court et positif pour les parents de ${enfant.prenom} resumant sa journee.

Informations sur la journee de ${enfant.prenom}:
${pointage ? `- Arrive a ${pointage.heure_arrivee}` : ''}
${pointage?.heure_depart ? `- Parti a ${pointage.heure_depart}` : ''}

Activites:
${activitesFormatted.map((a: Record<string, unknown>) => {
  const details = a.details as Record<string, unknown>;
  switch (a.type) {
    case 'repas':
      return `- ${a.heure}: Repas (${details.type}) - A mange: ${details.quantite}${details.menu ? ` (${details.menu})` : ''}`;
    case 'sommeil':
      return `- ${details.debut} a ${details.fin || '...'}: Sieste${details.qualite ? ` (${details.qualite})` : ''}`;
    case 'change':
      return `- ${a.heure}: Change - etat ${details.etat}`;
    case 'activite':
      return `- ${a.heure}: ${details.description}${details.participation ? ` (participation ${details.participation})` : ''}`;
    case 'observation':
      return `- ${a.heure}: ${details.description}`;
    case 'soin':
      return `- ${a.heure}: Soin - ${details.description}`;
    default:
      return `- ${a.heure}: ${a.type}`;
  }
}).join('\n')}

Redige un message de 2-3 phrases maximum, chaleureux et positif. Ne mentionne pas les changes sauf si probleme. Termine par une formule sympathique.`;

  try {
    // Call Workers AI
    const aiResponse = await c.env.AI.run('@cf/meta/llama-3.1-8b-instruct', {
      messages: [{ role: 'user', content: prompt }],
      max_tokens: 200,
    }) as { response: string };

    const contenu = aiResponse.response.trim();

    // Check if transmission already exists for this day
    const existing = await c.env.DB.prepare(
      'SELECT id FROM transmissions WHERE enfant_id = ? AND date = ?'
    ).bind(enfant_id, date).first();

    let transmissionId: string;

    if (existing) {
      // Update existing
      transmissionId = existing.id as string;
      await c.env.DB.prepare(`
        UPDATE transmissions
        SET contenu_original = ?, genere_par = 'ia', valide_par = NULL, envoye = 0
        WHERE id = ?
      `).bind(contenu, transmissionId).run();
    } else {
      // Create new
      transmissionId = generateId();
      await c.env.DB.prepare(`
        INSERT INTO transmissions (id, enfant_id, date, contenu_original, genere_par)
        VALUES (?, ?, ?, ?, 'ia')
      `).bind(transmissionId, enfant_id, date, contenu).run();
    }

    return c.json({
      success: true,
      data: {
        id: transmissionId,
        enfant_id,
        date,
        contenu_original: contenu,
        genere_par: 'ia',
        valide: false,
      },
    });
  } catch (error) {
    console.error('AI generation error:', error);
    return c.json({
      success: false,
      error: {
        code: 'AI_ERROR',
        message: 'Failed to generate transmission with AI',
      },
    }, 500);
  }
});

// Validate and send transmission
transmissionsRoutes.post('/:id/envoyer', requireRole('directeur', 'auxiliaire'), async (c) => {
  const id = c.req.param('id');
  const user = c.get('user');
  const body = await c.req.json().catch(() => ({}));

  const { contenu_modifie } = body as { contenu_modifie?: string };

  // Get transmission
  const transmission = await c.env.DB.prepare(
    'SELECT * FROM transmissions WHERE id = ?'
  ).bind(id).first();

  if (!transmission) {
    return c.json({
      success: false,
      error: { code: 'NOT_FOUND', message: 'Transmission not found' },
    }, 404);
  }

  // Update transmission
  await c.env.DB.prepare(`
    UPDATE transmissions
    SET
      contenu_original = COALESCE(?, contenu_original),
      valide_par = ?,
      envoye = 1,
      envoye_at = CURRENT_TIMESTAMP
    WHERE id = ?
  `).bind(contenu_modifie || null, user?.id || null, id).run();

  // TODO: Send push notification to parent app
  // TODO: Send email notification if configured

  return c.json({
    success: true,
    message: 'Transmission sent successfully',
    data: {
      id,
      envoye: true,
      envoye_at: new Date().toISOString(),
    },
  });
});

// Translate transmission
transmissionsRoutes.post('/:id/traduire', async (c) => {
  const id = c.req.param('id');
  const body = await c.req.json();
  const parsed = traduireSchema.safeParse(body);

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

  const { langue } = parsed.data;

  // Get transmission
  const transmission = await c.env.DB.prepare(
    'SELECT contenu_original FROM transmissions WHERE id = ?'
  ).bind(id).first<{ contenu_original: string }>();

  if (!transmission) {
    return c.json({
      success: false,
      error: { code: 'NOT_FOUND', message: 'Transmission not found' },
    }, 404);
  }

  try {
    // Use translation model
    const response = await c.env.AI.run('@cf/meta/m2m100-1.2b', {
      text: transmission.contenu_original,
      source_lang: 'french',
      target_lang: langue === 'en' ? 'english' : langue === 'es' ? 'spanish' : langue === 'ar' ? 'arabic' : 'english',
    }) as { translated_text: string };

    const contenuTraduit = response.translated_text;

    // Save translation
    await c.env.DB.prepare(`
      UPDATE transmissions
      SET contenu_traduit = ?, langue_traduction = ?
      WHERE id = ?
    `).bind(contenuTraduit, langue, id).run();

    return c.json({
      success: true,
      data: {
        contenu_traduit: contenuTraduit,
        langue_traduction: langue,
      },
    });
  } catch (error) {
    console.error('Translation error:', error);
    return c.json({
      success: false,
      error: {
        code: 'TRANSLATION_ERROR',
        message: 'Failed to translate transmission',
      },
    }, 500);
  }
});

// Get transmissions for a parent
transmissionsRoutes.get('/parent/:parent_id', async (c) => {
  const parentId = c.req.param('parent_id');
  const user = c.get('user');

  // Verify access
  if (user?.type === 'parent' && user.id !== parentId) {
    return c.json({
      success: false,
      error: { code: 'FORBIDDEN', message: 'Access denied' },
    }, 403);
  }

  // Get parent's children
  const parent = await c.env.DB.prepare(
    'SELECT enfant_id, langue_preferee FROM parents WHERE id = ?'
  ).bind(parentId).first<{ enfant_id: string; langue_preferee: string }>();

  if (!parent) {
    return c.json({
      success: false,
      error: { code: 'NOT_FOUND', message: 'Parent not found' },
    }, 404);
  }

  // Get transmissions
  const result = await c.env.DB.prepare(`
    SELECT t.*, e.prenom, e.nom, e.photo_url
    FROM transmissions t
    JOIN enfants e ON t.enfant_id = e.id
    WHERE t.enfant_id = ? AND t.envoye = 1
    ORDER BY t.date DESC
    LIMIT 30
  `).bind(parent.enfant_id).all();

  return c.json({
    success: true,
    data: result.results.map((t: Record<string, unknown>) => ({
      ...t,
      contenu: parent.langue_preferee !== 'fr' && t.contenu_traduit
        ? t.contenu_traduit
        : t.contenu_original,
      enfant: {
        prenom: t.prenom,
        nom: t.nom,
        photo_url: t.photo_url,
      },
    })),
  });
});

// Mark transmission as read
transmissionsRoutes.put('/:id/lu', async (c) => {
  const id = c.req.param('id');

  await c.env.DB.prepare(`
    UPDATE transmissions
    SET lu = 1, lu_at = CURRENT_TIMESTAMP
    WHERE id = ?
  `).bind(id).run();

  return c.json({
    success: true,
    message: 'Transmission marked as read',
  });
});

// Get transmission by ID
transmissionsRoutes.get('/:id', async (c) => {
  const id = c.req.param('id');

  const transmission = await c.env.DB.prepare(`
    SELECT t.*, e.prenom, e.nom
    FROM transmissions t
    JOIN enfants e ON t.enfant_id = e.id
    WHERE t.id = ?
  `).bind(id).first();

  if (!transmission) {
    return c.json({
      success: false,
      error: { code: 'NOT_FOUND', message: 'Transmission not found' },
    }, 404);
  }

  return c.json({
    success: true,
    data: transmission,
  });
});

export { transmissionsRoutes };
