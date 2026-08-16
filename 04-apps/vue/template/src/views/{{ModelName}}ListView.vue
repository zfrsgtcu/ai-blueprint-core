<!-- PURPOSE OF THIS FILE: {{ModelName}} liste sayfası — yükleme, hata, boş ve veri durumlarını yönetir -->
<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { use{{ModelName}}Store } from '@/stores/{{modelName}}.store';
import {{ModelName}}Card from '@/components/{{ModelName}}Card.vue';

const store = use{{ModelName}}Store();
const search = ref('');

onMounted(() => {
  store.fetchItems();
});

async function handleDelete(id: string) {
  if (!confirm('Silmek istediğinize emin misiniz?')) return;
  try {
    await store.remove(id);
  } catch {
    // Hata store.error'da
  }
}
</script>

<template>
  <div>
    <div class="flex items-center justify-between mb-6">
      <h1 class="text-2xl font-bold text-gray-900">{{HumanReadableName}}</h1>
    </div>

    <div v-if="store.isLoading" class="text-center py-12" role="status">
      <div class="animate-spin w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full mx-auto"></div>
      <p class="mt-4 text-gray-500">Yükleniyor...</p>
    </div>

    <div v-else-if="store.error" class="bg-red-50 border border-red-200 rounded-lg p-4" role="alert">
      <p class="text-red-700">{{ "{{ store.error }}" }}</p>
      <button @click="store.fetchItems()" class="mt-2 text-sm text-red-600 underline">Tekrar dene</button>
    </div>

    <div v-else-if="store.items.length === 0" class="text-center py-12">
      <p class="text-gray-500">Henüz kayıt bulunmamaktadır.</p>
    </div>

    <div v-else class="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      <{{ModelName}}Card
        v-for="item in store.items"
        :key="item.id"
        :item="item"
        @delete="handleDelete"
      />
    </div>
  </div>
</template>
