<!-- PURPOSE OF THIS FILE: {{ModelName}}Card component — kart görünümü, link ve silme butonu -->
import { Link } from 'react-router-dom';
import type { {{ModelName}}Dto } from '@/types/{{modelName}}.types';

interface Props {
  item: {{ModelName}}Dto;
  onDelete: (id: string) => void;
}

export default function {{ModelName}}Card({ item, onDelete }: Props) {
  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between">
        <Link
          to={`/{{model_names}}/${item.id}`}
          className="text-lg font-semibold text-gray-900 hover:text-blue-600 transition-colors"
        >
          {item.name}
        </Link>
        <button
          onClick={() => onDelete(item.id)}
          className="text-red-500 hover:text-red-700 p-1 rounded transition-colors"
          aria-label="Sil"
        >
          ✕
        </button>
      </div>
      {item.description && (
        <p className="mt-2 text-gray-600 text-sm line-clamp-2">{item.description}</p>
      )}
      <p className="mt-3 text-xs text-gray-400">
        {new Date(item.createdAt).toLocaleDateString('tr-TR')}
      </p>
    </div>
  );
}
