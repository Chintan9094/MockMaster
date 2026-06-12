import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import toast from 'react-hot-toast';
import api from '../lib/api';
import { AUTH_STORAGE_KEY, readStoredAuth } from '../lib/authStorage';
import { isTokenExpired } from '../lib/token';
import { invalidatePageCache } from '../hooks/usePageCache';
import { useBookmarkStore } from './bookmarkStore';
import { useExamStore } from './examStore';

let hasHandledUnauthorized = false;

export const useAuthStore = create(
  persist(
    (set, get) => ({
      token: null,
      user: null,
      bootstrapped: false,

      setUnauthorizedHandlerHandled: (value) => {
        hasHandledUnauthorized = value;
      },

      handleUnauthorized: () => {
        if (hasHandledUnauthorized) return;
        hasHandledUnauthorized = true;
        get().clearSession();
        toast.error('Session expired. Please login again.');
        if (window.location.pathname !== '/login' && window.location.pathname !== '/register') {
          window.location.replace('/login');
        }
      },

      clearSession: () => {
        set({ token: null, user: null, bootstrapped: true });
        useExamStore.getState().resetExam();
        useBookmarkStore.getState().clearLocal();
        invalidatePageCache();
        hasHandledUnauthorized = false;

        try {
          const stored = readStoredAuth();
          if (stored?.state) {
            stored.state.token = null;
            stored.state.user = null;
            stored.state.bootstrapped = true;
            localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(stored));
          }
        } catch {
          localStorage.removeItem(AUTH_STORAGE_KEY);
        }
      },

      register: async ({ name, email, password }) => {
        const { data } = await api.post('/auth/register', { name, email, password });
        set({
          token: data.data.token,
          user: data.data.user
        });
        invalidatePageCache();
        hasHandledUnauthorized = false;
        return data.data.user;
      },

      login: async ({ email, password }) => {
        const { data } = await api.post('/auth/login', { email, password });
        set({
          token: data.data.token,
          user: data.data.user
        });
        invalidatePageCache();
        hasHandledUnauthorized = false;
        return data.data.user;
      },

      bootstrap: async () => {
        const { token } = get();
        if (!token) {
          set({ user: null, bootstrapped: true });
          return;
        }

        if (isTokenExpired(token)) {
          get().clearSession();
          set({ bootstrapped: true });
          return;
        }

        try {
          const { data } = await api.get('/auth/me');
          set({ user: data.data.user, bootstrapped: true });
          hasHandledUnauthorized = false;
        } catch (err) {
          if (err?.response?.status === 401) {
            get().handleUnauthorized();
          } else {
            get().clearSession();
          }
          set({ bootstrapped: true });
        }
      },

      logout: (redirect = true) => {
        get().clearSession();
        if (redirect) window.location.replace('/login');
      }
    }),
    {
      name: AUTH_STORAGE_KEY
    }
  )
);
