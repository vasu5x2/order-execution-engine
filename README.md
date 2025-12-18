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
```bash
npm i
