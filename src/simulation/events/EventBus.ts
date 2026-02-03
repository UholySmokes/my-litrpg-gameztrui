/**
 * Event Bus and Event Sourcing System
 * Every state mutation produces events; state = initial + event log
 */

import { Event, Tick, EntityId } from "../types/core";
import { isValidEvent } from "../validation/basic";

// ============================================================================
// EVENT LISTENER INTERFACES
// ============================================================================

export interface EventListener {
  (event: Event): void;
}

export interface EventFilter {
  eventType?: string;
  entityId?: EntityId;
  sinceTick?: Tick;
  untilTick?: Tick;
}

// ============================================================================
// EVENT BUS IMPLEMENTATION
// ============================================================================

export class EventBus {
  private listeners: Map<string, EventListener[]> = new Map();
  private globalListeners: EventListener[] = [];
  private eventLog: Event[] = [];
  private maxLogSize: number = 10000;

  /**
   * Subscribe to specific event type
   */
  subscribe(eventType: string, listener: EventListener): () => void {
    if (!this.listeners.has(eventType)) {
      this.listeners.set(eventType, []);
    }

    const typeListeners = this.listeners.get(eventType)!;
    typeListeners.push(listener);

    // Return unsubscribe function
    return () => {
      const index = typeListeners.indexOf(listener);
      if (index > -1) {
        typeListeners.splice(index, 1);
      }
    };
  }

  /**
   * Subscribe to all events
   */
  subscribeToAll(listener: EventListener): () => void {
    this.globalListeners.push(listener);

    // Return unsubscribe function
    return () => {
      const index = this.globalListeners.indexOf(listener);
      if (index > -1) {
        this.globalListeners.splice(index, 1);
      }
    };
  }

  /**
   * Publish event to all subscribers
   */
  publish(event: Event): void {
    if (!isValidEvent(event)) {
      throw new Error(`Invalid event: ${JSON.stringify(event)}`);
    }

    // Add to event log
    this.addToLog(event);

    // Notify global listeners
    for (const listener of this.globalListeners) {
      try {
        listener(event);
      } catch (error) {
        console.error(`Global listener error for event ${event.id}:`, error);
      }
    }

    // Notify type-specific listeners
    const typeListeners = this.listeners.get(event.type);
    if (typeListeners) {
      for (const listener of typeListeners) {
        try {
          listener(event);
        } catch (error) {
          console.error(`Type listener error for event ${event.id}:`, error);
        }
      }
    }
  }

  /**
   * Get events from log with optional filtering
   */
  getEvents(filter?: EventFilter): Event[] {
    let events = [...this.eventLog];

    if (filter) {
      if (filter.eventType) {
        events = events.filter((e) => e.type === filter.eventType);
      }
      if (filter.entityId) {
        events = events.filter((e) => e.entityId === filter.entityId);
      }
      if (filter.sinceTick !== undefined) {
        events = events.filter((e) => e.tick > filter.sinceTick!);
      }
      if (filter.untilTick !== undefined) {
        events = events.filter((e) => e.tick <= filter.untilTick!);
      }
    }

    return events;
  }

  /**
   * Get events for specific entity
   */
  getEventsForEntity(entityId: EntityId, sinceTick?: Tick): Event[] {
    return this.getEvents({
      entityId,
      sinceTick,
    });
  }

  /**
   * Get events of specific type
   */
  getEventsByType(eventType: string, sinceTick?: Tick): Event[] {
    return this.getEvents({
      eventType,
      sinceTick,
    });
  }

  /**
   * Clear event log
   */
  clearLog(): void {
    this.eventLog = [];
  }

  /**
   * Get event log statistics
   */
  getLogStats(): {
    totalEvents: number;
    eventTypeCounts: Map<string, number>;
    latestTick: number;
    oldestTick: number;
  } {
    const eventTypeCounts = new Map<string, number>();
    let latestTick = 0;
    let oldestTick = Infinity;

    for (const event of this.eventLog) {
      // Count by type
      const count = eventTypeCounts.get(event.type) || 0;
      eventTypeCounts.set(event.type, count + 1);

      // Track tick range
      latestTick = Math.max(latestTick, event.tick);
      oldestTick = Math.min(oldestTick, event.tick);
    }

    return {
      totalEvents: this.eventLog.length,
      eventTypeCounts,
      latestTick: this.eventLog.length > 0 ? latestTick : 0,
      oldestTick: this.eventLog.length > 0 ? oldestTick : 0,
    };
  }

