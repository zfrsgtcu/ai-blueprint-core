// {{ProjectName}} — Zod Validation Middleware
// Request body, query ve params'ı Zod şeması ile doğrular.
// Kullanım: router.post('/', validate(create{{ModelName}}Schema), handler)

import { Request, Response, NextFunction } from 'express';
import { AnyZodObject, ZodError } from 'zod';

export function validate(schema: AnyZodObject) {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const parsed = await schema.parseAsync({
        body: req.body,
        query: req.query,
        params: req.params,
      });

      // Doğrulanmış değerleri request'e geri yaz
      req.body = parsed.body;
      req.query = parsed.query as Record<string, string>;
      req.params = parsed.params;

      next();
    } catch (error) {
      if (error instanceof ZodError) {
        res.status(400).json({
          message: 'Validasyon hatası',
          errors: error.errors.map((e) => ({
            field: e.path.join('.'),
            message: e.message,
          })),
        });
        return;
      }
      next(error);
    }
  };
}
