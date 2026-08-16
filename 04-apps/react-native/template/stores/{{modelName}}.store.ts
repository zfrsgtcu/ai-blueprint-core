<!-- PURPOSE OF THIS FILE: {{ModelName}} Zustand store — liste, seçili item, create/update/delete actions, loading/error state. -->
import { create } from 'zustand';
import { api } from '../services/api';
import { {{ModelName}}Dto, Create{{ModelName}}Dto, Update{{ModelName}}Dto } from '../types/{{modelName}}.types';

interface {{ModelName}}State {
  items: {{ModelName}}Dto[];
  selectedItem: {{ModelName}}Dto | null;
  isLoading: boolean;
  error: string | null;

  // Actions
  fetchItems: () => Promise<void>;
  fetchById: (id: string) => Promise<void>;
  create: (dto: Create{{ModelName}}Dto) => Promise<{{ModelName}}Dto>;
  update: (id: string, dto: Update{{ModelName}}Dto) => Promise<{{ModelName}}Dto>;
  remove: (id: string) => Promise<void>;
  clearError: () => void;
}

export const use{{ModelName}}Store = create<{{ModelName}}State>((set, get) => ({
  items: [],
  selectedItem: null,
  isLoading: false,
  error: null,

  fetchItems: async () => {
    set({ isLoading: true, error: null });
    try {
      const items = await api.get<{{ModelName}}Dto[]>('/api/{{model_names}}');
      set({ items, isLoading: false });
    } catch (err: any) {
      set({ error: err.message, isLoading: false });
    }
  },

  fetchById: async (id: string) => {
    set({ isLoading: true, error: null });
    try {
      const item = await api.get<{{ModelName}}Dto>(`/api/{{model_names}}/${id}`);
      set({ selectedItem: item, isLoading: false });
    } catch (err: any) {
      set({ error: err.message, isLoading: false });
    }
  },

  create: async (dto: Create{{ModelName}}Dto) => {
    set({ isLoading: true, error: null });
    try {
      const created = await api.post<{{ModelName}}Dto>('/api/{{model_names}}', dto);
      set((state) => ({ items: [...state.items, created], isLoading: false }));
      return created;
    } catch (err: any) {
      set({ error: err.message, isLoading: false });
      throw err;
    }
  },

  update: async (id: string, dto: Update{{ModelName}}Dto) => {
    set({ isLoading: true, error: null });
    try {
      const updated = await api.put<{{ModelName}}Dto>(`/api/{{model_names}}/${id}`, dto);
      set((state) => ({
        items: state.items.map((i) => (i.id === id ? updated : i)),
        selectedItem: updated,
        isLoading: false,
      }));
      return updated;
    } catch (err: any) {
      set({ error: err.message, isLoading: false });
      throw err;
    }
  },

  remove: async (id: string) => {
    set({ isLoading: true, error: null });
    try {
      await api.delete(`/api/{{model_names}}/${id}`);
      set((state) => ({
        items: state.items.filter((i) => i.id !== id),
        selectedItem: state.selectedItem?.id === id ? null : state.selectedItem,
        isLoading: false,
      }));
    } catch (err: any) {
      set({ error: err.message, isLoading: false });
      throw err;
    }
  },

  clearError: () => set({ error: null }),
}));