  private addToLog(event: Event): void {
    this.eventLog.push(event);

    // Maintain log size limit
    if (this.eventLog.length > this.maxLogSize) {
      const excess = this.eventLog.length - this.maxLogSize;
      this.eventLog.splice(0, excess);
    }
  }
}

// ============================================================================
// EVENT SOURCING MANAGER
// ============================================================================

export interface EventSnapshot {
  tick: Tick;
  timestamp: number;
  eventLogIndex: number;
  stateHash: string;
}

export class EventSourcingManager {
  private eventBus: EventBus;
  private snapshots: Map<Tick, EventSnapshot> = new Map();
  private snapshotInterval: Tick = 100; // Create snapshot every N ticks
  private maxSnapshots: number = 50;

  constructor(eventBus: EventBus, snapshotInterval?: Tick) {
    this.eventBus = eventBus;
    if (snapshotInterval) {
      this.snapshotInterval = snapshotInterval;
    }
  }

  /**
   * Create snapshot at current tick
   */
  createSnapshot(tick: Tick, stateHash: string, timestamp?: number): void {
    if (tick % this.snapshotInterval !== 0) {
      return; // Only snapshot at intervals
    }

    const snapshotTimestamp =
      typeof timestamp === "number" && Number.isFinite(timestamp)
        ? timestamp
        : tick;

    const snapshot: EventSnapshot = {
      tick,
      timestamp: snapshotTimestamp,
      eventLogIndex: this.eventBus.getEvents().length,
      stateHash,
    };

    this.snapshots.set(tick, snapshot);

    // Maintain snapshot limit
    if (this.snapshots.size > this.maxSnapshots) {
      const oldestTick = Math.min(...this.snapshots.keys());
      this.snapshots.delete(oldestTick);
    }
  }

  /**
   * Get most recent snapshot before or at given tick
   */
  getSnapshotBefore(tick: Tick): EventSnapshot | null {
    const snapshotTicks = Array.from(this.snapshots.keys()).sort(
      (a, b) => b - a,
    );

    for (const snapshotTick of snapshotTicks) {
      if (snapshotTick <= tick) {
        return this.snapshots.get(snapshotTick) || null;
      }
    }

    return null;
  }

  /**
   * Get all snapshots
   */
  getSnapshots(): EventSnapshot[] {
    return Array.from(this.snapshots.values()).sort((a, b) => a.tick - b.tick);
  }

  /**
   * Clear all snapshots
   */
  clearSnapshots(): void {
    this.snapshots.clear();
  }

  /**
   * Get events since last snapshot
   */
  getEventsSinceSnapshot(tick: Tick): Event[] {
    const snapshot = this.getSnapshotBefore(tick);
    if (!snapshot) {
      return this.eventBus.getEvents({ untilTick: tick });
    }

    return this.eventBus.getEvents({
      sinceTick: snapshot.tick,
    });
  }
}

// ============================================================================
// EVENT REPLAY SYSTEM
// ============================================================================

export interface ReplayOptions {
  fromTick?: Tick;
  toTick?: Tick;
  eventTypes?: string[];
  entityId?: EntityId;
  speed?: number; // Playback speed multiplier
  onEvent?: (event: Event, replayTime: number) => void;
  onComplete?: (totalEvents: number, replayTime: number) => void;
}

export class EventReplayer {
  private eventBus: EventBus;
  private isReplaying: boolean = false;
  private currentReplay: Promise<number> | null = null;

  constructor(eventBus: EventBus) {
    this.eventBus = eventBus;
  }

  /**
   * Replay events from log
   */
  async replay(options: ReplayOptions = {}): Promise<number> {
    if (this.isReplaying) {
      throw new Error("Replay already in progress");
    }

    this.isReplaying = true;
    this.currentReplay = this.doReplay(options);

    try {
      return await this.currentReplay;
    } finally {
      this.isReplaying = false;
      this.currentReplay = null;
    }
  }

