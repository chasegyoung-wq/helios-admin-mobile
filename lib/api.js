// Thin fetch wrapper around the Helios API.
// Reads the access token from SecureStore and attaches it to every request.

import * as SecureStore from 'expo-secure-store';

// CHANGE ME if your API is not on 192.168.4.71:4000
// For simulator on same Mac, use http://localhost:4000/api
export const API_BASE = 'http://192.168.4.71:4000/api';

const TOKEN_KEY = 'helios_admin_access_token';
const REFRESH_KEY = 'helios_admin_refresh_token';

export async function setTokens({ accessToken, refreshToken }) {
  await SecureStore.setItemAsync(TOKEN_KEY, accessToken);
  if (refreshToken) {
    await SecureStore.setItemAsync(REFRESH_KEY, refreshToken);
  }
}

export async function getAccessToken() {
  return SecureStore.getItemAsync(TOKEN_KEY);
}

export async function getRefreshToken() {
  return SecureStore.getItemAsync(REFRESH_KEY);
}

export async function clearTokens() {
  await SecureStore.deleteItemAsync(TOKEN_KEY);
  await SecureStore.deleteItemAsync(REFRESH_KEY);
}

export async function api(path, options = {}) {
  const token = await getAccessToken();
  const headers = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...(options.headers || {}),
  };

  const url = path.startsWith('http') ? path : `${API_BASE}${path}`;

  const res = await fetch(url, { ...options, headers });

  // Try to parse JSON; tolerate empty bodies
  let data = null;
  const text = await res.text();
  if (text) {
    try { data = JSON.parse(text); } catch { data = { raw: text }; }
  }

  if (!res.ok) {
    const err = new Error(data?.error || `HTTP ${res.status}`);
    err.status = res.status;
    err.data = data;
    throw err;
  }

  return data;
}

// Convenience helpers
export const apiGet  = (path)        => api(path, { method: 'GET' });
export const apiPost = (path, body)  => api(path, { method: 'POST', body: JSON.stringify(body) });
export const apiPut  = (path, body)  => api(path, { method: 'PUT',  body: JSON.stringify(body) });
export const apiDel  = (path)        => api(path, { method: 'DELETE' });
