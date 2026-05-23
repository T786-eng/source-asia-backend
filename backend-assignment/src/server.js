'use strict';

const app = require('./app');
const config = require('./config');

const server = app.listen(config.port, () => {
  console.log(`[server] listening on http://localhost:${config.port}`);
  console.log(`[server] rate limit: ${config.rateLimit.maxRequests} req/user/${config.rateLimit.windowMs}ms`);
});

// graceful shutdown
const shutdown = (signal) => {
  console.log(`\n[server] received ${signal}, shutting down...`);
  server.close(() => process.exit(0));
};

process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);