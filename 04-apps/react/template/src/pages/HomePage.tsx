<!-- PURPOSE OF THIS FILE: Ana sayfa — hoş geldiniz başlığı ve hızlı navigasyon linki -->
import { Link } from 'react-router-dom';

export default function HomePage() {
  return (
    <div className="text-center py-16">
      <h1 className="text-4xl font-bold text-gray-900 mb-4">
        {{ProjectName}}'ye Hoş Geldiniz
      </h1>
      <p className="text-xl text-gray-600 mb-8">
        {{Description}}
      </p>
      <Link
        to="/{{model_names}}"
        className="inline-flex items-center px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
      >
        {{HumanReadableName}} Yönetimi
      </Link>
    </div>
  );
}
