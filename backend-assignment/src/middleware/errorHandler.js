'use strict';

// Centralized error handler. Converts thrown errors into clean JSON responses.
module.exports = (err, req, res, next) => {
  const status = err.status || 500;
  const body = {
    error: err.code || 'INTERNAL_ERROR',
    message: err.message || 'Something went wrong',
  };
  if (err.details) body.details = err.details;

  if (status >= 500) {
    console.error(`[error] ${req.method} ${req.originalUrl}`, err);
  }

  res.status(status).json(body);
};