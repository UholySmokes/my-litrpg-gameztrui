import { useMemo, useState } from "react";
import { getTitleById } from "../../core/titleLogic.js";

const SLOT_LABELS = {
  weapon: "Weapon",
  armor: "Armor",
  accessory: "Accessory",
  title: "Title",
};
const EMPTY_INVENTORY = Object.freeze([]);

const normalizeText = (value) => String(value || "").toLowerCase();

export default function EquipmentSelectionPanel({
  player,
  slotKey,
  onEquipItem,
  onUnequipItem,
  onEquipTitle,
  onUnequipTitle,
}) {
  const [query, setQuery] = useState("");
  const label = SLOT_LABELS[slotKey] || "Item";
  const inventory = Array.isArray(player?.inventory) ? player.inventory : EMPTY_INVENTORY;
  const equipment = player?.equipment || {};

  const equippedItem =
    slotKey === "title"
      ? (() => {
          const equippedTitleId =
            typeof player?.equippedTitle === "string"
              ? player.equippedTitle
              : null;
          const titleData = equippedTitleId
            ? getTitleById(equippedTitleId)
            : null;
          if (titleData) return { id: titleData.id, name: titleData.name };
          if (player?.title) return { id: "legacy_title", name: player.title };
          return null;
        })()
      : equipment?.[slotKey] || null;

  const availableOptions = useMemo(() => {
    const q = normalizeText(query.trim());
    if (!slotKey) return [];

    if (slotKey === "title") {
      const unlocked =
        player?.unlockedTitles || player?.titles || [];
      const titleIds = Array.isArray(unlocked) ? unlocked : [];
      return titleIds
        .map((id) => getTitleById(id) || { id, name: id })
        .filter((title) => {
          if (!q) return true;
          const name = normalizeText(title?.name || title?.id);
          return name.includes(q);
        })
        .sort((a, b) =>
          String(a?.name || "").localeCompare(String(b?.name || "")),
        );
    }

    return inventory
      .filter(
        (item) =>
          item &&
          (item.type === "equipment" || item.equipSlot) &&
          item.equipSlot === slotKey,
      )
      .filter((item) => {
        if (!q) return true;
        const name = normalizeText(item?.name || item?.id);
        const desc = normalizeText(item?.description);
        return name.includes(q) || desc.includes(q);
      })
      .sort((a, b) =>
        String(a?.name || "").localeCompare(String(b?.name || "")),
      );
  }, [inventory, player?.titles, player?.unlockedTitles, query, slotKey]);

  const handleEquip = (item) => {
    if (slotKey === "title") {
      onEquipTitle?.(item?.id);
      return;
    }
    if (!item) return;
    onEquipItem?.(slotKey, item);
  };

  const handleUnequip = () => {
    if (slotKey === "title") {
      onUnequipTitle?.();
      return;
    }
    onUnequipItem?.(slotKey);
  };

  return (
    <div className="equipment-select">
      <div className="equipment-select__header">
        <div className="command-deck__panel-title">
          Select {label}
        </div>
        <input
          type="text"
          className="equipment-select__search"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          aria-label={`Filter ${label.toLowerCase()} options`}
        />
      </div>

      <div className="equipment-select__equipped">
        <div className="equipment-select__equipped-label">Equipped</div>
        {equippedItem ? (
          <div className="equipment-select__equipped-row">
            <span>{equippedItem.name || equippedItem.id}</span>
            <button
              type="button"
              className="holo-button"
              onClick={handleUnequip}
            >
              Unequip
            </button>
          </div>
        ) : (
          <div style={{ color: "var(--text-dim)" }}>None equipped.</div>
        )}
      </div>

      <div className="equipment-select__list">
        {availableOptions.length === 0 ? (
          <div style={{ color: "var(--text-dim)" }}>
            No available {label.toLowerCase()}s.
          </div>
        ) : (
          <ul className="equipment-select__items">
            {availableOptions.map((item, index) => {
              const quantity = Number.isFinite(item?.quantity)
                ? item.quantity
                : 1;
              return (
                <li
                  key={`${item?.id || item?.name}-${index}`}
                  className="equipment-select__item"
                >
                  <div>
                    <div className="equipment-select__item-title">
                      {item?.name || item?.id}
                      {quantity > 1 && (
                        <span className="equipment-select__item-qty">
                          x{quantity}
                        </span>
                      )}
                    </div>
                    {item?.description && (
                      <div className="equipment-select__item-desc">
                        {item.description}
                      </div>
                    )}
                  </div>
                  <button
                    type="button"
                    className="holo-button"
                    onClick={() => handleEquip(item)}
                  >
                    Equip
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
}
