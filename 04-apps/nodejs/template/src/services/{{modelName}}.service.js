<!-- PURPOSE OF THIS FILE: {{ModelName}} service — file-based JSON DB ile CRUD işlemleri -->
const path = require('path');
const fs = require('fs/promises');

const DATA_DIR = path.join(__dirname, '..', '..', 'data');
const DATA_FILE = path.join(DATA_DIR, '{{model_names}}.json');

/**
 * Veri dosyasının varlığını garanti eder, yoksa boş array ile oluşturur.
 */
async function ensureDataFile() {
  try {
    await fs.access(DATA_FILE);
  } catch {
    await fs.mkdir(DATA_DIR, { recursive: true });
    await fs.writeFile(DATA_FILE, '[]', 'utf-8');
  }
}

/**
 * Tüm kayıtları okur.
 * @returns {Promise<Array>}
 */
async function readAll() {
  await ensureDataFile();
  const raw = await fs.readFile(DATA_FILE, 'utf-8');
  return JSON.parse(raw);
}

/**
 * Tüm kayıtları yazar.
 * @param {Array} items
 */
async function writeAll(items) {
  await ensureDataFile();
  await fs.writeFile(DATA_FILE, JSON.stringify(items, null, 2), 'utf-8');
}

const {{modelName}}Service = {
  /**
   * Sayfalı listeleme.
   * @param {number} page
   * @param {number} limit
   * @returns {Promise<{data: Array, total: number, page: number, limit: number}>}
   */
  async findAll(page = 1, limit = 10) {
    const items = await readAll();
    const total = items.length;
    const start = (page - 1) * limit;
    const data = items.slice(start, start + limit);
    return { data, total, page, limit };
  },

  /**
   * ID ile tek kayıt getir.
   * @param {string} id
   * @returns {Promise<object|null>}
   */
  async findById(id) {
    const items = await readAll();
    return items.find((item) => item.id === id) || null;
  },

  /**
   * Yeni kayıt oluştur.
   * @param {object} dto
   * @returns {Promise<object>}
   */
  async create(dto) {
    if (!dto || Object.keys(dto).length === 0) {
      throw new Error('VALIDATION: Gövde boş olamaz');
    }

    const items = await readAll();
    const now = new Date().toISOString();
    const item = {
      id: generateId(),
      ...dto,
      createdAt: now,
      updatedAt: now,
    };
    items.push(item);
    await writeAll(items);
    return item;
  },

  /**
   * Tam güncelleme (PUT).
   * @param {string} id
   * @param {object} dto
   * @returns {Promise<object|null>}
   */
  async update(id, dto) {
    if (!dto || Object.keys(dto).length === 0) {
      throw new Error('VALIDATION: Gövde boş olamaz');
    }

    const items = await readAll();
    const idx = items.findIndex((item) => item.id === id);
    if (idx === -1) return null;

    items[idx] = {
      ...dto,
      id,
      createdAt: items[idx].createdAt,
      updatedAt: new Date().toISOString(),
    };
    await writeAll(items);
    return items[idx];
  },

  /**
   * Kısmi güncelleme (PATCH).
   * @param {string} id
   * @param {object} dto
   * @returns {Promise<object|null>}
   */
  async patch(id, dto) {
    if (!dto || Object.keys(dto).length === 0) {
      throw new Error('VALIDATION: Gövde boş olamaz');
    }

    const items = await readAll();
    const idx = items.findIndex((item) => item.id === id);
    if (idx === -1) return null;

    items[idx] = {
      ...items[idx],
      ...dto,
      id,
      updatedAt: new Date().toISOString(),
    };
    await writeAll(items);
    return items[idx];
  },

  /**
   * Kayıt sil.
   * @param {string} id
   * @returns {Promise<boolean>}
   */
  async remove(id) {
    const items = await readAll();
    const idx = items.findIndex((item) => item.id === id);
    if (idx === -1) return false;

    items.splice(idx, 1);
    await writeAll(items);
    return true;
  },
};

/**
 * Basit UUID benzeri ID üretici.
 * @returns {string}
 */
function generateId() {
  return Date.now().toString(36) + '-' + Math.random().toString(36).slice(2, 10);
}

module.exports = {{modelName}}Service;
