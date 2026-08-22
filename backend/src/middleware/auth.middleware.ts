import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

export interface AuthPayload {
  userId: string;
  role: string;
}

// Extend Express Request to include user
declare global {
  namespace Express {
    interface Request {
      user?: AuthPayload;
    }
  }
}

export function requireAuth(req: Request, res: Response, next: NextFunction): void {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    res.status(401).json({
      success: false,
      error: {
        code: 'UNAUTHORIZED',
        message: 'Authorization header is missing or malformed. Expected: Bearer <token>',
      },
    });
    return;
  }

  const token = authHeader.slice(7);
  const secret = process.env.JWT_ACCESS_SECRET;

  if (!secret) {
    res.status(500).json({
      success: false,
      error: { code: 'INTERNAL_ERROR', message: 'Server configuration error.' },
    });
    return;
  }

  try {
    const payload = jwt.verify(token, secret) as AuthPayload;
    req.user = { userId: payload.userId, role: payload.role };
    next();
  } catch (err) {
    if (err instanceof jwt.TokenExpiredError) {
      res.status(401).json({
        success: false,
        error: { code: 'UNAUTHORIZED', message: 'Access token has expired.' },
      });
    } else {
      res.status(401).json({
        success: false,
        error: { code: 'UNAUTHORIZED', message: 'Invalid access token.' },
      });
    }
  }
}
