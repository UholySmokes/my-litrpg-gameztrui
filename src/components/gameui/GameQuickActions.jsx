export default function GameQuickActions({
  isDevBuild,
  onToggleCraft,
  onToggleGacha,
  onToggleQuests,
  onToggleReplayInspector,
  onToggleSaveLoad,
  onToggleShop,
  onToggleStatus,
  onToggleTitles,
}) {
  return (
    <div className="command-deck__quick-actions">
      <button type="button" className="holo-button" onClick={onToggleQuests}>
        Quests
      </button>
      <button type="button" className="holo-button" onClick={onToggleShop}>
        Shop
      </button>
      <button type="button" className="holo-button" onClick={onToggleGacha}>
        Gacha
      </button>
      <button type="button" className="holo-button" onClick={onToggleCraft}>
        Craft
      </button>
      <button type="button" className="holo-button" onClick={onToggleStatus}>
        Status
      </button>
      <button type="button" className="holo-button" onClick={onToggleTitles}>
        Titles
      </button>
      <button type="button" className="holo-button" onClick={onToggleSaveLoad}>
        Save and Load
      </button>
      {isDevBuild ? (
        <button
          type="button"
          className="holo-button"
          onClick={onToggleReplayInspector}
        >
          Replay Inspector
        </button>
      ) : null}
    </div>
  );
}
