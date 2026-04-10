import type { CategoryInfo, CategoryContent } from '../types';

const API_BASE = '/api';
const TOKEN_KEY = 'access_token';
const CACHE_PREFIX = 'api_cache_';
const DEFAULT_CACHE_TTL = 5 * 60 * 1000;

interface CacheEntry<T> {
  data: T;
  timestamp: number;
}

function getToken(): string | null {
  return localStorage.getItem(TOKEN_KEY);
}

function setToken(token: string) {
  localStorage.setItem(TOKEN_KEY, token);
}

function clearToken() {
  localStorage.removeItem(TOKEN_KEY);
}

function getCache<T>(key: string, ttl: number = DEFAULT_CACHE_TTL): T | null {
  const cached = localStorage.getItem(CACHE_PREFIX + key);
  if (!cached) return null;
  try {
    const entry: CacheEntry<T> = JSON.parse(cached);
    if (Date.now() - entry.timestamp < ttl) {
      return entry.data;
    }
    localStorage.removeItem(CACHE_PREFIX + key);
  } catch {
    localStorage.removeItem(CACHE_PREFIX + key);
  }
  return null;
}

function setCache<T>(key: string, data: T): void {
  const entry: CacheEntry<T> = { data, timestamp: Date.now() };
  localStorage.setItem(CACHE_PREFIX + key, JSON.stringify(entry));
}

function clearCache(key?: string): void {
  if (key) {
    localStorage.removeItem(CACHE_PREFIX + key);
  } else {
    Object.keys(localStorage)
      .filter(k => k.startsWith(CACHE_PREFIX))
      .forEach(k => localStorage.removeItem(k));
  }
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
  getCategories(useCache: boolean = true): Promise<CategoryInfo[]> {
    if (useCache) {
      const cached = getCache<CategoryInfo[]>('categories');
      if (cached) return Promise.resolve(cached);
    }
    return request<CategoryInfo[]>('/categories').then(data => {
      setCache('categories', data);
      return data;
    });
  },

  getCategory(name: string, useCache: boolean = true): Promise<CategoryContent> {
    const cacheKey = `category_${encodeURIComponent(name)}`;
    if (useCache) {
      const cached = getCache<CategoryContent>(cacheKey);
      if (cached) return Promise.resolve(cached);
    }
    return request<CategoryContent>(`/categories/${encodeURIComponent(name)}`).then(data => {
      setCache(cacheKey, data);
      return data;
    });
  },

  getConfig(): Promise<{ localMode: boolean }> {
    const cached = getCache<{ localMode: boolean }>('config');
    if (cached) return Promise.resolve(cached);
    return request<{ localMode: boolean }>('/config').then(data => {
      setCache('config', data);
      return data;
    });
  },

  invalidateCategoriesCache(): void {
    clearCache('categories');
    Object.keys(localStorage)
      .filter(k => k.startsWith(CACHE_PREFIX + 'category_'))
      .forEach(k => localStorage.removeItem(k));
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
