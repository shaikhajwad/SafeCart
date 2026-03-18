import { createContext, useContext, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiFetch, clearToken, getToken, setToken } from '../lib/api';
import type { User } from '../types';

interface AuthContextValue {
  user: User | null;
  loading: boolean;
  login: (token: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const token = getToken();
    if (!token) {
      setLoading(false);
      return;
    }
    async function restoreSession() {
      try {
        const u = await apiFetch<User>('/api/auth/me');
        setUser(u);
      } catch {
        clearToken();
        setUser(null);
      } finally {
        setLoading(false);
      }
    }
    void restoreSession();
  }, []);

  async function login(token: string) {
    setToken(token);
    try {
      const u = await apiFetch<User>('/api/auth/me');
      setUser(u);
    } catch {
      clearToken();
      throw new Error('Failed to fetch user after login');
    }
  }

  function logout() {
    clearToken();
    setUser(null);
    navigate('/login');
  }

  return (
    <AuthContext.Provider value={{ user, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

// eslint-disable-next-line react-refresh/only-export-components -- context + hook in same file is the standard React pattern
export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
