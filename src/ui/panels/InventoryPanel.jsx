import { useMemo, useState } from "react";

const TYPE_LABELS = {
  all: "All",
  equipment: "Equipment",
  consumable: "Consumables",
  material: "Materials",
  quest: "Quest",
  misc: "Misc",
};

const normalizeType = (item) => {
  if (!item) return "misc";
  if (typeof item.type === "string" && item.type.trim()) return item.type;
  if (item.equipSlot) return "equipment";
  return "misc";
};

export default function InventoryPanel({ inventory, storyHint = "" }) {
  const [query, setQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");

  const normalizedInventory = Array.isArray(inventory) ? inventory : [];
  const filteredItems = useMemo(() => {
    const q = query.trim().toLowerCase();
    return normalizedInventory.filter((item) => {
      const type = normalizeType(item);
      if (typeFilter !== "all" && type !== typeFilter) return false;
      if (!q) return true;
      const name = String(item?.name || item?.id || "").toLowerCase();
      const description = String(item?.description || "").toLowerCase();
      return name.includes(q) || description.includes(q);
    });
  }, [normalizedInventory, query, typeFilter]);

  if (!normalizedInventory.length) {
    return <div style={{ color: "var(--text-dim)" }}>Inventory empty.</div>;
  }

  return (
    <div className="inventory-panel">
      {storyHint ? (
        <div style={{ color: "var(--text-dim)", fontSize: "0.78rem" }}>{storyHint}</div>
      ) : null}
      <div className="inventory-panel__filters">
        <input
          type="text"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          className="inventory-panel__search"
          aria-label="Filter inventory items"
        />
        <select
          className="inventory-panel__select"
          value={typeFilter}
          onChange={(event) => setTypeFilter(event.target.value)}
        >
          {Object.entries(TYPE_LABELS).map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </select>
      </div>

      {filteredItems.length === 0 ? (
        <div style={{ color: "var(--text-dim)" }}>No items match this filter.</div>
      ) : (
        <ul className="inventory-panel__list">
          {filteredItems.map((item, index) => {
            const quantity = Number.isFinite(item?.quantity)
              ? item.quantity
              : 1;
            const type = normalizeType(item);
            return (
              <li
                key={`${item?.id || item?.name || "item"}-${index}`}
                className="inventory-panel__item"
              >
                <div className="inventory-panel__item-title">
                  {item?.name || item?.id || "Unknown Item"}
                  {quantity > 1 && (
                    <span className="inventory-panel__item-qty">x{quantity}</span>
                  )}
                </div>
                <div className="inventory-panel__item-meta">
                  <span>{TYPE_LABELS[type] || "Misc"}</span>
                  {item?.rarity && <span>{item.rarity}</span>}
                </div>
                {item?.description && (
                  <div className="inventory-panel__item-desc">
                    {item.description}
                  </div>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
