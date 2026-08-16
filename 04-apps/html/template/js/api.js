<!-- PURPOSE OF THIS FILE: API client — fetch wrapper, JWT token yönetimi, hata işleme -->
/**
 * API istemcisi — fetch tabanlı, JWT token yönetimli.
 *
 * Kullanım:
 *   import { api } from './api.js';
 *   const data = await api.get('/api/{{model_names}}');
 *   const created = await api.post('/api/{{model_names}}', { name: '...' });
 */
const API_BASE_URL = '{{API_BASE_URL}}';

class ApiClient {
  constructor(baseUrl) {
    this.baseUrl = baseUrl;
  }

  /**
   * localStorage'dan JWT token okur.
   * @returns {string|null}
   */
  getToken() {
    return localStorage.getItem('token');
  }

  /**
   * JWT token kaydeder.
   * @param {string} token
   */
  setToken(token) {
    localStorage.setItem('token', token);
  }

  /**
   * JWT token'ı siler (çıkış yapma).
   */
  clearToken() {
    localStorage.removeItem('token');
  }

  /**
   * Genel fetch işlemi.
   * @param {string} path — endpoint (örn: '/api/{{model_names}}')
   * @param {object} [options={}]
   * @returns {Promise<any>}
   */
  async request(path, options = {}) {
    const url = `${this.baseUrl}${path}`;
    const token = this.getToken();

    const headers = {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    };

    const response = await fetch(url, { ...options, headers });

    // 204 No Content
    if (response.status === 204) return null;

    const data = await response.json();

    if (!response.ok) {
      // 401 ise token'ı temizle
      if (response.status === 401) {
        this.clearToken();
      }
      throw new ApiError(data.error || `HTTP ${response.status}`, response.status);
    }

    return data;
  }

  /** GET isteği */
  get(path) {
    return this.request(path, { method: 'GET' });
  }

  /** POST isteği */
  post(path, body) {
    return this.request(path, {
      method: 'POST',
      body: JSON.stringify(body),
    });
  }

  /** PUT isteği */
  put(path, body) {
    return this.request(path, {
      method: 'PUT',
      body: JSON.stringify(body),
    });
  }

  /** PATCH isteği */
  patch(path, body) {
    return this.request(path, {
      method: 'PATCH',
      body: JSON.stringify(body),
    });
  }

  /** DELETE isteği */
  delete(path) {
    return this.request(path, { method: 'DELETE' });
  }
}

/** API hata sınıfı */
class ApiError extends Error {
  constructor(message, status) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
  }
}

/** Singleton API istemcisi */
export const api = new ApiClient(API_BASE_URL);
