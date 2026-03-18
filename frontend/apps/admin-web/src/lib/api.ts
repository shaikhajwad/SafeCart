const BASE_URL = (import.meta.env.VITE_API_URL as string | undefined) ?? 'http://localhost:3000';

export function getToken(): string | null {
  return localStorage.getItem('admin_token');
}

export function setToken(t: string): void {
  localStorage.setItem('admin_token', t);
}

export function clearToken(): void {
  localStorage.removeItem('admin_token');
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
    const fallbackText = await res.text().catch(() => '');
    let err: {
      message?: string;
      error?: { message?: string } | string;
    } = { message: 'Request failed' };

    if (fallbackText) {
      try {
        err = JSON.parse(fallbackText) as { message?: string; error?: { message?: string } | string };
      } catch {
        err = { message: fallbackText };
      }
    }

    const nestedMessage = typeof err.error === 'string' ? err.error : err.error?.message;
    throw new Error((nestedMessage ?? err.message ?? fallbackText) || `Request failed (${res.status})`);
  }
  if (res.status === 204) return undefined as T;
  return res.json() as Promise<T>;
}

export async function apiDownload(path: string, filename: string): Promise<void> {
  const token = getToken();
  const headers: Record<string, string> = {};
  if (token) headers['Authorization'] = `Bearer ${token}`;

  const res = await fetch(`${BASE_URL}${path}`, { headers });
  if (!res.ok) {
    throw new Error(`Download failed (${res.status})`);
  }

  const blob = await res.blob();
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(url);
}
