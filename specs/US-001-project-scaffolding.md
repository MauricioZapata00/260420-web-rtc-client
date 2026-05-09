# US-001 — Project Scaffolding

## Goal

Replace the default SvelteKit template with the folder structure defined in `CLAUDE.md` so every subsequent user story
has a compilable, correctly-wired place to land.

## Context

The project currently contains SvelteKit's default demo files (`sverdle`, `about`, `Counter.svelte`, `Header.svelte`,
`layout.css`, etc.). These must be removed. The target structure (per `CLAUDE.md`) is:

```
src/
├── app.html
├── app.d.ts
├── hooks.ts
├── hooks.server.ts
├── routes/
│   ├── +layout.svelte
│   ├── +page.svelte
│   └── room/
│       └── +page.svelte
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
    │   └── connection.ts
    ├── services/
    │   ├── index.ts
    │   ├── sendOffer.ts
    │   └── sendIceCandidate.ts
    ├── webrtc/
    │   ├── index.ts
    │   ├── peer.ts
    │   └── datachannel.ts
    └── integrations/
        └── signalingSocket.ts
```

## Acceptance Criteria

- [ ] All demo routes (`sverdle/`, `about/`) and their files are deleted.
- [ ] Demo components at the routes level (`Counter.svelte`, `Header.svelte`, `layout.css`) are deleted.
- [ ] The `lib/images/` folder is deleted (no longer needed).
- [ ] The `lib/vitest-examples/` folder is deleted.
- [ ] `routes/+layout.svelte` exists as a minimal root layout shell (no demo markup).
- [ ] `routes/+page.svelte` exists as an empty orchestration shell for the home/join page.
- [ ] `routes/room/+page.svelte` exists as an empty orchestration shell for the active room page.
- [ ] All six `lib/` subdirectories exist (`components/`, `stores/`, `services/`, `webrtc/`, `integrations/`).
- [ ] Every `lib/` subdirectory that is imported from outside has an `index.ts` barrel file (export-only, no logic).
- [ ] All `.svelte` component stubs exist and render an empty `<div>` placeholder.
- [ ] All `.ts` module stubs exist and export their public surface as empty / `TODO` placeholders.
- [ ] `npm run check` (svelte-check) passes with zero errors.
- [ ] `npm run build` succeeds.

## Dependencies Added (`package.json`)

| Package             | Purpose                                                        |
|---------------------|----------------------------------------------------------------|
| `tailwindcss`       | Utility-first CSS framework (see `CLAUDE.md`)                  |
| `@tailwindcss/vite` | Vite integration for Tailwind CSS                              |
| `clsx`              | Conditional class-name helper                                  |
| `vitest`            | Test runner                                                    |
| `jsdom`             | DOM environment for Vitest — used by component and store tests |

## Out of Scope

- Actual business logic (covered by US-002 through US-008).
- Tailwind theme customisation beyond the default config.
- Any network calls or WebRTC API usage.
