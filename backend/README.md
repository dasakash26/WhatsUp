# whatsup-server

REST API + WebSocket server for a real-time group chat application.

- **Data flow**: all mutations go over HTTP; after each DB write the controller calls `server.publish(chat_${chatId}, payload)`, fanning out typed event frames (`NEW_MESSAGE`, `EDIT_MESSAGE`, `DELETE_MESSAGE`) to all WS subscribers in that room.
- **Auth**: Clerk RS256 JWT — token extracted from `Authorization` header or `?clerkToken` query param, verified against `CLERK_PEM_PUBLIC_KEY`, resolved to a Prisma user.
- **Media**: multipart uploads streamed to Cloudinary.
- **Calling**: Stream SDK issues signed JWTs for video/audio room entry.

## Stack

| Layer | Technology |
|---|---|
| Runtime | Bun |
| HTTP Framework | Hono (RPC-chained, typed) |
| ORM | Prisma + `@prisma/adapter-pg` |
| Database | PostgreSQL |
| Auth | Clerk (`@clerk/hono`, RS256 token verification) |
| Real-time | Bun native WebSocket pub/sub |
| Media | Cloudinary |
| Calling | Stream SDK |

## Design

**REST → WS fan-out**: Every write endpoint (`POST /api/message/:chatId`, `PATCH /api/message/:messageId`, `DELETE /api/message/:messageId`) completes its DB transaction via Prisma, then calls `server.publish(chat_${chatId}, payload)` to broadcast typed events (`NEW_MESSAGE`, `EDIT_MESSAGE`, `DELETE_MESSAGE`) to all subscribers on that chat topic.

**Hono RPC**: All sub-routers are chained (`.get()`, `.post()` etc.) on a single `Hono` instance before export. `AppType` is derived from the app definition and consumed by `hc<AppType>()` on the frontend for end-to-end type safety with zero codegen.

**Auth**: `requireCurrentUser()` extracts the Clerk token from the `Authorization` header or `clerkToken` query param, verifies it against `CLERK_PEM_PUBLIC_KEY`, and resolves the Prisma user record. All chat and message routes gate behind this.

## Setup

```bash
bun install
bun prisma:generate
cp .env.example .env   # fill in keys
```

```bash
bun dev    # --watch
bun start  # production
```

## Tests

33 integration tests, 8 suites, **>90% route coverage**. Covers auth gating (`403`), input validation (`400`), full CRUD lifecycles, and sequential WS pub/sub propagation (`NEW_MESSAGE` → `EDIT_MESSAGE` → `DELETE_MESSAGE`). Clerk, Stream, and Cloudinary are mock-intercepted via `mock.module()` in `tests/mocks.ts`. Server binds to port `0` (OS-assigned) to avoid conflicts.

```bash
bun test
bun x tsc --noEmit
```
