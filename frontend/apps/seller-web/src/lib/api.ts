const BASE_URL = (import.meta.env.VITE_API_URL as string | undefined) ?? 'http://localhost:3000';

export function getToken(): string | null {
  return localStorage.getItem('seller_token');
}

export function setToken(t: string): void {
  localStorage.setItem('seller_token', t);
}

export function clearToken(): void {
  localStorage.removeItem('seller_token');
  localStorage.removeItem('seller_org_id');
}

export function getOrgId(): string | null {
  return localStorage.getItem('seller_org_id');
}

export function setOrgId(id: string): void {
  localStorage.setItem('seller_org_id', id);
}

export async function apiFetch<T>(path: string, options?: RequestInit): Promise<T> {
  const token = getToken();
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (options?.headers) {
    Object.assign(headers, options.headers);
  }
  if (token) headers['Authorization'] = `Bearer ${token}`;
  const res = await fetch(`${BASE_URL}${path}`, { ...options, headers });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ message: 'Request failed' })) as { message?: string };
    throw new Error(err.message ?? 'Request failed');
  }
  if (res.status === 204) return undefined as T;
  return res.json() as Promise<T>;
}

export const api = { getToken, setToken, clearToken, apiFetch, getOrgId, setOrgId };
