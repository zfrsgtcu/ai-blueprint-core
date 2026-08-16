<!-- PURPOSE OF THIS FILE: Zustand store — CRUD işlemleri, loading/error state, async actions -->
import { create } from 'zustand';
import { api } from '@/services/api';
import type { {{ModelName}}Dto, Create{{ModelName}}Dto, Update{{ModelName}}Dto } from '@/types/{{modelName}}.types';

interface {{ModelName}}State {
  items: {{ModelName}}Dto[];
  selectedItem: {{ModelName}}Dto | null;
  isLoading: boolean;
  error: string | null;

  fetchItems: () => Promise<void>;
  fetchById: (id: string) => Promise<void>;
  create: (dto: Create{{ModelName}}Dto) => Promise<{{ModelName}}Dto>;
  update: (id: string, dto: Update{{ModelName}}Dto) => Promise<{{ModelName}}Dto>;
  remove: (id: string) => Promise<void>;
  clearError: () => void;
}

export const use{{ModelName}}Store = create<{{ModelName}}State>((set) => ({
  items: [],
  selectedItem: null,
  isLoading: false,
  error: null,

  fetchItems: async () => {
    set({ isLoading: true, error: null });
    try {
      const { data } = await api.get<{{ModelName}}Dto[]>('/api/{{model_names}}');
      set({ items: data, isLoading: false });
    } catch (err: any) {
      set({ error: err.response?.data?.message || err.message, isLoading: false });
    }
  },

  fetchById: async (id) => {
    set({ isLoading: true });
    try {
      const { data } = await api.get<{{ModelName}}Dto>(`/api/{{model_names}}/${id}`);
      set({ selectedItem: data, isLoading: false });
    } catch (err: any) {
      set({ error: err.message, isLoading: false });
    }
  },

  create: async (dto) => {
    const { data } = await api.post<{{ModelName}}Dto>('/api/{{model_names}}', dto);
    set((s) => ({ items: [...s.items, data] }));
    return data;
  },

  update: async (id, dto) => {
    const { data } = await api.put<{{ModelName}}Dto>(`/api/{{model_names}}/${id}`, dto);
    set((s) => ({
      items: s.items.map((i) => (i.id === id ? data : i)),
      selectedItem: s.selectedItem?.id === id ? data : s.selectedItem,
    }));
    return data;
  },

  remove: async (id) => {
    await api.delete(`/api/{{model_names}}/${id}`);
    set((s) => ({
      items: s.items.filter((i) => i.id !== id),
      selectedItem: s.selectedItem?.id === id ? null : s.selectedItem,
    }));
  },

  clearError: () => set({ error: null }),
}));
