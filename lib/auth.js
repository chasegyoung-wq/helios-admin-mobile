// Auth context — wraps the app, exposes { user, login, logout, loading }
// Rejects member logins (this app is staff-only).

import React, { createContext, useContext, useEffect, useState } from 'react';
import { apiPost, apiGet, setTokens, clearTokens, getAccessToken } from './api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // On mount: check for existing token and fetch /me
  useEffect(() => {
    (async () => {
      try {
        const token = await getAccessToken();
        if (!token) { setLoading(false); return; }
        const me = await apiGet('/auth/me');
        // Defensive: if somehow a member token is stored, kick them out
        if (me.role !== 'staff') {
          await clearTokens();
          setUser(null);
        } else {
          setUser(hydrateUser(me));
        }
      } catch (err) {
        // Token invalid/expired — clear and land on login
        await clearTokens();
        setUser(null);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  async function login(email, password) {
    const res = await apiPost('/auth/login', { email, password });
    if (res.user.role !== 'staff') {
      throw new Error('This app is for staff only. Please use the member app to sign in.');
    }
    await setTokens({
      accessToken: res.accessToken,
      refreshToken: res.refreshToken,
    });
    setUser(hydrateUser(res.user));
    return res.user;
  }

  async function logout() {
    try {
      await apiPost('/auth/logout', {});
    } catch { /* ignore */ }
    await clearTokens();
    setUser(null);
  }

  return (
    <AuthContext.Provider value={{ user, login, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside <AuthProvider>');
  return ctx;
}

// Normalize whatever the API returns into a consistent shape.
// /me returns DB row (snake_case), /login returns camelCase.
function hydrateUser(raw) {
  return {
    id:          raw.id,
    email:       raw.email,
    firstName:   raw.firstName   ?? raw.first_name,
    lastName:    raw.lastName    ?? raw.last_name,
    role:        raw.role,
    staffRole:   raw.staffRole   ?? raw.staff_role ?? raw.role,
    accessLevel: raw.accessLevel ?? raw.access_level ?? 0,
    roleName:    raw.roleName    ?? raw.role_name,
    department:  raw.department,
    orgId:       raw.orgId       ?? raw.org_id,
    orgSlug:     raw.orgSlug     ?? raw.org_slug,
    orgName:     raw.orgName     ?? raw.org_name,
    modules:     raw.modules     ?? {},
  };
}
