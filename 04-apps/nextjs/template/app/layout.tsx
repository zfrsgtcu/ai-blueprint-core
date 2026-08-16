// {{ProjectName}} — Root Layout
// Tüm sayfalarda ortak olan HTML yapısını ve metadata'yı tanımlar.
// AI: metadata'daki title, description ve openGraph alanlarını projeye göre özelleştir.

import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: {
    default: '{{Description}}',
    template: '%s — {{ProjectName}}',
  },
  description: '{{Description}}',
  openGraph: {
    title: '{{Description}}',
    description: '{{Description}}',
    type: 'website',
    locale: 'tr_TR',
    // images: [{ url: '/og-image.png' }],
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="tr">
      <body className="min-h-screen bg-white antialiased">
        {/* Header / Navigasyon */}
        <header className="border-b sticky top-0 bg-white z-50">
          <nav className="container mx-auto flex items-center justify-between px-4 py-4">
            <a href="/" className="text-xl font-bold">
              {{ProjectName}}
            </a>
            <ul className="flex gap-6">
              <li>
                <a href="/" className="hover:text-blue-600 transition-colors">
                  Ana Sayfa
                </a>
              </li>
              <li>
                <a href="/about" className="hover:text-blue-600 transition-colors">
                  Hakkımızda
                </a>
              </li>
              <li>
                <a href="/contact" className="hover:text-blue-600 transition-colors">
                  İletişim
                </a>
              </li>
            </ul>
          </nav>
        </header>

        {/* Ana İçerik */}
        <main className="flex-1">{children}</main>

        {/* Footer */}
        <footer className="border-t bg-gray-50">
          <div className="container mx-auto px-4 py-8">
            <div className="flex flex-col md:flex-row justify-between gap-8">
              <div>
                <h3 className="font-bold">{{ProjectName}}</h3>
                <p className="text-gray-600 mt-2 text-sm">{{Description}}</p>
              </div>
              <div>
                <h4 className="font-semibold mb-2">Bağlantılar</h4>
                <ul className="space-y-1 text-sm text-gray-600">
                  <li><a href="/about" className="hover:text-blue-600">Hakkımızda</a></li>
                  <li><a href="/contact" className="hover:text-blue-600">İletişim</a></li>
                  <li><a href="/privacy" className="hover:text-blue-600">Gizlilik Politikası</a></li>
                </ul>
              </div>
            </div>
            <div className="mt-8 border-t pt-4 text-center text-sm text-gray-500">
              &copy; {new Date().getFullYear()} {{ProjectName}}. Tüm hakları saklıdır.
            </div>
          </div>
        </footer>
      </body>
    </html>
  );
}
