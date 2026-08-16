<!-- PURPOSE OF THIS FILE: Hash-based SPA Router — hash değişimini dinler, route → handler eşleştirmesi yapar -->
/**
 * Basit hash-based SPA router.
 *
 * Rota tanımı: `{ path: string | RegExp, handler: (params) => void }`
 * Dinamik segmentler RegExp grupları ile yakalanır.
 *
 * Kullanım:
 *   import { router } from './router.js';
 *   router.on('/{{model_names}}', () => render{{ModelName}}List());
 *   router.on(/^\/{{model_names}}\/([^/]+)$/, ([id]) => render{{ModelName}}Detail(id));
 *   router.start();
 */
class Router {
  constructor() {
    this.routes = [];
    this.notFoundHandler = null;
    this._onHashChange = this._onHashChange.bind(this);
  }

  /**
   * Rota kaydı.
   * @param {string|RegExp} pattern — string tam eşleşme, RegExp grup yakalamalı
   * @param {Function} handler — (params: string[]) => void
   */
  on(pattern, handler) {
    this.routes.push({ pattern, handler });
  }

  /**
   * 404 handler kaydı.
   * @param {Function} handler
   */
  onNotFound(handler) {
    this.notFoundHandler = handler;
  }

  /**
   * Navigator (programatik yönlendirme).
   * @param {string} hash — '#' dahil veya hariç (örn: '/{{model_names}}')
   */
  navigate(hash) {
    window.location.hash = hash.startsWith('#') ? hash.slice(1) : hash;
  }

  /** Router dinlemeyi başlatır. */
  start() {
    window.addEventListener('hashchange', this._onHashChange);
    // İlk yüklemede de rotayı çalıştır
    if (window.location.hash) {
      this._onHashChange();
    } else {
      this.navigate('/');
    }
  }

  /** Router dinlemeyi durdurur. */
  stop() {
    window.removeEventListener('hashchange', this._onHashChange);
  }

  /**
   * Hash değişiminde çağrılır — kayıtlı rotalar arasında eşleşme arar.
   * @private
   */
  _onHashChange() {
    const hash = window.location.hash.slice(1) || '/';
    const appEl = document.getElementById('app');

    // Önceki view içeriğini temizle
    if (appEl) {
      appEl.innerHTML = '';
    }

    for (const { pattern, handler } of this.routes) {
      if (typeof pattern === 'string') {
        if (pattern === hash) {
          handler([]);
          return;
        }
      } else if (pattern instanceof RegExp) {
        const match = hash.match(pattern);
        if (match) {
          handler(match.slice(1));
          return;
        }
      }
    }

    // Hiçbir route eşleşmedi → 404
    if (this.notFoundHandler) {
      this.notFoundHandler();
    }
  }
}

/** Singleton router */
export const router = new Router();
