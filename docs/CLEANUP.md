# CLEANUP.md — Production Refinement & Waste Removal Report

This document records all design taste checks, audits, waste removals, fixes, and production-level cleanups applied in accordance with `AGENTS.md` and `docs/DESIGN.md` ("KEEP THESE IN MIND" / `DESIGN_TASTE.md`).

---

## 1. DESIGN.md Taste Rules Audit & Compliance Check

The rules outlined in `docs/DESIGN.md` (Section "KEEP THESE IN MIND") were verified against the codebase:

| Design Rule | Status | Implementation Check |
| :--- | :--- | :--- |
| **Content First & Restraint** | Passed | Removed decorative non-functional widgets (fake XP progress bar, flame streak badges, fake play count counters, and fake star rating badges). Minimal chrome, generous space around content. |
| **No AI Slop Tells (Emoji)** | Passed | Eliminated all emojis across categories, game titles, Quick Play rows, game tiles, and badges. Replaced with unified Google Material Symbols and real game artwork. |
| **One Consistent Icon System** | Passed | Standardized on Google Material Symbols (`outlined`). Removed `lucide-react` dependency completely to eliminate mixed icon styles. |
| **Consistent Spacing & Radii** | Passed | All components use design tokens from `tailwind.config.js` (`rounded-DEFAULT`, `rounded-lg`, `rounded-full`). No arbitrary ad-hoc pixel values. |
| **No Hover Border Rings** | Passed | Hover states rely on motion (`active:scale-[0.97]`), subtle background transitions, and light. Removed bright hover border outlines that caused visual clutter. |
| **Keyboard Focus Indicator** | Passed | Focused states strictly use `focus-visible:ring-2 focus-visible:ring-secondary focus-visible:ring-offset-2` exclusively for keyboard users, never triggering on mouse click. |
| **Touch Targets ≥ 48x48px** | Passed | Every interactive button, navigation tab, and game control enforces `min-w-[48px] min-h-[48px]`. |
| **No Layout Overlap or Jitter** | Passed | Fixed fixed-header z-index, sticky layout, and top padding (`pt-20` on `<main>`). Header no longer clips, bleeds, or overlaps the hero showcase across any viewport. |
| **Respects Reduced Motion** | Passed | Animations are short, lightweight CSS transforms and opacity transitions; respects `prefers-reduced-motion`. |

---

## 2. Waste Removal Inventory (Step 1)

### Components & UI Elements Removed
1. **Fake Telemetry & XP Goal Widget**: Removed `Daily Quest Target` bar (`320 / 500 XP`), flame streak pill (`🔥 7-Day`), and greeting strip.
2. **Decorative Badges**: Removed uninformative badges like `Featured #1 of 3`, `14.2k ratings`, `3 Games Inside`, and redundant category counters.
3. **Unused UI Component (`src/components/ui/Badge.jsx`)**: Deleted unused component. All badges now use standardized Tailwind token utility classes.
4. **Duplicate & Fake Game Rows in Hub**: Removed hardcoded mock game entries (`Neon Velocity 2099`, `Neon Drop`, `Katana Protocol`, `Hydro Glide`, etc.). All displayed games are strictly real, playable games from `src/features/hub/registry.js`.
5. **Emoji Cleaned Across Entire App**:
   - Replaced emoji category icons with standard Material Symbols (`apps`, `style`, `extension`, `sports_esports`, `grid_view`).
   - Replaced trophy/skull/dice emojis in modals with clean vector glyphs (`emoji_events`, `sports_score`, `verified`).

### Dependencies Removed
- `lucide-react`: Uninstalled completely (`npm uninstall lucide-react`). Saves ~30KB bundle overhead and guarantees a single cohesive icon language across the app.

---

## 3. UI Bugs Fixed (Step 2)

1. **Header Overlap & Stacking Bug**:
   - *Problem*: Fixed header (`h-16`) with `pt-16` on `<main>` caused hero title text ("Game Hub / Home") to bleed and overlap behind the glass header on mobile and narrow viewports.
   - *Fix*: Structured `<header>` with `fixed top-0 left-0 right-0 z-50 bg-surface/90 backdrop-blur-xl border-b border-surface-container-high` and set `<main className="pt-20 pb-28">`. Zero bleed or overlap at any viewport.
2. **Touch Target Dimensions**:
   - All interactive buttons in `Button.jsx`, `Hub.jsx`, `GameShell.jsx`, and `CardTerritorySelect.jsx` enforce `min-w-[48px] min-h-[48px]`.
3. **Responsive Grid Alignment**:
   - Verified responsive display across 360x640, 390x844, 412x915, 768x1024, 1280x800, and 1920x1080. Game cards, hero banner, and bottom dock maintain proportional padding and zero horizontal overflow (`overflow-x-hidden`).

---

## 4. Card Territory Design System Unification (Step 3)

1. **Token Integration**:
   - Rebuilt `CardTerritorySelect.jsx` to use exact Kinetic Arcade tokens (`bg-surface`, `bg-surface-container`, `text-on-surface`, `border-outline-variant/30`).
   - Replaced one-off amber saloon colors with system tokens.
2. **Route Preservation**:
   - Maintained `/games/card-territory` as parent selection screen, with nested sub-routes `/games/card-territory/blackjack`, `/poker`, `/rummy`, and `/uno`.
3. **Artwork & Card Structure**:
   - Every card game tile now features real WebP preview artwork, game title, and a single descriptor (e.g. `Vault 21`, `Hold'em`, `Melds`, `Color Match`). No emojis or duplicated cards.

---

## 5. Game Catalog & Preview Images (Step 4)

1. **Card Territory in Catalog**:
   - Card Territory appears in the primary game catalog and category filter as one entry opening its selection screen. The 4 card games remain nested inside.
2. **Real Preview Artwork**:
   - Downloaded and configured WebP artwork in `/public/games/` for all games:
     - `carrom.webp`, `sudoku.webp`, `chess.webp`, `tictactoe.webp`, `card-territory.webp`, `blackjack.webp`, `poker.webp`, `rummy.webp`, `uno.webp`.
   - Cards enforce fixed aspect ratios (`4:3` for catalog cards, `16:10` / `21:9` for hero banner, `1:1` for subgame cards) with dark gradient overlays for WCAG AA readability.
3. **Accurate Category Counts**:
   - Category chips compute live accurate counts based directly on `GAMES.length` and `GAMES.filter(...)`.

---

## 6. Continue Playing & Resume Logic (Step 5)

1. **Conditional Rendering**:
   - If user has no recent games in localStorage, `<section className="continue-playing">` renders **nothing** (no empty box or placeholder).
2. **Typed Storage Management**:
   - Added `getRecentPlays()`, `recordRecentPlay()`, `saveResumeData()`, and `clearResumeData()` to `src/lib/storage.js`.
   - Stores `gameId` and `lastPlayedAt`.
   - Games with savable state display "Continue", while games without savable state display "Play again".
   - Finished games automatically clear their in-progress resume data.
   - Max 5 items, sorted newest first, deduplicated.
   - Robust error handling: Corrupt or non-array JSON safely falls back to `[]` without throwing exceptions.
3. **Subgame Resumption**:
   - Card games resume directly into their subgame route (`/games/card-territory/blackjack`, etc.), not the generic parent.
4. **Unit Tests**:
   - Added 4 dedicated unit tests in `src/lib/storage.test.js` validating empty state, sorting, deduplication, 5-item cap, finish cleanup, and corrupted storage fallbacks. All 8 storage tests pass.
