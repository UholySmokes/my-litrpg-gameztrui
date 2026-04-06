import { DataRegistry } from "../data/DataRegistry.js";
import { processEnemyTurns } from "../systems/combat/CombatSystem.js";
import { handleAttack } from "./actions/attackHandler.js";
import { handleRest } from "./actions/restHandler.js";
import { handleMove } from "./actions/moveHandler.js";
import { handleEscape } from "./actions/escapeHandler.js";
import {
  processTimeEffects,
  advanceWorldTimeAndWeather,
} from "../systems/world/TimeSystem.js";
import { withTraceSpan } from "../observability/traceShim.js";
import {
  magicSense,
  magicAttune,
  magicDraw,
  magicRefine,
  magicCompress,
  magicAnchor,
  magicShape,
  magicWeave,
  magicPurge,
  magicRelease,
  processEssenceEcologyTurn,
} from "../systems/magic/EssenceWeavingSystem.js";
import {
  buildCombatMagicSkill,
  castMagic,
  castPreparedMagic,
  prepareMagic,
  senseMagic,
  stabilizeMagic,
  sustainMagic,
  translateLegacyMagicAction,
} from "../systems/magic/UnifiedMagicSystem.js";
import { hasCreationPerk } from "./creationPerks.js";
import {
  executeDevourerDigest,
  executeDevourerRefine,
  executeDevourerPurge,
} from "../systems/archetype/devourerCore.js";

const isLayerDEnabled = (state) => {
  const rollout =
    state?.config?.magicRollout &&
    typeof state.config.magicRollout === "object" &&
    !Array.isArray(state.config.magicRollout)
      ? state.config.magicRollout
      : null;
  if (!rollout) return true;
  if (typeof rollout.layerD === "boolean") return rollout.layerD;
  if (typeof rollout.layerD === "number") return rollout.layerD !== 0;
  if (typeof rollout.layerD === "string") {
    const normalized = rollout.layerD.trim().toLowerCase();
    if (["false", "0", "no", "off", "disabled"].includes(normalized)) return false;
    if (["true", "1", "yes", "on", "enabled"].includes(normalized)) return true;
  }
  return true;
};

/**
 * Executes an action and returns the result
 * This is the main dispatcher that routes actions to appropriate logic functions
 * @param {object} state - The current game state object
 * @param {object} action - The action object from InputParser
 * @returns {object} Result object with success flag, new state, and description
 */
