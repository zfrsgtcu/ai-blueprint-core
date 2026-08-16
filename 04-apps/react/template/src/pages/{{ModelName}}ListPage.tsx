<!-- PURPOSE OF THIS FILE: {{ModelName}} liste sayfası — loading, error, empty, data state'leri -->
import { useEffect } from 'react';
import { use{{ModelName}}Store } from '@/stores/{{modelName}}.store';
import {{ModelName}}Card from '@/components/{{ModelName}}Card';

export default function {{ModelName}}ListPage() {
  const { items, isLoading, error, fetchItems, remove } = use{{ModelName}}Store();

  useEffect(() => {
    fetchItems();
  }, [fetchItems]);

  async function handleDelete(id: string) {
    if (!confirm('Silmek istediğinize emin misiniz?')) return;
    try {
      await remove(id);
    } catch {
      // Hata store.error'da
    }
  }

  if (isLoading) {
    return (
      <div className="text-center py-12" role="status">
        <div className="animate-spin w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full mx-auto" />
        <p className="mt-4 text-gray-500">Yükleniyor...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4" role="alert">
        <p className="text-red-700">{error}</p>
        <button onClick={fetchItems} className="mt-2 text-sm text-red-600 underline">
          Tekrar dene
        </button>
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">Henüz kayıt bulunmamaktadır.</p>
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">{{HumanReadableName}}</h1>
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {items.map((item) => (
          <{{ModelName}}Card key={item.id} item={item} onDelete={handleDelete} />
        ))}
      </div>
    </div>
  );
}
