# US-007 — Components

## Goal

Build all presentational Svelte components so the room page and home page have complete, styled UI building blocks
ready to assemble.

## Context

Per `CLAUDE.md`, `lib/components/` contains purely presentational components. They receive data as props, emit events
upward, and contain no `fetch` calls and no direct store writes. Tailwind CSS utility classes are used exclusively for
styling — no `<style>` blocks.

The room supports up to **30 simultaneous users**. The UI must accommodate this without becoming unusable. A scrollable
tile grid is the expected pattern for remote video.

## Acceptance Criteria

### `lib/components/video/LocalVideo.svelte`

- [ ] Accepts prop `stream: MediaStream | null`.
- [ ] Binds `stream` to a `<video>` element via `srcObject` (use `bind:this` + `$effect` / `onMount`).
- [ ] The video is always muted (prevent echo) and auto-plays.
- [ ] Shows a placeholder (dark rounded rectangle with an icon or initials) when `stream` is `null`.
- [ ] Accepts prop `cameraEnabled: boolean`; when `false`, overlays a visual indicator (e.g. a crossed-out camera icon)
  on the video tile.

### `lib/components/video/RemoteVideo.svelte`

- [ ] Accepts prop `stream: MediaStream`.
- [ ] Accepts prop `peerId: string` (displayed as a short label, e.g. last 8 chars of the UUID).
- [ ] Binds `stream` to a `<video>` element (NOT muted — this is remote audio).
- [ ] Auto-plays.

### `lib/components/video/VideoGrid.svelte`

- [ ] Accepts prop `streams: Array<{ peerId: string; stream: MediaStream }>`.
- [ ] Renders a `RemoteVideo` for each entry.
- [ ] Uses a CSS grid layout (Tailwind `grid`) that adapts to the number of participants:
  - 1–4 streams: 2-column grid.
  - 5–9 streams: 3-column grid.
  - 10+ streams: 4-column grid (scrollable overflow).
- [ ] When `streams` is empty, renders a message: `"Waiting for others to join…"`.

### `lib/components/buttons/ConnectButton.svelte`

- [ ] Accepts prop `disabled: boolean`.
- [ ] Emits a `connect` custom event when clicked.
- [ ] Shows label `"Join Room"` when not disabled; shows `"Connecting…"` when disabled.
- [ ] Styled with Tailwind; visually distinct disabled state (opacity + cursor).

### `lib/components/buttons/MediaToggleButton.svelte`

- [ ] Accepts props `type: 'camera' | 'mic'` and `enabled: boolean`.
- [ ] Emits a `toggle` custom event when clicked.
- [ ] Displays an icon or label indicating the current state (enabled / disabled).
- [ ] When `enabled` is `false`, applies a visual "off" style (e.g. red background or strikethrough icon).

### `lib/components/alerts/ConnectionAlert.svelte`

- [ ] Accepts prop `state: ConnectionState`.
- [ ] Renders nothing when `state === 'idle'` or `state === 'connected'`.
- [ ] Shows an info banner when `state === 'connecting'`: `"Connecting to room…"`.
- [ ] Shows an error banner when `state === 'failed'`: `"Connection failed. Please refresh."`.
- [ ] Shows a warning banner when `state === 'closed'`: `"Connection closed."`.
- [ ] Banners are dismissible (emit a `dismiss` event).

### `lib/components/indicators/ConnectionStateIndicator.svelte`

- [ ] Accepts prop `state: ConnectionState`.
- [ ] Renders a small coloured dot + label:
  - `idle` → grey dot, `"Idle"`.
  - `connecting` → yellow dot, `"Connecting"`.
  - `connected` → green dot, `"Connected"`.
  - `failed` → red dot, `"Failed"`.
  - `closed` → grey dot, `"Closed"`.

### `lib/components/chat/ChatPanel.svelte`

- [ ] Accepts prop `messages: ChatMessage[]`.
- [ ] Emits a `send` custom event with the message text when the user submits the chat form.
- [ ] Renders each message as `<peer-id-short>: <text>` (last 8 chars of `from` UUID).
- [ ] Auto-scrolls to the latest message when `messages` updates.
- [ ] Input clears after submission.
- [ ] Send button is disabled when the input is empty or the WebRTC data channel is not open (accepts prop
  `channelOpen: boolean`).

### Tests (`lib/components/**/*.test.ts`)

- [ ] Use `@testing-library/svelte` + `render()` — assert on DOM output and emitted events.
- [ ] **Never** assert on internal store state from within a component test.
- [ ] `LocalVideo.svelte` — renders placeholder when `stream` is `null`; renders `<video>` when stream is provided.
- [ ] `ConnectButton.svelte` — disabled when prop is `true`; emits `connect` on click.
- [ ] `MediaToggleButton.svelte` — emits `toggle` on click; label/style reflects `enabled` prop.
- [ ] `ConnectionAlert.svelte` — renders nothing for `idle`; correct text for each other state.
- [ ] `ConnectionStateIndicator.svelte` — correct label for each state.
- [ ] `ChatPanel.svelte` — emits `send` with input text on submit; input clears after submit; send disabled when input
  empty.

## Out of Scope

- Screen-share video tile (add as a separate component in a later story).
- Participant name display beyond the short UUID label.
- Message persistence or history beyond the current session.
