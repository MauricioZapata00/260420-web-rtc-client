# WebRTC Client

## Architecture

```
root/
├── .eslintrc.cjs
├── .gitignore
├── Dockerfile
├── nginx.conf
├── package.json
├── svelte.config.js
├── vite.config.js
├── static/
│   └── favicon.png
└── src/
    ├── app.html
    ├── routes/
    │   ├── +layout.svelte              # Root layout — mounts global shell components
    │   ├── +page.svelte                # Home / connection entry point
    │   └── room/
    │       └── +page.svelte            # Active WebRTC session page
    └── lib/
        ├── components/
        │   ├── alerts/
        │   │   └── ConnectionAlert.svelte
        │   ├── buttons/
        │   │   └── ConnectButton.svelte
        │   ├── indicators/
        │   │   └── ConnectionStateIndicator.svelte
        │   └── video/
        │       ├── LocalVideo.svelte
        │       └── RemoteVideo.svelte
        ├── stores/
        │   ├── index.ts
        │   └── connection.ts           # WebRTC connection state slice
        ├── services/
        │   ├── index.ts
        │   ├── sendOffer.ts            # POST SDP offer, receive answer
        │   └── sendIceCandidate.ts     # Trickle ICE via WebSocket
        ├── webrtc/
        │   ├── index.ts
        │   ├── peer.ts                 # PeerConnection factory and event wiring
        │   └── datachannel.ts          # DataChannel open/close/message handling
        └── integrations/
            └── signalingSocket.ts      # WebSocket client singleton for ICE exchange
```

---

## Design Principles

### SvelteKit mental model

- **Routes are thin**: `+page.svelte` files are orchestration shells — they bind stores to components and call services.
  Zero business logic lives inside them.
- **Reactive by default**: use Svelte stores (`writable`, `derived`, `readable`) as the single source of truth;
  components subscribe automatically with `$store` syntax. Never duplicate state inside a component when a store already
  owns it.
- **Load functions own data fetching**: any data needed before the page renders belongs in `+page.ts` or
  `+page.server.ts` as a `load` function, not in `onMount` inside the component.
- **Actions over event handlers for forms**: use Svelte form actions (`+page.server.ts` `actions`) instead of `fetch`
  calls wired directly in components when dealing with form submission.
- **Avoid two-way binding across boundaries**: `bind:` is fine inside a single component; across a parent/child
  boundary, prefer props down and dispatched events up (`createEventDispatcher` or the newer `$props` + callback pattern
  in Svelte 5).

### SOLID in Svelte

- **Single responsibility**: each `.svelte` file renders one UI concept. If a component needs more than one `<script>`
  concern, extract the logic into a store or a `lib/webrtc/` module.
- **Open/closed**: stores and services are extended by composing new derived stores or new service files — never by
  editing unrelated existing ones.
- **Liskov**: components that accept a `connection` prop must work correctly with any shape that satisfies the
  `Connection` TypeScript interface, not a concrete class.
- **Interface segregation**: define narrow TypeScript interfaces per consumer (`PeerEventMap`, `DataChannelMessage`,
  `SignalingMessage`) rather than one large union type.
- **Dependency inversion**: components depend on store interfaces and service function signatures, never on concrete
  WebRTC API objects directly. WebRTC construction is isolated in `lib/webrtc/peer.ts`.

---

## Module Responsibilities

- `routes/` — page shells and layouts only; import from `$lib`, dispatch store actions, render components.
- `lib/components/` — purely presentational Svelte components; receive data as props, emit events upward, contain no
  fetch calls and no direct store writes.
- `lib/stores/` — all reactive global state; one file per domain slice. Components read via `$store`; services write via
  exported store methods.
- `lib/services/` — one async function per backend operation; no UI logic, no direct store writes — return data and let
  the caller decide what to do with it.
- `lib/webrtc/` — WebRTC peer and data channel construction, event wiring, and lifecycle (offer, answer, ICE, track,
  close). This is the only place that touches `RTCPeerConnection` and `RTCDataChannel` directly.
- `lib/integrations/` — third-party singleton setup (WebSocket client, any auth SDK). Instantiated once, exported as a
  module-level singleton.

---

## WebRTC Events

All five server-side events have a corresponding client-side handler wired in `lib/webrtc/peer.ts`:

| Server event            | Client-side handler location |
|-------------------------|------------------------------|
| `connectionstatechange` | `pc.onconnectionstatechange` |
| `datachannel`           | `pc.ondatachannel`           |
| `message`               | `dc.onmessage`               |
| `close` (datachannel)   | `dc.onclose`                 |
| `track`                 | `pc.ontrack`                 |

