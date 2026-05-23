'use strict';

const store = require('./products.store');
const config = require('../config');
const {
  httpError,
  requireNonEmptyString,
  validateUrlArray,
  parsePositiveInt,
} = require('../utils/validator');

function createProduct(body = {}) {
  const name = requireNonEmptyString(body.name, 'name');
  const sku  = requireNonEmptyString(body.sku, 'sku');
  const image_urls = validateUrlArray(body.image_urls, 'image_urls');
  const video_urls = validateUrlArray(body.video_urls, 'video_urls');

  if (store.hasSku(sku)) {
    throw httpError(409, 'DUPLICATE_SKU', `sku "${sku}" already exists`);
  }
  return store.create({ name, sku, image_urls, video_urls });
}

function listProducts(query = {}) {
  const limit = parsePositiveInt(query.limit, config.products.defaultLimit, {
    min: 1,
    max: config.products.maxLimit,
  });
  const offset = parsePositiveInt(query.offset, 0, { min: 0 });
  const { total, items } = store.list({ limit, offset });
  return { total, limit, offset, items };
}

function getProduct(id) {
  const p = store.get(id);
  if (!p) throw httpError(404, 'NOT_FOUND', `product ${id} not found`);
  return p;
}

function appendMedia(id, body = {}) {
  const image_urls = validateUrlArray(body.image_urls, 'image_urls');
  const video_urls = validateUrlArray(body.video_urls, 'video_urls');

  if (image_urls.length === 0 && video_urls.length === 0) {
    throw httpError(400, 'INVALID_INPUT', 'provide at least one image_urls or video_urls item');
  }
  const updated = store.appendMedia(id, { image_urls, video_urls });
  if (!updated) throw httpError(404, 'NOT_FOUND', `product ${id} not found`);
  return updated;
}

module.exports = { createProduct, listProducts, getProduct, appendMedia };