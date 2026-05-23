'use strict';

module.exports = {
  port: parseInt(process.env.PORT, 10) || 3000,
  rateLimit: {
    windowMs: 60 * 1000,   // 1 minute rolling window
    maxRequests: 5,         // max accepted per user per window
  },
  products: {
    defaultLimit: 20,
    maxLimit: 100,
  },
};