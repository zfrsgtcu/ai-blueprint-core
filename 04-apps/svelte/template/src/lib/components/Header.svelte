<script lang="ts">
  import { page } from '$app/stores';
  import { goto } from '$app/navigation';
</script>

<header class="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
  <div>
    <h1 class="text-lg font-semibold text-gray-900">
      {#if $page.url.pathname === '/dashboard'}
        Dashboard
      {:else if $page.url.pathname.startsWith('/{{model_names}}')}
        {{HumanReadableName}}
      {:else}
        {{ProjectName}}
      {/if}
    </h1>
  </div>

  <div class="flex items-center gap-4">
    <!-- Arama -->
    <input
      type="search"
      placeholder="Ara..."
      class="w-64 px-3 py-2 border border-gray-300 rounded-md text-sm
             focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
    />

    <!-- Bildirim -->
    <button class="relative p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-md">
      🔔
      <span class="absolute top-0 right-0 w-2 h-2 bg-red-500 rounded-full"></span>
    </button>

    <!-- Profil -->
    <button
      onclick={() => goto('/profile')}
      class="w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center text-sm"
    >
      U
    </button>
  </div>
</header>
