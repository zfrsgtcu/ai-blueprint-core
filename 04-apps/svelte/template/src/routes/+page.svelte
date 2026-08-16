<script lang="ts">
  import { goto } from '$app/navigation';
</script>

<svelte:head>
  <title>{{ProjectName}}</title>
  <meta name="description" content="{{Description}}" />
</svelte:head>

<main>
  <div class="max-w-7xl mx-auto">
    <!-- Hero Section -->
    <div class="text-center py-16">
      <h1 class="text-4xl font-bold text-gray-900 mb-4">
        {{ProjectName}}'e Hoş Geldiniz
      </h1>
      <p class="text-lg text-gray-600 mb-8 max-w-2xl mx-auto">
        {{Description}}
      </p>
      <div class="flex gap-4 justify-center">
        <button
          onclick={() => goto('/dashboard')}
          class="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700
                 font-medium transition-colors"
        >
          Başlayın
        </button>
        <button
          onclick={() => goto('/about')}
          class="bg-white text-gray-700 px-6 py-3 rounded-lg border border-gray-300
                 hover:bg-gray-50 font-medium transition-colors"
        >
          Daha Fazla Bilgi
        </button>
      </div>
    </div>

    <!-- Stats Cards -->
    <div class="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
      <div class="bg-white rounded-lg shadow-sm border border-gray-200 p-6 text-center">
        <div class="text-3xl font-bold text-blue-600 mb-2">0</div>
        <div class="text-sm text-gray-600">Toplam Kayıt</div>
      </div>

      <div class="bg-white rounded-lg shadow-sm border border-gray-200 p-6 text-center">
        <div class="text-3xl font-bold text-green-600 mb-2">0</div>
        <div class="text-sm text-gray-600">Aktif</div>
      </div>

      <div class="bg-white rounded-lg shadow-sm border border-gray-200 p-6 text-center">
        <div class="text-3xl font-bold text-purple-600 mb-2">0</div>
        <div class="text-sm text-gray-600">Bu Ay</div>
      </div>
    </div>
  </div>
</main>
