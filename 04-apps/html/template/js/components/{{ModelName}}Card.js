<!-- PURPOSE OF THIS FILE: {{ModelName}}Card bileşeni — semantic article elementi ile kart görünümü -->
/**
 * {{ModelName}} kart bileşeni.
 *
 * Her kart bir `<article>` elementi olarak render edilir.
 * Silme işlemi için `onDelete` callback'i çağrılır.
 *
 * @param {object} item — {{ModelName}} verisi (id, name, description, ...)
 * @param {Function} onDelete — silme callback'i: (id: string) => void
 * @returns {HTMLElement} — render edilmiş kart elementi
 */
export function render{{ModelName}}Card(item, onDelete) {
  const article = document.createElement('article');
  article.className = 'card';
  article.setAttribute('aria-labelledby', `card-title-${item.id}`);

  article.innerHTML = `
    <h3 id="card-title-${item.id}" class="card__title">
      <a href="#/{{model_names}}/${item.id}" class="card__title-link">
        ${escapeHtml(item.name || item.title || item.id)}
      </a>
    </h3>
    <p class="card__desc">${escapeHtml(item.description || '')}</p>
    <div class="card__actions">
      <a href="#/{{model_names}}/${item.id}" class="btn btn--secondary btn--sm"
         aria-label="${escapeHtml(item.name || item.title || item.id)} detayını görüntüle">
        Detay
      </a>
      <button type="button" class="btn btn--danger btn--sm"
              aria-label="${escapeHtml(item.name || item.title || item.id)} kaydını sil"
              data-delete-id="${item.id}">
        Sil
      </button>
    </div>
  `;

  // Silme butonu event listener'ı
  const deleteBtn = article.querySelector('[data-delete-id]');
  if (deleteBtn && onDelete) {
    deleteBtn.addEventListener('click', () => {
      if (window.confirm('Bu kaydı silmek istediğinize emin misiniz?')) {
        onDelete(item.id);
      }
    });
  }

  return article;
}

/**
 * XSS koruması — HTML özel karakterlerini escape eder.
 * @param {string} str
 * @returns {string}
 */
function escapeHtml(str) {
  const div = document.createElement('div');
  div.appendChild(document.createTextNode(str));
  return div.innerHTML;
}
