# Order Execution Engine (Mock) — Fastify + BullMQ + Redis + Postgres

This service implements **Market Orders** (mock execution) with **DEX routing** between Raydium and Meteora and **WebSocket status streaming**.

## Why Market Order?
Market orders give a clean end-to-end execution pipeline (pending → routing → building → submitted → confirmed/failed) without long-running triggers.

## How to extend to Limit / Sniper (1–2 sentences)
Add a **trigger stage** before enqueuing execution: a **price watcher** for limit orders, and an **event watcher** (launch/migration signal) for sniper orders—both can reuse the same router + execution worker pipeline.

---

## Tech
- Node.js + TypeScript
- Fastify (HTTP + WebSocket)
- BullMQ + Redis (queue, retries, concurrency=10)
- PostgreSQL + Prisma (order history)
- Redis Pub/Sub (WS streaming) + Redis active-orders set

---

## Local Setup

### 1) Install
npm i

2) Environment variables

Create .env from the example:

cp .env.example .env


Example .env:

PORT=3000
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/oee?schema=public"
REDIS_URL="redis://localhost:6379"

3) Start PostgreSQL & Redis

You can use local installs or Docker. Required:

PostgreSQL on localhost:5432

Redis on localhost:6379

4) Prisma setup
npx prisma generate
npx prisma migrate dev --name init

5) Run the server
npm run dev


Server will start at:

HTTP: http://localhost:3000

WebSocket: ws://localhost:3000

API Reference
Health Check

GET /health

Response:

{
  "ok": true,
  "service": "order-execution-engine",
  "env": "development"
}

Create / Execute Order

POST /api/orders/execute

Headers:

Content-Type: application/json


Body:

{
  "tokenIn": "SOL",
  "tokenOut": "USDC",
  "amountIn": 1.5,
  "slippageBps": 50
}


Response:

{
  "orderId": "uuid",
  "wsUrl": "/ws/orders/<orderId>"
}

WebSocket Order Status Stream

Connect to:

ws://localhost:3000/ws/orders/<orderId>


You will receive:

Snapshot (latest known state)

Live events with increasing sequence numbers

Event lifecycle:

pending

routing

building

submitted

confirmed (includes txHash, executedPrice, chosenDex)

failed (includes error reason)

Example event:

{
  "type": "confirmed",
  "orderId": "...",
  "seq": 5,
  "txHash": "mock_...",
  "executedPrice": 123.45,
  "chosenDex": "meteora"
}

Get Order Details

GET /api/orders/:orderId

Returns full persisted state including quotes, routing decision, and final result.

Active Orders

GET /api/orders/active

Returns orders currently being processed:

{
  "activeCount": 2,
  "orderIds": ["id1", "id2"]
}

Recent Orders

GET /api/orders/recent?limit=20

Returns recently created orders from the database.

Load Testing (100+ orders/min)
npx tsx scripts/loadTest.ts http://localhost:3000 100


Example output:

Done. Sent 100 orders in 800ms (~7500 orders/min)

Testing

Includes 10+ unit and integration tests covering:

Routing logic

Retry & failure behavior

Queue execution

HTTP endpoints

WebSocket lifecycle

Run tests:

npm test

Notes

This is a mock execution engine (no real funds moved)

Designed to cleanly support real Solana devnet execution later

Worker and API run in the same process for simplicity (can be split in production)

Demo Expectations

Submit multiple orders simultaneously

Observe real-time WebSocket updates

Show routing decisions in logs

Verify concurrency via active orders

Demonstrate retry and failure handling

License

MIT


---

If you want next:
- **Postman Collection JSON**
- **Docker Compose (Postgres + Redis)**
- **Deployment guide (Render / Railway / Fly.io)**

Just tell me which one.
