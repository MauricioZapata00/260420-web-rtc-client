# US-003 — Stores

## Goal

Create all reactive global-state slices so components and WebRTC event handlers have a single source of truth to read
from and write to.

## Context

Per `CLAUDE.md`, all global state lives in `lib/stores/` as Svelte `writable` or `derived` stores. One file per domain
slice. Stores export typed update functions alongside the store — consumers call the function, never `store.update()`
directly. Components read with `$store` syntax; WebRTC event handlers in `lib/webrtc/peer.ts` write via the exported
functions.

## Acceptance Criteria

### `lib/stores/connection.ts`

- [ ] Exports `connection` — a `writable<ConnectionStore>` initialised to `{ state: 'idle', error: null }`.
  - `ConnectionStore` shape: `{ state: ConnectionState; error: string | null }`.
- [ ] Exports `peerId` — a `writable<string | null>` initialised to `null`. Holds the UUID returned by `POST /offer`.
- [ ] Exports `setConnecting()` — sets state to `'connecting'`, clears error.
- [ ] Exports `setConnected(peerId: string)` — sets state to `'connected'`, stores the peer ID, clears error.
- [ ] Exports `setFailed(error: string)` — sets state to `'failed'`, stores the error message.
- [ ] Exports `setClosed()` — sets state to `'closed'`, clears error.
- [ ] Exports `resetConnection()` — resets both `connection` and `peerId` to their initial values.

### `lib/stores/media.ts`

- [ ] Exports `media` — a `writable<MediaStore>` initialised to `{ cameraEnabled: true, micEnabled: true }`.
  - `MediaStore` shape: `{ cameraEnabled: boolean; micEnabled: boolean }`.
- [ ] Exports `toggleCamera()` — flips `cameraEnabled`.
- [ ] Exports `toggleMic()` — flips `micEnabled`.
- [ ] Exports `setCamera(enabled: boolean)` — sets `cameraEnabled` to the given value.
- [ ] Exports `setMic(enabled: boolean)` — sets `micEnabled` to the given value.

### `lib/stores/messages.ts`

- [ ] Exports `messages` — a `writable<ChatMessage[]>` initialised to `[]`.
- [ ] Exports `addMessage(msg: ChatMessage)` — appends a message to the list (immutably).
- [ ] Exports `clearMessages()` — resets the list to `[]`.

### `lib/stores/index.ts`

- [ ] Re-exports all stores and their update functions from the three slice files above.
- [ ] Contains only `export` statements — no logic.

### Tests

#### `lib/stores/connection.test.ts`

- [ ] Plain `test()` with `get(store)` assertions — no component mounting.
- [ ] Initial state is `{ state: 'idle', error: null }` and `peerId` is `null`.
- [ ] `setConnecting()` → state is `'connecting'`, error is `null`.
- [ ] `setConnected('uuid-1')` → state is `'connected'`, `peerId` is `'uuid-1'`, error is `null`.
- [ ] `setFailed('timeout')` → state is `'failed'`, error is `'timeout'`.
- [ ] `setClosed()` → state is `'closed'`, error is `null`.
- [ ] `resetConnection()` → state is `'idle'`, `peerId` is `null`, error is `null`.

#### `lib/stores/media.test.ts`

- [ ] Initial state is `{ cameraEnabled: true, micEnabled: true }`.
- [ ] `toggleCamera()` twice returns to initial value.
- [ ] `toggleMic()` twice returns to initial value.
- [ ] `setCamera(false)` then `setCamera(true)` restores initial value.
- [ ] `setMic(false)` then `setMic(true)` restores initial value.

#### `lib/stores/messages.test.ts`

- [ ] Initial state is `[]`.
- [ ] `addMessage(msg)` appends without mutating the previous array reference.
- [ ] Two `addMessage` calls produce a list of length 2 in insertion order.
- [ ] `clearMessages()` after two messages resets to `[]`.

## Out of Scope

- Persisting state to `localStorage` or cookies.
- Derived stores for computed values (add later if needed).
