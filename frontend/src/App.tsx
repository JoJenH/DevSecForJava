import { BrowserRouter, Routes, Route, Navigate, useParams, useNavigate, useLocation } from 'react-router-dom';
import { useState, useCallback, useEffect } from 'react';
import { Sidebar } from './components/Sidebar/Sidebar';
import { CategoryContent } from './components/Content/CategoryContent';
import { EditorPage } from './components/EditorPage/EditorPage';
import { LoginPage } from './components/LoginPage/LoginPage';
import { useCategories, useCategory } from './hooks/useVulnerabilities';
import { useTheme } from './hooks/useTheme';
import { ConfigProvider } from './hooks/useConfig';
import { auth } from './services/api';
import './App.css';

function CategoryPage({
  selectedItemId,
  onScrollItem
}: {
  selectedItemId: string | null;
  onScrollItem: (itemId: string) => void;
}) {
  const { categoryId } = useParams<{ categoryId: string }>();
  const categoryName = categoryId ? decodeURIComponent(categoryId) : null;
  const { category, loading, error } = useCategory(categoryName);

  if (loading) {
    return (
      <div className="loading">
        <div className="loading-spinner">加载中...</div>
      </div>
    );
  }

  if (error || !category) {
    return (
      <div className="error">
        <div className="error-message">{error || '加载失败'}</div>
      </div>
    );
  }

  return (
    <CategoryContent
      category={category}
      selectedItemId={selectedItemId}
      onScrollItem={onScrollItem}
    />
  );
}

function EditGuard({ children }: { children: React.ReactNode }) {
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
  const { categories, categoryItemsMap, loading: categoriesLoading, error: categoriesError, refresh } = useCategories();
  const [selectedItemId, setSelectedItemId] = useState<string | null>(null);
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set());
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const location = useLocation();
  const isEditMode = location.pathname === '/edit';

  const { categoryId } = useParams<{ categoryId: string }>();
  const currentCategoryName = categoryId ? decodeURIComponent(categoryId) : null;

  const handleSelectItem = useCallback((itemId: string) => {
    setSelectedItemId(itemId);
  }, []);

  const handleScrollItem = useCallback((itemId: string) => {
    setSelectedItemId(itemId);
  }, []);

  const handleToggleCategory = useCallback((categoryName: string) => {
    setExpandedCategories(prev => {
      const newSet = new Set(prev);
      if (newSet.has(categoryName)) {
        newSet.delete(categoryName);
      } else {
        newSet.clear();
        newSet.add(categoryName);
      }
      return newSet;
    });
  }, []);

  if (isEditMode) {
    return (
      <EditGuard>
        <EditorPage
          categoryName={currentCategoryName || undefined}
          categories={categories}
          onBack={() => navigate('/')}
          onSave={refresh}
        />
      </EditGuard>
    );
  }

  if (categoriesLoading) {
    return (
      <div className="loading">
        <div className="loading-spinner">加载中...</div>
      </div>
    );
  }

  if (categoriesError) {
    return (
      <div className="error">
        <div className="error-title">加载失败</div>
        <div className="error-message">{categoriesError}</div>
      </div>
    );
  }

  if (categories.length === 0) {
    return (
      <div className="error">
        <div className="error-message">暂无数据</div>
      </div>
    );
  }

  const defaultCategory = categories[0]?.name;

  return (
    <div className="app">
      <Sidebar
        categories={categories}
        categoryItemsMap={categoryItemsMap}
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
              selectedItemId={selectedItemId}
              onScrollItem={handleScrollItem}
            />
          }
        />
        <Route
          path="/"
          element={<Navigate to={`/${encodeURIComponent(defaultCategory)}`} replace />}
        />
      </Routes>
    </div>
  );
}

function App() {
  return (
    <BrowserRouter>
      <ConfigProvider>
        <AppContent />
      </ConfigProvider>
    </BrowserRouter>
  );
}

export default App;
