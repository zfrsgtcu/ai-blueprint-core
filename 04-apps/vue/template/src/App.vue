<!-- PURPOSE OF THIS FILE: Root Vue component — RouterView ile sayfa render, geçiş animasyonları -->
<script setup lang="ts">
</script>

<template>
  <div id="app-root">
    <header class="bg-white shadow-sm border-b border-gray-200">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <nav class="flex items-center justify-between h-16" aria-label="Ana menü">
          <router-link to="/" class="text-xl font-bold text-blue-600">
            {{ProjectName}}
          </router-link>
          <div class="flex gap-6">
            <router-link to="/" class="text-gray-600 hover:text-blue-600 transition-colors">
              Ana Sayfa
            </router-link>
            <router-link to="/{{model_names}}" class="text-gray-600 hover:text-blue-600 transition-colors">
              {{HumanReadableName}}
            </router-link>
          </div>
        </nav>
      </div>
    </header>

    <main class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <router-view v-slot="{ Component }">
        <transition name="fade" mode="out-in">
          <component :is="Component" />
        </transition>
      </router-view>
    </main>
  </div>
</template>

<style scoped>
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.15s ease;
}
.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>
