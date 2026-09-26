import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { api } from '../utils/api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [token, setToken] = useState(() => localStorage.getItem('safebuddy_token'));
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(Boolean(token));

  useEffect(() => {
    if (!token) { setLoading(false); return; }
    api('/auth/me', { token }).then(({ user: currentUser }) => setUser(currentUser)).catch(() => {
      localStorage.removeItem('safebuddy_token'); setToken(null);
    }).finally(() => setLoading(false));
  }, [token]);

  const saveSession = ({ token: newToken, user: currentUser }) => {
    localStorage.setItem('safebuddy_token', newToken);
    setToken(newToken); setUser(currentUser);
  };
  const login = async (details) => { const data = await api('/auth/login', { method: 'POST', body: details }); saveSession(data); return data.user; };
  const register = async (details) => { const data = await api('/auth/register', { method: 'POST', body: details }); saveSession(data); return data.user; };
  const logout = () => { localStorage.removeItem('safebuddy_token'); setToken(null); setUser(null); };
  const refreshUser = async () => { if (!token) return; const data = await api('/auth/me', { token }); setUser(data.user); return data.user; };

  const value = useMemo(() => ({ token, user, loading, login, register, logout, refreshUser, setUser }), [token, user, loading]);
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export const useAuth = () => useContext(AuthContext);
