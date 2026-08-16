<!-- PURPOSE OF THIS FILE: Ana sayfa — hoş geldiniz başlığı ve hızlı navigasyon linkleri -->
<script setup lang="ts">
</script>

<template>
  <div class="text-center py-16">
    <h1 class="text-4xl font-bold text-gray-900 mb-4">
      {{ProjectName}}'ye Hoş Geldiniz
    </h1>
    <p class="text-xl text-gray-600 mb-8">
      {{Description}}
    </p>
    <div class="flex justify-center gap-4">
      <router-link
        to="/{{model_names}}"
        class="inline-flex items-center px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
      >
        {{HumanReadableName}} Yönetimi
      </router-link>
    </div>
  </div>
</template>
