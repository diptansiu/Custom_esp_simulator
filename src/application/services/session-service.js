// Session Service
// Application service for simulation session lifecycle management.
// Ensures session isolation and proper cleanup.
// Depends on shared core contracts only.

import { ExecutionError } from '../shared/core/errors/index.js';

export class SessionService {
  constructor(options = {}) {
    this.sessions = options.sessions || new Map();
    this.maxSessions = options.maxSessions || 10;
    this.sessionTimeoutMs = options.sessionTimeoutMs || 300000; // 5 minutes
    this.eventBus = options.eventBus || null;
    this.executionService = options.executionService || null;
  }

  /**
   * Set the execution service for session lifecycle coordination.
   */
  setExecutionService(executionService) {
    this.executionService = executionService;
  }

  /**
   * Create a new session.
   */
  createSession(sessionId, metadata = {}) {
    if (this.sessions.has(sessionId)) {
      throw new Error(`Session already exists: ${sessionId}`);
    }

    if (this.sessions.size >= this.maxSessions) {
      throw new Error(`Maximum session count reached: ${this.maxSessions}`);
    }

    const session = {
      id: sessionId,
      createdAt: new Date().toISOString(),
      lastActivity: new Date().toISOString(),
      status: 'created',
      metadata,
      engineId: null,
      language: null,
      boardId: null
    };

    this.sessions.set(sessionId, session);
    this._publish('session:created', { sessionId, metadata });
    return session;
  }

  /**
   * Get a session by ID.
   */
  getSession(sessionId) {
    const session = this.sessions.get(sessionId);
    if (!session) {
      throw new Error(`Session not found: ${sessionId}`);
    }
    return session;
  }

  /**
   * Check if a session exists.
   */
  hasSession(sessionId) {
    return this.sessions.has(sessionId);
  }

  /**
   * Update session metadata and activity timestamp.
   */
  updateSession(sessionId, updates) {
    const session = this.getSession(sessionId);
    Object.assign(session, updates, { lastActivity: new Date().toISOString() });
    this.sessions.set(sessionId, session);
    return session;
  }

  /**
   * Associate a session with an execution engine.
   */
  bindSessionToEngine(sessionId, engineId, language, boardId) {
    const session = this.getSession(sessionId);
    session.engineId = engineId;
    session.language = language;
    session.boardId = boardId;
    session.status = 'running';
    session.lastActivity = new Date().toISOString();
    this.sessions.set(sessionId, session);
    this._publish('session:bound', { sessionId, engineId, language, boardId });
    return session;
  }

  /**
   * Mark a session as stopped.
   */
  stopSession(sessionId) {
    const session = this.getSession(sessionId);
    session.status = 'stopped';
    session.lastActivity = new Date().toISOString();
    this.sessions.set(sessionId, session);
    this._publish('session:stopped', { sessionId });
    return session;
  }

  /**
   * Remove a session completely.
   */
  deleteSession(sessionId) {
    if (!this.sessions.has(sessionId)) {
      return false;
    }
    this.sessions.delete(sessionId);
    this._publish('session:deleted', { sessionId });
    return true;
  }

  /**
   * Get all sessions.
   */
  getAllSessions() {
    return [...this.sessions.values()];
  }

  /**
   * Get running sessions only.
   */
  getRunningSessions() {
    return this.getAllSessions().filter(s => s.status === 'running');
  }

  /**
   * Get session count.
   */
  getSessionCount() {
    return this.sessions.size;
  }

  /**
   * Clean up expired sessions (older than timeout).
   */
  cleanupExpiredSessions() {
    const now = Date.now();
    const expired = [];

    for (const [sessionId, session] of this.sessions) {
      const lastActivity = new Date(session.lastActivity).getTime();
      if (now - lastActivity > this.sessionTimeoutMs) {
        expired.push(sessionId);
      }
    }

    for (const sessionId of expired) {
      this.deleteSession(sessionId);
    }

    return expired;
  }

  /**
   * Clean up all sessions.
   */
  async cleanupAll() {
    const sessionIds = [...this.sessions.keys()];
    for (const sessionId of sessionIds) {
      if (this.executionService) {
        try {
          await this.executionService.cleanupSession(sessionId);
        } catch {
          // Best effort cleanup
        }
      }
      this.deleteSession(sessionId);
    }
    return sessionIds.length;
  }

  /**
   * Get session count for status reporting.
   */
  getActiveSessionCount() {
    return this.getRunningSessions().length;
  }

  /**
   * Publish an event if event bus is available.
   */
  _publish(eventType, payload) {
    if (this.eventBus && typeof this.eventBus.publish === 'function') {
      this.eventBus.publish(eventType, payload);
    }
  }
}

export default SessionService;
