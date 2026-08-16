<!--
  {{ProjectName}} — Root Application Component
  Tüm sayfaların ortak yapısını tanımlar.
  AI: Header navigasyon linklerini ve footer içeriğini domain'e göre özelleştir.
-->
<template>
  <div class="min-h-screen flex flex-col bg-white antialiased">
    <!-- Header / Navigasyon -->
    <header class="border-b sticky top-0 bg-white z-50">
      <nav class="container mx-auto flex items-center justify-between px-4 py-4">
        <NuxtLink to="/" class="text-xl font-bold">
          {{ProjectName}}
        </NuxtLink>
        <ul class="flex gap-6">
          <li><NuxtLink to="/" class="hover:text-blue-600 transition-colors">Ana Sayfa</NuxtLink></li>
          <li><NuxtLink to="/about" class="hover:text-blue-600 transition-colors">Hakkımızda</NuxtLink></li>
          <li><NuxtLink to="/contact" class="hover:text-blue-600 transition-colors">İletişim</NuxtLink></li>
        </ul>
      </nav>
    </header>

    <!-- Ana İçerik -->
    <main class="flex-1">
      <NuxtPage />
    </main>

    <!-- Footer -->
    <footer class="border-t bg-gray-50">
      <div class="container mx-auto px-4 py-8">
        <div class="flex flex-col md:flex-row justify-between gap-8">
          <div>
            <h3 class="font-bold">{{ProjectName}}</h3>
            <p class="text-gray-600 mt-2 text-sm">{{Description}}</p>
          </div>
          <div>
            <h4 class="font-semibold mb-2">Bağlantılar</h4>
            <ul class="space-y-1 text-sm text-gray-600">
              <li><NuxtLink to="/about" class="hover:text-blue-600">Hakkımızda</NuxtLink></li>
              <li><NuxtLink to="/contact" class="hover:text-blue-600">İletişim</NuxtLink></li>
              <li><NuxtLink to="/privacy" class="hover:text-blue-600">Gizlilik Politikası</NuxtLink></li>
            </ul>
          </div>
        </div>
        <div class="mt-8 border-t pt-4 text-center text-sm text-gray-500">
          &copy; {{ new Date().getFullYear() }} {{ProjectName}}. Tüm hakları saklıdır.
        </div>
      </div>
    </footer>
  </div>
</template>

<script setup lang="ts">
// AI: Sayfa geçişleri, global state, veya layout-level logic burada yönetilebilir.
// Örnek: useHead ile global meta tag'leri
useHead({
  meta: [
    { name: 'description', content: '{{Description}}' },
    { property: 'og:type', content: 'website' },
  ],
});
</script>
