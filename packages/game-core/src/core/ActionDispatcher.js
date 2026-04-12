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
  applySkillProgressionAction,
  buildCombatAbilitySkill,
  executeAbilityAction,
  processAbilityEcologyTurn,
  syncPlayerAbilityState,
} from "../systems/abilities/UnifiedAbilityEngine.js";
import { randomBool, randomChoice, randomInt } from "../utils/DeterministicRandom.js";
import { hasCreationPerk } from "./creationPerks.js";
import {
  executeDevourerDigest,
  executeDevourerRefine,
  executeDevourerPurge,
} from "../systems/archetype/devourerCore.js";

const clamp = (value, min, max) => Math.max(min, Math.min(max, value));

function pushUnique(list, value) {
  const next = Array.isArray(list) ? [...list] : [];
  if (!value) return next;
  if (!next.includes(value)) next.push(value);
  return next;
}

function normalizeStringList(list) {
  if (!Array.isArray(list)) return [];
  return list.map((entry) => String(entry || "").trim().toLowerCase()).filter(Boolean);
}

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
          const result = executeAbilityAction(state, action);
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
            const combatMagic = buildCombatAbilitySkill(state, action);
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

          const result = executeAbilityAction(state, action);
          if (result && result.ok === false) {
            return { success: false, reason: result.reason, state: result.state || state };
          }
          newState = result.state || state;
          description = result.description || "Cast magic";
          break;
        }

        case "magic_sustain": {
          const result = executeAbilityAction(state, action);
          if (result && result.ok === false) {
            return { success: false, reason: result.reason, state: result.state || state };
          }
          newState = result.state || state;
          description = result.description || "Sustained magic";
          break;
        }

        case "magic_stabilize": {
          const result = executeAbilityAction(state, action);
          if (result && result.ok === false) {
            return { success: false, reason: result.reason, state: result.state || state };
          }
          newState = result.state || state;
          description = result.description || "Stabilized magic";
          incrementsTurn = false;
          break;
        }

        case "magic_sense": {
          const result = executeAbilityAction(state, action);
          return {
            success: true,
            description: result.description || "Sensed essence",
            state: result.state || state,
            readOnly: true,
          };
        }

        case "magic_attune": {
          const result = executeAbilityAction(state, action);
          newState = result.state || state;
          description = result.description || "Attuned";
          incrementsTurn = false;
          break;
        }

        case "magic_draw": {
          const result = executeAbilityAction(state, action);
          if (result && result.ok === false) {
            return { success: false, reason: result.reason, state: result.state || state };
          }
          newState = result.state || state;
          description = result.description || "Drew essence";
          break;
        }

        case "magic_refine": {
          const result = executeAbilityAction(state, action);
          if (result && result.ok === false) {
            return { success: false, reason: result.reason, state: result.state || state };
          }
          newState = result.state || state;
          description = result.description || "Refined essence";
          break;
        }

        case "magic_compress": {
          const result = executeAbilityAction(state, action);
          if (result && result.ok === false) {
            return { success: false, reason: result.reason, state: result.state || state };
          }
          newState = result.state || state;
          description = result.description || "Compressed essence";
          break;
        }

        case "magic_anchor": {
          const result = executeAbilityAction(state, action);
          newState = result.state || state;
          description = result.description || "Anchored";
          incrementsTurn = false;
          break;
        }

        case "magic_purge": {
          const result = executeAbilityAction(state, action);
          if (result && result.ok === false) {
            return { success: false, reason: result.reason, state: result.state || state };
          }
          newState = result.state || state;
          description = result.description || "Purged contamination";
          break;
        }

        case "magic_shape": {
          const result = executeAbilityAction(state, action);
          if (result && result.ok === false) {
            return { success: false, reason: result.reason, state: result.state || state };
          }
          newState = result.state || state;
          description = result.description || "Prepared magic";
          break;
        }

        case "magic_weave": {
          const result = executeAbilityAction(state, action);
          if (result && result.ok === false) {
            return { success: false, reason: result.reason, state: result.state || state };
          }
          newState = result.state || state;
          description = result.description || "Prepared weave";
          break;
        }

        case "magic_study": {
          let workingState = state;
          const rawTarget =
            typeof action.target === "string" && action.target.trim()
              ? action.target.trim().toLowerCase()
              : "unknown";
          const turn = state.world?.turnCount || 0;

          const baselineMagic = workingState.player?.magic || {};
          const baselineGrammar = baselineMagic.grammar || {};
          const knownEssences = new Set([
            ...normalizeStringList(baselineGrammar.essences),
            ...normalizeStringList(Object.keys(baselineMagic.affinities || {})),
          ]);
          const knownForms = new Set(normalizeStringList(baselineGrammar.forms));

          const tokens = rawTarget.split(/\s+/).filter(Boolean);
          const isSpellStudy =
            tokens[0] === "spell" ||
            tokens.includes("spell") ||
            tokens.includes("buildup") ||
            tokens.includes("buildups");
          const isRuneStudy =
            tokens.includes("rune") ||
            tokens.includes("runes") ||
            tokens.includes("symbol") ||
            tokens.includes("symbols");
          const isInscriptionStudy =
            tokens.includes("inscription") ||
            tokens.includes("inscriptions") ||
            tokens.includes("glyph") ||
            tokens.includes("text");
          const isPhenomenaStudy =
            tokens.includes("phenomena") ||
            tokens.includes("phenomenon") ||
            tokens.includes("leyline") ||
            tokens.includes("storm") ||
            tokens.includes("tide") ||
            tokens.includes("mirage");
          const isEpiphanyStudy =
            tokens.includes("epiphany") || tokens.includes("insight");

          let requestedEssence = null;
          let requestedForm = null;
          if (tokens[0] === "spell") {
            const maybeEssence = tokens[1] || null;
            const maybeForm = tokens[2] || null;
            if (maybeEssence && knownEssences.has(maybeEssence)) requestedEssence = maybeEssence;
            if (maybeForm && knownForms.has(maybeForm)) requestedForm = maybeForm;

            // Allow "study spell lance" (form-only) without misclassifying it as an essence.
            if (!requestedEssence && !requestedForm && maybeEssence && knownForms.has(maybeEssence)) {
              requestedForm = maybeEssence;
            }
          } else if (isSpellStudy) {
            requestedEssence = tokens.find((token) => knownEssences.has(token)) || null;
            requestedForm = tokens.find((token) => knownForms.has(token)) || null;
          }

          let recipeUnlocked = false;
          if (isSpellStudy) {
            const progressed = applySkillProgressionAction(workingState, {
              type: "STUDY_SPELL",
              payload: {
                essence: requestedEssence,
                form: requestedForm,
              },
            });
            if (progressed) {
              workingState = progressed;
              recipeUnlocked = true;
            }
          }

          const magic = workingState.player?.magic || {};
          const journal = Array.isArray(magic.journal) ? magic.journal : [];
          const unlocked = [];
          const nextMagic = { ...magic };

          // Baseline: study costs focus (strain), with a chance of calm insight.
          const strainMax = Number.isFinite(magic.strain?.max) ? magic.strain.max : 100;
          const strainCurrent = Number.isFinite(magic.strain?.current) ? magic.strain.current : 0;
          const strainDelta = isEpiphanyStudy ? randomInt(0, 1) : randomInt(1, 3);
          nextMagic.strain = {
            ...(magic.strain || {}),
            current: clamp(strainCurrent + strainDelta, 0, strainMax),
            max: strainMax,
            state: magic.strain?.state || "steady",
          };

          if (magic.resonance) {
            const resonanceMax = Number.isFinite(magic.resonance?.max) ? magic.resonance.max : 100;
            const resonanceCurrent = Number.isFinite(magic.resonance?.current) ? magic.resonance.current : 0;
            const resonanceDelta = isEpiphanyStudy ? randomInt(2, 6) : randomInt(0, 2);
            nextMagic.resonance = {
              ...(magic.resonance || {}),
              current: clamp(resonanceCurrent + resonanceDelta, 0, resonanceMax),
              max: resonanceMax,
              state: magic.resonance?.state || "quiet",
            };
          }

          const grammar = { ...(magic.grammar || {}) };
          const grammarPatterns = { ...(grammar.patterns || {}) };
          const shapePatterns = normalizeStringList(grammarPatterns.shape);
          const weavePatterns = normalizeStringList(grammarPatterns.weave);
          const deliveries = normalizeStringList(grammar.deliveries);
          let essences = normalizeStringList(grammar.essences);
          let forms = normalizeStringList(grammar.forms);

          const affinityTarget =
            requestedEssence ||
            essences[0] ||
            (typeof magic.attunement?.focusedEssence === "string"
              ? magic.attunement.focusedEssence
              : null);
          if (affinityTarget) {
            const nextAffinities = { ...(magic.affinities || {}) };
            const current = Number(nextAffinities[affinityTarget]) || 0;
            const gain = isEpiphanyStudy ? randomInt(1, 3) : randomInt(0, 2);
            nextAffinities[affinityTarget] = current + gain;
            nextMagic.affinities = nextAffinities;
            if (gain > 0) unlocked.push(`affinity +${gain} (${affinityTarget})`);
          }

          if (isRuneStudy) {
            const unlockPool = ["lance", "cone", "veil", "vortex"];
            if (randomBool(isEpiphanyStudy ? 0.65 : 0.35)) {
              const next = randomChoice(unlockPool.filter((p) => !shapePatterns.includes(p)));
              if (next) {
                const nextShape = pushUnique(shapePatterns, next);
                grammarPatterns.shape = nextShape;
                nextMagic.unlockedPatterns = {
                  ...(nextMagic.unlockedPatterns || {}),
                  shape: nextShape,
                  weave: Array.isArray(nextMagic.unlockedPatterns?.weave)
                    ? nextMagic.unlockedPatterns.weave
                    : weavePatterns,
                };
                unlocked.push(`pattern:${next}`);
              }
            }
          }

          if (isInscriptionStudy) {
            const deliveryPool = ["instant", "sustained", "channeled"];
            const formPool = ["lance", "cone", "wall", "veil", "vortex", "lattice"];

            if (randomBool(isEpiphanyStudy ? 0.55 : 0.25)) {
              const nextDelivery = randomChoice(deliveryPool.filter((d) => !deliveries.includes(d)));
              if (nextDelivery) {
                deliveries.push(nextDelivery);
                unlocked.push(`delivery:${nextDelivery}`);
              }
            }

            if (randomBool(isEpiphanyStudy ? 0.55 : 0.25)) {
              const nextForm = randomChoice(formPool.filter((f) => !forms.includes(f)));
              if (nextForm) {
                forms.push(nextForm);
                unlocked.push(`form:${nextForm}`);
              }
            }

            if (magic.interference) {
              const score = Number.isFinite(magic.interference?.score) ? magic.interference.score : 0;
              nextMagic.interference = {
                ...(magic.interference || {}),
                score: clamp(score - 0.02, 0, 1),
              };
            }
          }

          if (isPhenomenaStudy) {
            const essencePool = [
              "lightning",
              "shadow",
              "light",
              "life",
              "creation",
              "destruction",
              "space",
              "time",
            ];
            if (randomBool(isEpiphanyStudy ? 0.45 : 0.18)) {
              const nextEssence = randomChoice(essencePool.filter((e) => !essences.includes(e)));
              if (nextEssence) {
                essences.push(nextEssence);
                unlocked.push(`essence:${nextEssence}`);
              }
            }
          }

          // Ensure core spell-study keys show up as part of grammar even if the action inferred them.
          if (requestedEssence) essences = pushUnique(essences, requestedEssence);
          if (requestedForm) forms = pushUnique(forms, requestedForm);

          nextMagic.grammar = {
            ...grammar,
            essences,
            forms,
            deliveries,
            patterns: {
              shape: Array.isArray(grammarPatterns.shape) ? grammarPatterns.shape : shapePatterns,
              weave: Array.isArray(grammarPatterns.weave) ? grammarPatterns.weave : weavePatterns,
            },
          };

          const method = isSpellStudy
            ? "spell_study"
            : isRuneStudy
              ? "rune_analysis"
              : isInscriptionStudy
                ? "inscription_decoding"
                : isEpiphanyStudy
                  ? "epiphany"
                  : "observation";
          const notes = [
            `Studied ${rawTarget} at turn ${turn}.`,
            recipeUnlocked ? "A stable spell recipe crystallized." : null,
            unlocked.length > 0 ? `Unlocked: ${unlocked.join(", ")}.` : null,
          ]
            .filter(Boolean)
            .join(" ");

          const entry = {
            turn,
            topic: `study_${rawTarget.replace(/\s+/g, "_")}`,
            target: rawTarget,
            method,
            result: recipeUnlocked ? "breakthrough" : unlocked.length > 0 ? "unlocked" : "recorded",
            notes,
          };

          nextMagic.journal = [...journal, entry].slice(-50);

          newState = {
            ...workingState,
            player: syncPlayerAbilityState(
              {
                ...workingState.player,
                magic: nextMagic,
              },
              {
                ...(workingState.player?.abilityState || {}),
                families: {
                  ...(workingState.player?.abilityState?.families || {}),
                  magic: nextMagic,
                },
              },
            ),
          };

          description = recipeUnlocked
            ? `Study complete: ${rawTarget} (recipe recorded).`
            : unlocked.length > 0
              ? `Study complete: ${rawTarget} (unlocks: ${unlocked.join(", ")}).`
              : `Studied ${rawTarget} - observation logged in magic journal.`;
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
            const nextMagic = { ...magic, journal: nextJournal };
            newState = {
              ...state,
              player: syncPlayerAbilityState(
                {
                  ...state.player,
                  magic: nextMagic,
                },
                {
                  ...(state.player?.abilityState || {}),
                  families: {
                    ...(state.player?.abilityState?.families || {}),
                    magic: nextMagic,
                  },
                },
              ),
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
          const inCombat = state.combat?.status === "active";
          if (inCombat) {
            const combatMagic = buildCombatAbilitySkill(state, action);
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
            const result = executeAbilityAction(state, action);
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

        case "dialogue":
          return {
            success: true,
            description: action.description || action.originalInput || "Spoke",
            state,
            readOnly: true,
            dialogue: {
              intent: action.intent || "speech",
              targetLabel: action.targetLabel || null,
              topic: action.topic || null,
              spokenText: action.spokenText || action.originalInput || "",
              requiresResponse: true,
            },
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
        newState = processAbilityEcologyTurn(newState);

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
        dialogue: action?.type === "dialogue"
          ? {
              intent: action.intent || "speech",
              targetLabel: action.targetLabel || null,
              topic: action.topic || null,
              spokenText: action.spokenText || action.originalInput || "",
              requiresResponse: true,
            }
          : undefined,
      };
    },
  );
}
