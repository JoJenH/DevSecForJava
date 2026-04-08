import { useState, useEffect, useCallback } from 'react';
import { api } from '../services/api';
import { parseMarkdown } from '../utils/markdownParser';
import type { CategoryInfo, VulnerabilityCategory } from '../types';

export function useCategories() {
  const [categories, setCategories] = useState<CategoryInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(() => {
    setLoading(true);
    api.getCategories()
      .then(data => {
        setCategories(data);
        setError(null);
      })
      .catch(err => {
        setError(err.message);
      })
      .finally(() => {
        setLoading(false);
      });
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return { categories, loading, error, refresh };
}

export function useCategory(name: string | null) {
  const [category, setCategory] = useState<VulnerabilityCategory | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    console.log('[useCategory] name changed:', name);
    if (!name) {
      setCategory(null);
      return;
    }

    setLoading(true);
    api.getCategory(name)
      .then(data => {
        console.log('[useCategory] got data for:', name);
        const parsed = parseMarkdown(data.content);
        setCategory(parsed);
        setError(null);
      })
      .catch(err => {
        console.error('[useCategory] error:', err);
        setError(err.message);
        setCategory(null);
      })
      .finally(() => {
        setLoading(false);
      });
  }, [name]);

  return { category, loading, error };
}
