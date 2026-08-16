<!-- PURPOSE OF THIS FILE: API client — fetch tabanlı, auth token interceptor, 401 handling, generic CRUD helper. -->
import * as SecureStore from 'expo-secure-store';

const BASE_URL = process.env.EXPO_PUBLIC_API_BASE_URL || '{{API_BASE_URL}}';

interface RequestOptions extends Omit<RequestInit, 'headers'> {
  headers?: Record<string, string>;
}

async function getAccessToken(): Promise<string | null> {
  return SecureStore.getItemAsync('accessToken');
}

async function request<T>(endpoint: string, options: RequestOptions = {}): Promise<T> {
  const token = await getAccessToken();

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...options.headers,
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(`${BASE_URL}${endpoint}`, {
    ...options,
    headers,
  });

  // 401 — token expired, logout
  if (response.status === 401) {
    await SecureStore.deleteItemAsync('accessToken');
    await SecureStore.deleteItemAsync('refreshToken');
    // isteğe bağlı: navigation.navigate('login')
    throw new Error('Oturum süresi doldu. Lütfen tekrar giriş yapın.');
  }

  if (!response.ok) {
    const errorBody = await response.text();
    throw new Error(errorBody || `API Error: ${response.status}`);
  }

  // 204 No Content
  if (response.status === 204) {
    return undefined as unknown as T;
  }

  return response.json();
}

export const api = {
  get: <T>(url: string) => request<T>(url),

  post: <T>(url: string, data: unknown) =>
    request<T>(url, {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  put: <T>(url: string, data: unknown) =>
    request<T>(url, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),

  patch: <T>(url: string, data: unknown) =>
    request<T>(url, {
      method: 'PATCH',
      body: JSON.stringify(data),
    }),

  delete: <T>(url: string) => request<T>(url, { method: 'DELETE' }),
};
