import { useState, useCallback } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import './POC.css';

interface POCProps {
  poc: string;
  verifyUrl?: string;
  defaultPayload?: string;
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

export function POC({ poc, verifyUrl, defaultPayload = '' }: POCProps) {
  const [verifying, setVerifying] = useState(false);
  const [response, setResponse] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [payload, setPayload] = useState(defaultPayload);

  const handleVerify = useCallback(async () => {
    if (!verifyUrl || !payload) return;
    
    setVerifying(true);
    setError(null);
    setResponse(null);
    
    try {
      const formData = new FormData();
      formData.append('payload', payload);
      
      const res = await fetch(verifyUrl, {
        method: 'POST',
        body: formData,
      });
      
      const text = await res.text();
      setResponse(`${res.status} ${res.statusText}\n\n${text}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : '请求失败');
    } finally {
      setVerifying(false);
    }
  }, [verifyUrl, payload]);

  return (
    <div className="poc-section">
      <div className="poc-header">
        <span className="poc-icon">⚡</span>
        <h3 className="poc-title">利用方式及验证 POC</h3>
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
        
        {verifyUrl && (
          <div className="poc-verify-section">
            <label className="poc-verify-label">Payload</label>
            <textarea
              className="poc-verify-input"
              value={payload}
              onChange={e => setPayload(e.target.value)}
              placeholder="输入验证用的 payload"
              rows={4}
            />
            <button 
              className="poc-verify-btn" 
              onClick={handleVerify}
              disabled={verifying || !payload}
            >
              {verifying ? '验证中...' : '🚀 一键验证'}
            </button>
          </div>
        )}
        
        {error && (
          <div className="poc-response poc-response--error">
            <div className="poc-response-header">❌ 错误</div>
            <pre className="poc-response-content">{error}</pre>
          </div>
        )}
        
        {response && (
          <div className="poc-response poc-response--success">
            <div className="poc-response-header">✅ 响应结果</div>
            <pre className="poc-response-content">{response}</pre>
          </div>
        )}
      </div>
    </div>
  );
}
