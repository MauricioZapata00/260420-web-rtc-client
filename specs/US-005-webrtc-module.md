# US-005 — WebRTC Module

## Goal

Implement the `RTCPeerConnection` factory, event wiring, and `RTCDataChannel` lifecycle so the application can
establish audio/video and text communication with the SFU server.

## Context

Per `CLAUDE.md`, `lib/webrtc/` is the **only** place that touches `RTCPeerConnection` and `RTCDataChannel` directly.
All five server-side events have corresponding client-side handlers here. Each handler writes to the appropriate store
via the exported update functions from `lib/stores/` — components never register WebRTC event listeners directly.

**Server ICE servers (from `web-rtc-server/README.md`):**

```
stun:stun.l.google.com:19302
stun:stun1.l.google.com:19302
```

**Data channel name:** `'chat'` (opened by the browser, not the server).

## Acceptance Criteria

### `lib/webrtc/peer.ts`

- [ ] Exports `function createPeerConnection(): RTCPeerConnection`.
    - Configures `iceServers` with Google's two STUN servers.
    - Wires all five event handlers before returning.
- [ ] `pc.onconnectionstatechange` — calls `setConnected` / `setFailed` / `setClosed` from `lib/stores/connection.ts`
  based on `pc.connectionState`.
- [ ] `pc.ondatachannel` — receives the server-reflected data channel; wires `onmessage` and `onclose` via
  `lib/webrtc/datachannel.ts`.
- [ ] `pc.ontrack` — appends the received `MediaStream` to the remote video store (see US-006 — `remoteStreams` store).
- [ ] Exports `async function initiateConnection(): Promise<{ pc: RTCPeerConnection; peerId: string }>`.
    - Creates a peer connection.
    - Adds a `'chat'` data channel via `openDataChannel(pc)` (from `lib/webrtc/datachannel.ts`).
    - Creates an SDP offer with `createOffer()`, sets it as local description.
    - Calls `sendOffer` from `lib/services/` and receives the `OfferResponse`.
    - Sets the remote description from the answer SDP.
    - Calls `setConnecting()` before the offer, `setConnected(peerId)` after the answer is applied.
    - Returns `{ pc, peerId }`.
    - On any error, calls `setFailed(error.message)` and re-throws.

### `lib/webrtc/datachannel.ts`

- [ ] Exports `function openDataChannel(pc: RTCPeerConnection): RTCDataChannel`.
    - Calls `pc.createDataChannel('chat')`.
    - Wires `onopen`, `onclose`, and `onmessage`.
    - Returns the data channel.
- [ ] `dc.onmessage` — parses the JSON `ChatMessage` and calls `addMessage` from `lib/stores/messages.ts`.
- [ ] `dc.onclose` — no-op (connection state is tracked via `pc.onconnectionstatechange`).
- [ ] Exports `function sendChatMessage(dc: RTCDataChannel, text: string): void`.
    - Calls `dc.send(text)`.
    - Only sends when `dc.readyState === 'open'` — silently drops otherwise.

### `lib/webrtc/index.ts`

- [ ] Re-exports `createPeerConnection`, `initiateConnection` from `peer.ts`.
- [ ] Re-exports `openDataChannel`, `sendChatMessage` from `datachannel.ts`.

### Tests

#### `lib/webrtc/peer.test.ts`

- [ ] Use `vi.stubGlobal('RTCPeerConnection', ...)` to replace the global with a mock class.
- [ ] `createPeerConnection()` — asserts that `RTCPeerConnection` was constructed with the two Google STUN servers.
- [ ] `pc.onconnectionstatechange` with `connectionState = 'connected'` → assert `setConnected` store function is
  called.
- [ ] `pc.onconnectionstatechange` with `connectionState = 'failed'` → assert `setFailed` is called.
- [ ] `pc.onconnectionstatechange` with `connectionState = 'closed'` → assert `setClosed` is called.
- [ ] `pc.ontrack` — fires with a mock `MediaStreamTrack`; asserts the remote streams store is updated.
- [ ] `initiateConnection()` happy path: mock `sendOffer` resolves with a valid `OfferResponse`; assert `setConnected`
  is called with the returned `peer_id`.
- [ ] `initiateConnection()` error path: mock `sendOffer` rejects; assert `setFailed` is called and the error is
  re-thrown.

#### `lib/webrtc/datachannel.test.ts`

- [ ] Mock `RTCDataChannel` with `vi.fn()`.
- [ ] `openDataChannel`: assert `createDataChannel('chat')` is called on the peer connection mock.
- [ ] `dc.onmessage` with valid `ChatMessage` JSON → assert `addMessage` store function is called with the correct
  message.
- [ ] `dc.onmessage` with malformed JSON → does not throw (handles parse errors gracefully).
- [ ] `sendChatMessage` when `dc.readyState === 'open'` → assert `dc.send` is called with the text.
- [ ] `sendChatMessage` when `dc.readyState === 'connecting'` → assert `dc.send` is NOT called.

## Out of Scope

- ICE candidate exchange over WebSocket (covered by US-006 — integrations).
- Renegotiation handling (handled in US-006).
- Adding local media tracks to the peer connection (covered by US-007 — room page route).
