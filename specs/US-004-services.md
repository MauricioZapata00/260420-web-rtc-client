# US-004 — Services

## Goal

Implement the two HTTP-level service functions that talk to the server's REST API so the WebRTC module has a clean,
typed interface to initiate and complete the SDP handshake.

## Context

Per `CLAUDE.md`, each service file exports a single `async` function with explicit parameter and return types. Services
make no store reads or writes — they accept what they need as arguments and return the result. The caller decides what
to do with it.

**Server contract (from `web-rtc-server/README.md`):**

- `POST /offer` — body `{ sdp: string }`, response `{ peer_id: string; sdp: string }`.
- HTTP 500 on error (plain-text body with the error message).

## Acceptance Criteria

### `lib/services/sendOffer.ts`

- [ ] Exports `async function sendOffer(offer: RTCSessionDescriptionInit): Promise<OfferResponse>`.
- [ ] Sends `POST /offer` with `Content-Type: application/json` and body `{ sdp: offer.sdp }`.
- [ ] On HTTP 200, returns the parsed `OfferResponse` (`{ peer_id, sdp }`).
- [ ] On any non-OK response, throws `new Error(`Signaling error: ${res.status}`)`.
- [ ] Has no store reads or writes.

### `lib/services/sendIceCandidate.ts`

- [ ] Exports `function sendIceCandidate(ws: WebSocket, candidate: RTCIceCandidate): void`.
- [ ] Serialises the candidate as `IceWsClientMessage` with `type: 'candidate'` and the appropriate `data` fields.
- [ ] Calls `ws.send(JSON.stringify(msg))`.
- [ ] Has no store reads or writes, no `async`/`await`, no `fetch`.

### `lib/services/sendRenegotiationAnswer.ts`

- [ ] Exports `function sendRenegotiationAnswer(ws: WebSocket, answer: RTCSessionDescriptionInit): void`.
- [ ] Serialises the answer as `IceWsClientMessage` with `type: 'answer'` and `data: { sdp: answer.sdp }`.
- [ ] Calls `ws.send(JSON.stringify(msg))`.
- [ ] Has no store reads or writes, no `async`/`await`, no `fetch`.

### `lib/services/index.ts`

- [ ] Re-exports `sendOffer`, `sendIceCandidate`, and `sendRenegotiationAnswer`.
- [ ] Contains only `export` statements — no logic.

### Tests

#### `lib/services/sendOffer.test.ts`

- [ ] Plain `test()` blocks — mock `globalThis.fetch` with `vi.stubGlobal`.
- [ ] Happy path: mock returns 200 with `{ peer_id: 'uuid', sdp: 'answer-sdp' }` — asserts the return value matches.
- [ ] Error path: mock returns 500 — asserts a thrown `Error` containing `'500'`.
- [ ] Verifies `fetch` is called with method `'POST'` and the correct `Content-Type` header.

#### `lib/services/sendIceCandidate.test.ts`

- [ ] Creates a mock `WebSocket` object with `vi.fn()` for `send`.
- [ ] Calls `sendIceCandidate(ws, candidate)` and asserts `ws.send` was called once.
- [ ] Parses the sent string and asserts `type === 'candidate'` and the candidate fields are correct.
- [ ] Asserts `ws.send` is not called when candidate is `null` (guard for null candidates from `onicecandidate`).

#### `lib/services/sendRenegotiationAnswer.test.ts`

- [ ] Creates a mock `WebSocket` with `vi.fn()` for `send`.
- [ ] Calls `sendRenegotiationAnswer(ws, answer)` and asserts `ws.send` was called once.
- [ ] Parses the sent string and asserts `type === 'answer'` and `data.sdp` matches.

## Out of Scope

- Authentication headers or tokens.
- Retry logic or exponential back-off.
- The ICE WebSocket lifecycle (covered by US-005 — integrations).
