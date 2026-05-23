'use strict';

const store = require('./ratelimit.store');
const config = require('../config');

/**
 * Rolling-window rate limiter.
 * For each request:
 *   1) prune timestamps older than (now - windowMs)
 *   2) if remaining count < max → accept, push now
 *   3) else → reject, compute retry_after_ms from the oldest timestamp
 *
 * Concurrency: every check-and-increment runs inside withUserLock,
 * so even N parallel requests for the same user_id are serialized
 * and the cap is honored exactly.
 */
async function consume(userId) {
  const { windowMs, maxRequests } = config.rateLimit;

  return store.withUserLock(userId, (entry) => {
    const now = Date.now();
    const cutoff = now - windowMs;

    // prune in place
    while (entry.timestamps.length && entry.timestamps[0] <= cutoff) {
      entry.timestamps.shift();
    }

    if (entry.timestamps.length < maxRequests) {
      entry.timestamps.push(now);
      return {
        allowed: true,
        accepted_in_window: entry.timestamps.length,
        remaining: maxRequests - entry.timestamps.length,
      };
    }

    const oldest = entry.timestamps[0];
    const retryAfterMs = Math.max(1, (oldest + windowMs) - now);
    entry.rejectedTotal += 1;

    return {
      allowed: false,
      retry_after_ms: retryAfterMs,
      accepted_in_window: entry.timestamps.length,
      rejected_total: entry.rejectedTotal,
    };
  });
}

function getStats() {
  return store.getAllStats(config.rateLimit.windowMs);
}

module.exports = { consume, getStats };