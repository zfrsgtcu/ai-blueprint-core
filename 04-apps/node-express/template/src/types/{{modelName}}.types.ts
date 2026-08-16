// {{ProjectName}} — {{ModelName}} Type Tanımları ve Zod Şemaları
// AI: Domain entity'sine göre şemaları ve tipleri özelleştir.

import { z } from 'zod';

// === REQUEST VALIDATION SCHEMALARI ===

export const create{{ModelName}}Schema = z.object({
  body: z.object({
    name: z.string().min(1, 'Ad zorunludur').max(200, 'Ad en fazla 200 karakter olabilir'),
    description: z.string().max(1000).optional(),
  }),
});

export const update{{ModelName}}Schema = z.object({
  body: z.object({
    name: z.string().min(1).max(200).optional(),
    description: z.string().max(1000).optional(),
  }),
});

export const {{modelName}}QuerySchema = z.object({
  page: z.coerce.number().int().positive().optional(),
  limit: z.coerce.number().int().positive().max(100).optional(),
  search: z.string().optional(),
  sort: z.string().optional(),
});

// === TİP TANIMLARI ===

export type Create{{ModelName}}Input = z.infer<typeof create{{ModelName}}Schema>['body'];
export type Update{{ModelName}}Input = z.infer<typeof update{{ModelName}}Schema>['body'];
export type {{ModelName}}Query = z.infer<typeof {{modelName}}QuerySchema>;

// === API RESPONSE ===

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}
