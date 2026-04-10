import { DiffEditor } from '@monaco-editor/react';
import { useTheme } from '../../hooks/useTheme';
import './CodeDiff.css';

interface CodeDiffProps {
  vulnerableCode: string;
  fixedCode: string;
  language?: string;
}

export function CodeDiff({ vulnerableCode, fixedCode, language = 'java' }: CodeDiffProps) {
  const { isDark } = useTheme();

  const editorOptions = {
    readOnly: true,
    domReadOnly: true,
    automaticLayout: true,
    scrollBeyondLastLine: false,
    minimap: { enabled: false },
    folding: true,
    lineNumbers: 'on' as const,
    renderSideBySide: true,
    diffWordWrap: 'on' as const,
    scrollbar: {
      vertical: 'auto' as const,
      horizontal: 'auto' as const,
    },
  };

  return (
    <div className="code-diff-wrapper">
      <div className="code-diff-header">
        <span className="code-diff-header-icon">⟨⟩</span>
        <h3 className="code-diff-header-title">代码对比</h3>
        <div className="code-diff-header-tags">
          <span className="code-diff-tag">{language}</span>
          <span className="code-diff-tag code-diff-tag--danger">漏洞代码</span>
          <span className="code-diff-arrow">→</span>
          <span className="code-diff-tag code-diff-tag--success">修复代码</span>
        </div>
      </div>
      <div className="code-diff-container">
        <DiffEditor
          height="300px"
          language={language}
          theme={isDark ? 'vs-dark' : 'light'}
          original={vulnerableCode}
          modified={fixedCode}
          options={editorOptions}
        />
      </div>
    </div>
  );
}
