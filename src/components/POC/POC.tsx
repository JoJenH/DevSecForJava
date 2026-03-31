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
        <pre className="poc-code">
          <code>{poc}</code>
        </pre>
      </div>
    </div>
  );
}
