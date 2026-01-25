import { SimBridge } from "../simulation/bridge/SimulationContext.js";

const listeners = new Map();

export function on(event, handler) {
  if (!listeners.has(event)) listeners.set(event, new Set());
  listeners.get(event).add(handler);
  return () => off(event, handler);
}

export function off(event, handler) {
  const set = listeners.get(event);
  if (set) set.delete(handler);
}

export function emit(event, payload) {
  const set = listeners.get(event);
  if (set) {
    for (const fn of set) {
      try {
        fn(payload);
      } catch (error) {
        console.error(`EventBus error in ${event}:`, error);
      }
    }
  }

  logToSimulation(event, payload);
}

export const EventBus = {
  on,
  off,
  emit,
};

function logToSimulation(event, payload) {
  if (typeof event !== "string") {
    return;
  }
  if (event === "effect:applied") {
    SimBridge.emitEvent("EffectApplied", {
      entityId: payload?.targetId ?? payload?.target ?? payload?.entityId,
      effectId: payload?.effectId ?? payload?.effectName,
      sourceId: payload?.sourceId ?? payload?.source,
      stacks: payload?.stacks ?? 1,
    });
    return;
  }

  if (event === "effect:removed") {
    const reason = payload?.reason;
    SimBridge.emitEvent("EffectRemoved", {
      entityId: payload?.targetId ?? payload?.target ?? payload?.entityId,
      effectId: payload?.effectId ?? payload?.effectName,
      reason:
        reason === "expired" || reason === "dispelled" || reason === "replaced"
          ? reason
          : "expired",
    });
    return;
  }

  if (event.startsWith("combat:")) {
    SimBridge.emitEvent("CombatAction", {
      action: event,
      result: payload,
    });
    return;
  }

  SimBridge.emitEvent("StateChanged", {
    actionType: event,
    changes: payload,
    description: `EventBus:${event}`,
  });
}
