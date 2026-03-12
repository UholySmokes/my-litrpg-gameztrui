import ActionSuggestionsPanel from "../panels/ActionSuggestionsPanel.jsx";
import CommandTerminalPanel from "../panels/CommandTerminalPanel.jsx";

function formatStatRow(player) {
  const hp = player?.hp ?? 0;
  const maxHp = player?.maxHp ?? hp;
  const level = player?.level ?? 1;
  const gold = player?.gold ?? 0;
  const mana = player?.mana ?? 0;

  return `LV ${level} | HP ${hp}/${maxHp} | MANA ${mana} | GOLD ${gold}`;
}

export default function TextRpgMode({
  player,
  narrativeEntries,
  suggestions,
  onSuggestionSelect,
  userInput,
  onInputChange,
  onSubmit,
  isLoading,
  error,
  inputRef,
}) {
  const latestEntries = Array.isArray(narrativeEntries)
    ? narrativeEntries.slice(0, 8)
    : [];
  const inventory = Array.isArray(player?.inventory) ? player.inventory : [];

  return (
    <section className="holo-panel" style={{ marginTop: "0.75rem" }}>
      <h2 style={{ marginTop: 0 }}>Text RPG Mode</h2>
      <p style={{ color: "var(--text-dim)" }}>{formatStatRow(player)}</p>

      <div style={{ margin: "1rem 0" }}>
        <h3 style={{ marginBottom: "0.5rem" }}>Narrative Feed</h3>
        <div style={{ display: "grid", gap: "0.4rem" }}>
          {latestEntries.length > 0 ? (
            latestEntries.map((entry, index) => (
              <p key={`${entry?.id || "entry"}-${index}`} style={{ margin: 0 }}>
                {entry?.text || "..."}
              </p>
            ))
          ) : (
            <p style={{ margin: 0, color: "var(--text-dim)" }}>
              No narrative entries yet.
            </p>
          )}
        </div>
      </div>

      <div style={{ marginBottom: "1rem" }}>
        <h3 style={{ marginBottom: "0.5rem" }}>Inventory</h3>
        {inventory.length ? (
          <ul style={{ margin: 0, paddingLeft: "1.2rem" }}>
            {inventory.slice(0, 6).map((item, index) => (
              <li key={`${item?.id || item?.name || "item"}-${index}`}>
                {item?.name || "Unknown Item"}
              </li>
            ))}
          </ul>
        ) : (
          <p style={{ margin: 0, color: "var(--text-dim)" }}>Inventory is empty.</p>
        )}
      </div>

      <ActionSuggestionsPanel suggestions={suggestions} onSelect={onSuggestionSelect} />
      <CommandTerminalPanel
        userInput={userInput}
        onInputChange={onInputChange}
        onSubmit={onSubmit}
        isLoading={isLoading}
        error={error}
        inputRef={inputRef}
      />
    </section>
  );
}
