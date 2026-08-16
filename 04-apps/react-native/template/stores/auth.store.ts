<!-- PURPOSE OF THIS FILE: Auth Zustand store — login, logout, token yönetimi, user state. -->
import { create } from 'zustand';
import * as SecureStore from 'expo-secure-store';

interface User {
  id: string;
  email: string;
  name: string;
  role?: string;
}

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;

  // Actions
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  loadStoredAuth: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isAuthenticated: false,
  isLoading: true,

  login: async (email: string, password: string) => {
    const response = await fetch(`${process.env.EXPO_PUBLIC_API_BASE_URL || '{{API_BASE_URL}}'}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(error || 'Giriş başarısız.');
    }

    const data = await response.json();
    await SecureStore.setItemAsync('accessToken', data.accessToken);
    if (data.refreshToken) {
      await SecureStore.setItemAsync('refreshToken', data.refreshToken);
    }

    set({ user: data.user, isAuthenticated: true });
  },

  logout: async () => {
    await SecureStore.deleteItemAsync('accessToken');
    await SecureStore.deleteItemAsync('refreshToken');
    set({ user: null, isAuthenticated: false });
  },

  loadStoredAuth: async () => {
    try {
      const token = await SecureStore.getItemAsync('accessToken');
      if (token) {
        // Token varsa user bilgisini API'den çek
        const response = await fetch(`${process.env.EXPO_PUBLIC_API_BASE_URL || '{{API_BASE_URL}}'}/api/auth/me`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (response.ok) {
          const user = await response.json();
          set({ user, isAuthenticated: true, isLoading: false });
          return;
        }
      }
    } catch {
      // Token geçersiz veya ağ yok
    }
    set({ isLoading: false });
  },
}));
