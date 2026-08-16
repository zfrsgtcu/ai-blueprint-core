<!-- PURPOSE OF THIS FILE: 404 sayfası — eşleşmeyen route'lar için hata sayfası -->
<script setup lang="ts">
</script>

<template>
  <div class="text-center py-16">
    <h1 class="text-6xl font-bold text-gray-300 mb-4">404</h1>
    <p class="text-xl text-gray-600 mb-8">Sayfa bulunamadı</p>
    <router-link
      to="/"
      class="inline-flex items-center px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
    >
      Ana Sayfaya Dön
    </router-link>
  </div>
</template>
