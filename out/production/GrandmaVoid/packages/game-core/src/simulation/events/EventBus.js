// Runtime-friendly EventBus implementation (JS shim for browser + Node)

export class EventBus {
  constructor() {
    this.listeners = new Map();
    this.globalListeners = [];
    this.eventLog = [];
    this.maxLogSize = 10000;
  }

  subscribe(eventType, listener) {
    if (!this.listeners.has(eventType)) {
      this.listeners.set(eventType, []);
    }

    const typeListeners = this.listeners.get(eventType);
    typeListeners.push(listener);

    return () => {
      const index = typeListeners.indexOf(listener);
      if (index > -1) {
        typeListeners.splice(index, 1);
      }
    };
  }

  subscribeToAll(listener) {
    this.globalListeners.push(listener);

    return () => {
      const index = this.globalListeners.indexOf(listener);
      if (index > -1) {
        this.globalListeners.splice(index, 1);
      }
    };
  }

  publish(event) {
    if (!event || typeof event !== "object") {
      throw new Error("Invalid event payload.");
    }

    this.addToLog(event);

    for (const listener of this.globalListeners) {
      try {
        listener(event);
      } catch (error) {
        console.error("Global listener error:", error);
      }
    }

    const typeListeners = this.listeners.get(event.type);
    if (typeListeners) {
      for (const listener of typeListeners) {
        try {
          listener(event);
        } catch (error) {
          console.error("Type listener error:", error);
        }
      }
    }
  }

  getEvents(filter) {
    let events = [...this.eventLog];

    if (filter) {
      if (filter.eventType) {
        events = events.filter((e) => e.type === filter.eventType);
      }
      if (filter.entityId) {
        events = events.filter((e) => e.entityId === filter.entityId);
      }
      if (filter.sinceTick !== undefined) {
        events = events.filter((e) => e.tick > filter.sinceTick);
      }
      if (filter.untilTick !== undefined) {
        events = events.filter((e) => e.tick <= filter.untilTick);
      }
    }

    return events;
  }

  getEventsForEntity(entityId, sinceTick) {
    return this.getEvents({
      entityId,
      sinceTick,
    });
  }

  getEventsByType(eventType, sinceTick) {
    return this.getEvents({
      eventType,
      sinceTick,
    });
  }

  clearLog() {
    this.eventLog = [];
  }

  getLogStats() {
    const eventTypeCounts = new Map();
    let latestTick = 0;
    let oldestTick = Infinity;

    for (const event of this.eventLog) {
      const count = eventTypeCounts.get(event.type) || 0;
      eventTypeCounts.set(event.type, count + 1);

      latestTick = Math.max(latestTick, event.tick || 0);
      oldestTick = Math.min(oldestTick, event.tick || 0);
    }

    return {
      totalEvents: this.eventLog.length,
      eventTypeCounts,
      latestTick: this.eventLog.length > 0 ? latestTick : 0,
      oldestTick: this.eventLog.length > 0 ? oldestTick : 0,
    };
  }

  addToLog(event) {
    this.eventLog.push(event);

    if (this.eventLog.length > this.maxLogSize) {
      const excess = this.eventLog.length - this.maxLogSize;
      this.eventLog.splice(0, excess);
    }
  }
}
