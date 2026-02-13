import { DataRegistry } from "../data/DataRegistry.js";
import { moveToLocation } from "../systems/exploration/ExplorationSystem.js";
import {
  startCombat,
  playerAttack,
  processEnemyTurns,
} from "../systems/combat/CombatSystem.js";
import { processTimeEffects } from "../systems/world/TimeSystem.js";
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
        case "magic_sense": {
          const result = magicSense(state, action);
          return {
            success: true,
            description: result.description || "Sensed essence",
            state: result.state || state,
            readOnly: true,
          };
        }

        case "magic_attune": {
          const result = magicAttune(state, action);
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
          const result = magicShape(state, action);
          if (result && result.ok === false) {
            return { success: false, reason: result.reason, state: result.state || state };
          }
          newState = result.state || state;
          description = result.description || "Shaped";
          break;
        }

        case "magic_weave": {
          const result = magicWeave(state, action);
          if (result && result.ok === false) {
            return { success: false, reason: result.reason, state: result.state || state };
          }
          newState = result.state || state;
          description = result.description || "Wove";
          break;
        }

        case "magic_release": {
          const prepared = state.player?.magic?.prepared;
          const isInCombat = state.combat?.status === "active";
          const casting = state.player?.magic?.casting;
          const layerD = isLayerDEnabled(state);

          if (layerD && isInCombat && prepared) {
            const anchored = Boolean(
              state.player?.magic?.anchors?.self ||
                state.player?.magic?.anchors?.area ||
                state.player?.magic?.anchors?.itemId,
            );

            if (casting && typeof casting === "object") {
              const remaining = Math.max(0, Math.floor(Number(casting.remainingTurns || 0)) - 1);
              if (remaining > 0) {
                newState = {
                  ...state,
                  player: {
                    ...state.player,
                    magic: {
                      ...state.player.magic,
                      casting: { ...casting, remainingTurns: remaining },
                    },
                  },
                };
                description = `You continue casting... (${remaining} turns)`;
              } else {
                const withoutCasting = {
                  ...state,
                  player: {
                    ...state.player,
                    magic: {
                      ...state.player.magic,
                      casting: null,
                    },
                  },
                };
                const result = magicRelease(withoutCasting, action);
                if (result && result.ok === false) {
                  return { success: false, reason: result.reason, state: result.state || state };
                }
                newState = result.state || state;
                description = result.description || "Released";
              }
            } else {
              const baseTurns = prepared.kind === "weave" ? 2 : 1;
              const reduced = anchored ? Math.max(0, baseTurns - 1) : baseTurns;
              if (reduced <= 0) {
                const result = magicRelease(state, action);
                if (result && result.ok === false) {
                  return { success: false, reason: result.reason, state: result.state || state };
                }
                newState = result.state || state;
                description = result.description || "Released";
              } else {
                newState = {
                  ...state,
                  player: {
                    ...state.player,
                    magic: {
                      ...state.player.magic,
                      casting: {
                        kind: "release",
                        preparedKind: prepared.kind,
                        remainingTurns: reduced,
                        anchored,
                        startedTurn: state.world?.turnCount || 0,
                      },
                    },
                  },
                };
                description = `You begin casting... (${reduced} turns)`;
              }
            }
          } else {
            const result = magicRelease(state, action);
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

          // Apply effects with clamping
          if (item.effect?.heal) {
            const currentHp =
              typeof player.hp === "object" && player.hp !== null
                ? player.hp.current ?? 0
                : player.hp ?? 0;
            const maxHp =
              typeof player.hp === "object" && player.hp !== null
                ? player.hp.max ?? 100
                : player.maxHp ?? player.maxHealth ?? 100;
            const nextHp = Math.min(maxHp, currentHp + item.effect.heal);
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
            const currentMana =
              typeof player.mana === "object" && player.mana !== null
                ? player.mana.current ?? 0
                : player.mana ?? 0;
            const maxMana =
              typeof player.mana === "object" && player.mana !== null
                ? player.mana.max ?? 100
                : player.maxMana ?? 100;
            const nextMana = Math.min(maxMana, currentMana + item.effect.mana);
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

        case "move":
          if (action.targetLocation) {
            newState = moveToLocation(state, action.targetLocation);
            description = `Moved to ${action.targetLocation}`;
            changes.location = action.targetLocation;
            incrementsTurn = false; // moveToLocation already increments turnCount
          } else {
            return {
              success: false,
              reason: "No target location specified",
              state: state,
            };
          }
          break;

        case "attack":
          // If not already in combat, start combat with a default encounter
          if (!state.combat || state.combat.status !== "active") {
            const enemyIds =
              action.enemyIds && action.enemyIds.length > 0
                ? action.enemyIds
                : ["goblin"];
            newState = startCombat(state, enemyIds);
            description = `Engaged combat with ${newState.combat.enemies.map((e) => e.name).join(", ")}`;
            changes.combatStarted = true;
          } else {
            const enemyIndex =
              action.enemyIndex !== undefined ? action.enemyIndex : 0;
            const result = playerAttack(
              state,
              enemyIndex,
              action.skillId || null,
            );
            if (!result.success) {
              return { success: false, reason: result.reason, state: state };
            }
            newState = processEnemyTurns(result.state);
            const targetName =
              newState.combat.enemies?.[enemyIndex]?.name || "enemy";
            description = `Attacked ${targetName}`;
            changes.damage = result.damage;
          }
          break;

        case "rest": {
          if (state.combat?.status === "active") {
            return { success: false, reason: "Cannot rest during combat", state };
          }

          const player = state.player;
          const hp =
            player.hp && typeof player.hp === "object" && player.hp !== null
              ? player.hp
              : { current: player.hp ?? 0, max: player.maxHp ?? 100 };
          const mana =
            player.mana && typeof player.mana === "object" && player.mana !== null
              ? player.mana
              : { current: player.mana ?? 0, max: player.maxMana ?? 100 };

          const config = state.config || {};
          const hpAmount = config.restHealAmount > 0
            ? config.restHealAmount
            : Math.max(5, Math.floor(hp.max * 0.25));
          const manaAmount = config.restManaAmount > 0
            ? config.restManaAmount
            : Math.max(5, Math.floor(mana.max * 0.25));

          const nextHp = Math.min(hp.max, (hp.current ?? 0) + hpAmount);
          const nextMana = Math.min(mana.max, (mana.current ?? 0) + manaAmount);

          newState = {
            ...state,
            player: {
              ...player,
              hp: { ...hp, current: nextHp },
              mana: { ...mana, current: nextMana },
            },
          };

          description = "Rested and recovered.";
          changes.hp = { current: nextHp, max: hp.max };
          changes.mana = { current: nextMana, max: mana.max };
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
