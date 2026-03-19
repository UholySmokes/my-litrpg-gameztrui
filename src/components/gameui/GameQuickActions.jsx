/* eslint-disable react-refresh/only-export-components */
import { useCallback, useMemo, useState } from "react";
import ActionButtons from "./ActionButtons.jsx";
import ItemPicker from "./ItemPicker.jsx";
import SkillPicker from "./SkillPicker.jsx";

const normalizeText = (value) => String(value || "").trim();

const toTitleCase = (value) => {
  const text = normalizeText(value);
  if (!text) return "";
  return text.charAt(0).toUpperCase() + text.slice(1);
};

export function getQuickActionSkills(player = {}) {
  const rawSkills = [];

  if (Array.isArray(player.activeSkills)) {
    rawSkills.push(...player.activeSkills);
  }

  if (Array.isArray(player.skills?.active)) {
    rawSkills.push(...player.skills.active);
  }

  if (Array.isArray(player.abilities)) {
    rawSkills.push(
      ...player.abilities.filter((ability) => ability?.type === "active"),
    );
  }

  const seen = new Set();

  return rawSkills
    .map((skill) => {
      if (!skill) return null;
      if (typeof skill === "string") {
        return {
          id: skill,
          name: skill,
          description: "",
        };
      }

      const id =
        normalizeText(skill.id) ||
        normalizeText(skill.skillId) ||
        normalizeText(skill.abilityId);
      if (!id) return null;

      const name = normalizeText(skill.name) || normalizeText(skill.label) || id;
      return {
        ...skill,
        id,
        name,
        description: normalizeText(skill.description),
        manaCost: Number.isFinite(skill.manaCost)
          ? skill.manaCost
          : Number.isFinite(skill.cost?.mana)
            ? skill.cost.mana
            : 0,
      };
    })
    .filter((skill) => {
      if (!skill || seen.has(skill.id)) return false;
      seen.add(skill.id);
      return true;
    })
    .slice(0, 8);
}

export function getQuickActionItems(player = {}) {
  const inventory = Array.isArray(player.inventory) ? player.inventory : [];
  return inventory
    .map((item) => {
      if (!item) return null;
      const id = normalizeText(item.id);
      if (!id) return null;
      const quantity = Math.max(1, Number(item.quantity || 1));
      const effect =
        item.effect && typeof item.effect === "object" ? item.effect : {};
      const usable =
        item.type === "consumable" ||
        Number.isFinite(effect.heal) ||
        Number.isFinite(effect.mana);
      return {
        ...item,
        id,
        name: normalizeText(item.name) || toTitleCase(id),
        quantity,
        description: normalizeText(item.description),
        usable,
      };
    })
    .filter(Boolean)
    .slice(0, 8);
}

export function getPrimaryCombatEnemyIndex(combatState = {}) {
  const enemies = Array.isArray(combatState.enemies) ? combatState.enemies : [];
  const firstLivingIndex = enemies.findIndex(
    (enemy) => Number(enemy?.stats?.hp?.current ?? 0) > 0,
  );
  return firstLivingIndex >= 0 ? firstLivingIndex : 0;
}

function runStructuredAction(submitAction, action, onFallback) {
  if (typeof submitAction === "function") {
    const result = submitAction({ kind: "action", action });
    return result;
  }

  if (typeof onFallback === "function") {
    onFallback(action);
  }

  return null;
}

