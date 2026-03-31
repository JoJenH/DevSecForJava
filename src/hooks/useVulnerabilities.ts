import { useState, useEffect } from 'react';
import type { VulnerabilityData } from '../types';

export function useVulnerabilities() {
  const [data, setData] = useState<VulnerabilityData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch('/data/vulnerabilities.json')
      .then(res => {
        if (!res.ok) {
          throw new Error('Failed to load vulnerability data');
        }
        return res.json();
      })
      .then((data: VulnerabilityData) => {
        setData(data);
        setLoading(false);
      })
      .catch(err => {
        setError(err.message);
        setLoading(false);
      });
  }, []);

  return { data, loading, error };
}
