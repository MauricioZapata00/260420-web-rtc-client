# US-006 — Integrations (Signaling WebSocket)

## Goal

Implement the WebSocket singleton that handles bidirectional ICE candidate exchange and SFU renegotiation, completing
the trickle-ICE flow after the SDP handshake.

## Context

Per `CLAUDE.md`, `lib/integrations/` holds third-party singleton setup. The signaling WebSocket is opened immediately
after `POST /offer` succeeds and stays alive for the duration of the session.

**Server WebSocket contract (from `web-rtc-server/README.md`):**

- Endpoint: `GET /ws/ice?peer_id=<uuid>`
- Server → client messages: `candidate`, `done`, `offer` (SFU renegotiation).
- Client → server messages: `candidate`, `answer`.

The WebSocket is module-level singleton — one instance per session, replaced on reconnect.

## Acceptance Criteria

### `lib/integrations/signalingSocket.ts`

- [ ] Exports `function openSignalingSocket(pc: RTCPeerConnection, peerId: string): WebSocket`.
    - Opens `new WebSocket(\`/ws/ice?peer_id=${peerId}\`)` (path-relative so Nginx proxying works).
    - Wires `pc.onicecandidate` → calls `sendIceCandidate(ws, candidate)` from `lib/services/` for every non-null
      candidate.
    - On `ws.onmessage` with `type: 'candidate'` → calls `pc.addIceCandidate(msg.data)`.
    - On `ws.onmessage` with `type: 'done'` → no-op (ICE gathering complete; log at debug level if needed).
    - On `ws.onmessage` with `type: 'offer'` (SFU renegotiation):
        1. `pc.setRemoteDescription({ type: 'offer', sdp: msg.data.sdp })`.
        2. `pc.createAnswer()` and `pc.setLocalDescription(answer)`.
        3. Calls `sendRenegotiationAnswer(ws, answer)` from `lib/services/`.
    - Returns the `WebSocket` instance to the caller.
- [ ] Exports `function closeSignalingSocket(ws: WebSocket): void`.
    - Calls `ws.close()` if `ws.readyState` is `OPEN` or `CONNECTING`.

### Tests (`lib/integrations/signalingSocket.test.ts`)

- [ ] Mock `globalThis.WebSocket` with `vi.stubGlobal`.
- [ ] Mock `RTCPeerConnection` with `vi.fn()` / `vi.stubGlobal`.
- [ ] `openSignalingSocket` — asserts `WebSocket` is constructed with a URL containing the `peer_id`.
- [ ] `pc.onicecandidate` fires with a valid candidate → asserts `ws.send` is called once with a `candidate` message.
- [ ] `pc.onicecandidate` fires with `null` candidate → asserts `ws.send` is NOT called.
- [ ] `ws.onmessage` with `type: 'candidate'` → asserts `pc.addIceCandidate` is called with the candidate data.
- [ ] `ws.onmessage` with `type: 'done'` → no error thrown, no side effects on the peer connection.
- [ ] `ws.onmessage` with `type: 'offer'` → asserts `pc.setRemoteDescription`, `pc.createAnswer`,
  `pc.setLocalDescription`, and `ws.send` (with `type: 'answer'`) are each called once.
- [ ] `ws.onmessage` with unknown `type` → no error thrown.
- [ ] `closeSignalingSocket` when `readyState === OPEN` → asserts `ws.close()` is called.
- [ ] `closeSignalingSocket` when `readyState === CLOSED` → asserts `ws.close()` is NOT called.

## Out of Scope

- Reconnection / back-off logic.
- Authentication headers on the WebSocket upgrade.
- Media track negotiation beyond renegotiation triggered by `type: 'offer'`.
