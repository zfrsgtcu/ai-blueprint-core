<!-- PURPOSE OF THIS FILE: Pinia Composition API store — CRUD işlemleri, loading/error state yönetimi -->
import { ref, computed } from 'vue';
import { defineStore } from 'pinia';
import { api } from '@/services/api';
import type { {{ModelName}}Dto, Create{{ModelName}}Dto, Update{{ModelName}}Dto } from '@/types/{{modelName}}.types';

export const use{{ModelName}}Store = defineStore('{{modelName}}', () => {
  const items = ref<{{ModelName}}Dto[]>([]);
  const selectedItem = ref<{{ModelName}}Dto | null>(null);
  const isLoading = ref(false);
  const error = ref<string | null>(null);

  const itemCount = computed(() => items.value.length);

  async function fetchItems() {
    isLoading.value = true;
    error.value = null;
    try {
      const res = await api.get<{{ModelName}}Dto[]>('/api/{{model_names}}');
      items.value = res.data;
    } catch (err: any) {
      error.value = err.response?.data?.message || err.message;
    } finally {
      isLoading.value = false;
    }
  }

  async function fetchById(id: string) {
    isLoading.value = true;
    try {
      const res = await api.get<{{ModelName}}Dto>(`/api/{{model_names}}/${id}`);
      selectedItem.value = res.data;
    } catch (err: any) {
      error.value = err.message;
    } finally {
      isLoading.value = false;
    }
  }

  async function create(dto: Create{{ModelName}}Dto) {
    const res = await api.post<{{ModelName}}Dto>('/api/{{model_names}}', dto);
    items.value.push(res.data);
    return res.data;
  }

  async function update(id: string, dto: Update{{ModelName}}Dto) {
    const res = await api.put<{{ModelName}}Dto>(`/api/{{model_names}}/${id}`, dto);
    const idx = items.value.findIndex((i) => i.id === id);
    if (idx !== -1) items.value[idx] = res.data;
    if (selectedItem.value?.id === id) selectedItem.value = res.data;
    return res.data;
  }

  async function remove(id: string) {
    await api.delete(`/api/{{model_names}}/${id}`);
    items.value = items.value.filter((i) => i.id !== id);
    if (selectedItem.value?.id === id) selectedItem.value = null;
  }

  function clearError() {
    error.value = null;
  }

  return { items, selectedItem, isLoading, error, itemCount, fetchItems, fetchById, create, update, remove, clearError };
});
