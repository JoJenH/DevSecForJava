import type { CategoryInfo, CategoryContent } from '../types';

const API_BASE = '/api';
const TOKEN_KEY = 'access_token';

function getToken(): string | null {
  return localStorage.getItem(TOKEN_KEY);
}

function setToken(token: string) {
  localStorage.setItem(TOKEN_KEY, token);
}

function clearToken() {
  localStorage.removeItem(TOKEN_KEY);
}

async function request<T>(url: string, options?: RequestInit): Promise<T> {
  const token = getToken();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const res = await fetch(`${API_BASE}${url}`, {
    ...options,
    headers: { ...headers, ...(options?.headers as Record<string, string>) },
  });

  if (res.status === 401) {
    clearToken();
    throw new Error('Unauthorized');
  }

  if (!res.ok) {
    const error = await res.json().catch(() => ({ error: 'Request failed' }));
    throw new Error(error.error || `HTTP ${res.status}`);
  }

  if (res.status === 204) {
    return undefined as T;
  }

  return res.json();
}

export const auth = {
  async login(password: string): Promise<string> {
    const res = await fetch(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password }),
    });
    if (!res.ok) {
      const error = await res.json().catch(() => ({ error: 'Login failed' }));
      throw new Error(error.error || 'Login failed');
    }
    const data = await res.json();
    setToken(data.token);
    return data.token;
  },

  async check(): Promise<boolean> {
    const token = getToken();
    if (!token) return false;
    try {
      const res = await fetch(`${API_BASE}/auth/check`, {
        headers: { 'Authorization': `Bearer ${token}` },
      });
      const data = await res.json();
      return data.authenticated === true;
    } catch {
      clearToken();
      return false;
    }
  },
};

export const api = {
  getCategories(): Promise<CategoryInfo[]> {
    return request<CategoryInfo[]>('/categories');
  },

  getCategory(name: string): Promise<CategoryContent> {
    return request<CategoryContent>(`/categories/${encodeURIComponent(name)}`);
  },

  getConfig(): Promise<{ localMode: boolean }> {
    return request<{ localMode: boolean }>('/config');
  },

  createCategory(name: string): Promise<CategoryInfo> {
    return request<CategoryInfo>('/edit/categories', {
      method: 'POST',
      body: JSON.stringify({ name }),
    });
  },

  updateCategory(name: string, content: string): Promise<CategoryContent> {
    return request<CategoryContent>(`/edit/categories/${encodeURIComponent(name)}`, {
      method: 'PUT',
      body: JSON.stringify({ content }),
    });
  },

  deleteCategory(name: string): Promise<void> {
    return request<void>(`/edit/categories/${encodeURIComponent(name)}`, {
      method: 'DELETE',
    });
  },
};
