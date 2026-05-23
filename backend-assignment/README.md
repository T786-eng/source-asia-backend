# Source Asia Backend Assignment

Node.js HTTP service implementing:
1. **Part 1** — A rate-limited API (`POST /request`, `GET /stats`)
2. **Part 2** — A product catalog with media (`/products` CRUD + media append)

All storage is **in-memory** (Map / array based) per the assignment spec.

---

## AI Tools Disclosure
Claude (Anthropic) was used as an AI assistant during development for suggestions and reference. All code was written, reviewed, and understood by the developer.

---

## Requirements
- Node.js **v20 or newer**
- npm

---

## Run

```bash
npm install
npm start
# → server on http://localhost:3000
```

Dev mode (auto-reload on file change):
```bash
npm run dev
```

Change port:
```bash
PORT=4000 npm start
```

---

## Part 1 — Rate-limited API

**Rules:** Max **5 accepted requests per `user_id` per rolling 60s window**. Concurrent requests for the same `user_id` are serialized via a per-user async lock so the cap is honored exactly even under burst load.

### Rate Limiting Approach
- **Rolling window** (not fixed buckets) — timestamps of accepted requests are stored per user. On each request, timestamps older than 60 seconds are pruned. If fewer than 5 remain, the request is accepted.
- **Per-user mutex** (`withUserLock`) — all check-and-increment operations are serialized per user_id, so concurrent requests cannot both slip through when count is at 4.

### `POST /request`
Returns `201 Created` on success.

```bash
curl -X POST http://localhost:3000/request \
  -H "Content-Type: application/json" \
  -d '{"user_id":"alice","payload":{"hello":"world"}}'
```

Success response `201`:
```json
{
  "status": "accepted",
  "user_id": "alice",
  "accepted_in_window": 1,
  "remaining": 4,
  "received_at": "2026-05-23T10:00:00.000Z"
}
```

Rate limited response `429`:
```json
{
  "error": "RATE_LIMITED",
  "message": "Too many requests for this user_id",
  "details": {
    "retry_after_ms": 45000,
    "accepted_in_window": 5
  }
}
```

Bad request response `400`:
```json
{
  "error": "INVALID_INPUT",
  "message": "\"user_id\" is required"
}
```

### `GET /stats`
```bash
curl http://localhost:3000/stats
```

Response schema:
```json
{
  "users": {
    "alice": {
      "accepted_in_window": 3,
      "rejected_total": 1
    }
  }
}
```

- `accepted_in_window` — requests accepted in the current rolling 60s window
- `rejected_total` — cumulative rejected requests since server start

---

## Part 2 — Product Catalog

### Validation Rules
- `name` and `sku` must be non-empty strings
- URLs must start with `http://` or `https://` and be under 2048 characters
- Maximum **20 URLs per array** per request
- Duplicate `sku` returns `409 Conflict`

### `POST /products`
```bash
curl -X POST http://localhost:3000/products \
  -H "Content-Type: application/json" \
  -d '{"name":"Widget A","sku":"SKU-001","image_urls":["https://cdn.example.com/products/sku-001/img-1.jpg"],"video_urls":["https://cdn.example.com/products/sku-001/demo.mp4"]}'
```
- `201` created, `409` duplicate SKU, `400` validation error.

### `GET /products` — List (fast, paginated, lightweight)
```bash
curl "http://localhost:3000/products?limit=20&offset=0"
```

- Default `limit`: 20, Max `limit`: 100, Default `offset`: 0
- Returns only: `id, name, sku, image_count, video_count, thumbnail_url, created_at`
- **Full URL arrays are never returned in list** — only counts and one thumbnail

### `GET /products/:id` — Detail
```bash
curl http://localhost:3000/products/<id>
```
Returns full record with all `image_urls` and `video_urls`. Returns `404` if not found.

### `POST /products/:id/media` — Append media
```bash
curl -X POST http://localhost:3000/products/<id>/media \
  -H "Content-Type: application/json" \
  -d '{"image_urls":["https://cdn.example.com/img2.jpg"],"video_urls":["https://cdn.example.com/demo2.mp4"]}'
```
- Appends URLs to existing product
- At least one of `image_urls` or `video_urls` must be provided
- Returns `404` if product not found, `400` if no URLs provided

---

## Data Model

Products are stored in a `Map` keyed by `id`. A separate `Map` (`_skuIndex`) maps SKU to id for O(1) duplicate checks.

**List vs Detail queries:**
- `GET /products` — iterates the map but maps each product to a lightweight object (id, name, sku, counts, thumbnail only). Full URL arrays are never serialized.
- `GET /products/:id` — returns the full product object including all URLs.

This means with 1,000 products × 10 URLs each, the list endpoint never touches or serializes 9,980 URLs it doesn't need.

---

## Production Limitations

- **Single instance only** — in-memory state is not shared across processes
- **Restart loses all data** — no persistence layer
- **Multi-instance deployment** — rate limit state would be inconsistent across instances; a shared Redis store would be needed
- **No authentication** — any caller can submit requests or read stats

---

## What Would Change with PostgreSQL + CDN

- Products and media URLs stored in a `products` table and a separate `media` table joined on `product_id`
- List query selects only summary columns with `COUNT()` — never loads URL arrays
- Detail query joins media table to fetch all URLs for one product
- Media URLs would point to a real CDN (S3, Cloudflare, etc.)
- Rate limit state moved to Redis with atomic increment + TTL