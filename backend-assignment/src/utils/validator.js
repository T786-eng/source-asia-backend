'use strict';

function httpError(status, code, message, details) {
  const err = new Error(message);
  err.status = status;
  err.code = code;
  if (details) err.details = details;
  return err;
}

function requireNonEmptyString(value, field) {
  if (value === undefined || value === null) {
    throw httpError(400, 'INVALID_INPUT', `"${field}" is required`);
  }
  if (typeof value !== 'string' || value.trim() === '') {
    throw httpError(400, 'INVALID_INPUT', `"${field}" must be a non-empty string`);
  }
  return value.trim();
}

function requireDefined(value, field) {
  if (value === undefined || value === null) {
    throw httpError(400, 'INVALID_INPUT', `"${field}" is required`);
  }
  return value;
}

function isValidUrl(str) {
  if (typeof str !== 'string') return false;
  if (str.length > 2048) return false;
  return str.startsWith('http://') || str.startsWith('https://');
}

function validateUrlArray(arr, field) {
  if (arr === undefined || arr === null) return [];
  if (!Array.isArray(arr)) {
    throw httpError(400, 'INVALID_INPUT', `"${field}" must be an array`);
  }
  if (arr.length > 20) {
    throw httpError(400, 'INVALID_INPUT', `"${field}" max 20 URLs allowed per request`);
  }
  for (const url of arr) {
    if (!isValidUrl(url)) {
      throw httpError(400, 'INVALID_INPUT', `"${field}" contains invalid URL: "${url}". Must start with http:// or https:// and be under 2048 chars`);
    }
  }
  return arr;
}

function parsePositiveInt(value, defaultVal, { min = 0, max = Infinity } = {}) {
  if (value === undefined || value === null) return defaultVal;
  const n = parseInt(value, 10);
  if (isNaN(n)) return defaultVal;
  if (n < min) return min;
  if (n > max) return max;
  return n;
}

module.exports = {
  httpError,
  requireNonEmptyString,
  requireDefined,
  validateUrlArray,
  parsePositiveInt,
};