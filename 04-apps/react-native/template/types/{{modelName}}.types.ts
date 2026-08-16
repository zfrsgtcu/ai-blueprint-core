<!-- PURPOSE OF THIS FILE: {{ModelName}} tip tanımları — domain entity, DTO interface'leri ve Zod validation şemaları. -->
export interface {{ModelName}}Dto {
  id: string;
  name: string;
  description?: string;
  createdAt: string;
  updatedAt?: string;
}

export interface Create{{ModelName}}Dto {
  name: string;
  description?: string;
}

export interface Update{{ModelName}}Dto {
  name?: string;
  description?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
}
