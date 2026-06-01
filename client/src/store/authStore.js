import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import toast from 'react-hot-toast';
import api from '../lib/api';
import { AUTH_STORAGE_KEY } from '../lib/authStorage';
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
        get().logout(false);
        toast.error('Session expired. Please login again.');
        window.location.href = '/login';
      },

      register: async ({ name, email, password }) => {
        const { data } = await api.post('/auth/register', { name, email, password });
        set({
          token: data.data.token,
          user: data.data.user
        });
        invalidatePageCache();
        hasHandledUnauthorized = false;
      },

      login: async ({ email, password }) => {
        const { data } = await api.post('/auth/login', { email, password });
        set({
          token: data.data.token,
          user: data.data.user
        });
        invalidatePageCache();
        hasHandledUnauthorized = false;
      },

      bootstrap: async () => {
        const { token } = get();
        if (!token) {
          set({ user: null, bootstrapped: true });
          return;
        }

        try {
          const { data } = await api.get('/auth/me');
          set({ user: data.data.user, bootstrapped: true });
          hasHandledUnauthorized = false;
        } catch {
          get().logout(false);
          set({ bootstrapped: true });
        }
      },

      logout: (redirect = true) => {
        set({ token: null, user: null, bootstrapped: true });
        useExamStore.getState().resetExam();
        useBookmarkStore.getState().clearLocal();
        invalidatePageCache();
        hasHandledUnauthorized = false;
        if (redirect) window.location.href = '/login';
      }
    }),
    {
      name: AUTH_STORAGE_KEY
    }
  )
);
