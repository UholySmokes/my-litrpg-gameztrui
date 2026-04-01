import React from "react";

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
  quests,
}) {
  const displayText = latestEntryText || "The atrium is still. Choose the next room or issue a command.";
  const activeQuest = Array.isArray(quests?.active) ? quests.active[0] : null;

  return (
    <div className="adventure-tab adventure-tab--atrium">
      <div className="adventure-tab__hero">
        <div className="mobile-section-title">World Atrium</div>
        <h2 className="adventure-tab__title">{activeQuest?.name || "No active directive"}</h2>
        <p className="adventure-tab__summary">
          {activeQuest?.description || "Review the latest generated text and route your next move through the Command Dais."}
        </p>
      </div>

      <div className="adventure-tab__scene">{displayText}</div>

      {error ? (
        <div className="adventure-tab__error">
          {typeof error === "string" ? error : error.message || "An error occurred."}
        </div>
      ) : null}

      {suggestions && suggestions.length > 0 ? (
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
                <span className="adventure-tab__action-marker">::</span>
                <span>{label}</span>
              </button>
            );
          })}
        </div>
      ) : null}

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
          placeholder={isLoading ? "Routing through the lattice..." : "What do you do?"}
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
          CAST
        </button>
      </form>
    </div>
  );
}
