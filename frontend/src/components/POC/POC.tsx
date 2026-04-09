import { useState, useCallback } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { useLocalMode } from '../../hooks/useLocalMode';
import './POC.css';

interface POCProps {
  poc: string;
  categoryName: string;
  itemName: string;
  defaultPayload?: string;
}

interface VerifyResult {
  status: number;
  statusText: string;
  body: string;
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
  const vulUrl = `/vul/verify`;
  const fixedUrl = `/fixed/verify`;
  const { localMode, loading: localModeLoading } = useLocalMode();
  const [verifying, setVerifying] = useState(false);
  const [vulResult, setVulResult] = useState<VerifyResult | null>(null);
  const [fixedResult, setFixedResult] = useState<VerifyResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [payload, setPayload] = useState(defaultPayload);

  const handleVerify = useCallback(async () => {
    if (!vulUrl) return;

    if (localMode === false) {
      setError('漏洞验证功能仅限本地部署使用，请本地部署后使用');
      return;
    }
    
    setVerifying(true);
    setError(null);
    setVulResult(null);
    setFixedResult(null);
    
    try {
      const jsonBody = JSON.stringify({ 
        payload, 
        category: categoryName, 
        item: itemName 
      });
      
      const [vulRes, fixedRes] = await Promise.all([
        fetch(vulUrl, { 
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

      const [vulText, fixedText] = await Promise.all([
        vulRes.text(),
        fixedRes.text()
      ]);

      const vulnJson: VerifyResult = {
        status: vulRes.status,
        statusText: vulRes.statusText,
        body: vulText,
      };

      const fixedJson: VerifyResult = {
        status: fixedRes.status,
        statusText: fixedRes.statusText,
        body: fixedText,
      };

      setVulResult(vulnJson);
      setFixedResult(fixedJson);
    } catch (err) {
      setError(err instanceof Error ? err.message : '请求失败');
    } finally {
      setVerifying(false);
    }
  }, [vulUrl, fixedUrl, payload]);

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
        
        {vulUrl && (
          <div className="poc-verify-section">
            <label className="poc-verify-label">Payload</label>
            <textarea
              className="poc-verify-input"
              value={payload}
              onChange={e => setPayload(e.target.value)}
              placeholder="输入验证用的 payload"
              rows={4}
            />
            {localMode === false ? (
              <button 
                className="poc-verify-btn" 
                onClick={handleVerify}
                disabled={true}
              >
                🔒 在线环境不可用，请本地部署
              </button>
            ) : (
              <button 
                className="poc-verify-btn" 
                onClick={handleVerify}
                disabled={verifying || localModeLoading}
              >
                {localModeLoading ? '加载中...' : verifying ? '验证中...' : '🚀 一键验证对比'}
              </button>
            )}
          </div>
        )}
        
        {error && (
          <div className="poc-response poc-response--error">
            <div className="poc-response-header">❌ 错误</div>
            <pre className="poc-response-content">{error}</pre>
          </div>
        )}
        
        {vulResult && fixedResult && (
          <div className="poc-compare">
            <div className="poc-compare-card poc-compare-card--vulnerable">
              <div className="poc-compare-header">
                <span className="poc-compare-badge poc-compare-badge--vulnerable">漏洞代码</span>
                <span className="poc-compare-status poc-compare-status--danger">
                  {vulResult.status} {vulResult.statusText}
                </span>
              </div>
              <pre className="poc-compare-result">{vulResult.body}</pre>
            </div>

            <div className="poc-compare-card poc-compare-card--safe">
              <div className="poc-compare-header">
                <span className="poc-compare-badge poc-compare-badge--fixed">修复代码</span>
                <span className="poc-compare-status poc-compare-status--success">
                  {fixedResult.status} {fixedResult.statusText}
                </span>
              </div>
              <pre className="poc-compare-result">{fixedResult.body}</pre>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
