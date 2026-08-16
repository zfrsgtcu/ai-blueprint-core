<!-- PURPOSE OF THIS FILE: {{ModelName}} detay sayfası — tek kayıt görüntüleme, useParams ile ID -->
import { useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { use{{ModelName}}Store } from '@/stores/{{modelName}}.store';

export default function {{ModelName}}DetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { selectedItem, isLoading, error, fetchById } = use{{ModelName}}Store();

  useEffect(() => {
    if (id) fetchById(id);
  }, [id, fetchById]);

  if (isLoading) {
    return (
      <div className="text-center py-12" role="status">
        <p className="text-gray-500">Yükleniyor...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4" role="alert">
        <p className="text-red-700">{error}</p>
      </div>
    );
  }

  if (!selectedItem) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">Kayıt bulunamadı.</p>
      </div>
    );
  }

  return (
    <div>
      <button
        onClick={() => navigate(-1)}
        className="mb-6 text-blue-600 hover:text-blue-800 flex items-center gap-1 transition-colors"
      >
        ← Geri
      </button>

      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-4">{selectedItem.name}</h1>
        {selectedItem.description && (
          <p className="text-gray-600 mb-4">{selectedItem.description}</p>
        )}
        <dl className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <dt className="text-gray-500">Oluşturulma</dt>
            <dd className="text-gray-900">
              {new Date(selectedItem.createdAt).toLocaleDateString('tr-TR')}
            </dd>
          </div>
          {selectedItem.updatedAt && (
            <div>
              <dt className="text-gray-500">Güncellenme</dt>
              <dd className="text-gray-900">
                {new Date(selectedItem.updatedAt).toLocaleDateString('tr-TR')}
              </dd>
            </div>
          )}
        </dl>
      </div>
    </div>
  );
}
