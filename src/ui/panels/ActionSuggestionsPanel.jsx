export default function ActionSuggestionsPanel({ suggestions = [], onSelect }) {
  if (!suggestions.length) {
    return <div style={{ color: "var(--text-dim)" }}>No suggestions yet.</div>;
  }

  return (
    <div className="command-deck__actions">
      {suggestions.map((suggestion, index) => {
        const label =
          typeof suggestion === "string"
            ? suggestion
            : suggestion?.t || suggestion?.text || "";
        const weight = typeof suggestion === "object" ? suggestion?.w : 1;
        return (
        <button
          key={`${label}-${index}`}
          className="holo-button"
          type="button"
          onClick={() => onSelect?.(label)}
          style={Number.isFinite(weight) ? { opacity: weight } : undefined}
        >
          {label || "Action"}
        </button>
      );
      })}
    </div>
  );
}
