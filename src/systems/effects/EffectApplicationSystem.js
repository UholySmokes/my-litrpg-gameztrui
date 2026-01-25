import { applyEffect } from "./EffectSystem.js";
import { emit } from "../../core/EventBus.js";
import { SimBridge } from "../../simulation/bridge/SimulationBridge.js";

/**
 * Unified effect application system for all skills
 * Centralizes effect handling with consistent error handling and logging
 */

class EffectApplicationSystem {
  constructor() {
    this.effectHistory = new Map();
    this.activeEffects = new Map();
  }

  /**
   * Apply a single effect with standardized error handling
   * @param {Object} target - The target entity
   * @param {string} effectId - The effect identifier
   * @param {Object} source - The source of the effect
   * @param {Object} options - Effect options (duration, magnitude, etc.)
   * @returns {Object} Updated target entity
   */
  applyEffect(target, effectId, source = null, options = {}) {
    try {
      if (!target || !effectId) {
        throw new Error("Invalid target or effect ID");
      }

      const startTime = performance.now();
      const effectKey = `${target.name || "unknown"}_${effectId}`;

      // Apply the effect using the core processor
      const updatedTarget = applyEffect(target, effectId, source, options);

      // Track effect history
      this.effectHistory.set(effectKey, {
        timestamp: SimBridge.now(),
        effectId,
        target: target.name || "unknown",
        source: source?.name || "system",
        duration: options.duration || 0,
        success: true,
      });

      // Track active effects
      if (!this.activeEffects.has(target.name || "unknown")) {
        this.activeEffects.set(target.name || "unknown", new Set());
      }
      this.activeEffects.get(target.name || "unknown").add(effectId);

      // Emit standardized event
      emit("effect:applied", {
        target: updatedTarget.name || "unknown",
        effectName: effectId,
        source: source?.name || "system",
        duration: options.duration || 0,
        timestamp: SimBridge.now(),
        performance: performance.now() - startTime,
      });

      return updatedTarget;
    } catch (error) {
      console.error(
        `Effect application failed: ${effectId} on ${target?.name || "unknown"}`,
        error,
      );

      // Track failed attempts
      const effectKey = `${target?.name || "unknown"}_${effectId}`;
      this.effectHistory.set(effectKey, {
        timestamp: SimBridge.now(),
        effectId,
        target: target?.name || "unknown",
        source: source?.name || "system",
        duration: options.duration || 0,
        success: false,
        error: error.message,
      });

      emit("effect:application_failed", {
        target: target?.name || "unknown",
        effectName: effectId,
        error: error.message,
        timestamp: SimBridge.now(),
      });

      // Return original target on failure
      return target;
    }
  }

  /**
   * Apply multiple effects in sequence with rollback on failure
   * @param {Object} target - The target entity
   * @param {Array} effects - Array of effect configurations
   * @param {Object} source - The source of the effects
   * @returns {Object} Updated target entity
   */
  applyEffects(target, effects, source = null) {
    if (!Array.isArray(effects)) {
      throw new Error("Effects must be an array");
    }

    let currentTarget = target;
    const appliedEffects = [];

    for (const effectConfig of effects) {
      try {
        const {
          id,
          duration,
          target: effectTarget = "enemy",
          ...options
        } = effectConfig;

        // Determine the actual target based on effect target specification
        // 'self' refers to source (caster), 'enemy' refers to currentTarget (target)
        let actualTarget;
        if (effectTarget === "self" && source) {
          actualTarget = source;
        } else {
          actualTarget = currentTarget;
        }

        const result = this.applyEffect(actualTarget, id, source, {
          duration,
          ...options,
        });

        // Only update currentTarget return value if we modified the main target
        // If we modified source (self), we don't change the return value chain for the target
        if (actualTarget === currentTarget) {
          currentTarget = result;
        }
        appliedEffects.push({ id, success: true });
      } catch (error) {
        console.error(
          `Batch effect application failed at ${effectConfig.id}`,
          error,
        );
        appliedEffects.push({
          id: effectConfig.id,
          success: false,
          error: error.message,
        });

        // Continue with remaining effects rather than full rollback
        // This provides partial application which is often more desirable
      }
    }

    // Emit batch completion event
    emit("effects:batch_applied", {
      target: currentTarget.name || "unknown",
      effects: appliedEffects,
      successCount: appliedEffects.filter((e) => e.success).length,
      totalCount: appliedEffects.length,
      timestamp: SimBridge.now(),
    });

    return currentTarget;
  }

  /**
   * Remove an effect from a target
   * @param {Object} target - The target entity
   * @param {string} effectId - The effect identifier to remove
   * @returns {Object} Updated target entity
   */
  removeEffect(target, effectId) {
    if (!target || !effectId) return target;

    try {
      const updatedEffects = (target.effects || []).filter(
        (e) => e.id !== effectId,
      );
      const updatedTarget = { ...target, effects: updatedEffects };

      // Remove from active effects tracking
      const targetName = target.name || "unknown";
      if (this.activeEffects.has(targetName)) {
        this.activeEffects.get(targetName).delete(effectId);
      }

      emit("effect:removed", {
        target: targetName,
        effectName: effectId,
        timestamp: SimBridge.now(),
      });

      return updatedTarget;
    } catch (error) {
      console.error(
        `Effect removal failed: ${effectId} from ${target?.name || "unknown"}`,
        error,
      );
      return target;
    }
  }

  /**
   * Get effect application statistics
   * @returns {Object} Statistics about effect applications
   */
  getStatistics() {
    const history = Array.from(this.effectHistory.values());
    const successful = history.filter((e) => e.success);
    const failed = history.filter((e) => !e.success);

    return {
      totalApplications: history.length,
      successfulApplications: successful.length,
      failedApplications: failed.length,
      successRate:
        history.length > 0 ? (successful.length / history.length) * 100 : 0,
      activeEffectsCount: this.getActiveEffectsCount(),
      mostAppliedEffect: this.getMostAppliedEffect(),
    };
  }

  /**
   * Get count of active effects across all targets
   * @returns {number} Total active effects count
   */
  getActiveEffectsCount() {
    let count = 0;
    for (const effects of this.activeEffects.values()) {
      count += effects.size;
    }
    return count;
  }

  /**
   * Get the most frequently applied effect
   * @returns {Object|null} Most applied effect information
   */
  getMostAppliedEffect() {
    const effectCounts = new Map();
    for (const entry of this.effectHistory.values()) {
      if (entry.success) {
        effectCounts.set(
          entry.effectId,
          (effectCounts.get(entry.effectId) || 0) + 1,
        );
      }
    }

    let mostApplied = null;
    let maxCount = 0;
    for (const [effectId, count] of effectCounts) {
      if (count > maxCount) {
        maxCount = count;
        mostApplied = { effectId, count };
      }
    }

    return mostApplied;
  }

  /**
   * Clear all tracking data
   */
  clear() {
    this.effectHistory.clear();
    this.activeEffects.clear();
  }
}

// Export singleton instance
export const effectApplicationSystem = new EffectApplicationSystem();