  private async doReplay(options: ReplayOptions): Promise<number> {
    const startTime = performance.now();
    let eventCount = 0;

    // Get events to replay
    const filter: EventFilter = {};
    if (options.fromTick !== undefined) {
      filter.sinceTick = options.fromTick - 1;
    }
    if (options.toTick !== undefined) {
      filter.untilTick = options.toTick;
    }
    if (options.eventTypes) {
      // This would need to be implemented in getEvents
      // For now, we'll filter after getting events
    }
    if (options.entityId) {
      filter.entityId = options.entityId;
    }

    let events = this.eventBus.getEvents(filter);

    // Additional filtering
    if (options.eventTypes) {
      events = events.filter((e) => options.eventTypes!.includes(e.type));
    }

    // Sort by tick to ensure proper order
    events.sort((a, b) => a.tick - b.tick);

    // Replay events
    for (const event of events) {
      if (options.onEvent) {
        const replayTime = performance.now() - startTime;
        options.onEvent(event, replayTime);
      }

      // Apply delay based on speed
      const speed = options.speed;
      if (typeof speed === "number" && speed < 1) {
        await new Promise((resolve) =>
          setTimeout(resolve, (1 - speed) * 100),
        );
      }

      eventCount++;
    }

    const totalTime = performance.now() - startTime;

    if (options.onComplete) {
      options.onComplete(eventCount, totalTime);
    }

    return eventCount;
  }

  /**
   * Check if replay is in progress
   */
  isReplayingInProgress(): boolean {
    return this.isReplaying;
  }

  /**
   * Cancel current replay
   */
  async cancelReplay(): Promise<void> {
    if (this.currentReplay) {
      // Note: This is a simplified cancellation
      // In a real implementation, you'd need proper cancellation tokens
      this.isReplaying = false;
      await this.currentReplay;
    }
  }
}

// ============================================================================
// EVENT AGGREGATIONS
// ============================================================================

export class EventAggregator {
  private eventBus: EventBus;

  constructor(eventBus: EventBus) {
    this.eventBus = eventBus;
  }

  /**
   * Count events by type in given tick range
   */
  countEventsByType(fromTick: Tick, toTick: Tick): Map<string, number> {
    const events = this.eventBus.getEvents({
      sinceTick: fromTick - 1,
      untilTick: toTick,
    });

    const counts = new Map<string, number>();
    for (const event of events) {
      const count = counts.get(event.type) || 0;
      counts.set(event.type, count + 1);
    }

    return counts;
  }

  /**
   * Get damage statistics for entity in tick range
   */
  getDamageStats(
    entityId: EntityId,
    fromTick: Tick,
    toTick: Tick,
  ): {
    totalDamage: number;
    totalHealing: number;
    damageEvents: number;
    healingEvents: number;
    criticalHits: number;
  } {
    const events = this.eventBus.getEventsForEntity(entityId, fromTick - 1);
    const filteredEvents = events.filter(
      (e) => e.tick <= toTick && (e.type === "Damage" || e.type === "Heal"),
    );

    let totalDamage = 0;
    let totalHealing = 0;
    let damageEvents = 0;
    let healingEvents = 0;
    let criticalHits = 0;

    for (const event of filteredEvents) {
      if (event.type === "Damage") {
        totalDamage += (event as any).amount || 0;
        damageEvents++;
        if ((event as any).isCritical) {
          criticalHits++;
        }
      } else if (event.type === "Heal") {
        totalHealing += (event as any).amount || 0;
        healingEvents++;
      }
    }

    return {
      totalDamage,
      totalHealing,
      damageEvents,
      healingEvents,
      criticalHits,
    };
  }

  /**
   * Get entity activity timeline
   */
  getActivityTimeline(
    entityId: EntityId,
    fromTick: Tick,
    toTick: Tick,
    bucketSize: Tick = 10,
  ): Map<Tick, number> {
    const events = this.eventBus.getEventsForEntity(entityId, fromTick - 1);
    const timeline = new Map<Tick, number>();

    for (const event of events) {
      if (event.tick > toTick) continue;

      const bucket = Math.floor(event.tick / bucketSize) * bucketSize;
      const count = timeline.get(bucket) || 0;
      timeline.set(bucket, count + 1);
    }

    return timeline;
  }
}
