// {{ProjectName}} — JWT Authentication Middleware
// Authorization: Bearer <token> header'ından JWT token'ı doğrular,
// başarılı ise req.user'a kullanıcı bilgisini ekler.
// AI: Kullanıcı modeline göre req.user tipini güncelle.

import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { env } from '../config/env';

export interface AuthPayload {
  userId: string;
  email: string;
  role?: string;
}

export interface AuthRequest extends Request {
  user?: AuthPayload;
}

export function authenticate(req: AuthRequest, res: Response, next: NextFunction): void {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    res.status(401).json({ message: 'Yetkilendirme gerekli' });
    return;
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = jwt.verify(token, env.JWT_SECRET) as AuthPayload;
    req.user = decoded;
    next();
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      res.status(401).json({ message: 'Token süresi doldu' });
    } else {
      res.status(401).json({ message: 'Geçersiz token' });
    }
  }
}

/**
 * Opsiyonel: Role-based authorization
 * Kullanım: router.get('/admin', authenticate, authorize('admin'), handler)
 */
export function authorize(...roles: string[]) {
  return (req: AuthRequest, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({ message: 'Yetkilendirme gerekli' });
      return;
    }
    if (roles.length > 0 && !roles.includes(req.user.role || '')) {
      res.status(403).json({ message: 'Bu işlem için yetkiniz yok' });
      return;
    }
    next();
  };
}
