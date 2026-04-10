import { createContext, useContext, useState, useEffect } from 'react';
import { api } from '../services/api';

interface AppConfig {
  localMode: boolean;
}

interface ConfigContextValue {
  config: AppConfig | null;
  loading: boolean;
  localMode: boolean;
}

const ConfigContext = createContext<ConfigContextValue>({
  config: null,
  loading: true,
  localMode: false,
});

export function ConfigProvider({ children }: { children: React.ReactNode }) {
  const [config, setConfig] = useState<AppConfig | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.getConfig()
      .then(data => {
        setConfig(data);
      })
      .catch(() => {
        setConfig({ localMode: false });
      })
      .finally(() => {
        setLoading(false);
      });
  }, []);

  const localMode = config?.localMode ?? false;

  return (
    <ConfigContext.Provider value={{ config, loading, localMode }}>
      {children}
    </ConfigContext.Provider>
  );
}

export function useConfig() {
  return useContext(ConfigContext);
}
