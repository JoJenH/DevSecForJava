import { useNavigate, useParams } from 'react-router-dom';
import type { VulnerabilityCategory } from '../../types';
import { api } from '../../services/api';
import './Sidebar.css';

interface SidebarProps {
  categories: VulnerabilityCategory[];
  selectedItemId: string | null;
  onSelectItem: (itemId: string, categoryId: string) => void;
  expandedCategories: Set<string>;
  onToggleCategory: (categoryId: string) => void;
}

export function Sidebar({
  categories,
  selectedItemId,
  onSelectItem,
  expandedCategories,
  onToggleCategory
}: SidebarProps) {
  const navigate = useNavigate();
  const { categoryId: currentCategoryId } = useParams<{ categoryId: string }>();

  const handleCategoryClick = (categoryId: string) => {
    navigate(`/${categoryId}`);
    onToggleCategory(categoryId);
  };

  const handleItemClick = (itemId: string, categoryId: string) => {
    onSelectItem(itemId, categoryId);
  };

  const handleExportYaml = async () => {
    try {
      const content = await api.exportYaml();
      const blob = new Blob([content], { type: 'text/yaml' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'vulnerabilities.yaml';
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error('导出失败:', err);
    }
  };

  const handleExportMarkdown = async () => {
    try {
      const content = await api.exportMarkdown();
      const blob = new Blob([content], { type: 'text/markdown' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'vulnerabilities.md';
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error('导出失败:', err);
    }
  };

  return (
    <aside className="sidebar">
      <div className="sidebar-header">
        <h1 className="sidebar-title">安全开发指南</h1>
        <p className="sidebar-subtitle">Java 代码审计参考</p>
      </div>
      <nav className="sidebar-nav">
        {categories.map(category => (
          <div key={category.id} className="category">
            <button
              className={`category-header ${expandedCategories.has(category.id) ? 'expanded' : ''} ${currentCategoryId === category.id ? 'active' : ''}`}
              onClick={() => handleCategoryClick(category.id)}
            >
              <span className="category-icon">
                {expandedCategories.has(category.id) ? '▼' : '▶'}
              </span>
              <span className="category-name">{category.name}</span>
            </button>
            {expandedCategories.has(category.id) && (
              <ul className="category-items">
                {category.items.map(item => (
                  <li key={item.id}>
                    <button
                      className={`item-button ${selectedItemId === item.id ? 'active' : ''}`}
                      onClick={() => handleItemClick(item.id!, category.id)}
                    >
                      {item.name}
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        ))}
      </nav>
      <div className="sidebar-footer">
        <button className="sidebar-export-btn" onClick={handleExportYaml}>
          导出 YAML
        </button>
        <button className="sidebar-export-btn" onClick={handleExportMarkdown}>
          导出 MD
        </button>
      </div>
    </aside>
  );
}
