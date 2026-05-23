'use strict';

const express = require('express');
const service = require('./ratelimit.service');
const { requireNonEmptyString, requireDefined } = require('../utils/validator');

const router = express.Router();

router.post('/request', async (req, res, next) => {
  try {
    const userId = requireNonEmptyString(req.body?.user_id, 'user_id');
    requireDefined(req.body?.payload, 'payload');

    const result = await service.consume(userId);

    if (!result.allowed) {
      return res.status(429).json({
        error: 'RATE_LIMITED',
        message: 'Too many requests for this user_id',
        details: {
          retry_after_ms: result.retry_after_ms,
          accepted_in_window: result.accepted_in_window,
        },
      });
    }

    return res.status(201).json({
      status: 'accepted',
      user_id: userId,
      accepted_in_window: result.accepted_in_window,
      remaining: result.remaining,
      received_at: new Date().toISOString(),
    });
  } catch (err) {
    next(err);
  }
});

router.get('/stats', (req, res, next) => {
  try {
    res.json({ users: service.getStats() });
  } catch (err) {
    next(err);
  }
});

module.exports = router;