# US-002 — TypeScript Types

## Goal

Define all shared TypeScript interfaces and types so every module has a single source of truth for data shapes.

## Context

Per `CLAUDE.md`, no `any` types are allowed. All interfaces must be narrow and purpose-specific (Interface Segregation).
Types live in `lib/` co-located with the module that owns them or in a dedicated `lib/types.ts` if shared across more
than two modules. The server API contract is defined in the server's `README.md`.

**Server API shapes the client must mirror:**

| Server endpoint    | Client type            |
| ------------------ | ---------------------- |
| `POST /offer` body | `SdpOffer`             |
| `POST /offer` resp | `OfferResponse`        |
| `GET /ws/ice` msg  | `IceWsMessage` (union) |
| Data channel msg   | `ChatMessage`          |

## Acceptance Criteria

### `lib/types.ts`

- [ ] `SdpOffer` — `{ sdp: string }` — matches `POST /offer` request body.
- [ ] `OfferResponse` — `{ peer_id: string; sdp: string }` — matches `POST /offer` response body.
- [ ] `IceCandidate` — `{ candidate: string; sdp_mid: string | null; sdp_mline_index: number | null }` — matches the
      ICE candidate shape in the WebSocket protocol.
- [ ] `IceWsMessage` — discriminated union with `type` field:
  - `{ type: 'candidate'; data: IceCandidate }` — server sends a gathered ICE candidate.
  - `{ type: 'done' }` — server ICE gathering complete.
  - `{ type: 'offer'; data: { sdp: string } }` — SFU renegotiation offer.
- [ ] `IceWsClientMessage` — discriminated union of messages the browser sends:
  - `{ type: 'candidate'; data: IceCandidate }` — browser-gathered ICE candidate.
  - `{ type: 'answer'; data: { sdp: string } }` — reply to an SFU renegotiation offer.
- [ ] `ChatMessage` — `{ from: string; text: string }` — data-channel message shape (server stamps `from`).
- [ ] `ConnectionState` — `'idle' | 'connecting' | 'connected' | 'failed' | 'closed'`.
- [ ] `MediaState` — `{ cameraEnabled: boolean; micEnabled: boolean }`.
- [ ] All types are `export`ed and re-exported from `lib/stores/index.ts` and `lib/webrtc/index.ts` as appropriate.

### Tests (`lib/types.test.ts`)

- [ ] Plain `test()` — no mocks, no async.
- [ ] JSON round-trip for `SdpOffer`, `OfferResponse`, `IceCandidate`, `ChatMessage`.
- [ ] Narrowing: verify that a parsed `IceWsMessage` with `type: 'candidate'` satisfies the `candidate` branch.
- [ ] Narrowing: verify that a parsed `IceWsMessage` with `type: 'done'` satisfies the `done` branch.

## Out of Scope

- Runtime validation / parsing (no Zod or io-ts — types are compile-time only).
- Store initialisation (covered by US-003).
