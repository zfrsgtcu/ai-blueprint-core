// {{ProjectName}} — Ana Sayfa
// Bu sayfa {{DomainName}} domain'inin ana sayfasıdır.
// Bu bir Server Component'tir — async/await ve direkt fetch kullanabilirsin.
// AI: Domain gereksinimlerine göre içeriği özelleştir.

import Link from 'next/link';

// Server Component — direkt API çağrısı yapabilir (cache otomatik yönetilir)
// async function get{{ModelName}}s() {
//   const res = await fetch('{{API_BASE_URL}}/{{model_names}}', {
//     headers: { Authorization: `Bearer ${process.env.API_SECRET}` },
//   });
//   if (!res.ok) throw new Error('Failed to fetch');
//   return res.json();
// }

export default async function HomePage() {
  // const {{model_names}} = await get{{ModelName}}s();

  return (
    <div>
      {/* Hero Bölümü */}
      <section className="relative">
        <div className="container mx-auto px-4 py-20">
          <h1 className="text-4xl md:text-6xl font-bold">
            {{Description}}&apos;e Hoş Geldiniz
          </h1>
          <p className="mt-4 text-lg text-gray-600 max-w-2xl">
            {{Description}} için modern, hızlı ve SEO dostu web uygulaması.
          </p>
          <div className="mt-8 flex gap-4">
            <Link
              href="/about"
              className="rounded-lg bg-blue-600 px-6 py-3 text-white hover:bg-blue-700 transition-colors"
            >
              Daha Fazla Bilgi
            </Link>
            <Link
              href="/contact"
              className="rounded-lg border border-gray-300 px-6 py-3 hover:bg-gray-50 transition-colors"
            >
              İletişime Geç
            </Link>
          </div>
        </div>
      </section>

      {/* Öne Çıkan {{HumanReadableName}} */}
      {/* AI: Bu bölümü domain entity'lerine göre özelleştir */}
      <section className="py-16 bg-gray-50">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold mb-8">Öne Çıkan {{HumanReadableName}}</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* AI: API verisinden veya statik veriden döngü ile doldur */}
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="font-semibold text-lg">Örnek Kart</h3>
              <p className="text-gray-600 mt-2">
                Bu bir örnek içerik kartıdır. AI tarafından değiştirilmelidir.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Bölümü */}
      <section className="py-16">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold">Hazır mısınız?</h2>
          <p className="mt-4 text-gray-600">Hemen bizimle iletişime geçin.</p>
          <Link
            href="/contact"
            className="mt-6 inline-block rounded-lg bg-blue-600 px-8 py-3 text-white hover:bg-blue-700 transition-colors"
          >
            Başlayın
          </Link>
        </div>
      </section>
    </div>
  );
}
