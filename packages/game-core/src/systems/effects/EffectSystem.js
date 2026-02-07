// =================================================================
// EFFECT PROCESSOR
// Handles application, processing, and removal of status effects.
// =================================================================

import {
  STACKING_RULES,
  getEffectDefinition,
  EFFECT_TYPES,
} from "./EffectRegistry.js";
import { emit } from "../../core/EventBus.js";
import { random } from "../../utils/DeterministicRandom.js";

/**
 * Applies an effect to a target entity.
 * Handles stacking rules and immunity checks.
 *
 * @param {object} target - The entity receiving the effect (must have .effects array)
 * @param {string} effectId - The ID of the effect to apply
 * @param {object} source - The entity applying the effect (optional)
 * @param {object} overrides - Optional overrides for duration/magnitude
 * @returns {object} The updated target entity
 */
export function applyEffect(target, effectId, source = null, overrides = {}) {
  const def = getEffectDefinition(effectId);
  if (!def) return target;

  // Initialize effects array if missing
  const currentEffects = target.effects || [];

  // Create new effect instance
  const newInstance = {
    ...def,
    instanceId: random().toString(36).substr(2, 9),
    sourceId: source?.id || "environment",
    duration: overrides.duration ?? def.duration,
    magnitude: overrides.magnitude ?? def.magnitude,
    stacks: 1,
    remainingDuration: overrides.duration ?? def.duration,
  };

  // Check for existing instances of this effect type
  const existingIndex = currentEffects.findIndex((e) => e.id === effectId);

  let newEffects = [...currentEffects];

  if (existingIndex !== -1) {
    const existing = newEffects[existingIndex];

    switch (def.stacking) {
      case STACKING_RULES.DONT_STACK:
        // Refresh duration only
        newEffects[existingIndex] = {
          ...existing,
          remainingDuration: Math.max(
            existing.remainingDuration,
            newInstance.remainingDuration,
          ),
        };
        break;

      case STACKING_RULES.STACK_DURATION:
        // Add durations
        newEffects[existingIndex] = {
          ...existing,
          remainingDuration:
            existing.remainingDuration + newInstance.remainingDuration,
        };
        break;

      case STACKING_RULES.STACK_INTENSITY:
        // Increase stacks/magnitude
        if (!def.maxStacks || existing.stacks < def.maxStacks) {
          newEffects[existingIndex] = {
            ...existing,
            stacks: existing.stacks + 1,
            magnitude: existing.magnitude + newInstance.magnitude,
            remainingDuration: Math.max(
              existing.remainingDuration,
              newInstance.remainingDuration,
            ), // Also refresh duration usually
          };
        } else {
          // Just refresh duration if max stacks reached
          newEffects[existingIndex] = {
            ...existing,
            remainingDuration: Math.max(
              existing.remainingDuration,
              newInstance.remainingDuration,
            ),
          };
        }
        break;

      case STACKING_RULES.INDEPENDENT:
        // Just add the new instance alongside old ones
        newEffects.push(newInstance);
        break;
    }
  } else {
    // No existing effect, just add
    newEffects.push(newInstance);
  }

  const updated = {
    ...target,
    effects: newEffects,
  };
  if (def)
    emit("effect:applied", { target: updated.name, effectName: def.name });
  return updated;
}

/**
 * Processes all effects on an entity for a single turn.
 * Handles DoT ticks, duration decrement, and expiration.
 *
 * @param {object} entity - The entity to process
 * @returns {object} { entity: updatedEntity, messages: [] }
 */
export function processTurnEffects(entity) {
  if (!entity.effects || entity.effects.length === 0) {
    return { entity, messages: [], damageTaken: 0 };
  }

  let messages = [];
  let totalDotDamage = 0;
  let totalHealAmount = 0;

  // Filter out expired effects and process active ones
  const activeEffects = entity.effects
    .map((effect) => {
      // Process DoTs
      if (effect.type === EFFECT_TYPES.DOT) {
        const dmg = Math.floor(effect.magnitude);
        totalDotDamage += dmg;
        messages.push(
          `${entity.name} takes ${dmg} ${effect.element || "damage"} from ${effect.name}!`,
        );
      }

      // Process HoTs (Heal over Time)
      if (effect.type === EFFECT_TYPES.HOT) {
        let healAmount = Math.floor(effect.magnitude);

        // Check for HEAL_IS_DMG (Undead Awakened) - healing damages instead
        if (
          hasEffectTag(entity, "HEAL_IS_DMG") ||
          entity.race?.id === "undead_awakened"
        ) {
          totalDotDamage += healAmount;
          messages.push(
            `${entity.name} is UNDEAD! Healing deals ${healAmount} damage instead!`,
          );
        } else {
          // Check for healing malus (reduced healing)
          if (hasEffectTag(entity, "HEAL_MALUS")) {
            healAmount = Math.floor(healAmount * 0.5);
            messages.push(`${entity.name} is resistant to healing!`);
          }

          totalHealAmount += healAmount;
          messages.push(
            `${entity.name} recovers ${healAmount} HP from ${effect.name}!`,
          );
        }
      }

      // Decrement duration
      return {
        ...effect,
        remainingDuration: effect.remainingDuration - 1,
      };
    })
    .filter((effect) => {
      if (effect.remainingDuration <= 0) {
        messages.push(`${effect.name} fades from ${entity.name}.`);
        return false; // Remove
      }
      return true; // Keep
    });

  // Apply damage and healing to entity state
  const newHpCurrent = Math.min(
    entity.hp.max,
    Math.max(0, entity.hp.current - totalDotDamage + totalHealAmount),
  );

  const updatedEntity = {
    ...entity,
    hp: {
      ...entity.hp,
      current: newHpCurrent,
    },
    effects: activeEffects,
  };

  return {
    entity: updatedEntity,
    messages,
    damageTaken: totalDotDamage,
  };
}

/**
 * Checks if an entity has a specific effect tag active
 */
export function hasEffectTag(entity, tag) {
  if (!entity.effects) return false;
  return entity.effects.some((e) => e.tags && e.tags.includes(tag));
}

/**
 * Gets the total magnitude of a specific effect tag (e.g. total speed boost)
 */
export function getEffectTagMagnitude(entity, tag) {
  if (!entity.effects) return 0;
  return entity.effects
    .filter((e) => e.tags && e.tags.includes(tag))
    .reduce((sum, e) => sum + (e.magnitude || 0), 0);
}
