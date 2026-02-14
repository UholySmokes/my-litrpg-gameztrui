import styles from './ActionSuggestionsPanel.module.css';

export default function ActionSuggestionsPanel({ suggestions = [], onSelect }) {
  const normalizedSuggestions = suggestions
    .map((suggestion) => {
      const label =
        typeof suggestion === "string"
          ? suggestion
          : suggestion?.t || suggestion?.text || "";
      const weight = typeof suggestion === "object" ? suggestion?.w : 1;
      return { label: String(label || "").trim(), weight };
    })
    .filter((suggestion) => suggestion.label.length > 0);

  if (!normalizedSuggestions.length) {
    return <div className={styles.emptyState}>No suggestions yet.</div>;
  }

  const getWeightLevel = (weight) => {
    if (weight >= 0.9) return 'high';
    if (weight >= 0.7) return 'medium';
    return 'low';
  };

  return (
    <div className={styles.container}>
      {normalizedSuggestions.map(({ label, weight }, index) => {
        const normalizedWeight = Number.isFinite(weight)
          ? Math.min(1, Math.max(0.35, weight))
          : undefined;

        return (
          <button
            key={`${label}-${index}`}
            className={styles.suggestionButton}
            type="button"
            onClick={() => onSelect?.(label)}
            data-weight={getWeightLevel(weight)}
            style={
              Number.isFinite(normalizedWeight)
                ? { opacity: normalizedWeight }
                : undefined
            }
            aria-label={`Suggestion: ${label}`}
            title={label}
          >
            {label}
          </button>
        );
      })}
    </div>
  );
}
