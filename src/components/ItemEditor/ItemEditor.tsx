import { useState, useCallback, useEffect } from 'react';
import Editor from '@monaco-editor/react';
import { useTheme } from '../../hooks/useTheme';
import type { VulnerabilityItem } from '../../types';
import './ItemEditor.css';

interface ItemEditorProps {
  item: VulnerabilityItem;
  categoryId: string;
  onSave: (categoryId: string, itemId: string, item: Omit<VulnerabilityItem, 'id'>) => void;
  saving: boolean;
}

type ListEditorProps = {
  label: string;
  items: string[];
  onChange: (items: string[]) => void;
};

function ListEditor({ label, items, onChange }: ListEditorProps) {
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [editValue, setEditValue] = useState('');

  const handleAdd = () => {
    onChange([...items, '']);
    setEditingIndex(items.length);
    setEditValue('');
  };

  const handleRemove = (index: number) => {
    onChange(items.filter((_, i) => i !== index));
  };

  const handleUpdate = (index: number, value: string) => {
    const newItems = [...items];
    newItems[index] = value;
    onChange(newItems);
  };

  const handleStartEdit = (index: number) => {
    setEditingIndex(index);
    setEditValue(items[index]);
  };

  const handleFinishEdit = () => {
    if (editingIndex !== null) {
      handleUpdate(editingIndex, editValue);
      setEditingIndex(null);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleFinishEdit();
    } else if (e.key === 'Escape') {
      setEditingIndex(null);
    }
  };

  return (
    <div className="list-editor">
      <div className="list-editor-header">
        <label className="editor-label">{label}</label>
        <button className="list-add-btn" onClick={handleAdd}>
          + 添加
        </button>
      </div>
      <ol className="ordered-list">
        {items.map((item, index) => (
          <li key={index} className="list-item">
            {editingIndex === index ? (
              <div className="list-item-edit">
                <input
                  type="text"
                  className="list-item-input"
                  value={editValue}
                  onChange={e => setEditValue(e.target.value)}
                  onBlur={handleFinishEdit}
                  onKeyDown={handleKeyDown}
                  autoFocus
                />
              </div>
            ) : (
              <div className="list-item-view" onClick={() => handleStartEdit(index)}>
                <span className="list-item-text">{item || '点击编辑...'}</span>
              </div>
            )}
            <button
              className="list-item-remove"
              onClick={() => handleRemove(index)}
              title="删除"
            >
              ✕
            </button>
          </li>
        ))}
      </ol>
      {items.length === 0 && (
        <div className="list-empty">
          <span className="list-empty-text">暂无条目，点击「添加」开始</span>
        </div>
      )}
    </div>
  );
}

