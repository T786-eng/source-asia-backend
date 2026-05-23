'use strict';

const express = require('express');
const service = require('./products.service');

const router = express.Router();

router.post('/', (req, res, next) => {
  try {
    const product = service.createProduct(req.body);
    res.status(201).json(product);
  } catch (e) { next(e); }
});

router.get('/', (req, res, next) => {
  try {
    res.json(service.listProducts(req.query));
  } catch (e) { next(e); }
});

router.get('/:id', (req, res, next) => {
  try {
    res.json(service.getProduct(req.params.id));
  } catch (e) { next(e); }
});

router.post('/:id/media', (req, res, next) => {
  try {
    res.status(200).json(service.appendMedia(req.params.id, req.body));
  } catch (e) { next(e); }
});

module.exports = router;