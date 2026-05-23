'use strict';

const { uuid } = require('../utils/ids');

class ProductStore {
  constructor() {
    this._byId = new Map();
    this._skuIndex = new Map();
  }

  hasSku(sku) {
    return this._skuIndex.has(sku);
  }

  create({ name, sku, image_urls, video_urls }) {
    const id = uuid();
    const now = new Date().toISOString();
    const product = {
      id,
      name,
      sku,
      image_urls: [...image_urls],
      video_urls: [...video_urls],
      created_at: now,
      updated_at: now,
    };
    this._byId.set(id, product);
    this._skuIndex.set(sku, id);
    return product;
  }

  get(id) {
    return this._byId.get(id) || null;
  }

  list({ limit, offset }) {
    const all = Array.from(this._byId.values())
      .sort((a, b) => (a.created_at < b.created_at ? 1 : -1));
    const total = all.length;
    const slice = all.slice(offset, offset + limit).map(p => ({
      id: p.id,
      name: p.name,
      sku: p.sku,
      image_count: p.image_urls.length,
      video_count: p.video_urls.length,
      thumbnail_url: p.image_urls[0] || null,
      created_at: p.created_at,
    }));
    return { total, items: slice };
  }

  appendMedia(id, { image_urls = [], video_urls = [] }) {
    const product = this._byId.get(id);
    if (!product) return null;
    product.image_urls.push(...image_urls);
    product.video_urls.push(...video_urls);
    product.updated_at = new Date().toISOString();
    return product;
  }
}

module.exports = new ProductStore();