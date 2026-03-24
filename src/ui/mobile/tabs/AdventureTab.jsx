import React from "react";

/**
 * Adventure tab — main narrative screen + suggested actions + command input.
 * Wraps existing NarrativeHub + ActionSuggestions + CommandTerminal logic.
 */
export default function AdventureTab({
  latestEntryText,
  suggestions,
  onSuggestionSelect,
  userInput,
  onInputChange,
  onSubmit,
  isLoading,
  inputRef,
  error,
}) {
  const displayText = latestEntryText || "Your adventure awaits…";

  return (
    <div className="adventure-tab">
      {/* Scene / Narrative */}
      <div className="adventure-tab__scene">
        {displayText}
      </div>

      {/* Error */}
      {error && (
        <div style={{ color: "var(--m-accent-danger, #ff2a6d)", fontSize: "0.8rem", padding: "0.4rem" }}>
          {typeof error === "string" ? error : error.message || "An error occurred."}
        </div>
      )}

      {/* Suggested Actions */}
      {suggestions && suggestions.length > 0 && (
        <div className="adventure-tab__actions">
          {suggestions.map((s, i) => {
            const text = typeof s === "string" ? s : s?.text || s?.label || String(s);
            return (
              <button
                key={i}
                className="adventure-tab__action-btn"
                onClick={() => onSuggestionSelect?.(s)}
                disabled={isLoading}
              >
                <span className="adventure-tab__action-marker">▶</span>
                <span>{text}</span>
              </button>
            );
          })}
        </div>
      )}

      {/* Command Input */}
      <form
        className="adventure-tab__input-row"
        onSubmit={(e) => {
          e.preventDefault();
          onSubmit?.();
        }}
      >
        <input
          ref={inputRef}
          className="adventure-tab__input"
          type="text"
          placeholder={isLoading ? "Thinking…" : "What do you do?"}
          value={userInput || ""}
          onChange={(e) => onInputChange?.(e.target.value)}
          disabled={isLoading}
          autoComplete="off"
        />
        <button
          type="submit"
          className="adventure-tab__send-btn"
          disabled={isLoading || !userInput?.trim()}
        >
          {isLoading ? "…" : "GO"}
        </button>
      </form>
    </div>
  );
}
