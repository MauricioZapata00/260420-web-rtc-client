# US-008 — Routes

## Goal

Wire the home page and room page routes so users can join a shared room and interact with audio, video, and chat.

## Context

Per `CLAUDE.md`, `routes/` files are thin orchestration shells — they bind stores to components, call services, and
contain zero business logic. The actual WebRTC and media logic lives in `lib/webrtc/` and `lib/integrations/`.

**User flow:**

1. User lands on `/` (home page) → clicks "Join Room".
2. Browser requests camera + microphone via `getUserMedia`.
3. Client calls `initiateConnection()` → `POST /offer` → receives `peerId` + SDP answer.
4. Client opens the signaling WebSocket via `openSignalingSocket(pc, peerId)`.
5. Client navigates to `/room`.
6. Room page displays local video, remote videos, chat panel, and media toggle buttons.
7. User can enable/disable camera and microphone at any time.
8. On page leave / browser close, peer connection and WebSocket are closed gracefully.

## Acceptance Criteria

### `routes/+layout.svelte`

- [ ] Minimal shell: renders `<slot />` (Svelte 4) or `{@render children()}` (Svelte 5).
- [ ] Imports Tailwind's base styles (via `app.css` or equivalent global import).
- [ ] Contains no application-specific markup.

### `routes/+page.svelte` (home / join page)

- [ ] Reads `$connection` store; passes `state` to `ConnectionAlert` and `ConnectionStateIndicator`.
- [ ] Renders `ConnectButton` with `disabled` bound to `$connection.state === 'connecting'`.
- [ ] On `connect` event from `ConnectButton`:
  1. Calls `getUserMedia({ audio: true, video: true })`.
  2. Stores the `MediaStream` locally (module-level `let`).
  3. Adds each track to the peer connection using `pc.addTrack(track, stream)` — the `pc` comes from
     `initiateConnection()`.
  4. Calls `initiateConnection()` and then `openSignalingSocket(pc, peerId)`.
  5. Navigates to `/room` using SvelteKit's `goto`.
- [ ] On `getUserMedia` error, calls `setFailed(error.message)`.
- [ ] Layout: centred card with the app title, `ConnectionStateIndicator`, `ConnectButton`, and `ConnectionAlert`.

### `routes/room/+page.svelte` (active room page)

- [ ] Reads `$connection`, `$media`, `$messages` stores.
- [ ] Renders `LocalVideo` with the local `MediaStream` and `cameraEnabled` from `$media`.
- [ ] Renders `VideoGrid` with the remote streams array (sourced from a `remoteStreams` store — see US-003 addendum
      below).
- [ ] Renders `ChatPanel` with `messages={$messages}` and `channelOpen` bound to data channel ready state.
- [ ] On `send` event from `ChatPanel`, calls `sendChatMessage(dc, text)` from `lib/webrtc/datachannel.ts`.
- [ ] Renders two `MediaToggleButton` components:
  - `type="camera"` with `enabled={$media.cameraEnabled}` → on `toggle`, calls `toggleCamera()` and
    enables/disables the video track on the local stream.
  - `type="mic"` with `enabled={$media.micEnabled}` → on `toggle`, calls `toggleMic()` and
    enables/disables the audio track on the local stream.
- [ ] On page destroy (`onDestroy` / Svelte 5 cleanup), calls `closeSignalingSocket(ws)` and `pc.close()`, then
      `resetConnection()` and `clearMessages()`.
- [ ] If `$connection.state` is not `'connected'` when the page mounts (e.g. direct URL access), redirects to `/`.
- [ ] Layout: two-column desktop layout (video grid left, chat panel right); single-column on mobile.

### US-003 Addendum — `lib/stores/remoteStreams.ts`

- [ ] Exports `remoteStreams` — a `writable<Array<{ peerId: string; stream: MediaStream }>>` initialised to `[]`.
- [ ] Exports `addRemoteStream(peerId: string, stream: MediaStream)` — appends a new entry.
- [ ] Exports `removeRemoteStream(peerId: string)` — removes the entry with the matching `peerId`.
- [ ] Exports `clearRemoteStreams()` — resets to `[]`.
- [ ] `lib/stores/index.ts` re-exports all four.
- [ ] `lib/webrtc/peer.ts` — `pc.ontrack` calls `addRemoteStream(peerId, event.streams[0])`.

### Tests

- [ ] Route files are not unit-tested directly (they are integration shells).
- [ ] `lib/stores/remoteStreams.test.ts` — plain `test()` covering initial state, `addRemoteStream`,
      `removeRemoteStream`
      (existing and non-existing peerId), and `clearRemoteStreams`.

## Out of Scope

- Authentication or named rooms (all users join a single shared room).
- Participant list panel beyond the video grid.
- Mobile push notifications.
- Recording or screen sharing.
