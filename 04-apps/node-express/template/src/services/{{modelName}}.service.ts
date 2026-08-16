// {{ProjectName}} — {{ModelName}} Service
// İş mantığı burada. Route handler'lar sadece HTTP istek/yanıt yönetir.
// AI: Domain iş kurallarını buraya ekle.

import { {{ModelName}}, I{{ModelName}} } from '../models/{{ModelName}}';
import type { Create{{ModelName}}Input, Update{{ModelName}}Input, {{ModelName}}Query } from '../types/{{modelName}}.types';

export async function getAll(query: {{ModelName}}Query): Promise<{ items: I{{ModelName}}[]; total: number }> {
  const page = query.page || 1;
  const limit = query.limit || 10;
  const skip = (page - 1) * limit;

  const filter: Record<string, unknown> = {};
  if (query.search) {
    filter.name = { $regex: query.search, $options: 'i' };
  }

  const [items, total] = await Promise.all([
    {{ModelName}}.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit),
    {{ModelName}}.countDocuments(filter),
  ]);

  return { items, total };
}

export async function getById(id: string): Promise<I{{ModelName}} | null> {
  return {{ModelName}}.findById(id);
}

export async function create(data: Create{{ModelName}}Input): Promise<I{{ModelName}}> {
  const item = new {{ModelName}}(data);
  return item.save();
}

export async function update(id: string, data: Update{{ModelName}}Input): Promise<I{{ModelName}} | null> {
  return {{ModelName}}.findByIdAndUpdate(id, data, { new: true, runValidators: true });
}

export async function remove(id: string): Promise<boolean> {
  // Soft delete — isDeleted = true
  const result = await {{ModelName}}.findByIdAndUpdate(id, { isDeleted: true });
  return result !== null;
}
