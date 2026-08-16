<!-- PURPOSE OF THIS FILE: Uygulama giriş noktası — router konfigürasyonu, sayfa render fonksiyonları -->
import { router } from './router.js';
import { api } from './api.js';
import { render{{ModelName}}Card } from './components/{{ModelName}}Card.js';

// ============================================================
// Ana sayfa render
// ============================================================
function renderHome() {
  const app = document.getElementById('app');
  app.innerHTML = `
    <section class="hero" aria-labelledby="hero-heading">
      <h1 id="hero-heading" class="hero__title">{{ProjectName}}</h1>
      <p class="hero__lead">{{Description}}</p>
      <a href="#/{{model_names}}" class="btn btn--primary">
        {{model_names}} sayfasına git
        <span aria-hidden="true">→</span>
      </a>
    </section>

    <section class="features" aria-labelledby="features-heading">
      <h2 id="features-heading" class="section__title">Özellikler</h2>
      <div class="features__grid">
        <article class="feature-card">
          <div class="feature-card__icon" aria-hidden="true">🔒</div>
          <h3 class="feature-card__title">Güvenli</h3>
          <p class="feature-card__desc">JWT tabanlı kimlik doğrulama ile güvenli erişim.</p>
        </article>
        <article class="feature-card">
          <div class="feature-card__icon" aria-hidden="true">⚡</div>
          <h3 class="feature-card__title">Hızlı</h3>
          <p class="feature-card__desc">Statik HTML + vanilya JS ile sıfır build süresi.</p>
        </article>
        <article class="feature-card">
          <div class="feature-card__icon" aria-hidden="true">♿</div>
          <h3 class="feature-card__title">Erişilebilir</h3>
          <p class="feature-card__desc">WCAG 2.1 AA uyumlu, tamamen klavye ile gezilebilir.</p>
        </article>
      </div>
    </section>
  `;
}

// ============================================================
// Liste sayfası render
// ============================================================
async function render{{ModelName}}List() {
  const app = document.getElementById('app');

  // Yükleme durumu
  app.innerHTML = `
    <div class="page-header">
      <h1 class="page-title">{{HumanReadableName}}</h1>
      <a href="#/{{model_names}}/yeni" class="btn btn--primary">Yeni Ekle</a>
    </div>
    <div class="loading" role="status" aria-label="Yükleniyor">
      <div class="spinner" aria-hidden="true"></div>
    </div>
  `;

  try {
    const result = await api.get('/api/{{model_names}}');
    const items = result.data || [];

    const pageHeader = app.querySelector('.page-header');

    if (items.length === 0) {
      // Boş durum
      app.innerHTML = `
        <div class="page-header">
          <h1 class="page-title">{{HumanReadableName}}</h1>
          <a href="#/{{model_names}}/yeni" class="btn btn--primary">Yeni Ekle</a>
        </div>
        <div class="empty-state">
          <div class="empty-state__icon" aria-hidden="true">📭</div>
          <p class="empty-state__text">Henüz bir kayıt bulunmuyor.</p>
          <a href="#/{{model_names}}/yeni" class="btn btn--primary">İlk kaydı ekle</a>
        </div>
      `;
      return;
    }

    // Veri var — kart grid'i oluştur
    app.innerHTML = `
      <div class="page-header">
        <h1 class="page-title">{{HumanReadableName}}</h1>
        <a href="#/{{model_names}}/yeni" class="btn btn--primary">Yeni Ekle</a>
      </div>
      <div class="card-grid" id="card-grid" role="list" aria-label="{{HumanReadableName}} listesi"></div>
    `;

    const grid = document.getElementById('card-grid');

    for (const item of items) {
      const card = render{{ModelName}}Card(item, async (id) => {
        try {
          await api.delete(`/api/{{model_names}}/${id}`);
          await render{{ModelName}}List(); // Listeyi yeniden yükle
        } catch (err) {
          showError(app, `Silme başarısız: ${err.message}`);
        }
      });
      card.setAttribute('role', 'listitem');
      grid.appendChild(card);
    }
  } catch (err) {
    app.innerHTML = `
      <div class="page-header">
        <h1 class="page-title">{{HumanReadableName}}</h1>
      </div>
    `;
    showError(app, `Liste yüklenemedi: ${err.message}`);
  }
}

