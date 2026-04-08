import { useState, useCallback } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import './POC.css';

interface POCProps {
  poc: string;
  categoryName: string;
  itemName: string;
  defaultPayload?: string;
}

interface VerifyResult {
  success: boolean;
  message: string;
  result?: unknown;
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

export function POC({ poc, categoryName, itemName, defaultPayload = '' }: POCProps) {
  const verifyUrl = `/vul/${encodeURIComponent(categoryName)}/${encodeURIComponent(itemName)}`;
  const fixedUrl = `${verifyUrl}/fixed`;
  const [verifying, setVerifying] = useState(false);
  const [vulnResult, setVulnResult] = useState<VerifyResult | null>(null);
  const [fixedResult, setFixedResult] = useState<VerifyResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [payload, setPayload] = useState(defaultPayload);

  const handleVerify = useCallback(async () => {
    if (!verifyUrl || !payload) return;
    
    setVerifying(true);
    setError(null);
    setVulnResult(null);
    setFixedResult(null);
    
    try {
      const jsonBody = JSON.stringify({ payload });
      
      const [vulnRes, fixedRes] = await Promise.all([
        fetch(verifyUrl, { 
          method: 'POST', 
          headers: { 'Content-Type': 'application/json' },
          body: jsonBody 
        }),
        fetch(fixedUrl, { 
          method: 'POST', 
          headers: { 'Content-Type': 'application/json' },
          body: jsonBody 
        })
      ]);

      const [vulnText, fixedText] = await Promise.all([
        vulnRes.text(),
        fixedRes.text()
      ]);

      let vulnJson: VerifyResult;
      let fixedJson: VerifyResult;

      try {
        vulnJson = JSON.parse(vulnText);
      } catch {
        vulnJson = { success: vulnRes.ok, message: vulnText };
      }

      try {
        fixedJson = JSON.parse(fixedText);
      } catch {
        fixedJson = { success: fixedRes.ok, message: fixedText };
      }

      setVulnResult(vulnJson);
      setFixedResult(fixedJson);
    } catch (err) {
      setError(err instanceof Error ? err.message : '请求失败');
    } finally {
      setVerifying(false);
    }
  }, [verifyUrl, fixedUrl, payload]);

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
              {verifying ? '验证中...' : '🚀 一键验证对比'}
            </button>
          </div>
        )}
        
        {error && (
          <div className="poc-response poc-response--error">
            <div className="poc-response-header">❌ 错误</div>
            <pre className="poc-response-content">{error}</pre>
          </div>
        )}
        
        {vulnResult && fixedResult && (
          <div className="poc-compare">
            <div className={`poc-compare-card ${vulnResult.success ? 'poc-compare-card--vulnerable' : 'poc-compare-card--safe'}`}>
              <div className="poc-compare-header">
                <span className="poc-compare-badge poc-compare-badge--vulnerable">漏洞代码</span>
                <span className={`poc-compare-status ${vulnResult.success ? 'poc-compare-status--danger' : 'poc-compare-status--success'}`}>
                  {vulnResult.success ? '⚠️ 可能存在漏洞' : '✅ 安全'}
                </span>
              </div>
              <div className="poc-compare-message">{vulnResult.message}</div>
              {vulnResult.result !== undefined && (
                <pre className="poc-compare-result">{JSON.stringify(vulnResult.result as unknown, null, 2)}</pre>
              )}
            </div>

            <div className={`poc-compare-card ${fixedResult.success ? 'poc-compare-card--safe' : 'poc-compare-card--safe'}`}>
              <div className="poc-compare-header">
                <span className="poc-compare-badge poc-compare-badge--fixed">修复代码</span>
                <span className={`poc-compare-status ${fixedResult.success ? 'poc-compare-status--success' : 'poc-compare-status--warning'}`}>
                  {fixedResult.success ? '✅ 安全' : '⚠️ 需要检查'}
                </span>
              </div>
              <div className="poc-compare-message">{fixedResult.message}</div>
              {fixedResult.result !== undefined && (
                <pre className="poc-compare-result">{JSON.stringify(fixedResult.result as unknown, null, 2)}</pre>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
