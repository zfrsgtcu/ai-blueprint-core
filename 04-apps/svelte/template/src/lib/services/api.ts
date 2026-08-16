import axios from 'axios';
import { browser } from '$app/environment';

const api = axios.create({
  baseURL: '{{API_BASE_URL}}',
  timeout: 15000,
  headers: { 'Content-Type': 'application/json' },
});

// Request interceptor — JWT token ekle
api.interceptors.request.use((config) => {
  if (browser) {
    const token = localStorage.getItem('accessToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  }
  return config;
});

// Response interceptor — 401 handling
api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401 && browser) {
      localStorage.removeItem('accessToken');
      window.location.href = '/login';
    }
    return Promise.reject(err);
  }
);

export { api };