Each handler writes to the appropriate store — components never register WebRTC event listeners directly.

---

## State Management

- All global state lives in `lib/stores/` as Svelte `writable` or `derived` stores.
- One file per domain slice (e.g. `connection.ts` for peer state, `messages.ts` for data channel messages).
- Stores export typed update functions alongside the store itself — consumers call the function, not `store.update()`
  directly, keeping mutation logic in one place.
- String constants for store action labels (if needed for debugging/logging) live in a `constants/` subfolder and are
  `SCREAMING_SNAKE_CASE`.

```ts
// lib/stores/connection.ts — example shape
export type ConnectionState = 'idle' | 'connecting' | 'connected' | 'failed' | 'closed';

interface ConnectionStore {
	state: ConnectionState;
	error: string | null;
}

export const connection = writable<ConnectionStore>({ state: 'idle', error: null });

export function setConnected() {
	connection.update(s => ({ ...s, state: 'connected', error: null }));
}

export function setFailed(error: string) {
	connection.update(s => ({ ...s, state: 'failed', error }));
}
```

---

## Styling

- Use **Tailwind CSS** utility classes exclusively for all styling — no custom CSS files, no `<style>` blocks, no inline
  `style` attributes unless dynamically computed.
- Component variants are expressed with conditional class strings (e.g. `clsx` or template literals), never with
  separate CSS classes.
- Responsive design uses Tailwind breakpoint prefixes (`sm:`, `md:`, `lg:`).
- Dark mode uses the `dark:` variant if required.

---

## Testing

- Unit tests live in `src/lib/**/*.test.ts`, co-located beside the file under test (e.g. `peer.test.ts` next to
  `peer.ts`).
- Use **Vitest** as the test runner and **@testing-library/svelte** for component tests.
- **Pure functions** (`lib/services/`, `lib/stores/` update functions): plain `test()` — no mocks needed.
- **WebRTC logic** (`lib/webrtc/`): mock `RTCPeerConnection` and `RTCDataChannel` with `vi.fn()` / `vi.stubGlobal()` to
  force each event and error path independently.
- **Component tests** (`lib/components/`): render with `@testing-library/svelte`, assert on DOM output and emitted
  events — never assert on internal store state from within a component test.
- **Store tests**: import the store and its update functions, call them, and assert on `get(store)` — no component
  mounting required.
- Cover happy path, every error variant, and boundary values for every exported function.

---

## Services

- One file per backend operation: `sendOffer.ts`, `sendIceCandidate.ts`, etc.
- Each file exports a single `async` function typed with explicit parameter and return types.
- No store reads or writes inside a service — accept what is needed as arguments, return the result.
- All services are re-exported from `lib/services/index.ts`; consumers import from the barrel.

```ts
// lib/services/sendOffer.ts — example shape
export async function sendOffer(offer: RTCSessionDescriptionInit): Promise<RTCSessionDescriptionInit> {
	const res = await fetch('/api/offer', {
		method: 'POST',
		headers: { 'Content-Type': 'application/json' },
		body: JSON.stringify(offer),
	});
	if (!res.ok) throw new Error(`Signaling error: ${res.status}`);
	return res.json();
}
```

---

## Naming Conventions

| Artifact         | Convention                                    | Example                         |
|------------------|-----------------------------------------------|---------------------------------|
| Components       | `PascalCase.svelte`                           | `RemoteVideo.svelte`            |
| Stores           | `camelCase.ts`, exported store in `camelCase` | `connection.ts` → `connection`  |
| Services         | `camelCase` verb + noun                       | `sendOffer.ts`                  |
| Types/interfaces | `PascalCase`, prefix `I` only if ambiguous    | `ConnectionState`, `PeerConfig` |
| Constants        | `SCREAMING_SNAKE_CASE`                        | `ICE_GATHERING_TIMEOUT`         |
| Test files       | same name as file under test + `.test.ts`     | `peer.test.ts`                  |

---

## Barrel Exports

Every `lib/` subfolder that is imported from outside exposes an `index.ts` barrel:

```ts
// lib/services/index.ts
export { sendOffer } from './sendOffer';
export { sendIceCandidate } from './sendIceCandidate';
```

Barrel files contain only `export` statements — no logic, no side effects.

---

## Code Style

- TypeScript everywhere — no `.js` files inside `src/`.
- Do NOT add comments to code unless the logic is genuinely non-obvious.
- When the user requests a commit message, use imperative mood (e.g. "Add ICE trickle support" not "Added ICE trickle
  support").
- No `any` types — use `unknown` and narrow, or define a proper interface.
- Prefer `const` over `let`; never use `var`.