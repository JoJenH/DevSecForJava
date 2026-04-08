import { useNavigate, useParams } from 'react-router-dom';
import type { CategoryInfo, VulnerabilityItem } from '../../types';
import './Sidebar.css';

interface SidebarProps {
  categories: CategoryInfo[];
  selectedItemId: string | null;
  onSelectItem: (itemId: string) => void;
  expandedCategories: Set<string>;
  onToggleCategory: (categoryId: string) => void;
  currentCategoryItems?: VulnerabilityItem[];
}

export function Sidebar({
  categories,
  selectedItemId,
  onSelectItem,
  expandedCategories,
  onToggleCategory,
  currentCategoryItems,
}: SidebarProps) {
  const navigate = useNavigate();
  const { categoryId: encodedCategoryId } = useParams<{ categoryId: string }>();
  const currentCategoryId = encodedCategoryId ? decodeURIComponent(encodedCategoryId) : null;

  const handleCategoryClick = (categoryName: string) => {
    navigate(`/${encodeURIComponent(categoryName)}`);
    onToggleCategory(categoryName);
  };

  const handleItemClick = (itemName: string) => {
    onSelectItem(itemName);
  };

  return (
    <aside className="sidebar">
      <div className="sidebar-header">
        <h1 className="sidebar-title">安全开发指南</h1>
        <p className="sidebar-subtitle">Java 代码审计参考</p>
      </div>
      <nav className="sidebar-nav">
        {categories.map(category => (
          <div key={category.name} className="category">
            <button
              className={`category-header ${expandedCategories.has(category.name) ? 'expanded' : ''} ${currentCategoryId === category.name ? 'active' : ''}`}
              onClick={() => handleCategoryClick(category.name)}
            >
              <span className="category-icon">
                {expandedCategories.has(category.name) ? '▼' : '▶'}
              </span>
              <span className="category-name">{category.name}</span>
            </button>
            {expandedCategories.has(category.name) && currentCategoryItems && (
              <ul className="category-items">
                {currentCategoryItems.map((item, index) => (
                  <li key={index}>
                    <button
                      className={`item-button ${selectedItemId === item.name ? 'active' : ''}`}
                      onClick={() => handleItemClick(item.name)}
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
    </aside>
  );
}
