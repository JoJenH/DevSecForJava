import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import './POC.css';

interface POCProps {
  poc: string;
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
          <ReactMarkdown remarkPlugins={[remarkGfm]}>{poc}</ReactMarkdown>
        </div>
      </div>
    </div>
  );
}
