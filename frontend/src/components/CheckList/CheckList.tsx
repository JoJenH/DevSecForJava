import './CheckList.css';

interface CheckListProps {
  auditPoints: string[];
  fixPoints: string[];
}

export function CheckList({ auditPoints, fixPoints }: CheckListProps) {
  return (
    <div className="check-list">
      <div className="check-panel check-panel--audit">
        <div className="check-panel-header">
          <span className="check-panel-icon">🔍</span>
          <h3 className="check-panel-title">审计要点</h3>
        </div>
        <ul className="check-items">
          {auditPoints.map((point, index) => (
            <li key={index} className="check-item">
              <span className="check-item-bullet">•</span>
              <span className="check-item-text">{point}</span>
            </li>
          ))}
        </ul>
      </div>
      <div className="check-panel check-panel--fix">
        <div className="check-panel-header">
          <span className="check-panel-icon">🔧</span>
          <h3 className="check-panel-title">修复要点</h3>
        </div>
        <ul className="check-items">
          {fixPoints.map((point, index) => (
            <li key={index} className="check-item">
              <span className="check-item-bullet">•</span>
              <span className="check-item-text">{point}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
