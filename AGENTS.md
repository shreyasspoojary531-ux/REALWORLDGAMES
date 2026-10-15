# AGENTS.md

Instructions for AI coding agents working in this repository. Read this file fully before making any change.

## Project Goal

Convert a collection of standalone HTML games (in `legacy-games/`) into a single production-quality React application: a game hub where every game is playable inside one polished, consistent UI.

- `legacy-games/` is the **read-only source of truth** for game rules, mechanics and content. Never modify or delete it.
- The new app lives in `src/`. Do not embed old HTML via iframes or `dangerouslySetInnerHTML`.
- Preserve original gameplay unless it is a bug. Record every deviation in `CHANGELOG.md`.

## Card Territory (Nested Route Flow)

`legacy-games/card-territory.html` is not a single game. It contains **3 card games** reached through its own internal flow. Keep that same route flow in React.

1. Audit the file first: identify the 3 card games, how the user enters Card Territory, how the user picks a game, and how the user returns. Document this in `docs/AUDIT.md`.
2. Rebuild the same flow with nested routes under one parent, for example:
   - `/games/card-territory` is the Card Territory entry/selection screen (same order and logic as the original)
   - `/games/card-territory/<card-game-id>` is each of the 3 games
3. In the hub, Card Territory appears as **one card** that opens its selection screen. Do not flatten the 3 games into separate top-level hub entries.
4. Share what the 3 games have in common (deck, card component, shuffle/deal logic, scoring helpers) in `features/games/card-territory/shared/`. Each game keeps its own folder for its rules.
5. Each of the 3 games still gets the full set: start screen, HUD, pause, game-over/restart, how-to-play, error boundary and tests.
6. Back navigation, deep links and browser refresh must work on every nested route. High scores are stored per card game, not per Card Territory.
7. If the original flow has a bug, fix it but keep the same sequence of screens, and note the change in `CHANGELOG.md`.

Apply the same rule to any other HTML file that bundles several games: preserve its original flow as a nested route group.

## Tech Stack

- Vite + React 18 + TypeScript (strict)
- React Router, Tailwind CSS, Framer Motion, Zustand
- Vitest + React Testing Library
- ESLint + Prettier
- Add a new dependency only if it is well maintained and clearly justified; note the reason in `README.md`.

## Commands

```bash
npm install        # install dependencies
npm run dev        # start dev server
npm run build      # production build (must have zero warnings)
npm run preview    # preview production build
npm run lint       # ESLint
npm run typecheck  # tsc --noEmit
npm run test       # Vitest
npm run format     # Prettier
```

Before declaring any task done, run: `npm run lint && npm run typecheck && npm run test && npm run build`. Fix every failure.

## Folder Structure

```
src/
  app/                 routing, providers, layout
  components/          shared UI (Button, Card, Modal, Tabs, Toast, ...)
  features/
    games/<game-id>/   component, hooks, logic/, assets/, index.ts
    games/card-territory/   parent game with its own sub-routes (see "Card Territory")
    hub/               home, categories, search, favorites
    scores/            high scores and stats
  hooks/
  lib/                 storage wrapper, utilities
  styles/              tokens, global CSS
  types/
docs/                  AUDIT.md, DESIGN.md
legacy-games/          original HTML files (read-only)
```

## Game Architecture Rules

1. Every game implements the shared `Game` interface (`id`, `title`, `description`, `category`, `thumbnail`, `controls`, `component`) and is registered in one registry file. Adding a game must need only a new folder plus one registry entry.
2. Separate pure game logic (no React, unit-testable) from rendering.
3. Real-time games use `requestAnimationFrame` through a shared game-loop hook. Always clean up timers, intervals, listeners and animation frames on unmount.
4. Lazy-load each game with `React.lazy` and `Suspense`.
5. Wrap each game in its own error boundary so one crash never breaks the hub.
6. Every game has: start screen, HUD (score, timer, lives where relevant), pause menu, game-over screen with restart, and a how-to-play/controls panel.
7. Support keyboard, mouse and touch wherever the game allows.
8. No stubbed or placeholder games. Every game must be fully playable.

## UI and Design Rules

- Follow `docs/DESIGN.md`. If it does not exist yet, create it first (see Workflow).
- Use design tokens (colors, spacing, radius, elevation, motion) defined once in `src/styles/`; never hard-code one-off values in components.
- Dark and light themes plus system preference. Respect `prefers-reduced-motion`.
- Fully responsive from 360px mobile to ultrawide desktop.
- Consistent components across all games; no game gets a bespoke look that breaks the hub.
- Target quality: clean, modern, cohesive, and clearly better than typical game portals. Avoid generic templated looks.

## Code Quality Rules

- Strict TypeScript. No `any`, no `@ts-ignore` without a written reason.
- Small, focused components and functions. No duplicated logic, no dead code, no leftover `console.log`.
- Memoize deliberately, not by default. Keep game loops at 60fps.
- Persist data (high scores, favorites, settings) only through the typed storage wrapper in `src/lib/`.
- Accessibility: semantic HTML, visible focus states, correct ARIA, WCAG AA contrast, full keyboard navigation.
- Naming: `PascalCase` components, `camelCase` functions and variables, `kebab-case` folders for games.

## Testing Rules

- Unit tests for each game's pure logic.
- At least one smoke test per game (renders, starts, restarts).
- Tests for key shared components and the storage wrapper.
- A bug fix should include a regression test where practical.

## Workflow

1. **Audit** all games in `legacy-games/`; write findings to `docs/AUDIT.md` (rules, controls, scoring, assets, bugs, UI flaws).
2. **Design**: research well-regarded game hubs and portals, then write the patterns and design system to `docs/DESIGN.md`.
3. **Scaffold** the app, shared components, registry and hub.
4. **Convert** games one at a time. After each game: lint, typecheck, test, play it in the browser.
5. **Polish**: accessibility, performance (Lighthouse 90+ in all categories), responsive checks.
6. **Finalize**: `README.md`, `CHANGELOG.md`, final report.

Work phase by phase. Make sensible decisions and document them rather than asking questions; ask only when truly blocked.

## Definition of Done

- All games converted, playable and bug-free against the audit.
- Lint, typecheck, tests and production build all pass with zero warnings.
- `README.md` covers setup, scripts, structure, how to add a game, and tech decisions.
- `CHANGELOG.md` lists every bug fixed per game and every deliberate behavior change.
- Final report states games converted, bugs fixed, anything unresolved, and suggested next steps.

## Boundaries

- Never edit `legacy-games/`.
- Never commit secrets, API keys or `.env` files.
- Never use `--force`, rewrite git history, or delete branches without explicit instruction.
- Do not install global packages or change system configuration.
- If an instruction here conflicts with a direct request from the user, follow the user and mention the conflict.