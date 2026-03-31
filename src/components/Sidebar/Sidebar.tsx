import { useNavigate, useParams } from 'react-router-dom';
import type { VulnerabilityCategory } from '../../types';
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
                      onClick={() => handleItemClick(item.id, category.id)}
                    >
                      {item.shortName}
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        ))}
      </nav>
    </aside>
  );
}
