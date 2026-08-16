// {{ProjectName}} — Global Error Handler Middleware
// Tüm route'larda yakalanmayan hataları ele alır,
// tutarlı JSON hata yanıtı döndürür.
// 4 parametreli Express error handler signature: (err, req, res, next).

import { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';
import { env } from '../config/env';

export class AppError extends Error {
  public readonly statusCode: number;
  public readonly isOperational: boolean;

  constructor(message: string, statusCode: number = 500) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = true;
    Error.captureStackTrace(this, this.constructor);
  }
}

export function errorHandler(
  err: Error,
  _req: Request,
  res: Response,
  _next: NextFunction,
): void {
  // Zod validation hatası
  if (err instanceof ZodError) {
    res.status(400).json({
      message: 'Validasyon hatası',
      errors: err.errors.map((e) => ({
        field: e.path.join('.'),
        message: e.message,
      })),
    });
    return;
  }

  // Özel AppError
  if (err instanceof AppError) {
    res.status(err.statusCode).json({ message: err.message });
    return;
  }

  // Mongoose ValidationError
  if (err.name === 'ValidationError') {
    res.status(400).json({ message: err.message });
    return;
  }

  // Mongoose CastError (geçersiz ObjectId)
  if (err.name === 'CastError') {
    res.status(400).json({ message: 'Geçersiz ID formatı' });
    return;
  }

  // Beklenmeyen hata
  console.error('Unhandled error:', err);

  res.status(500).json({
    message:
      env.NODE_ENV === 'production'
        ? 'Beklenmeyen bir hata oluştu'
        : err.message,
    ...(env.NODE_ENV !== 'production' && { stack: err.stack }),
  });
}
