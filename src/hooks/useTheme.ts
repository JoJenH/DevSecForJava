import { useState, useEffect, useCallback } from 'react';

type Theme = 'dark' | 'light';

const STORAGE_KEY = 'theme';
const THEME_CHANGE_EVENT = 'themechange';

function getInitialTheme(): Theme {
  // Check localStorage first
  const saved = localStorage.getItem(STORAGE_KEY) as Theme | null;
  if (saved === 'dark' || saved === 'light') {
    return saved;
  }

  // Check system preference
  if (window.matchMedia('(prefers-color-scheme: light)').matches) {
    return 'light';
  }
  return 'dark';
}

export function useTheme() {
  const [theme, setThemeState] = useState<Theme>(getInitialTheme);

  // Listen for theme changes from other components (same window)
  useEffect(() => {
    const handleThemeChange = (e: CustomEvent<Theme>) => {
      if (e.detail === 'dark' || e.detail === 'light') {
        setThemeState(e.detail);
      }
    };

    window.addEventListener(THEME_CHANGE_EVENT, handleThemeChange as EventListener);
    return () => window.removeEventListener(THEME_CHANGE_EVENT, handleThemeChange as EventListener);
  }, []);

  // Listen for theme changes from other windows
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === STORAGE_KEY && e.newValue) {
        const newTheme = e.newValue as Theme;
        if (newTheme === 'dark' || newTheme === 'light') {
          setThemeState(newTheme);
        }
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  // Apply theme to document
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem(STORAGE_KEY, theme);
  }, [theme]);

  const toggleTheme = useCallback(() => {
    const newTheme = theme === 'dark' ? 'light' : 'dark';
    setThemeState(newTheme);
    // Dispatch custom event for same-window updates
    window.dispatchEvent(new CustomEvent(THEME_CHANGE_EVENT, { detail: newTheme }));
  }, [theme]);

  const setDarkTheme = useCallback(() => {
    setThemeState('dark');
    window.dispatchEvent(new CustomEvent(THEME_CHANGE_EVENT, { detail: 'dark' }));
  }, []);

  const setLightTheme = useCallback(() => {
    setThemeState('light');
    window.dispatchEvent(new CustomEvent(THEME_CHANGE_EVENT, { detail: 'light' }));
  }, []);

  return {
    theme,
    isDark: theme === 'dark',
    isLight: theme === 'light',
    toggleTheme,
    setDarkTheme,
    setLightTheme,
  };
}
