<!-- PURPOSE OF THIS FILE: Layout component — header, navigasyon ve Outlet ile sayfa render -->
import { Suspense } from 'react';
import { Outlet, Link, NavLink } from 'react-router-dom';

export default function Layout() {
  return (
    <div className="min-h-screen">
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <nav className="flex items-center justify-between h-16" aria-label="Ana menü">
            <Link to="/" className="text-xl font-bold text-blue-600">
              {{ProjectName}}
            </Link>
            <div className="flex gap-6">
              <NavLink
                to="/"
                end
                className={({ isActive }) =>
                  `transition-colors ${isActive ? 'text-blue-600 font-medium' : 'text-gray-600 hover:text-blue-600'}`
                }
              >
                Ana Sayfa
              </NavLink>
              <NavLink
                to="/{{model_names}}"
                className={({ isActive }) =>
                  `transition-colors ${isActive ? 'text-blue-600 font-medium' : 'text-gray-600 hover:text-blue-600'}`
                }
              >
                {{HumanReadableName}}
              </NavLink>
            </div>
          </nav>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Suspense
          fallback={
            <div className="text-center py-12" role="status">
              <div className="animate-spin w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full mx-auto" />
              <p className="mt-4 text-gray-500">Yükleniyor...</p>
            </div>
          }
        >
          <Outlet />
        </Suspense>
      </main>
    </div>
  );
}