export default function GameQuickActions({
  isDevBuild,
  combatState,
  onAttack,
  onEscape,
  onRest,
  onUseItem,
  onUseSkill,
  onToggleArchetypeSystem,
  onToggleCraft,
  onToggleGacha,
  onToggleQuests,
  onToggleReplayInspector,
  onToggleSaveLoad,
  onToggleShop,
  onToggleStatus,
  onToggleTitles,
  player,
  submitAction,
}) {
  const [activePicker, setActivePicker] = useState(null);

  const combatReady = combatState?.status === "active";
  const enemyIndex = useMemo(
    () => getPrimaryCombatEnemyIndex(combatState),
    [combatState],
  );
  const skills = useMemo(() => getQuickActionSkills(player), [player]);
  const items = useMemo(() => getQuickActionItems(player), [player]);

  const closePicker = useCallback(() => setActivePicker(null), []);
  const togglePicker = useCallback((pickerName) => {
    setActivePicker((current) => (current === pickerName ? null : pickerName));
  }, []);

  const handleAttack = useCallback(() => {
    const result = runStructuredAction(
      submitAction,
      {
        type: "attack",
        enemyIndex,
        originalInput: "attack",
      },
      onAttack ? () => onAttack(enemyIndex) : null,
    );

    if (result && result.ok === false && typeof onAttack === "function") {
      onAttack(enemyIndex);
    }
  }, [enemyIndex, onAttack, submitAction]);

  const handleRest = useCallback(() => {
    const result = runStructuredAction(
      submitAction,
      {
        type: "rest",
        originalInput: "rest",
      },
      onRest,
    );

    if (result && result.ok === false && typeof onRest === "function") {
      onRest();
    }
  }, [onRest, submitAction]);

  const handleEscape = useCallback(() => {
    const result = runStructuredAction(
      submitAction,
      {
        type: "escape",
        originalInput: "escape",
      },
      onEscape,
    );

    if (result && result.ok === false && typeof onEscape === "function") {
      onEscape();
    }
  }, [onEscape, submitAction]);

  const handleUseSkill = useCallback(
    (skill) => {
      if (!skill?.id) return;
      const result = runStructuredAction(
        submitAction,
        {
          type: "attack",
          skillId: skill.id,
          enemyIndex,
          originalInput: `use ${skill.name || skill.id}`,
        },
        onUseSkill ? () => onUseSkill(skill.id, enemyIndex) : null,
      );

      if (result && result.ok === false && typeof onUseSkill === "function") {
        onUseSkill(skill.id, enemyIndex);
      }

      closePicker();
    },
    [closePicker, enemyIndex, onUseSkill, submitAction],
  );

  const handleUseItem = useCallback(
    (item) => {
      if (!item?.id) return;
      const result = runStructuredAction(
        submitAction,
        {
          type: "use_item",
          itemId: item.id,
          itemName: item.name,
          originalInput: `use ${item.name || item.id}`,
        },
        onUseItem ? () => onUseItem(item.id, item.name) : null,
      );

      if (result && result.ok === false && typeof onUseItem === "function") {
        onUseItem(item.id, item.name);
      }

      closePicker();
    },
    [closePicker, onUseItem, submitAction],
  );

  const directActionDisabled = !submitAction && typeof onAttack !== "function";
  const restDisabled = !submitAction && typeof onRest !== "function";
  const escapeDisabled =
    (!submitAction && typeof onEscape !== "function") || !combatReady;
  const skillDisabled = skills.length === 0;
  const itemDisabled = items.length === 0;

  return (
    <div className="command-deck__quick-actions">
      <div className="command-deck__quick-actions-row command-deck__quick-actions-row--primary">
        <ActionButtons
          onAttack={handleAttack}
          onEscape={handleEscape}
          onRest={handleRest}
          attackDisabled={directActionDisabled}
          escapeDisabled={escapeDisabled}
          isCombatActive={combatReady}
          restDisabled={restDisabled}
        />
        <button
          type="button"
          className="holo-button command-deck__quick-action-toggle"
          onClick={() => togglePicker("skills")}
          disabled={skillDisabled}
          aria-expanded={activePicker === "skills"}
        >
          Skill
        </button>
        <button
          type="button"
          className="holo-button command-deck__quick-action-toggle"
          onClick={() => togglePicker("items")}
          disabled={itemDisabled}
          aria-expanded={activePicker === "items"}
        >
          Item
        </button>
      </div>

      {activePicker === "skills" ? (
        <SkillPicker
          skills={skills}
          onClose={closePicker}
          onSelectSkill={handleUseSkill}
          combatReady={combatReady}
          disabled={!combatReady}
        />
      ) : null}

      {activePicker === "items" ? (
        <ItemPicker
          items={items}
          onClose={closePicker}
          onSelectItem={handleUseItem}
        />
      ) : null}

      <div className="command-deck__quick-actions-row command-deck__quick-actions-row--support">
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
        <button
          type="button"
          className="holo-button"
          onClick={onToggleArchetypeSystem}
        >
          System
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
    </div>
  );
}
