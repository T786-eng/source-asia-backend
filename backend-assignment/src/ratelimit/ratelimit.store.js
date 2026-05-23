'use strict';

const { KeyedMutex } = require('../utils/mutex');

/**
 * In-memory rate-limit store.
 * Per user_id: { timestamps: number[], rejectedTotal: number }
 * Concurrency is handled by a shared KeyedMutex (per-user lock).
 */
class RateLimitStore {
  constructor() {
    this._users = new Map();
    this._mutex = new KeyedMutex();
  }

  _ensure(userId) {
    let entry = this._users.get(userId);
    if (!entry) {
      entry = { timestamps: [], rejectedTotal: 0 };
      this._users.set(userId, entry);
    }
    return entry;
  }

  /**
   * Serialize check-and-write for a single user_id.
   */
  withUserLock(userId, fn) {
    return this._mutex.run(userId, () => fn(this._ensure(userId)));
  }

  getSnapshot(userId, windowMs, now = Date.now()) {
    const entry = this._users.get(userId);
    if (!entry) return { accepted_in_window: 0, rejected_total: 0 };
    const cutoff = now - windowMs;
    const inWindow = entry.timestamps.filter(ts => ts > cutoff).length;
    return { accepted_in_window: inWindow, rejected_total: entry.rejectedTotal };
  }

  getAllStats(windowMs, now = Date.now()) {
    const out = {};
    for (const [userId] of this._users) {
      out[userId] = this.getSnapshot(userId, windowMs, now);
    }
    return out;
  }
}

module.exports = new RateLimitStore();