export function ItemEditor({ item, categoryId, onSave, saving }: ItemEditorProps) {
  const { isDark } = useTheme();
  const [form, setForm] = useState({
    name: item.name,
    shortName: item.shortName,
    description: item.description,
    vulnerableCode: item.vulnerableCode,
    fixedCode: item.fixedCode,
    auditPoints: [...item.auditPoints],
    fixPoints: [...item.fixPoints],
    poc: item.poc,
  });
  const [hasChanges, setHasChanges] = useState(false);
  
  // 当保存成功或item变化时重置hasChanges
  useEffect(() => {
    setHasChanges(false);
  }, [item]);

  const updateField = useCallback(<K extends keyof typeof form>(key: K, value: typeof form[K]) => {
    setForm(prev => ({ ...prev, [key]: value }));
    setHasChanges(true);
  }, []);

  const handleSave = () => {
    onSave(categoryId, item.id, form);
  };

  const handleReset = () => {
    setForm({
      name: item.name,
      shortName: item.shortName,
      description: item.description,
      vulnerableCode: item.vulnerableCode,
      fixedCode: item.fixedCode,
      auditPoints: [...item.auditPoints],
      fixPoints: [...item.fixPoints],
      poc: item.poc,
    });
    setHasChanges(false);
  };

  return (
    <div className="item-editor">
      <div className="item-editor-header">
        <h2 className="item-editor-title">编辑: {item.shortName}</h2>
        <div className="item-editor-actions">
          <button
            className="editor-btn editor-btn--secondary"
            onClick={handleReset}
            disabled={!hasChanges || saving}
          >
            重置
          </button>
          <button
            className="editor-btn editor-btn--primary"
            onClick={handleSave}
            disabled={!hasChanges || saving}
          >
            {saving ? '保存中...' : '保存'}
          </button>
        </div>
      </div>

      <div className="item-editor-body">
        <div className="editor-section">
          <div className="editor-row">
            <div className="editor-field">
              <label className="editor-label">名称</label>
              <input
                type="text"
                className="editor-input"
                value={form.name}
                onChange={e => updateField('name', e.target.value)}
              />
            </div>
            <div className="editor-field editor-field--short">
              <label className="editor-label">简称</label>
              <input
                type="text"
                className="editor-input"
                value={form.shortName}
                onChange={e => updateField('shortName', e.target.value)}
              />
            </div>
          </div>

          <div className="editor-field">
            <label className="editor-label">描述</label>
            <textarea
              className="editor-textarea"
              value={form.description}
              onChange={e => updateField('description', e.target.value)}
              rows={3}
            />
          </div>
        </div>

        <div className="editor-section">
          <div className="editor-section-header">
            <span className="editor-section-icon">⟨⟩</span>
            <h3 className="editor-section-title">代码对比</h3>
          </div>
          <div className="editor-code-grid">
            <div className="editor-code-block">
              <div className="editor-code-label editor-code-label--danger">漏洞代码</div>
              <Editor
                height="200px"
                language="java"
                theme={isDark ? 'vs-dark' : 'light'}
                value={form.vulnerableCode}
                onChange={v => updateField('vulnerableCode', v || '')}
                options={{
                  minimap: { enabled: false },
                  scrollBeyondLastLine: false,
                  lineNumbers: 'on',
                  fontSize: 13,
                  fontFamily: 'var(--mono)',
                  padding: { top: 8 },
                  automaticLayout: true,
                }}
              />
            </div>
            <div className="editor-code-block">
              <div className="editor-code-label editor-code-label--success">修复代码</div>
              <Editor
                height="200px"
                language="java"
                theme={isDark ? 'vs-dark' : 'light'}
                value={form.fixedCode}
                onChange={v => updateField('fixedCode', v || '')}
                options={{
                  minimap: { enabled: false },
                  scrollBeyondLastLine: false,
                  lineNumbers: 'on',
                  fontSize: 13,
                  fontFamily: 'var(--mono)',
                  padding: { top: 8 },
                  automaticLayout: true,
                }}
              />
            </div>
          </div>
        </div>

        <div className="editor-section">
          <ListEditor
            label="审计要点"
            items={form.auditPoints}
            onChange={items => updateField('auditPoints', items)}
          />
        </div>

        <div className="editor-section">
          <ListEditor
            label="修复要点"
            items={form.fixPoints}
            onChange={items => updateField('fixPoints', items)}
          />
        </div>

        <div className="editor-section">
          <div className="editor-section-header">
            <span className="editor-section-icon">⚡</span>
            <h3 className="editor-section-title">POC (概念验证)</h3>
          </div>
          <Editor
            height="300px"
            language="markdown"
            theme={isDark ? 'vs-dark' : 'light'}
            value={form.poc}
            onChange={v => updateField('poc', v || '')}
            options={{
              minimap: { enabled: false },
              scrollBeyondLastLine: false,
              lineNumbers: 'on',
              fontSize: 13,
              fontFamily: 'var(--mono)',
              padding: { top: 8 },
              automaticLayout: true,
              wordWrap: 'on',
            }}
          />
        </div>
      </div>
    </div>
  );
}
