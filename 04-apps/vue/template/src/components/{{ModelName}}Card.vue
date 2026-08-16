<!-- PURPOSE OF THIS FILE: {{ModelName}}Card component — kart görünümü, link ve silme butonu -->
<script setup lang="ts">
import type { {{ModelName}}Dto } from '@/types/{{modelName}}.types';

defineProps<{
  item: {{ModelName}}Dto;
}>();

defineEmits<{
  (e: 'delete', id: string): void;
}>();
</script>

<template>
  <div class="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow">
    <div class="flex items-start justify-between">
      <router-link
        :to="`/{{model_names}}/${item.id}`"
        class="text-lg font-semibold text-gray-900 hover:text-blue-600 transition-colors"
      >
        {{ "{{ item.name }}" }}
      </router-link>
      <button
        @click="$emit('delete', item.id)"
        class="text-red-500 hover:text-red-700 p-1 rounded transition-colors"
        aria-label="Sil"
      >
        ✕
      </button>
    </div>
    <p v-if="item.description" class="mt-2 text-gray-600 text-sm line-clamp-2">
      {{ "{{ item.description }}" }}
    </p>
    <p class="mt-3 text-xs text-gray-400">
      {{ "{{ new Date(item.createdAt).toLocaleDateString('tr-TR') }}" }}
    </p>
  </div>
</template>
