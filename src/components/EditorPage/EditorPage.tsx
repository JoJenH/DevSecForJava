import { useState, useEffect, useCallback } from 'react';
import { api } from '../../services/api';
import type { CategoryInfo } from '../../types';
import './EditorPage.css';

interface EditorPageProps {
  categoryName?: string;
  categories: CategoryInfo[];
  onBack: () => void;
  onSave: () => void;
}

export function EditorPage({ categoryName, categories, onBack, onSave }: EditorPageProps) {
  const [selectedCategory, setSelectedCategory] = useState<string>(categoryName || (categories[0]?.name || ''));
  const [content, setContent] = useState('');
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saveMessage, setSaveMessage] = useState<string | null>(null);
  const [newCategoryName, setNewCategoryName] = useState('');

  useEffect(() => {
    if (categoryName) {
      setSelectedCategory(categoryName);
    }
  }, [categoryName]);

  const loadCategory = useCallback(async (name: string) => {
    try {
      setLoading(true);
      setError(null);
      const data = await api.getCategory(name);
      setContent(data.content);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load category');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (selectedCategory) {
      loadCategory(selectedCategory);
    }
  }, [selectedCategory, loadCategory]);

  const handleCategoryChange = (name: string) => {
    setSelectedCategory(name);
  };

  const handleCreateCategory = async () => {
    if (!newCategoryName.trim()) return;
    try {
      await api.createCategory(newCategoryName.trim());
      setSelectedCategory(newCategoryName.trim());
      setNewCategoryName('');
      onSave();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create category');
    }
  };

  const handleDeleteCategory = async (name: string) => {
    if (!confirm('确定要删除此分类吗？')) return;
    try {
      await api.deleteCategory(name);
      if (selectedCategory === name) {
        const remaining = categories.filter(c => c.name !== name);
        setSelectedCategory(remaining[0]?.name || '');
      }
      onSave();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete category');
    }
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      setError(null);
      await api.updateCategory(selectedCategory, content);
      setSaveMessage('保存成功');
      setTimeout(() => setSaveMessage(null), 2000);
      onSave();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="editor-page">
      <div className="editor-toolbar">
        <button className="editor-back-btn" onClick={onBack}>
          ← 返回查看
        </button>
        <h1 className="editor-title">Markdown 编辑器</h1>
        <div className="editor-toolbar-actions">
          <button
            className="editor-toolbar-btn"
            onClick={handleSave}
            disabled={saving}
          >
            {saving ? '保存中...' : '💾 保存'}
          </button>
        </div>
        {saveMessage && <span className="editor-save-message">{saveMessage}</span>}
      </div>

      {error && <div className="editor-toast error">{error}</div>}

      <div className="editor-content">
        <div className="editor-sidebar">
          <div className="editor-sidebar-header">
            <h3>分类列表</h3>
          </div>
          <div className="editor-category-list">
            {categories.map(cat => (
              <div
                key={cat.name}
                className={`editor-category ${selectedCategory === cat.name ? 'active' : ''}`}
              >
                <div className="editor-category-header">
                  <button
                    className="editor-category-name"
                    onClick={() => handleCategoryChange(cat.name)}
                  >
                    {cat.name}
                  </button>
                  <div className="editor-category-actions">
                    <button
                      className="editor-icon-btn editor-icon-btn--danger"
                      title="删除"
                      onClick={() => handleDeleteCategory(cat.name)}
                    >
                      ✕
                    </button>
                  </div>
                </div>
              </div>
            ))}
            <div className="editor-inline-edit">
              <div className="inline-edit-row">
                <input
                  type="text"
                  placeholder="新建分类名称"
                  value={newCategoryName}
                  onChange={e => setNewCategoryName(e.target.value)}
                  onKeyDown={e => {
                    if (e.key === 'Enter') handleCreateCategory();
                    if (e.key === 'Escape') setNewCategoryName('');
                  }}
                />
              </div>
              <div className="inline-edit-actions">
                <button
                  className="inline-edit-btn inline-edit-btn--primary"
                  onClick={handleCreateCategory}
                >
                  ✓
                </button>
              </div>
            </div>
          </div>
        </div>

        <div className="editor-main">
          {loading ? (
            <div className="editor-loading">加载中...</div>
          ) : (
            <div className="markdown-editor-container">
              <textarea
                className="markdown-editor"
                value={content}
                onChange={e => setContent(e.target.value)}
                placeholder="使用 Markdown 格式编写内容..."
              />
              <div className="markdown-editor-help">
                <h4>Markdown 格式说明</h4>
                <ul>
                  <li><code># 标题</code> - 一级标题（分类名）</li>
                  <li><code>## 标题</code> - 二级标题（条目名）</li>
                  <li><code>### vulnerable-code</code> - 有漏洞的代码</li>
                  <li><code>### fixed-code</code> - 修复后的代码</li>
                  <li><code>### 审计点</code> - 审计检查点（使用有序列表）</li>
                  <li><code>### 修复点</code> - 修复建议（使用有序列表）</li>
                  <li><code>### 利用方式</code> - 利用说明</li>
                  <li><code>### 验证接口</code> - 验证 URL（用反引号包裹）</li>
                  <li><code>### payload</code> - Payload 示例</li>
                </ul>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
