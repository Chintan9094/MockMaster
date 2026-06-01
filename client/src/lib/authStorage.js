export const AUTH_STORAGE_KEY = 'mockmaster_auth';

export function readStoredAuth() {
  try {
    const parsed = JSON.parse(localStorage.getItem(AUTH_STORAGE_KEY) || 'null');
    return parsed && typeof parsed === 'object' ? parsed : null;
  } catch {
    return null;
  }
}

export function getAuthToken() {
  return readStoredAuth()?.state?.token || null;
}
