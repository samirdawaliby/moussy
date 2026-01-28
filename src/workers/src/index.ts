import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { logger } from 'hono/logger';
import { secureHeaders } from 'hono/secure-headers';

import { authRoutes } from './routes/auth';
import { crechesRoutes } from './routes/creches';
import { enfantsRoutes } from './routes/enfants';
import { pointagesRoutes } from './routes/pointages';
import { activitesRoutes } from './routes/activites';
import { transmissionsRoutes } from './routes/transmissions';
import { authMiddleware } from './middleware/auth';

// Environment bindings type
export type Bindings = {
  DB: D1Database;
  STORAGE: R2Bucket;
  AI: Ai;
  SESSIONS: KVNamespace;
  ENVIRONMENT: string;
  JWT_SECRET: string;
  TURNSTILE_SECRET: string;
};

// App context type
export type Variables = {
  user: {
    id: string;
    type: 'employe' | 'parent';
    role?: string;
    creche_id?: string;
  } | null;
};

const app = new Hono<{ Bindings: Bindings; Variables: Variables }>();

// Global middleware
app.use('*', logger());
app.use('*', secureHeaders());
app.use('*', cors({
  origin: ['https://app.moussy.fr', 'https://moussy.pages.dev', 'http://localhost:3000'],
  allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowHeaders: ['Content-Type', 'Authorization'],
  exposeHeaders: ['Content-Length'],
  maxAge: 86400,
  credentials: true,
}));

// Health check
app.get('/', (c) => {
  return c.json({
    name: 'MOUSSY API',
    version: '0.1.0',
    status: 'healthy',
    environment: c.env.ENVIRONMENT,
  });
});

app.get('/health', (c) => {
  return c.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Public routes (no auth required)
app.route('/auth', authRoutes);

// Protected routes (auth required)
app.use('/api/*', authMiddleware);
app.route('/api/creches', crechesRoutes);
app.route('/api/enfants', enfantsRoutes);
app.route('/api/pointages', pointagesRoutes);
app.route('/api/activites', activitesRoutes);
app.route('/api/transmissions', transmissionsRoutes);

// 404 handler
app.notFound((c) => {
  return c.json({
    success: false,
    error: {
      code: 'NOT_FOUND',
      message: `Route ${c.req.method} ${c.req.path} not found`,
    },
  }, 404);
});

// Error handler
app.onError((err, c) => {
  console.error('Unhandled error:', err);
  return c.json({
    success: false,
    error: {
      code: 'INTERNAL_ERROR',
      message: c.env.ENVIRONMENT === 'production'
        ? 'An unexpected error occurred'
        : err.message,
    },
  }, 500);
});

export default app;
