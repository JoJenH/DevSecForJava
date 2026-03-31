import { useState, useCallback } from 'react';
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

type TagListEditorProps = {
  label: string;
  tags: string[];
  onChange: (tags: string[]) => void;
};

function TagListEditor({ label, tags, onChange }: TagListEditorProps) {
  const [input, setInput] = useState('');

  const handleAdd = () => {
    const trimmed = input.trim();
    if (trimmed && !tags.includes(trimmed)) {
      onChange([...tags, trimmed]);
      setInput('');
    }
  };

  const handleRemove = (index: number) => {
    onChange(tags.filter((_, i) => i !== index));
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleAdd();
    }
  };

  return (
    <div className="tag-list-editor">
      <label className="editor-label">{label}</label>
      <div className="tag-input-row">
        <input
          type="text"
          className="editor-input tag-input"
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="输入后按 Enter 添加"
        />
        <button className="tag-add-btn" onClick={handleAdd} disabled={!input.trim()}>
          添加
        </button>
      </div>
      <div className="tag-list">
        {tags.map((tag, index) => (
          <span key={index} className="tag-item">
            {tag}
            <button className="tag-remove" onClick={() => handleRemove(index)}>✕</button>
          </span>
        ))}
      </div>
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
          <TagListEditor
            label="审计要点"
            tags={form.auditPoints}
            onChange={tags => updateField('auditPoints', tags)}
          />
        </div>

        <div className="editor-section">
          <TagListEditor
            label="修复要点"
            tags={form.fixPoints}
            onChange={tags => updateField('fixPoints', tags)}
          />
        </div>

        <div className="editor-section">
          <div className="editor-section-header">
            <span className="editor-section-icon">⚡</span>
            <h3 className="editor-section-title">POC (概念验证)</h3>
          </div>
          <textarea
            className="editor-textarea editor-textarea--code"
            value={form.poc}
            onChange={e => updateField('poc', e.target.value)}
            rows={6}
          />
        </div>
      </div>
    </div>
  );
}
