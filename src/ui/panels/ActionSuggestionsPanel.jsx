import styles from './ActionSuggestionsPanel.module.css';

export default function ActionSuggestionsPanel({ suggestions = [], onSelect }) {
  if (!suggestions.length) {
    return <div className={styles.emptyState}>No suggestions yet.</div>;
  }

  const getWeightLevel = (weight) => {
    if (weight >= 0.9) return 'high';
    if (weight >= 0.7) return 'medium';
    return 'low';
  };

  return (
    <div className={styles.container}>
      {suggestions.map((suggestion, index) => {
        const label =
          typeof suggestion === 'string'
            ? suggestion
            : suggestion?.t || suggestion?.text || '';
        const weight = typeof suggestion === 'object' ? suggestion?.w : 1;

        return (
          <button
            key={`${label}-${index}`}
            className={styles.suggestionButton}
            type="button"
            onClick={() => onSelect?.(label)}
            data-weight={getWeightLevel(weight)}
            style={Number.isFinite(weight) ? { opacity: weight } : undefined}
          >
            {label || 'Action'}
          </button>
        );
      })}
    </div>
  );
}
