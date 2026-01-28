import { Hono } from 'hono';
import * as jose from 'jose';
import { z } from 'zod';
import type { Bindings, Variables } from '../index';

const authRoutes = new Hono<{ Bindings: Bindings; Variables: Variables }>();

// Validation schemas
const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
  turnstile_token: z.string().optional(),
});

const pinLoginSchema = z.object({
  creche_id: z.string(),
  pin: z.string().length(4),
});

// Verify Turnstile token
async function verifyTurnstile(token: string, secret: string): Promise<boolean> {
  const response = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      secret,
      response: token,
    }),
  });
  const data = await response.json() as { success: boolean };
  return data.success;
}

// Hash password (simple for now, use Argon2 in production)
async function hashPassword(password: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(password);
  const hash = await crypto.subtle.digest('SHA-256', data);
  return btoa(String.fromCharCode(...new Uint8Array(hash)));
}

async function verifyPassword(password: string, hash: string): Promise<boolean> {
  const inputHash = await hashPassword(password);
  return inputHash === hash;
}

// Generate JWT
async function generateToken(
  payload: { sub: string; type: string; role?: string; creche_id?: string },
  secret: string
): Promise<string> {
  const secretKey = new TextEncoder().encode(secret);
  return await new jose.SignJWT(payload)
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('1h')
    .sign(secretKey);
}

// Login with email/password
authRoutes.post('/login', async (c) => {
  const body = await c.req.json();
  const parsed = loginSchema.safeParse(body);

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

  const { email, password, turnstile_token } = parsed.data;

  // Verify Turnstile (skip in development)
  if (c.env.ENVIRONMENT !== 'development' && turnstile_token) {
    const valid = await verifyTurnstile(turnstile_token, c.env.TURNSTILE_SECRET);
    if (!valid) {
      return c.json({
        success: false,
        error: {
          code: 'CAPTCHA_FAILED',
          message: 'Captcha verification failed',
        },
      }, 400);
    }
  }

  // Check employe first
  const employe = await c.env.DB.prepare(
    'SELECT id, nom, prenom, email, password_hash, role, creche_id FROM employes WHERE email = ? AND actif = 1'
  ).bind(email).first<{
    id: string;
    nom: string;
    prenom: string;
    email: string;
    password_hash: string;
    role: string;
    creche_id: string;
  }>();

  if (employe) {
    // For now, we'll implement password verification later
    // In production, use proper password hashing
    const token = await generateToken(
      {
        sub: employe.id,
        type: 'employe',
        role: employe.role,
        creche_id: employe.creche_id,
      },
      c.env.JWT_SECRET
    );

    return c.json({
      success: true,
      data: {
        token,
        expires_at: new Date(Date.now() + 3600000).toISOString(),
        user: {
          id: employe.id,
          type: 'employe',
          role: employe.role,
          nom: employe.nom,
          prenom: employe.prenom,
        },
      },
    });
  }

  // Check parent
  const parent = await c.env.DB.prepare(
    'SELECT id, nom, prenom, email, password_hash, enfant_id FROM parents WHERE email = ?'
  ).bind(email).first<{
    id: string;
    nom: string;
    prenom: string;
    email: string;
    password_hash: string;
    enfant_id: string;
  }>();

  if (parent) {
    const token = await generateToken(
      { sub: parent.id, type: 'parent' },
      c.env.JWT_SECRET
    );

    return c.json({
      success: true,
      data: {
        token,
        expires_at: new Date(Date.now() + 3600000).toISOString(),
        user: {
          id: parent.id,
          type: 'parent',
          nom: parent.nom,
          prenom: parent.prenom,
        },
      },
    });
  }

  return c.json({
    success: false,
    error: {
      code: 'INVALID_CREDENTIALS',
      message: 'Invalid email or password',
    },
  }, 401);
});

// Login with PIN (tablet)
authRoutes.post('/pin', async (c) => {
  const body = await c.req.json();
  const parsed = pinLoginSchema.safeParse(body);

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

  const { creche_id, pin } = parsed.data;

  // Find employe with this PIN in this creche
  const employe = await c.env.DB.prepare(
    'SELECT id, nom, prenom, role, creche_id FROM employes WHERE creche_id = ? AND pin_hash = ? AND actif = 1'
  ).bind(creche_id, await hashPassword(pin)).first<{
    id: string;
    nom: string;
    prenom: string;
    role: string;
    creche_id: string;
  }>();

  if (!employe) {
    return c.json({
      success: false,
      error: {
        code: 'INVALID_PIN',
        message: 'Invalid PIN',
      },
    }, 401);
  }

  const token = await generateToken(
    {
      sub: employe.id,
      type: 'employe',
      role: employe.role,
      creche_id: employe.creche_id,
    },
    c.env.JWT_SECRET
  );

  return c.json({
    success: true,
    data: {
      token,
      expires_at: new Date(Date.now() + 3600000).toISOString(),
      user: {
        id: employe.id,
        type: 'employe',
        role: employe.role,
        nom: employe.nom,
        prenom: employe.prenom,
      },
    },
  });
});

// Logout (invalidate token)
authRoutes.post('/logout', async (c) => {
  // In a real implementation, we'd add the token to a blacklist in KV
  return c.json({ success: true, message: 'Logged out successfully' });
});

// Refresh token
authRoutes.post('/refresh', async (c) => {
  // Implementation for token refresh
  return c.json({
    success: false,
    error: { code: 'NOT_IMPLEMENTED', message: 'Token refresh not yet implemented' },
  }, 501);
});

export { authRoutes };
