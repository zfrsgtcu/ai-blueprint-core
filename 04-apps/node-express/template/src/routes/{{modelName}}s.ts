// {{ProjectName}} — {{ModelName}} Route Handler'ları
// AI: Domain entity'lerine göre her entity için bir route dosyası oluştur.
// Standart CRUD endpoint'leri: GET, GET/:id, POST, PUT/:id, DELETE/:id.

import { Router, Request, Response, NextFunction } from 'express';
import { authenticate } from '../middleware/auth';
import { validate } from '../middleware/validate';
import {
  create{{ModelName}}Schema,
  update{{ModelName}}Schema,
  {{modelName}}QuerySchema,
} from '../types/{{modelName}}.types';
import * as {{modelName}}Service from '../services/{{modelName}}.service';

const router = Router();

/**
 * GET /api/{{model_names}}
 * Tüm {{ModelName}} kayıtlarını getir (sayfalama destekli)
 */
router.get('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const query = {{modelName}}QuerySchema.parse(req.query);
    const result = await {{modelName}}Service.getAll(query);
    res.json(result);
  } catch (err) {
    next(err);
  }
});

/**
 * GET /api/{{model_names}}/:id
 * ID'ye göre {{ModelName}} getir
 */
router.get('/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const item = await {{modelName}}Service.getById(req.params.id);
    if (!item) {
      return res.status(404).json({ message: '{{ModelName}} bulunamadı' });
    }
    res.json(item);
  } catch (err) {
    next(err);
  }
});

/**
 * POST /api/{{model_names}}
 * Yeni {{ModelName}} oluştur (auth gerekli)
 */
router.post(
  '/',
  authenticate,
  validate(create{{ModelName}}Schema),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const item = await {{modelName}}Service.create(req.body);
      res.status(201).json(item);
    } catch (err) {
      next(err);
    }
  },
);

/**
 * PUT /api/{{model_names}}/:id
 * {{ModelName}} güncelle (auth gerekli)
 */
router.put(
  '/:id',
  authenticate,
  validate(update{{ModelName}}Schema),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const item = await {{modelName}}Service.update(req.params.id, req.body);
      if (!item) {
        return res.status(404).json({ message: '{{ModelName}} bulunamadı' });
      }
      res.json(item);
    } catch (err) {
      next(err);
    }
  },
);

/**
 * DELETE /api/{{model_names}}/:id
 * {{ModelName}} sil (auth gerekli)
 */
router.delete('/:id', authenticate, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const deleted = await {{modelName}}Service.remove(req.params.id);
    if (!deleted) {
      return res.status(404).json({ message: '{{ModelName}} bulunamadı' });
    }
    res.status(204).send();
  } catch (err) {
    next(err);
  }
});

export default router;
