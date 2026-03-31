import React from "react";

/**
 * Adventure tab - main narrative screen + suggested actions + command input.
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
  const displayText = latestEntryText || "Your adventure awaits...";

  return (
    <div className="adventure-tab">
      <div className="adventure-tab__scene">{displayText}</div>

      {error && (
        <div
          style={{
            color: "var(--m-accent-danger, #ff2a6d)",
            fontSize: "0.8rem",
            padding: "0.4rem",
          }}
        >
          {typeof error === "string" ? error : error.message || "An error occurred."}
        </div>
      )}

      {suggestions && suggestions.length > 0 && (
        <div className="adventure-tab__actions">
          {suggestions.map((suggestion, index) => {
            const label =
              typeof suggestion === "string"
                ? suggestion
                : suggestion?.label ||
                  suggestion?.text ||
                  suggestion?.command ||
                  suggestion?.t ||
                  String(suggestion);
            const command =
              typeof suggestion === "string"
                ? suggestion
                : suggestion?.command ||
                  suggestion?.t ||
                  suggestion?.label ||
                  suggestion?.text ||
                  String(suggestion);

            return (
              <button
                key={`${command}-${index}`}
                className="adventure-tab__action-btn"
                onClick={() => onSuggestionSelect?.({ label, command })}
                disabled={isLoading || suggestion?.enabled === false}
              >
                <span className="adventure-tab__action-marker">{">"}</span>
                <span>{label}</span>
              </button>
            );
          })}
        </div>
      )}

      <form
        className="adventure-tab__input-row"
        onSubmit={(event) => {
          event.preventDefault();
          onSubmit?.();
        }}
      >
        <input
          ref={inputRef}
          className="adventure-tab__input"
          type="text"
          placeholder={isLoading ? "Thinking..." : "What do you do?"}
          value={userInput || ""}
          onChange={(event) => onInputChange?.(event.target.value)}
          disabled={isLoading}
          autoComplete="off"
        />
        <button
          type="submit"
          className="adventure-tab__send-btn"
          disabled={isLoading || !userInput?.trim()}
        >
          {isLoading ? "..." : "GO"}
        </button>
      </form>
    </div>
  );
}
