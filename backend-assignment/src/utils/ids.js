'use strict';

const crypto = require('crypto');

/**
 * ID generator utilities.
 * Uses native crypto.randomUUID (Node 18+) with a safe fallback.
 */

function uuid() {
  if (typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  // fallback: 16 random bytes formatted as UUID v4
  const b = crypto.randomBytes(16);
  b[6] = (b[6] & 0x0f) | 0x40;
  b[8] = (b[8] & 0x3f) | 0x80;
  const h = b.toString('hex');
  return `${h.slice(0,8)}-${h.slice(8,12)}-${h.slice(12,16)}-${h.slice(16,20)}-${h.slice(20)}`;
}

/**
 * Short, URL-safe id (good for logs / public ids if you ever need them).
 */
function shortId(bytes = 8) {
  return crypto.randomBytes(bytes).toString('hex');
}

module.exports = { uuid, shortId };