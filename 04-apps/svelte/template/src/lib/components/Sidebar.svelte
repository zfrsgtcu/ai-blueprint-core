<script lang="ts">
  import { page } from '$app/stores';
</script>

<aside class="w-64 bg-gray-900 text-white flex flex-col h-full">
  <div class="p-4 border-b border-gray-800">
    <a href="/" class="text-xl font-bold text-white hover:text-blue-400 transition-colors">
      {{ProjectName}}
    </a>
  </div>

  <nav class="flex-1 p-4 space-y-1 overflow-y-auto">
    <a href="/dashboard"
       class="block px-4 py-2 rounded-md text-gray-300 hover:bg-gray-800 hover:text-white
              transition-colors {$page.url.pathname === '/dashboard' ? 'bg-gray-800 text-white' : ''}">
      📊 Dashboard
    </a>

    <!-- AI: Domain entity'lerine göre buraya menü item'ları ekle -->
    <a href="/{{model_names}}"
       class="block px-4 py-2 rounded-md text-gray-300 hover:bg-gray-800 hover:text-white
              transition-colors {$page.url.pathname.startsWith('/{{model_names}}') ? 'bg-gray-800 text-white' : ''}">
      📋 {{HumanReadableName}}
    </a>
  </nav>

  <div class="p-4 border-t border-gray-800">
    <div class="flex items-center gap-3">
      <div class="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center text-sm font-medium">
        U
      </div>
      <div class="flex-1 min-w-0">
        <p class="text-sm font-medium text-white truncate">Kullanıcı</p>
        <p class="text-xs text-gray-400 truncate">user@example.com</p>
      </div>
    </div>
  </div>
</aside>
