import styles from './ActionSuggestionsPanel.module.css';

export default function ActionSuggestionsPanel({ suggestions = [], onSelect }) {
  const normalizedSuggestions = suggestions
    .map((suggestion) => {
      if (typeof suggestion === "string") {
        return {
          label: suggestion,
          command: suggestion,
          weight: 1,
          enabled: true,
          reason: "",
        };
      }
      const label = suggestion?.label || suggestion?.text || suggestion?.command || suggestion?.t || "";
      const command = suggestion?.command || suggestion?.t || suggestion?.label || suggestion?.text || "";
      const weight = typeof suggestion === "object" ? suggestion?.w ?? suggestion?.weight : 1;
      return {
        label: String(label || "").trim(),
        command: String(command || "").trim(),
        weight,
        enabled: suggestion?.enabled !== false,
        reason: suggestion?.reason || "",
      };
    })
    .filter((suggestion) => suggestion.label.length > 0 && suggestion.command.length > 0);

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
      {normalizedSuggestions.map(({ label, command, weight, enabled, reason }, index) => {
        const normalizedWeight = Number.isFinite(weight)
          ? Math.min(1, Math.max(0.35, weight))
          : undefined;

        return (
          <button
            key={`${label}-${index}`}
            className={styles.suggestionButton}
            type="button"
            onClick={() => onSelect?.({ label, command, weight, enabled, reason })}
            data-weight={getWeightLevel(weight)}
            data-enabled={enabled ? "true" : "false"}
            style={
              Number.isFinite(normalizedWeight)
                ? { opacity: normalizedWeight }
                : undefined
            }
            aria-label={`Suggestion: ${label}`}
            title={reason ? `${label}\n${reason}` : label}
            disabled={!enabled}
          >
            <span>{label}</span>
            <span className={styles.suggestionCommand}>{command}</span>
          </button>
        );
      })}
    </div>
  );
}
