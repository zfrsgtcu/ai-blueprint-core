// {{ProjectName}} — Örnek Server API Route
// Nitro server engine ile lightweight BFF (Backend for Frontend) endpoint'i.
// AI: Bu route'u backend proxy veya lightweight API endpoint'i olarak özelleştir.
// Güvenlik: Sensitive data (API key, secret) asla expose etme!

export default defineEventHandler(async (event) => {
  // Query parametrelerini al
  const query = getQuery(event);

  // Örnek: Backend API'ye proxy
  // const config = useRuntimeConfig();
  // const response = await $fetch(`${config.apiSecret}/{{model_names}}`, {
  //   headers: { Authorization: `Bearer ${config.apiSecret}` },
  // });

  return {
    message: '{{ProjectName}} — Server API çalışıyor',
    timestamp: new Date().toISOString(),
    query,
  };
});
