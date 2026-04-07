import type { VulnerabilityData, VulnerabilityCategory, VulnerabilityItem } from '../types';

const API_BASE = '/api';
const TOKEN_KEY = 'admin_token';

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
  getData(): Promise<VulnerabilityData> {
    return request<VulnerabilityData>('/data');
  },

  createCategory(name: string): Promise<VulnerabilityCategory> {
    return request<VulnerabilityCategory>('/categories', {
      method: 'POST',
      body: JSON.stringify({ name }),
    });
  },

  updateCategory(categoryId: string, name: string): Promise<VulnerabilityCategory> {
    return request<VulnerabilityCategory>(`/categories/${encodeURIComponent(categoryId)}`, {
      method: 'PUT',
      body: JSON.stringify({ name }),
    });
  },

  deleteCategory(categoryId: string): Promise<void> {
    return request<void>(`/categories/${encodeURIComponent(categoryId)}`, {
      method: 'DELETE',
    });
  },

  createItem(
    categoryId: string,
    item: VulnerabilityItem
  ): Promise<VulnerabilityItem> {
    return request<VulnerabilityItem>(`/categories/${encodeURIComponent(categoryId)}/items`, {
      method: 'POST',
      body: JSON.stringify(item),
    });
  },

  updateItem(
    categoryId: string,
    itemId: string,
    item: VulnerabilityItem
  ): Promise<VulnerabilityItem> {
    return request<VulnerabilityItem>(`/categories/${encodeURIComponent(categoryId)}/items/${encodeURIComponent(itemId)}`, {
      method: 'PUT',
      body: JSON.stringify(item),
    });
  },

  deleteItem(categoryId: string, itemId: string): Promise<void> {
    return request<void>(`/categories/${encodeURIComponent(categoryId)}/items/${encodeURIComponent(itemId)}`, {
      method: 'DELETE',
    });
  },

  async exportYaml(): Promise<string> {
    const res = await fetch(`${API_BASE}/export/yaml`);
    if (!res.ok) {
      throw new Error(`Export failed: ${res.status}`);
    }
    return res.text();
  },

  async importYaml(file: File): Promise<void> {
    const token = getToken();
    const formData = new FormData();
    formData.append('file', file);

    const res = await fetch(`${API_BASE}/import/yaml`, {
      method: 'POST',
      headers: token ? { 'Authorization': `Bearer ${token}` } : {},
      body: formData,
    });

    if (!res.ok) {
      const error = await res.json().catch(() => ({ error: 'Import failed' }));
      throw new Error(error.error || 'Import failed');
    }
  },

  async exportMarkdown(): Promise<string> {
    const res = await fetch(`${API_BASE}/export/markdown`);
    if (!res.ok) {
      throw new Error(`Export failed: ${res.status}`);
    }
    return res.text();
  },
};
