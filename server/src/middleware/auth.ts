import jwt from 'jsonwebtoken';
import type { NextFunction, Request, Response } from 'express';
import { JWT_SECRET } from '../lib/secret';

export type AuthRequest = Request & { userId?: string };

export function signToken(userId: string): string {
  return jwt.sign({ userId }, JWT_SECRET, { expiresIn: '30d' });
}

export function requireAuth(req: AuthRequest, res: Response, next: NextFunction) {
  const header = req.headers.authorization;
  const token = header?.startsWith('Bearer ') ? header.slice('Bearer '.length) : undefined;
  if (!token) {
    return res.status(401).json({ error: 'Token manquant' });
  }

  try {
    const payload = jwt.verify(token, JWT_SECRET) as { userId?: string };
    if (!payload.userId) {
      return res.status(401).json({ error: 'Token invalide' });
    }
    req.userId = payload.userId;
    return next();
  } catch {
    return res.status(401).json({ error: 'Token invalide ou expiré' });
  }
}

export function optionalAuth(req: AuthRequest, _res: Response, next: NextFunction) {
  const header = req.headers.authorization;
  const token = header?.startsWith('Bearer ') ? header.slice('Bearer '.length) : undefined;
  if (!token) {
    return next();
  }

  try {
    const payload = jwt.verify(token, JWT_SECRET) as { userId?: string };
    if (payload.userId) {
      req.userId = payload.userId;
    }
  } catch {
    req.userId = undefined;
  }

  return next();
}
