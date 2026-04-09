import { useState, useEffect, useCallback } from 'react';
import { api } from '../services/api';
import { parseMarkdown } from '../utils/markdownParser';
import type { CategoryInfo, VulnerabilityCategory, VulnerabilityItem } from '../types';

export function useCategories() {
  const [categories, setCategories] = useState<CategoryInfo[]>([]);
  const [categoryItemsMap, setCategoryItemsMap] = useState<Map<string, VulnerabilityItem[]>>(new Map());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const categoryList = await api.getCategories();
      setCategories(categoryList);

      const itemsMap = new Map<string, VulnerabilityItem[]>();
      await Promise.all(
        categoryList.map(async (category) => {
          try {
            const content = await api.getCategory(category.name);
            const parsed = parseMarkdown(content.content);
            itemsMap.set(category.name, parsed.items);
          } catch {
            itemsMap.set(category.name, []);
          }
        })
      );
      setCategoryItemsMap(itemsMap);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load categories');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return { categories, categoryItemsMap, loading, error, refresh };
}

export function useCategory(name: string | null) {
  const [category, setCategory] = useState<VulnerabilityCategory | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!name) {
      setCategory(null);
      return;
    }

    setLoading(true);
    api.getCategory(name)
      .then(data => {
        const parsed = parseMarkdown(data.content);
        setCategory(parsed);
        setError(null);
      })
      .catch(err => {
        setError(err.message);
        setCategory(null);
      })
      .finally(() => {
        setLoading(false);
      });
  }, [name]);

  return { category, loading, error };
}