export function executeAction(state, action, _options = {}) {
  return withTraceSpan(
    "core.executeAction",
    {
      "game.action.type": action?.type ? String(action.type) : "unknown",
    },
    () => {
      void _options;
      if (!action || !action.type) {
        return {
          success: false,
          reason: "Invalid action",
          state,
        };
      }

      if (!state?.player) {
        return {
          success: false,
          reason:
            "Player data unavailable. Complete character setup before issuing commands.",
          state,
        };
      }

      let newState = state;
      let description = "";
      const changes = {};
      let incrementsTurn = true;

      switch (action.type) {
        case "magic_prepare": {
          const result = prepareMagic(state, action);
          if (result && result.ok === false) {
            return { success: false, reason: result.reason, state: result.state || state };
          }
          newState = result.state || state;
          description = result.description || "Prepared magic";
          break;
        }

        case "magic_cast": {
          const inCombat = state.combat?.status === "active";
          if (inCombat) {
            const combatMagic = buildCombatMagicSkill(state, action);
            if (!combatMagic.ok) {
              return { success: false, reason: combatMagic.reason, state };
            }
            const attackResult = handleAttack(state, {
              type: "attack",
              enemyIndex: action.enemyIndex !== undefined ? action.enemyIndex : 0,
              skillId: combatMagic.syntheticSkill,
            });
            if (attackResult.earlyReturn) return attackResult.earlyReturn;
            newState = attackResult.newState;
            description = `Cast ${combatMagic.syntheticSkill.name}`;
            Object.assign(changes, attackResult.changes, {
              magicCast: combatMagic.syntheticSkill.name,
            });
            incrementsTurn = false;
            break;
          }

          const result = castMagic(state, action);
          if (result && result.ok === false) {
            return { success: false, reason: result.reason, state: result.state || state };
          }
          newState = result.state || state;
          description = result.description || "Cast magic";
          break;
        }

        case "magic_sustain": {
          const result = sustainMagic(state, action);
          if (result && result.ok === false) {
            return { success: false, reason: result.reason, state: result.state || state };
          }
          newState = result.state || state;
          description = result.description || "Sustained magic";
          break;
        }

        case "magic_stabilize": {
          const result = stabilizeMagic(state, action);
          if (result && result.ok === false) {
            return { success: false, reason: result.reason, state: result.state || state };
          }
          newState = result.state || state;
          description = result.description || "Stabilized magic";
          incrementsTurn = false;
          break;
        }

        case "magic_sense": {
          const result = senseMagic(state, action);
          return {
            success: true,
            description: result.description || "Sensed essence",
            state: result.state || state,
            readOnly: true,
          };
        }

        case "magic_attune": {
          const result = stabilizeMagic(state, translateLegacyMagicAction(action));
          newState = result.state || state;
          description = result.description || "Attuned";
          incrementsTurn = false;
          break;
        }

        case "magic_draw": {
          const result = magicDraw(state, action);
          if (result && result.ok === false) {
            return { success: false, reason: result.reason, state: result.state || state };
          }
          newState = result.state || state;
          description = result.description || "Drew essence";
          break;
        }

        case "magic_refine": {
          const result = magicRefine(state, action);
          if (result && result.ok === false) {
            return { success: false, reason: result.reason, state: result.state || state };
          }
          newState = result.state || state;
          description = result.description || "Refined essence";
          break;
        }

        case "magic_compress": {
          const result = magicCompress(state, action);
          if (result && result.ok === false) {
            return { success: false, reason: result.reason, state: result.state || state };
          }
          newState = result.state || state;
          description = result.description || "Compressed essence";
          break;
        }

        case "magic_anchor": {
          const result = magicAnchor(state, action);
          newState = result.state || state;
          description = result.description || "Anchored";
          incrementsTurn = false;
          break;
        }

        case "magic_purge": {
          const result = magicPurge(state, action);
          if (result && result.ok === false) {
            return { success: false, reason: result.reason, state: result.state || state };
          }
          newState = result.state || state;
          description = result.description || "Purged contamination";
          break;
        }

        case "magic_shape": {
          const result = prepareMagic(state, translateLegacyMagicAction(action));
          if (result && result.ok === false) {
            return { success: false, reason: result.reason, state: result.state || state };
          }
          newState = result.state || state;
          description = result.description || "Prepared magic";
          break;
        }

        case "magic_weave": {
          const result = prepareMagic(state, translateLegacyMagicAction(action));
          if (result && result.ok === false) {
            return { success: false, reason: result.reason, state: result.state || state };
          }
          newState = result.state || state;
          description = result.description || "Prepared weave";
          break;
        }

        case "magic_study": {
          const magic = state.player?.magic || {};
          const target = action.target || "unknown";
          const journal = Array.isArray(magic.journal) ? magic.journal : [];
          const turn = state.world?.turnCount || 0;
          const entry = {
            turn,
            topic: `study_${target.replace(/\s+/g, "_")}`,
            target,
            method: "observation",
            result: "recorded",
            notes: `Studied ${target} at turn ${turn}.`,
          };
          const nextJournal = [...journal, entry].slice(-50);
          newState = {
            ...state,
            player: {
              ...state.player,
              magic: { ...magic, journal: nextJournal },
            },
          };
          description = `Studied ${target} — observation logged in magic journal.`;
          break;
        }

        case "magic_journal": {
          const magic = state.player?.magic || {};
          const journal = Array.isArray(magic.journal) ? magic.journal : [];
          const turn = state.world?.turnCount || 0;
          if (action.note) {
            const entry = {
              turn,
              topic: "player_note",
              target: null,
              method: "manual",
              result: "noted",
              notes: action.note,
            };
            const nextJournal = [...journal, entry].slice(-50);
            newState = {
              ...state,
              player: {
                ...state.player,
                magic: { ...magic, journal: nextJournal },
              },
            };
            description = `Journal updated: "${action.note}"`;
          } else {
            const count = journal.length;
            description = count > 0
              ? `Magic journal has ${count} entries. Latest: ${journal[count - 1]?.notes || "(empty)"}`
              : "Magic journal is empty.";
            newState = state;
          }
          incrementsTurn = false;
          break;
        }

        case "devourer_digest": {
          const result = executeDevourerDigest(state, action);
          if (result && result.ok === false) {
            return { success: false, reason: result.reason, state: result.state || state };
          }
          newState = result.state || state;
          description = result.description || "Digested prey sample";
          break;
        }

        case "devourer_refine": {
          const result = executeDevourerRefine(state, action);
          if (result && result.ok === false) {
            return { success: false, reason: result.reason, state: result.state || state };
          }
          newState = result.state || state;
          description = result.description || "Refined adaptation";
          break;
        }

        case "devourer_purge": {
          const result = executeDevourerPurge(state);
          if (result && result.ok === false) {
            return { success: false, reason: result.reason, state: result.state || state };
          }
          newState = result.state || state;
          description = result.description || "Purged devourer taint";
          break;
        }

        case "magic_release": {
          const translated = translateLegacyMagicAction(action);
          const inCombat = state.combat?.status === "active";
          if (inCombat) {
            const combatMagic = buildCombatMagicSkill(state, translated);
            if (!combatMagic.ok) {
              return { success: false, reason: combatMagic.reason, state };
            }
            const attackResult = handleAttack(state, {
              type: "attack",
              enemyIndex: action.enemyIndex !== undefined ? action.enemyIndex : 0,
              skillId: combatMagic.syntheticSkill,
            });
            if (attackResult.earlyReturn) return attackResult.earlyReturn;
            newState = attackResult.newState;
            description = `Cast ${combatMagic.syntheticSkill.name}`;
            Object.assign(changes, attackResult.changes, {
              magicCast: combatMagic.syntheticSkill.name,
            });
            incrementsTurn = false;
          } else {
            const result = castPreparedMagic(state, translated);
            if (result && result.ok === false) {
              return { success: false, reason: result.reason, state: result.state || state };
            }
            newState = result.state || state;
            description = result.description || "Released";
          }
          break;
        }

        case "use_item": {
          // Validate item exists and is consumable
          const item = DataRegistry.getItemById(action.itemId);
          if (!item || item.type !== "consumable") {
            return {
              success: false,
              reason: `Cannot use ${action.itemName || action.itemId}`,
              state,
            };
          }

          const inventory = [...(state.player.inventory || [])];
          const itemIndex = inventory.findIndex((i) => i.id === action.itemId);
          if (itemIndex === -1) {
            return {
              success: false,
              reason: `You don't have ${action.itemName || action.itemId}`,
              state,
            };
          }

          const player = state.player;
          let nextPlayer = { ...player };
          const consumablePotencyMult = hasCreationPerk(player, "iron_stomach") ? 1.1 : 1;

          // Apply effects with clamping
          if (item.effect?.heal) {
            const baseHeal = Number(item.effect.heal);
            const healAmount =
              Number.isFinite(baseHeal) && baseHeal > 0 && consumablePotencyMult !== 1
                ? Math.ceil(baseHeal * consumablePotencyMult - 1e-9)
                : baseHeal;
            const currentHp =
              typeof player.hp === "object" && player.hp !== null
                ? player.hp.current ?? 0
                : player.hp ?? 0;
            const maxHp =
              typeof player.hp === "object" && player.hp !== null
                ? player.hp.max ?? 100
                : player.maxHp ?? player.maxHealth ?? 100;
            const nextHp = Math.min(maxHp, currentHp + healAmount);
            nextPlayer = {
              ...nextPlayer,
              hp:
                typeof player.hp === "object" && player.hp !== null
                  ? { ...player.hp, current: nextHp }
                  : nextHp,
            };
            changes.hp =
              typeof player.hp === "object" && player.hp !== null
                ? { ...player.hp, current: nextHp, max: maxHp }
                : { current: nextHp, max: maxHp };
          }

          if (item.effect?.mana) {
            const baseMana = Number(item.effect.mana);
            const manaAmount =
              Number.isFinite(baseMana) && baseMana > 0 && consumablePotencyMult !== 1
                ? Math.ceil(baseMana * consumablePotencyMult - 1e-9)
                : baseMana;
            const currentMana =
              typeof player.mana === "object" && player.mana !== null
                ? player.mana.current ?? 0
                : player.mana ?? 0;
            const maxMana =
              typeof player.mana === "object" && player.mana !== null
                ? player.mana.max ?? 100
                : player.maxMana ?? 100;
            const nextMana = Math.min(maxMana, currentMana + manaAmount);
            nextPlayer = {
              ...nextPlayer,
              mana:
                typeof player.mana === "object" && player.mana !== null
                  ? { ...player.mana, current: nextMana }
                  : nextMana,
            };
            changes.mana =
              typeof player.mana === "object" && player.mana !== null
                ? { ...player.mana, current: nextMana, max: maxMana }
                : { current: nextMana, max: maxMana };
          }

          // Remove item from inventory
          const existing = inventory[itemIndex] || { quantity: 1 };
          if ((existing.quantity || 1) > 1) {
            inventory[itemIndex] = {
              ...existing,
              quantity: (existing.quantity || 1) - 1,
            };
          } else {
            inventory.splice(itemIndex, 1);
          }

          newState = {
            ...state,
            player: {
              ...nextPlayer,
              inventory,
            },
          };

          description = `Used ${action.itemName || action.itemId}`;
          changes.itemUsed = action.itemName || action.itemId;
          break;
        }

        case "move": {
          const moveResult = handleMove(state, action);
          if (moveResult.earlyReturn) return moveResult.earlyReturn;
          newState = moveResult.newState;
          description = moveResult.description;
          Object.assign(changes, moveResult.changes);
          if (moveResult.incrementsTurn === false) incrementsTurn = false;
          break;
        }

        case "attack": {
          const attackResult = handleAttack(state, action);
          if (attackResult.earlyReturn) return attackResult.earlyReturn;
          newState = attackResult.newState;
          description = attackResult.description;
          Object.assign(changes, attackResult.changes);
          break;
        }

        case "escape": {
          const escapeResult = handleEscape(state, action);
          if (escapeResult.earlyReturn) return escapeResult.earlyReturn;
          newState = escapeResult.newState;
          description = escapeResult.description;
          Object.assign(changes, escapeResult.changes);
          if (escapeResult.incrementsTurn === false) incrementsTurn = false;
          break;
        }

        case "rest": {
          const restResult = handleRest(state, action);
          if (restResult.earlyReturn) return restResult.earlyReturn;
          newState = restResult.newState;
          description = restResult.description;
          Object.assign(changes, restResult.changes);
          break;
        }

        case "look":
        case "inventory":
          // These are read-only actions, no state change
          return {
            success: true,
            description: `Viewed ${action.type}`,
            state: state,
            readOnly: true,
          };

        case "status":
          // Status action - display character status
          return {
            success: true,
            description: "Status displayed",
            state: state,
            readOnly: true,
            showStatus: true, // Flag to show status block
          };

        case "narrative":
          // Narrative actions don't change game state
          return {
            success: true,
            description: action.originalInput || "Explored",
            state: state,
            readOnly: true,
          };

        default:
          return {
            success: false,
            reason: `Unknown action type: ${action.type}`,
            state: state,
          };
      }

      if (
        newState.combat?.status === "active" &&
        newState.combat.turn === "player" &&
        !action.readOnly &&
        incrementsTurn &&
        action.type !== "attack"
      ) {
        newState = {
          ...newState,
          combat: {
            ...newState.combat,
            turn: "enemy",
          },
        };
        newState = processEnemyTurns(newState);
      }

      // Increment turn count for state-changing actions
      if (!action.readOnly && incrementsTurn) {
        const nextTurnCount = (newState.world?.turnCount || 0) + 1;
        newState = {
          ...newState,
          world: {
            ...(newState.world || {}),
            turnCount: nextTurnCount,
          },
        };

        newState = advanceWorldTimeAndWeather(newState, { turns: 1 });
        newState = processEssenceEcologyTurn(newState);

        // Apply passive time-based effects (mana regen, race abilities)
        // when not in active combat (combat handles this via processEnemyTurns)
        if (newState.combat?.status !== "active") {
          newState = processTimeEffects(newState);
        }
      }

      return {
        success: true,
        description: description || "Action completed",
        state: newState,
        changes: Object.keys(changes).length > 0 ? changes : undefined,
      };
    },
  );
}
