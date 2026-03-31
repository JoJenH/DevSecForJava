import { DiffEditor } from '@monaco-editor/react';
import { useTheme } from '../../hooks/useTheme';
import './CodeDiff.css';

interface CodeDiffProps {
  vulnerableCode: string;
  fixedCode: string;
}

export function CodeDiff({ vulnerableCode, fixedCode }: CodeDiffProps) {
  const { isDark } = useTheme();

  return (
    <div className="code-diff-wrapper">
      <div className="code-diff-header">
        <span className="code-diff-header-icon">⟨⟩</span>
        <h3 className="code-diff-header-title">代码对比</h3>
        <div className="code-diff-header-tags">
          <span className="code-diff-tag code-diff-tag--danger">漏洞代码</span>
          <span className="code-diff-arrow">→</span>
          <span className="code-diff-tag code-diff-tag--success">修复代码</span>
        </div>
      </div>
      <div className="code-diff-container">
        <DiffEditor
          height="200px"
          language="java"
          theme={isDark ? 'vs-dark' : 'light'}
          original={vulnerableCode}
          modified={fixedCode}
          options={{
            readOnly: true,
            domReadOnly: true,
            renderSideBySide: true,
            automaticLayout: true,
            scrollBeyondLastLine: false,
            minimap: { enabled: false },
            folding: false,
            lineNumbers: 'on',
            renderLineHighlight: 'none',
            contextmenu: true,
            diffAlgorithm: 'advanced',
            scrollbar: {
              vertical: 'auto',
              horizontal: 'auto',
            },
            overviewRulerLanes: 0,
            hideUnchangedRegions: {
              contextLineCount: 3,
              minimumLineCount: 5,
              revealLineCount: 10,
            },
            glyphMargin: false,
            lineDecorationsWidth: 12,
          }}
        />
      </div>
    </div>
  );
}
