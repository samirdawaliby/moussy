import { Context, Next } from 'hono';
import * as jose from 'jose';
import type { Bindings, Variables } from '../index';

export async function authMiddleware(
  c: Context<{ Bindings: Bindings; Variables: Variables }>,
  next: Next
) {
  const authHeader = c.req.header('Authorization');

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return c.json({
      success: false,
      error: {
        code: 'UNAUTHORIZED',
        message: 'Missing or invalid Authorization header',
      },
    }, 401);
  }

  const token = authHeader.substring(7);

  try {
    // Verify JWT
    const secret = new TextEncoder().encode(c.env.JWT_SECRET);
    const { payload } = await jose.jwtVerify(token, secret);

    // Set user in context
    c.set('user', {
      id: payload.sub as string,
      type: payload.type as 'employe' | 'parent',
      role: payload.role as string | undefined,
      creche_id: payload.creche_id as string | undefined,
    });

    await next();
  } catch (error) {
    if (error instanceof jose.errors.JWTExpired) {
      return c.json({
        success: false,
        error: {
          code: 'TOKEN_EXPIRED',
          message: 'Authentication token has expired',
        },
      }, 401);
    }

    return c.json({
      success: false,
      error: {
        code: 'INVALID_TOKEN',
        message: 'Invalid authentication token',
      },
    }, 401);
  }
}

// Role-based access control middleware
export function requireRole(...allowedRoles: string[]) {
  return async (
    c: Context<{ Bindings: Bindings; Variables: Variables }>,
    next: Next
  ) => {
    const user = c.get('user');

    if (!user) {
      return c.json({
        success: false,
        error: {
          code: 'UNAUTHORIZED',
          message: 'Authentication required',
        },
      }, 401);
    }

    if (user.type === 'parent') {
      // Parents have limited access
      if (!allowedRoles.includes('parent')) {
        return c.json({
          success: false,
          error: {
            code: 'FORBIDDEN',
            message: 'Access denied for parents',
          },
        }, 403);
      }
    } else if (user.role && !allowedRoles.includes(user.role)) {
      return c.json({
        success: false,
        error: {
          code: 'FORBIDDEN',
          message: `Access denied. Required roles: ${allowedRoles.join(', ')}`,
        },
      }, 403);
    }

    await next();
  };
}
