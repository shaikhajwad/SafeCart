import { createContext, useContext, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiFetch, clearToken, getOrgId, getToken, setOrgId, setToken } from '../lib/api';
import type { Org, User } from '../types';

interface AuthContextValue {
  user: User | null;
  org: Org | null;
  orgId: string | null;
  loading: boolean;
  login: (token: string) => Promise<void>;
  logout: () => void;
  setOrg: (org: Org) => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [org, setOrgState] = useState<Org | null>(null);
  const [orgId, setOrgIdState] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  async function fetchUser() {
    try {
      const u = await apiFetch<User>('/api/auth/me');
      setUser(u);
      const storedOrgId = getOrgId();
      if (storedOrgId) {
        setOrgIdState(storedOrgId);
        try {
          const o = await apiFetch<Org>(`/api/orgs/${storedOrgId}`);
          setOrgState(o);
        } catch {
          // org fetch failed, user will see onboarding
        }
      }
    } catch {
      clearToken();
      setUser(null);
      setOrgState(null);
      setOrgIdState(null);
    }
  }

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
        const storedOrgId = getOrgId();
        if (storedOrgId) {
          setOrgIdState(storedOrgId);
          try {
            const o = await apiFetch<Org>(`/api/orgs/${storedOrgId}`);
            setOrgState(o);
          } catch {
            // org fetch failed, user will see onboarding
          }
        }
      } catch {
        clearToken();
        setUser(null);
        setOrgState(null);
        setOrgIdState(null);
      } finally {
        setLoading(false);
      }
    }
    void restoreSession();
  }, []);

  async function login(token: string) {
    setToken(token);
    await fetchUser();
  }

  function logout() {
    clearToken();
    setUser(null);
    setOrgState(null);
    setOrgIdState(null);
    navigate('/login');
  }

  function setOrg(o: Org) {
    setOrgState(o);
    setOrgIdState(o.id);
    setOrgId(o.id);
  }

  return (
    <AuthContext.Provider value={{ user, org, orgId, loading, login, logout, setOrg }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
