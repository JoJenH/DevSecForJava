import { Editor } from '@monaco-editor/react';
import { useTheme } from '../../hooks/useTheme';
import './CodeDiff.css';

interface CodeDiffProps {
  vulnerableCode: string;
  fixedCode: string;
  vulnerableCodeLanguage?: string;
  fixedCodeLanguage?: string;
}

export function CodeDiff({ vulnerableCode, fixedCode, vulnerableCodeLanguage = 'java', fixedCodeLanguage = 'java' }: CodeDiffProps) {
  const { isDark } = useTheme();

  const editorOptions = {
    readOnly: true,
    domReadOnly: true,
    automaticLayout: true,
    scrollBeyondLastLine: false,
    minimap: { enabled: false },
    folding: false,
    lineNumbers: 'on' as const,
    renderLineHighlight: 'none' as const,
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
          <span className="code-diff-tag code-diff-tag--danger">漏洞代码({vulnerableCodeLanguage})</span>
          <span className="code-diff-arrow">→</span>
          <span className="code-diff-tag code-diff-tag--success">修复代码({fixedCodeLanguage})</span>
        </div>
      </div>
      <div className="code-diff-container">
        <div className="code-diff-panel">
          <Editor
            height="200px"
            language={vulnerableCodeLanguage}
            theme={isDark ? 'vs-dark' : 'light'}
            value={vulnerableCode}
            options={editorOptions}
          />
        </div>
        <div className="code-diff-panel">
          <Editor
            height="200px"
            language={fixedCodeLanguage}
            theme={isDark ? 'vs-dark' : 'light'}
            value={fixedCode}
            options={editorOptions}
          />
        </div>
      </div>
    </div>
  );
}
