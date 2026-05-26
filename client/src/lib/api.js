import axios from 'axios';

function getSessionId() {
  let id = localStorage.getItem('psi_session_id');
  if (!id) {
    id = 'sess_' + Date.now() + '_' + Math.random().toString(36).substring(2, 15);
    localStorage.setItem('psi_session_id', id);
  }
  return id;
}

const api = axios.create({
  baseURL: '/api',
  headers: { 'Content-Type': 'application/json' }
});

api.interceptors.request.use((config) => {
  config.headers['x-session-id'] = getSessionId();
  return config;
});

export default api;