// ============================================================
// Detay sayfası render
// ============================================================
async function render{{ModelName}}Detail(id) {
  const app = document.getElementById('app');

  app.innerHTML = `
    <div class="loading" role="status" aria-label="Yükleniyor">
      <div class="spinner" aria-hidden="true"></div>
    </div>
  `;

  try {
    const item = await api.get(`/api/{{model_names}}/${id}`);

    app.innerHTML = `
      <div class="detail" aria-labelledby="detail-title">
        <a href="#/{{model_names}}" class="detail__back">
          <span aria-hidden="true">←</span> Listeye dön
        </a>
        <h1 id="detail-title" class="detail__title">${escapeHtml(item.name || item.title || '')}</h1>
        <dl class="detail__meta">
          <dt>Oluşturulma</dt>
          <dd><time datetime="${item.createdAt || ''}">${formatDate(item.createdAt)}</time></dd>
          <dt>Güncellenme</dt>
          <dd><time datetime="${item.updatedAt || ''}">${formatDate(item.updatedAt)}</time></dd>
        </dl>
        <div class="detail__actions">
          <a href="#/{{model_names}}/${id}/duzenle" class="btn btn--secondary">Düzenle</a>
          <button type="button" id="detail-delete-btn" class="btn btn--danger">Sil</button>
        </div>
      </div>
    `;

    document.getElementById('detail-delete-btn').addEventListener('click', async () => {
      if (!window.confirm('Bu kaydı silmek istediğinize emin misiniz?')) return;
      try {
        await api.delete(`/api/{{model_names}}/${id}`);
        router.navigate('/{{model_names}}');
      } catch (err) {
        showError(app, `Silme başarısız: ${err.message}`);
      }
    });
  } catch (err) {
    app.innerHTML = '';
    showError(app, `Kayıt yüklenemedi: ${err.message}`);
  }
}

// ============================================================
// 404 sayfası
// ============================================================
function renderNotFound() {
  const app = document.getElementById('app');
  app.innerHTML = `
    <div class="not-found">
      <div class="not-found__code" aria-hidden="true">404</div>
      <h1 class="page-title">Sayfa Bulunamadı</h1>
      <p class="not-found__message">Aradığınız sayfa mevcut değil veya taşınmış olabilir.</p>
      <a href="#/" class="btn btn--primary">Ana Sayfaya Dön</a>
    </div>
  `;
}

// ============================================================
// Yardımcı fonksiyonlar
// ============================================================

/**
 * Hata banner'ı gösterir.
 * @param {HTMLElement} container
 * @param {string} message
 */
function showError(container, message) {
  const banner = document.createElement('div');
  banner.className = 'error-banner';
  banner.setAttribute('role', 'alert');
  banner.textContent = message;
  if (container.firstChild) {
    container.insertBefore(banner, container.firstChild);
  } else {
    container.appendChild(banner);
  }
}

function escapeHtml(str) {
  const div = document.createElement('div');
  div.appendChild(document.createTextNode(str));
  return div.innerHTML;
}

function formatDate(isoString) {
  if (!isoString) return '—';
  return new Date(isoString).toLocaleDateString('tr-TR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

// ============================================================
// Route kayıtları
// ============================================================
router.on('/', renderHome);
router.on('/{{model_names}}', render{{ModelName}}List);
router.on(/^\/{{model_names}}\/([^/]+)$/, ([id]) => render{{ModelName}}Detail(id));
router.onNotFound(renderNotFound);

// Uygulamayı başlat
router.start();
