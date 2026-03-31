import { BrowserRouter, Routes, Route, Navigate, useParams, useNavigate } from 'react-router-dom';
import { useState, useCallback, useMemo } from 'react';
import { Sidebar } from './components/Sidebar/Sidebar';
import { CategoryContent } from './components/Content/CategoryContent';
import { useVulnerabilities } from './hooks/useVulnerabilities';
import { useTheme } from './hooks/useTheme';
import type { VulnerabilityCategory } from './types';
import './App.css';

function CategoryPage({
  categories,
  selectedItemId,
  onScrollItem
}: {
  categories: VulnerabilityCategory[];
  selectedItemId: string | null;
  onScrollItem: (itemId: string) => void;
}) {
  const { categoryId } = useParams<{ categoryId: string }>();
  const category = categories.find((c: VulnerabilityCategory) => c.id === categoryId);

  if (!category) {
    return <Navigate to={`/${categories[0]?.id}`} replace />;
  }

  return (
    <CategoryContent
      category={category}
      selectedItemId={selectedItemId}
      onScrollItem={onScrollItem}
    />
  );
}

function AppContent() {
  const { data, loading, error } = useVulnerabilities();
  const [selectedItemId, setSelectedItemId] = useState<string | null>(null);
  const initialExpandedCategories = useMemo(() => {
    return data ? new Set(data.categories.map(cat => cat.id)) : new Set<string>();
  }, [data]);
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(initialExpandedCategories);
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();

  const handleSelectItem = useCallback((itemId: string, categoryId: string) => {
    setSelectedItemId(itemId);
    navigate(`/${categoryId}`);
  }, [navigate]);

  const handleScrollItem = useCallback((itemId: string) => {
    setSelectedItemId(itemId);
  }, []);

  const handleToggleCategory = useCallback((categoryId: string) => {
    setExpandedCategories(prev => {
      const newSet = new Set(prev);
      if (newSet.has(categoryId)) {
        newSet.delete(categoryId);
      } else {
        newSet.add(categoryId);
      }
      return newSet;
    });
  }, []);

  // Render loading state
  if (loading) {
    return (
      <div className="loading">
        <div className="loading-spinner">加载中...</div>
      </div>
    );
  }

  // Render error state
  if (error) {
    return (
      <div className="error">
        <div className="error-title">加载失败</div>
        <div className="error-message">{error}</div>
      </div>
    );
  }

  // Render empty state
  if (!data || data.categories.length === 0) {
    return (
      <div className="error">
        <div className="error-message">暂无数据</div>
      </div>
    );
  }

  return (
    <div className="app">
      <Sidebar
        categories={data.categories}
        selectedItemId={selectedItemId}
        onSelectItem={handleSelectItem}
        expandedCategories={expandedCategories}
        onToggleCategory={handleToggleCategory}
      />
      <div className="theme-toggle">
        <button onClick={toggleTheme} className="theme-toggle-button">
          {theme === 'dark' ? '☀️' : '🌙'}
        </button>
      </div>
      <Routes>
        <Route
          path="/:categoryId"
          element={
            <CategoryPage
              categories={data.categories}
              selectedItemId={selectedItemId}
              onScrollItem={handleScrollItem}
            />
          }
        />
        <Route
          path="/"
          element={<Navigate to={`/${data.categories[0].id}`} replace />}
        />
      </Routes>
    </div>
  );
}

function App() {
  return (
    <BrowserRouter>
      <AppContent />
    </BrowserRouter>
  );
}

export default App;
