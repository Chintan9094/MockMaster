import axios from 'axios';
import { getAuthToken } from './authStorage';
import { isTokenExpired } from './token';

/** API base URL. Empty → `/api` (Vite dev proxy). Production: `https://your-app.onrender.com/api` */
function getApiBaseUrl() {
  const url = import.meta.env.VITE_API_URL?.trim();

  if (!url) return '/api';

  const cleaned = url.replace(/\/$/, '');
  return cleaned.endsWith('/api') ? cleaned : `${cleaned}/api`;
}

const api = axios.create({
  baseURL: getApiBaseUrl(),
  headers: { 'Content-Type': 'application/json' }
});

api.interceptors.request.use((config) => {
  const token = getAuthToken();
  if (!token) return config;

  if (isTokenExpired(token)) {
    import('../store/authStore').then(({ useAuthStore }) => {
      useAuthStore.getState().handleUnauthorized();
    });
    return Promise.reject(new axios.CanceledError('Session expired'));
  }

  config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    const requestUrl = String(error?.config?.url || '');
    const isAuthRequest = requestUrl.includes('/auth/login') || requestUrl.includes('/auth/register');

    if (error?.response?.status === 401 && !isAuthRequest) {
      import('../store/authStore').then(({ useAuthStore }) => {
        useAuthStore.getState().handleUnauthorized();
      });
    }
    return Promise.reject(error);
  }
);

export default api;
