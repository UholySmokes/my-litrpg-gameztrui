export default function ItemPicker({
  items = [],
  onSelectItem,
  onClose,
  disabled = false,
}) {
  return (
    <section className="command-deck__picker" aria-label="Item picker">
      <div className="command-deck__picker-header">
        <div>
          <div className="command-deck__picker-title">Item Picker</div>
          <div className="command-deck__picker-subtitle">
            Choose a usable item from the current inventory.
          </div>
        </div>
        <button type="button" className="holo-button" onClick={onClose}>
          Close
        </button>
      </div>

      <div className="command-deck__picker-list">
        {items.length === 0 ? (
          <div className="command-deck__picker-empty">No inventory items available.</div>
        ) : (
          items.map((item) => {
            const usable = Boolean(item.usable);
            const entryDisabled = disabled || !usable;
            return (
              <button
                key={item.id}
                type="button"
                className="command-deck__picker-item holo-button"
                onClick={() => onSelectItem?.(item)}
                disabled={entryDisabled}
                title={item.description || item.name}
              >
                <span className="command-deck__picker-item-name">
                  {item.name}
                </span>
                <span className="command-deck__picker-item-meta">
                  x{item.quantity}
                  {usable ? "" : " not usable"}
                </span>
              </button>
            );
          })
        )}
      </div>
    </section>
  );
}

