import { BrowserRouter, Routes, Route, Navigate, useParams, useNavigate, useLocation } from 'react-router-dom';
import { useState, useCallback, useMemo, useEffect } from 'react';
import { Sidebar } from './components/Sidebar/Sidebar';
import { CategoryContent } from './components/Content/CategoryContent';
import { EditorPage } from './components/EditorPage/EditorPage';
import { LoginPage } from './components/LoginPage/LoginPage';
import { useVulnerabilities } from './hooks/useVulnerabilities';
import { useTheme } from './hooks/useTheme';
import { auth } from './services/api';
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

function AdminGuard({ children }: { children: React.ReactNode }) {
  const [checking, setChecking] = useState(true);
  const [isAuth, setIsAuth] = useState(false);

  useEffect(() => {
    auth.check().then(valid => {
      setIsAuth(valid);
      setChecking(false);
    });
  }, []);

  if (checking) {
    return (
      <div className="loading">
        <div className="loading-spinner">验证中...</div>
      </div>
    );
  }

  if (!isAuth) {
    return <LoginPage onLogin={() => setIsAuth(true)} />;
  }

  return <>{children}</>;
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
  const location = useLocation();
  const isAdmin = location.pathname === '/admin';

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

  if (isAdmin) {
    return (
      <AdminGuard>
        <EditorPage onBack={() => navigate('/')} />
      </AdminGuard>
    );
  }

  if (loading) {
    return (
      <div className="loading">
        <div className="loading-spinner">加载中...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="error">
        <div className="error-title">加载失败</div>
        <div className="error-message">{error}</div>
      </div>
    );
  }

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
