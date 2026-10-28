import './ProgressBar.css';

export default function ProgressBar({ current, max, label, color = '#4ade80', tooltip = '' }) {
  const percentage = max > 0 ? Math.max(0, Math.min((current / max) * 100, 100)) : 0;
  return (
    <div className="progress-container" title={tooltip}>
      <div className="progress-label">
        <span>{label}</span>
        <span className="progress-value">{Math.round(current)}/{max}</span>
      </div>
      <div className="progress-bar">
        <div
          className="progress-fill"
          style={{
            '--progress': `${percentage}%`,
            '--fill-color': color
          }}
        />
      </div>
    </div>
  );
}
