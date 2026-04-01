import { useState, useEffect, useCallback, useRef } from 'react';
import { api } from '../../services/api';
import type { VulnerabilityCategory, VulnerabilityItem } from '../../types';
import { ItemEditor } from '../ItemEditor/ItemEditor';
import './EditorPage.css';

interface EditorPageProps {
  onBack: () => void;
}

type InlineEditState = {
  type: 'category' | 'item';
  categoryId?: string;
} | null;

export function EditorPage({ onBack }: EditorPageProps) {
  const [categories, setCategories] = useState<VulnerabilityCategory[]>([]);
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(null);
  const [selectedItemId, setSelectedItemId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState<string | null>(null);
  const [inlineEdit, setInlineEdit] = useState<InlineEditState>(null);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [newItemName, setNewItemName] = useState('');
  const initialLoadDone = useRef(false);

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await api.getData();
      setCategories(data.categories);
      if (data.categories.length > 0) {
        setSelectedCategoryId(prev => prev ?? data.categories[0].id);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load data');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!initialLoadDone.current) {
      initialLoadDone.current = true;
      loadData();
    }
  }, [loadData]);

  const selectedCategory = categories.find(c => c.id === selectedCategoryId);
  const selectedItem = selectedCategory?.items.find(i => i.id === selectedItemId);

  const handleCreateCategory = async (name: string) => {
    try {
      const newCat = await api.createCategory(name);
      setCategories(prev => [...prev, newCat]);
      setSelectedCategoryId(newCat.id);
      setSelectedItemId(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create category');
    }
  };

  const handleUpdateCategory = async (categoryId: string, name: string) => {
    try {
      const updated = await api.updateCategory(categoryId, name);
      setCategories(prev => prev.map(c => c.id === categoryId ? updated : c));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update category');
    }
  };

  const handleDeleteCategory = async (categoryId: string) => {
    if (!confirm('确定要删除此分类及其所有条目吗？')) return;
    try {
      await api.deleteCategory(categoryId);
      setCategories(prev => prev.filter(c => c.id !== categoryId));
      if (selectedCategoryId === categoryId) {
        setSelectedCategoryId(categories.find(c => c.id !== categoryId)?.id || null);
        setSelectedItemId(null);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete category');
    }
  };

  const handleCreateItem = async (categoryId: string, item: VulnerabilityItem) => {
    try {
      const newItem = await api.createItem(categoryId, item);
      setCategories(prev =>
        prev.map(c =>
          c.id === categoryId ? { ...c, items: [...c.items, newItem] } : c
        )
      );
      setSelectedItemId(newItem.id!);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create item');
    }
  };

  const handleUpdateItem = async (categoryId: string, itemId: string, item: VulnerabilityItem) => {
    try {
      setSaving(true);
      const updated = await api.updateItem(categoryId, itemId, item);
      setCategories(prev =>
        prev.map(c =>
          c.id === categoryId
            ? { ...c, items: c.items.map(i => i.id === itemId ? updated : i) }
            : c
        )
      );
      setSaveMessage('保存成功');
      setTimeout(() => setSaveMessage(null), 2000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save item');
    } finally {
      setSaving(false);
    }
  };

  const handleCreateCategoryInline = () => {
    if (newCategoryName.trim()) {
      handleCreateCategory(newCategoryName.trim());
      setNewCategoryName('');
      setInlineEdit(null);
    }
  };

  const handleCreateItemInline = (categoryId: string) => {
    if (newItemName.trim()) {
      handleCreateItem(categoryId, {
        name: newItemName.trim(),
        description: '',
        vulnerableCode: '',
        fixedCode: '',
        auditPoints: [],
        fixPoints: [],
        poc: '',
      });
      setNewItemName('');
      setInlineEdit(null);
    }
  };

  const cancelInlineEdit = () => {
    setInlineEdit(null);
    setNewCategoryName('');
    setNewItemName('');
  };

  const handleDeleteItem = async (categoryId: string, itemId: string) => {
    if (!confirm('确定要删除此条目吗？')) return;
    try {
      await api.deleteItem(categoryId, itemId);
      setCategories(prev =>
        prev.map(c =>
          c.id === categoryId
            ? { ...c, items: c.items.filter(i => i.id !== itemId) }
            : c
        )
      );
      if (selectedItemId === itemId) {
        setSelectedItemId(null);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete item');
    }
  };

  if (loading) {
    return (
      <div className="editor-page">
        <div className="editor-loading">加载中...</div>
      </div>
    );
  }

  if (error && categories.length === 0) {
    return (
      <div className="editor-page">
        <div className="editor-error">
          <div className="editor-error-title">加载失败</div>
          <div className="editor-error-message">{error}</div>
          <button className="editor-error-retry" onClick={loadData}>重试</button>
        </div>
      </div>
    );
  }

  return (
    <div className="editor-page">
      <div className="editor-toolbar">
        <button className="editor-back-btn" onClick={onBack}>
          ← 返回查看
        </button>
        <h1 className="editor-title">文档编辑器</h1>
        {saveMessage && <span className="editor-save-message">{saveMessage}</span>}
      </div>

      {error && <div className="editor-toast error">{error}</div>}

      <div className="editor-content">
        <div className="editor-sidebar">
          <div className="editor-sidebar-header">
            <h3>分类列表</h3>
            <button
              className="editor-add-btn"
              onClick={() => {
                setInlineEdit({ type: 'category' });
              }}
            >
              + 新建分类
            </button>
          </div>
          <div className="editor-category-list">
            {categories.map(category => (
              <div
                key={category.id}
                className={`editor-category ${selectedCategoryId === category.id ? 'active' : ''}`}
              >
                <div className="editor-category-header">
                  <button
                    className="editor-category-name"
                    onClick={() => {
                      setSelectedCategoryId(category.id);
                      setSelectedItemId(null);
                    }}
                  >
                    {category.name}
                  </button>
                  <div className="editor-category-actions">
                    <button
                      className="editor-icon-btn"
                      title="重命名"
                      onClick={() => {
                        const name = prompt('请输入新名称:', category.name);
                        if (name) handleUpdateCategory(category.id, name.trim());
                      }}
                    >
                      ✎
                    </button>
                    <button
                      className="editor-icon-btn editor-icon-btn--danger"
                      title="删除"
                      onClick={() => handleDeleteCategory(category.id)}
                    >
                      ✕
                    </button>
                  </div>
                </div>
                {selectedCategoryId === category.id && (
                  <ul className="editor-item-list">
                    {category.items.map(item => (
                      <li key={item.id}>
                        <button
                          className={`editor-item-btn ${selectedItemId === item.id ? 'active' : ''}`}
                          onClick={() => {
                            setSelectedCategoryId(category.id);
                            setSelectedItemId(item.id!);
                          }}
                        >
                          {item.name}
                        </button>
                        <button
                          className="editor-icon-btn editor-icon-btn--danger editor-icon-btn--small"
                          onClick={() => handleDeleteItem(category.id, item.id!)}
                        >
                          ✕
                        </button>
                      </li>
                    ))}
                    {inlineEdit && inlineEdit.type === 'item' && inlineEdit.categoryId === category.id && (
                      <li className="editor-inline-edit">
                        <div className="inline-edit-row">
                          <input
                            type="text"
                            placeholder="条目名称"
                            value={newItemName}
                            onChange={e => setNewItemName(e.target.value)}
                            onKeyDown={e => {
                              if (e.key === 'Enter') handleCreateItemInline(category.id);
                              if (e.key === 'Escape') cancelInlineEdit();
                            }}
                            autoFocus
                          />
                        </div>
                        <div className="inline-edit-actions">
                          <button
                            className="inline-edit-btn inline-edit-btn--primary"
                            onClick={() => handleCreateItemInline(category.id)}
                          >
                            ✓
                          </button>
                          <button
                            className="inline-edit-btn inline-edit-btn--cancel"
                            onClick={cancelInlineEdit}
                          >
                            ✕
                          </button>
                        </div>
                      </li>
                    )}
                    <li>
                      <button
                        className="editor-add-item-btn"
                        onClick={() => {
                          setInlineEdit({ type: 'item', categoryId: category.id });
                        }}
                      >
                        + 新建条目
                      </button>
                    </li>
                  </ul>
                )}
              </div>
            ))}
            {inlineEdit && inlineEdit.type === 'category' && (
              <div className="editor-inline-edit">
                <div className="inline-edit-row">
                  <input
                    type="text"
                    placeholder="分类名称"
                    value={newCategoryName}
                    onChange={e => setNewCategoryName(e.target.value)}
                    onKeyDown={e => {
                      if (e.key === 'Enter') handleCreateCategoryInline();
                      if (e.key === 'Escape') cancelInlineEdit();
                    }}
                    autoFocus
                  />
                </div>
                <div className="inline-edit-actions">
                  <button
                    className="inline-edit-btn inline-edit-btn--primary"
                    onClick={handleCreateCategoryInline}
                  >
                    ✓
                  </button>
                  <button
                    className="inline-edit-btn inline-edit-btn--cancel"
                    onClick={cancelInlineEdit}
                  >
                    ✕
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="editor-main">
          {selectedItem && selectedCategory ? (
            <ItemEditor
              key={selectedItem.id}
              item={selectedItem}
              categoryId={selectedCategory.id}
              onSave={handleUpdateItem}
              saving={saving}
            />
          ) : (
            <div className="editor-empty">
              <div className="editor-empty-icon">📝</div>
              <div className="editor-empty-text">
                {selectedCategory
                  ? '请选择一个条目进行编辑，或创建新条目'
                  : '请选择一个分类'}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
