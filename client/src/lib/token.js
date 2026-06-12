export function decodeJwtPayload(token) {
  try {
    const base64 = token.split('.')[1];
    if (!base64) return null;
    const json = atob(base64.replace(/-/g, '+').replace(/_/g, '/'));
    return JSON.parse(json);
  } catch {
    return null;
  }
}

export function isTokenExpired(token, skewMs = 5000) {
  const payload = decodeJwtPayload(token);
  if (!payload?.exp) return false;
  return payload.exp * 1000 <= Date.now() + skewMs;
}
