# PERFORMANCE OPTIMIZATION STANDARDS

1. **BUNDLE SIZE:**
   Keep initial JavaScript bundle under 200KB (gzipped). Use code splitting (e.g., React.lazy, Nuxt's `defineAsyncComponent`) for large routes/modules.

2. **API CALLS:**
   Batch independent API requests into parallel calls (e.g., `Promise.all`) to reduce waterfall. Avoid sequential calls for unrelated data.

3. **IMAGE OPTIMIZATION:**
   Use framework-specific image components (Next.js `next/image`, Astro's `<Image />`, Nuxt's `<NuxtImg>`) for automatic optimization, lazy loading, and format conversion (WebP/AVIF).

4. **DEBOUNCING / THROTTLING:**
   Debounce search inputs (300ms), throttle scroll/resize events (100ms) to reduce expensive function calls.

5. **MEMORY AND CACHING:**
   Cache API responses using browser cache (Cache-Control) or service workers. Invalidate cache only when data changes. Avoid storing large data in component state.

6. **WEB VITALS:**
   Ensure Largest Contentful Paint (LCP) < 2.5s, First Input Delay (FID) < 100ms, Cumulative Layout Shift (CLS) < 0.1. Use tools like Lighthouse to audit.