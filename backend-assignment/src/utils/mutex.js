'use strict';

/**
 * KeyedMutex — per-key async lock.
 *
 * Why: Node is single-threaded, but await points let other requests interleave.
 * For rate-limiting and "check-then-write" operations on the same user_id,
 * we must serialize the critical section so two concurrent requests can't
 * both observe `count = 4` and both pass through.
 *
 * Usage:
 *   const m = new KeyedMutex();
 *   const result = await m.run(userId, async () => {
 *     // critical section
 *   });
 */
class KeyedMutex {
  constructor() {
    this._chains = new Map(); // key -> Promise (tail of the chain)
  }

  run(key, fn) {
    const prev = this._chains.get(key) || Promise.resolve();
    const next = prev.then(() => fn());
    // keep chain alive even if fn rejects
    const tail = next.catch(() => {});
    this._chains.set(key, tail);

    // optional cleanup: when this tail finishes and is still the current tail,
    // drop the entry to prevent unbounded memory growth.
    tail.then(() => {
      if (this._chains.get(key) === tail) {
        this._chains.delete(key);
      }
    });

    return next;
  }
}

module.exports = { KeyedMutex };