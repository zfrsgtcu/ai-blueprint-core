<!-- PURPOSE OF THIS FILE: TypeScript tipleri — {{ModelName}} DTO, Create/Update tipleri, PaginatedResponse -->
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
  pageSize: number;
  totalPages: number;
}
