import { useState, useEffect } from 'react';
import { api } from '../services/api';

export function useLocalMode() {
  const [localMode, setLocalMode] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.getConfig()
      .then(config => {
        setLocalMode(config.localMode);
      })
      .catch(() => {
        setLocalMode(false);
      })
      .finally(() => {
        setLoading(false);
      });
  }, []);

  return { localMode, loading };
}
