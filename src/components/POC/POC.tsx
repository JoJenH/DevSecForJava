import { useState, useCallback } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import './POC.css';

interface POCProps {
  poc: string;
}

function CodeBlock({ children, className }: { children?: React.ReactNode; className?: string }) {
  const [copied, setCopied] = useState(false);
  
  const codeContent = String(children || '').replace(/\n$/, '');
  
  const handleCopy = useCallback(() => {
    navigator.clipboard.writeText(codeContent).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }, [codeContent]);

  if (className) {
    return (
      <div className="code-block-wrapper">
        <button className="code-copy-btn" onClick={handleCopy}>
          {copied ? '✓ 已复制' : '复制'}
        </button>
        <code className={className}>{children}</code>
      </div>
    );
  }
  
  return <code className={className}>{children}</code>;
}

export function POC({ poc }: POCProps) {
  return (
    <div className="poc-section">
      <div className="poc-header">
        <span className="poc-icon">⚡</span>
        <h3 className="poc-title">验证利用 POC</h3>
      </div>
      <div className="poc-content">
        <div className="poc-markdown">
          <ReactMarkdown 
            remarkPlugins={[remarkGfm]}
            components={{ code: CodeBlock }}
          >
            {poc}
          </ReactMarkdown>
        </div>
      </div>
    </div>
  );
}
