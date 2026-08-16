<!-- PURPOSE OF THIS FILE: {{ModelName}} detay sayfası — tek kayıt görüntüleme, ID route param'ından alınır -->
<script setup lang="ts">
import { onMounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { use{{ModelName}}Store } from '@/stores/{{modelName}}.store';

const route = useRoute();
const router = useRouter();
const store = use{{ModelName}}Store();
const id = route.params.id as string;

onMounted(() => {
  store.fetchById(id);
});
</script>

<template>
  <div>
    <button
      @click="router.back()"
      class="mb-6 text-blue-600 hover:text-blue-800 flex items-center gap-1 transition-colors"
    >
      ← Geri
    </button>

    <div v-if="store.isLoading" class="text-center py-12" role="status">
      <p class="text-gray-500">Yükleniyor...</p>
    </div>

    <div v-else-if="store.error" class="bg-red-50 border border-red-200 rounded-lg p-4" role="alert">
      <p class="text-red-700">{{ "{{ store.error }}" }}</p>
    </div>

    <div v-else-if="store.selectedItem" class="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <h1 class="text-2xl font-bold text-gray-900 mb-4">{{ "{{ store.selectedItem.name }}" }}</h1>
      <p v-if="store.selectedItem.description" class="text-gray-600 mb-4">
        {{ "{{ store.selectedItem.description }}" }}
      </p>
      <dl class="grid grid-cols-2 gap-4 text-sm">
        <div>
          <dt class="text-gray-500">Oluşturulma</dt>
          <dd class="text-gray-900">{{ "{{ new Date(store.selectedItem.createdAt).toLocaleDateString('tr-TR') }}" }}</dd>
        </div>
        <div v-if="store.selectedItem.updatedAt">
          <dt class="text-gray-500">Güncellenme</dt>
          <dd class="text-gray-900">{{ "{{ new Date(store.selectedItem.updatedAt).toLocaleDateString('tr-TR') }}" }}</dd>
        </div>
      </dl>
    </div>

    <div v-else class="text-center py-12">
      <p class="text-gray-500">Kayıt bulunamadı.</p>
    </div>
  </div>
</template>
