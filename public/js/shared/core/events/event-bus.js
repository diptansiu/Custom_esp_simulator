// Simple Event Bus
// Platform-independent event publication/subscription.
// Used by application services to communicate loosely coupled events.
// No dependencies on Electron, browser DOM, or Node.js specific APIs.

import { EVENT_NAME, EVENT_CATEGORY, createEvent } from '../shared/core/contracts/event-contracts.js';

export class EventBus {
  constructor() {
    this._subscribers = new Map(); // eventType -> Set<callback>
    this._subscriberCount = 0;
  }

  /**
   * Subscribe to an event type.
   * Returns an unsubscribe function.
   */
  subscribe(eventType, callback) {
    if (!this._subscribers.has(eventType)) {
      this._subscribers.set(eventType, new Set());
    }
    this._subscribers.get(eventType).add(callback);
    this._subscriberCount++;

    return () => {
      this.unsubscribe(eventType, callback);
    };
  }

  /**
   * Unsubscribe from an event type.
   */
  unsubscribe(eventType, callback) {
    const subscribers = this._subscribers.get(eventType);
    if (subscribers) {
      subscribers.delete(callback);
      if (subscribers.size === 0) {
        this._subscribers.delete(eventType);
      }
    }
  }

  /**
   * Publish an event to all subscribers.
   */
  publish(eventType, payload) {
    const subscribers = this._subscribers.get(eventType);
    if (!subscribers) return;

    const event = createEvent({
      type: eventType,
      ...payload,
      source: 'event-bus'
    });

    // Copy subscribers to avoid modification during iteration
    const callbacks = [...subscribers];
    for (const callback of callbacks) {
      try {
        callback(event);
      } catch (err) {
        console.error(`[EventBus] Error in subscriber for ${eventType}:`, err.message);
      }
    }
  }

  /**
   * Get subscriber count for an event type.
   */
  getSubscriberCount(eventType) {
    const subscribers = this._subscribers.get(eventType);
    return subscribers ? subscribers.size : 0;
  }

  /**
   * Get total subscriber count.
   */
  getTotalSubscriberCount() {
    return this._subscriberCount;
  }

  /**
   * Get all event types with subscribers.
   */
  getEventTypes() {
    return [...this._subscribers.keys()];
  }

  /**
   * Remove all subscribers.
   */
  clear() {
    this._subscribers.clear();
    this._subscriberCount = 0;
  }
}

export const eventNames = EVENT_NAME;
export const eventCategories = EVENT_CATEGORY;

export default EventBus;
