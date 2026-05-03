# Live Scoreboard — API Module Specification

## Overview

This document specifies the backend module responsible for managing the **Live Scoreboard** feature. The module handles secure score updates triggered by user actions on the client, maintains a ranked leaderboard of the top 10 users, and pushes real-time updates to all connected clients.

---

## Table of Contents

1. [Architecture Summary](#architecture-summary)
2. [Endpoints](#endpoints)
3. [Authentication & Authorization](#authentication--authorization)
4. [Score Update Flow](#score-update-flow)
5. [Real-Time Broadcast](#real-time-broadcast)
6. [Data Models](#data-models)
7. [Security Considerations](#security-considerations)
8. [Error Handling](#error-handling)
9. [Improvement Recommendations](#improvement-recommendations)

---

## Architecture Summary
The module is composed of logical layers bellow:

```
Client (Browser)
    │
    ├── GET /api/action/actionToken     ──→  Action Controller
    │                                               │
    │                                               └── Action Service (generate action_id + action_token)
    ├── POST /api/scores/update         ──→  Score Update Controller
    │                                               │
    │                                               ├── Auth Middleware (JWT validation)
    │                                               ├── Action Verification Service
    │                                               ├── Score Service (write to DB)
    │                                               └── Leaderboard Cache (Redis)
    │
    └── WebSocket connection            ──→  Scoreboard Push Service
                                                    │
                                                    └── Broadcasts top-10 on score change
```

**Key infrastructure dependencies:**
- **Database**: PostgreSQL (persistent user scores)
- **Cache**: Redis (leaderboard snapshot, rate limiting)
- **Real-time transport**: WebSocket (via Socket.IO or native `ws`)
- **Auth**: JWT (JSON Web Tokens), issued at login

---

## Endpoints

### `GET /api/actions/actionToken`

Triggered by the client before updating score. Initializes a valid action and issues a secure token.

#### Request

| Field         | Location | Type     | Required | Description                                      |
|---------------|----------|----------|----------|--------------------------------------------------|
| `Authorization` | Header | `string` | ✅       | `Bearer <JWT token>`                             |

#### Response — `200 OK`

```json
{
  "action_id": "act_9f3c1a72",
  "action_token": "eyJhbGciOiJIUzI1NiIsInR5..."
}
```
### `POST /api/scores/update`

Triggered by the client upon successful completion of a user action.

#### Request

| Field         | Location | Type     | Required | Description                                      |
|---------------|----------|----------|----------|--------------------------------------------------|
| `Authorization` | Header | `string` | ✅       | `Bearer <JWT token>`                             |
| `action_id`   | Body     | `string` | ✅       | Unique identifier for the completed action       |
| `action_token`| Body     | `string` | ✅       | Server-issued one-time token proving the action was legitimately started |
| `timestamp`   | Body     | `number` | ✅       | Unix epoch (ms) of action completion on client   |

```json
// Example Request Body
{
  "action_id": "act_9f3c1a72",
  "action_token": "eyJhbGciOiJIUzI1NiIsInR5...",
  "timestamp": 1746278400000
}
```

#### Response — `200 OK`

```json
{
  "success": true,
  "new_score": 1450,
  "score_delta": 50,
  "rank": 3
}
```

#### Response — Error Codes

| HTTP Status | Code                    | Meaning                                                 |
|-------------|-------------------------|---------------------------------------------------------|
| `400`       | `INVALID_PAYLOAD`       | Missing or malformed request fields                     |
| `401`       | `UNAUTHORIZED`          | JWT missing, expired, or invalid                        |
| `403`       | `INVALID_ACTION_TOKEN`  | Action token already used, expired, or forged           |
| `429`       | `RATE_LIMITED`          | Too many score update requests in a short window        |
| `500`       | `INTERNAL_ERROR`        | Unexpected server error                                 |

---

### `GET /api/scores/leaderboard`

Returns the current top-10 leaderboard snapshot. Used for initial page load (before WebSocket is established).

#### Response — `200 OK`

```json
{
  "leaderboard": [
    { "rank": 1, "user_id": "usr_abc", "display_name": "PlayerOne", "score": 9800 },
    { "rank": 2, "user_id": "usr_def", "display_name": "Speedy",    "score": 8750 },
    ...
  ],
  "updated_at": 1746278400000
}
```

---

### `WebSocket /ws/scoreboard`

Persistent connection for receiving live leaderboard updates. The server pushes a new leaderboard payload to **all connected clients** whenever the top-10 changes.

#### Client → Server (on connect)

```json
{ "event": "subscribe", "token": "<JWT>" }
```

#### Server → Client (push on change)

```json
{
  "event": "leaderboard_update",
  "leaderboard": [ ... ],
  "updated_at": 1746278400000
}
```

> No polling needed. Clients only receive data when something changes.

---

## Authentication & Authorization

All score update requests **must** include a valid JWT in the `Authorization` header.

### JWT Validation Steps (Middleware)

1. Extract the token from the `Authorization: Bearer <token>` header.
2. Verify the signature using the application's secret key.
3. Confirm the token is not expired (`exp` claim).
4. Extract the `user_id` claim and attach it to the request context.
5. Reject with `401` on any failure.

### Action Token (One-Time Proof-of-Work)

To prevent clients from fabricating score update requests, the server issues an **action token** when a user begins an action (this happens at the action's start, in a separate flow not detailed here). The action token is:

- Cryptographically signed by the server
- Bound to the specific `user_id` and `action_id`
- Single-use (invalidated upon redemption)
- Short-lived (TTL: 5 minutes)

On `POST /api/scores/update`, the server **verifies and immediately invalidates** the token. Any replay attempt returns `403 INVALID_ACTION_TOKEN`.

---

## Score Update Flow

```
1. Client completes an action
2. Client sends POST /api/scores/update with JWT + action_token
3. Auth Middleware validates JWT → extracts user_id
4. Action Verification Service validates action_token:
      - Correct signature?
      - Not expired?
      - Not already redeemed?
      → Mark token as redeemed in Redis (with TTL)
5. Score Service:
      - Fetch current score for user_id from DB
      - Apply score delta (server-side, not client-provided)
      - Write updated score to DB (atomic increment)
6. Leaderboard Cache:
      - Update Redis sorted set (ZADD)
      - Fetch new top-10 (ZREVRANGE 0 9)
      - If top-10 has changed → trigger broadcast
7. Return 200 response to client with new_score + rank
8. WebSocket push to all connected clients (if leaderboard changed)
```

>  **Critical**: The score delta is **never** accepted from the client. It is determined entirely server-side based on the action type. This prevents tampering.

---

## Real-Time Broadcast

The Scoreboard Push Service maintains a registry of all active WebSocket connections. When a score change affects the top-10:

1. Compute new top-10 from Redis sorted set.
2. Compare with previous cached top-10 snapshot.
3. If different → broadcast `leaderboard_update` event to all subscribers.
4. Update the cached snapshot.

**Technology recommendation**: Use **Socket.IO** with a Redis adapter to support horizontal scaling across multiple server instances. All instances share the same Redis pub/sub channel.

---

## Data Models

### `users` (PostgreSQL)

| Column        | Type        | Notes                    |
|---------------|-------------|--------------------------|
| `id`          | `UUID`      | Primary key              |
| `display_name`| `VARCHAR`   | Shown on scoreboard      |
| `score`       | `INTEGER`   | Current cumulative score |
| `created_at`  | `TIMESTAMP` |                          |
| `updated_at`  | `TIMESTAMP` |                          |

### `action_tokens` (Redis)

| Key pattern                         | Value     | TTL       |
|-------------------------------------|-----------|-----------|
| `action_token:{token_hash}`         | `redeemed` or `pending` | 5 min |

### `leaderboard` (Redis Sorted Set)

| Key            | Members     | Score    |
|----------------|-------------|----------|
| `leaderboard`  | `user_id`   | `score`  |

> Use `ZADD`, `ZINCRBY`, and `ZREVRANGE 0 9 WITHSCORES` for efficient leaderboard operations.

---

## Security Considerations

| Threat                              | Mitigation                                                                 |
|-------------------------------------|----------------------------------------------------------------------------|
| Unauthenticated score injection     | JWT required on all update requests                                        |
| Replaying a valid action token      | Tokens are single-use; redeemed state stored in Redis                      |
| Client-side score manipulation      | Score delta is server-determined, never client-provided                    |
| Brute-force token forgery           | Tokens are HMAC-signed; rate limiting on the endpoint                      |
| Rapid-fire automated requests       | Rate limiter: max 10 requests/minute per `user_id` (Redis sliding window)  |
| WebSocket flooding                  | JWT required to subscribe; unauthenticated connections are dropped          |
| Horizontal scaling race conditions  | Atomic Redis operations prevent double-counting                            |

---

## Error Handling

All errors follow a consistent envelope:

```json
{
  "success": false,
  "error": {
    "code": "INVALID_ACTION_TOKEN",
    "message": "The action token has already been used or has expired."
  }
}
```

- All `5xx` errors are logged with full context (user_id, action_id, stack trace) and never expose internal details to the client.
- `4xx` errors return descriptive messages safe for client consumption.

---

## Improvement Recommendations

### 1. Audit Log Table
Persist every score update event (user, action, delta, timestamp, IP address) to a database audit table. This creates an immutable record useful for detecting anomalies, investigating disputes, and retrospective security analysis.

### 2. Anomaly Detection
Implement a background job that flags users whose score velocity is statistically abnormal (e.g., far exceeds the 99th percentile). Flag for manual review rather than auto-banning, to avoid false positives.

### 3. Regional Leaderboards / Scoping
The current spec covers a global top-10. Future scoping (by time window — daily, weekly, all-time — or by region) should be planned for from the start at the data model level, since it's expensive to retrofit.