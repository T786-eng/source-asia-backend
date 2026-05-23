'use strict';

const express = require('express');
const rateLimitRoutes = require('./ratelimit/ratelimit.routes');
const productRoutes = require('./products/products.routes');
const notFound = require('./middleware/notFound');
const errorHandler = require('./middleware/errorHandler');

const app = express();

app.use(express.json({ limit: '1mb' }));

app.get('/health', (req, res) => res.json({ status: 'ok', uptime: process.uptime() }));

// Part 1: Rate-limited API
app.use('/', rateLimitRoutes);

// Part 2: Product catalog
app.use('/products', productRoutes);

app.use(notFound);
app.use(errorHandler);

module.exports = app;