import axios from 'axios';

function getSessionId() {
  let id = localStorage.getItem('psi_session_id');
  if (!id) {
    id = 'sess_' + Date.now() + '_' + Math.random().toString(36).substring(2, 15);
    localStorage.setItem('psi_session_id', id);
  }
  return id;
}

/** API base URL. Empty → `/api` (Vite dev proxy). Production: `https://your-app.onrender.com/api` */
function getApiBaseUrl() {
  const url = import.meta.env.VITE_API_URL?.trim();
  if (!url) return '/api';
  return `${url.replace(/\/$/, '')}/api`;
}

const api = axios.create({
  baseURL: getApiBaseUrl(),
  headers: { 'Content-Type': 'application/json' }
});

api.interceptors.request.use((config) => {
  config.headers['x-session-id'] = getSessionId();
  return config;
});

export default api;
