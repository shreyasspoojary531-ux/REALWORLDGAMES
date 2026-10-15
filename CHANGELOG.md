# Changelog

All notable changes, bug fixes, and architectural improvements made during the transition from `legacy-games/` to the modern React JS application are documented here.

---

## [2.0.2] - Carrom, Tic Tac Toe, Blackjack, Poker, Rummy & Uno Fix

### Uno (Uno Zone)
- **What was broken**:
  1. The game was modeled as a 2-player duel rather than the official 3-player format (1 human vs 2 computer opponents).
  2. Action card effects (Skip, Reverse, Draw Two, Wild, Wild Draw Four) lacked strict turn skipping and penalty draws across multiple seats.
  3. Reverse card lacked special-case handling for 2 players (where it functions as a Skip).
  4. Missed UNO call penalty was missing (if player fails to call UNO on 1 card, they must draw 2 penalty cards on next turn).
  5. The UI lacked turn rotation direction indicators (clockwise/counter-clockwise), active color glow highlighting, hand fan mobile containment for 360px phones with only valid cards highlighted, and a 500-point tournament score table.
- **Root Cause**:
  1. Engine had simplified 2-seat toggle (`turn === 'player' ? 'bot' : 'player'`) instead of indexed cyclic rotation with directional vector and action card step overrides.
  2. Discard pile reshuffle didn't preserve the top discard when replenishing an empty draw pile.
- **What was fixed**:
  1. Built pure multi-seat Uno engine (`UnoEngine.js`) supporting 1 human and 2 computer bots with an official 108-card deck (76 numbers, 24 actions, 4 wilds, 4 wild +4s) and proper shuffle and deal of 7 cards each.
  2. Full action card support: Skip (advances 2 steps), Reverse (reverses direction in 3+ players, acts as Skip in 2 players), Draw Two (+2 cards and forfeited turn), Wild (color selector), Wild Draw Four (+4 cards and forfeited turn).
  3. Automatic discard pile reshuffle into draw pile (preserving the top face-up discard) whenever the draw pile is exhausted.
  4. UNO Call enforcement: dedicated "Call UNO!" button when holding $\le 2$ cards; automatic 2-card draw penalty applied when turn advances if the player failed to call UNO. Computers call UNO automatically.
  5. Official round and tournament scoring: Round winner scores points from cards remaining in all opponents' hands (number cards = face value, action cards = 20 pts, wild cards = 50 pts). Tournament continues until a player reaches 500 points with full score table modal (`Scoreboard`).
  6. Fast computer AI (<15ms evaluation, 250ms dispatch timer $\le 0.5$s requirement): prioritizes action cards when an opponent has few cards, chooses its most-held color for wild cards, draws when needed and immediately plays valid drawn cards.
  7. Mobile-first UI fitting 360px phones: Bot 1 and Bot 2 stations at top, central draw and discard piles with active color glow ring and directional rotation indicator, hand fan with only valid matching cards highlighted, and color chooser sheet for wild cards.
  8. 13 comprehensive unit tests covering 108-card deck generation, dealing, playable card validation, skip, reverse in 2p, +2 and +4 penalties, missed UNO call penalty, discard reshuffle, scoring to 500 pts, and AI speed.

### Rummy (Rummy Market)
- **What was broken**:
  1. The game was missing the standard 2-deck shoe (106 cards with 2 printed jokers + cut wild joker).
  2. Pure sequence enforcement was lenient and lacked strict validation with descriptive error feedback when rejecting declarations.
  3. Penalty points were not tracked across multi-round match play to a score limit (200 pts) with a cumulative score table.
  4. Hand cards were displayed as a static flex wrap with no horizontal mobile overflow control or drag-and-drop reordering.
- **Root Cause**:
  1. Engine dealt from a single deck and lacked full multi-round scoring data structures.
  2. Validation logic did not isolate the mandatory pure sequence requirement (no jokers) from secondary sequences and sets.
- **What was fixed**:
  1. Implemented standard 13-Card Indian Rummy rules with 2 decks + 2 printed jokers (106 cards total) and 1 cut wild joker.
  2. Pure engine declaration validation (`validateDeclaration`): enforces exactly 13 cards, minimum 2 sequences, at least 1 mandatory Pure Sequence (no jokers), and all remaining cards in valid sets or runs, providing precise descriptive feedback on rejection.
  3. Official scoring: Winner scores 0; opponent scores sum of unmelded cards (face cards and Aces = 10, numbers = face value, jokers = 0, capped at 80 pts per round).
  4. Match tournament structure: rounds continue until a player breaches the 200 points limit, with full cumulative scoreboard modal (`Scoreboard`).
  5. Fast AI (<15ms evaluation, 250ms dispatch timer $\le 0.5$s requirement): takes discard if it helps form a sequence/set or is a joker, otherwise draws from stock and discards highest-penalty unmelded card; automatically declares on 14 cards if melded.
  6. Mobile-first UI fitting 360px phones: scrollable card row with drag-and-drop horizontal reordering, tap-to-select, drag-to-discard into discard pile, auto-sort by Suit/Rank buttons, and thumb zone Discard & Declare controls.
  7. Clear How to Play panel with the chosen variant (13-Card Indian Rummy) displayed prominently at the top.
  8. 14 comprehensive unit tests verifying pure sequences, Ace-high runs, impure sequences, set validity with distinct suits, declaration rejection rules, penalty point calculation, 80-pt cap, and AI speed.

### Poker (Hold'em)
- **What was broken**:
  1. The game was heads-up (2 players) instead of the required 3-player format (human vs 2 computer players) starting with 1,000 chips each.
  2. Blinds and dealer button did not rotate across 3 players, and side pots were not calculated for varied all-in stack amounts.
  3. Action buttons had a generic slider instead of quick, fixed raise buttons (2x and 3x BB, i.e., $40 and $60) alongside Fold, Check, Call, and All-in.
  4. Eliminations were not tracked per-player to a conclusive single-winner tournament finish with Play Again.
- **Root Cause**:
  1. Engine was previously structured around a 2-player state without multiple pot allocation tiers or 3-way rotation.
  2. Hand evaluations did not support split side pots and kicker comparisons across 3 competing hands.
- **What was fixed**:
  1. Built pure 3-player Texas Hold'em engine (`PokerEngine.js`): You (Human) vs Bot 1 (Bluffer) vs Bot 2 (Tight), starting with 1,000 chips each.
  2. Rotating Dealer Button (D), Small Blind ($10), Big Blind ($20), with correct preflop and post-flop action order.
  3. Action options: Fold, Check, Call, fixed Raise 2x BB ($40), fixed Raise 3x BB ($60), and All-in.
  4. Accurate 7-card evaluator (High Card through Royal Flush) with complete kicker comparisons, split pot sharing on ties, and multi-tier side pots for all-ins.
  5. Fast rule-based AI decisions (<10ms evaluation, 200ms dispatch, well under 0.5s requirement) based on hand strength category with subtle bluffing.
  6. Player elimination when reaching $0; tournament ends when 1 player holds all 3,000 chips or human is eliminated, with modal result and "Play Again" button.
  7. Mobile-first table layout fitting 360px phones: Bot 1 and Bot 2 at top, pot and community cards in center, large player cards and active turn highlights, and action buttons in the bottom thumb zone.
  8. 14 comprehensive unit tests covering all hand ranks, kickers, split pots, side pots, blinds rotation, elimination, and round completion.

### Blackjack (Blackjack Vault)
- **What was broken**:
  1. The game lacked a proper single 52-card deck with Fisher-Yates shuffle and automatic reshuffle below 15 cards.
  2. The UI used complex multi-hand split and insurance flows with arbitrary coin refill modals rather than simple 10, 50, 100 chip bets, a 1000 starting balance, and a direct Reset Balance button at $0.
  3. Dealer play had delays rather than resolving immediately upon player Stand.
- **Root Cause**:
  1. Engine previously modeled a 6-deck casino shoe with insurance side bets and split arrays instead of standard single-deck Blackjack rules.
  2. State balance was not integrated cleanly with localStorage persistence and lacked an inline balance reset when bankrupt.
- **What was fixed**:
  1. Single 52-card deck with Fisher-Yates shuffle algorithm; automatically reshuffles whenever fewer than 15 cards remain in the deck.
  2. Pure engine rules: Player and Dealer get 2 cards (one dealer card hidden); Hit, Stand, Double Down (on first two cards only); Ace counts as 11 or 1 automatically; Dealer hits until 17 or more and stands on all 17s.
  3. Official payouts: Natural Blackjack pays 3 to 2 (2.5x bet), standard win pays 1 to 1 (2x bet), push returns the bet, bust/loss loses.
  4. Chip betting: $10, $50, $100 buttons before each round; persistent balance saved to storage; direct "Reset Balance ($1,000)" button displayed when chips hit $0.
  5. Instant dealer resolution after Stand with smooth CSS card reveals and flip styling, showing both hand totals and a round outcome banner.
  6. Comprehensive unit tests covering Ace handling, Blackjack detection, bust detection, dealer standing on 17, all payout ratios (win, blackjack, push, loss), double down, and balance reset.

### Tic Tac Toe
- **What was broken**:
  1. The computer opponent played instantaneously without human pacing, making moves feel mechanical rather than like a real opponent.
  2. Simultaneous or rapid board tapping could race during computer turn transitions if not explicitly locked.
  3. No indicator was shown during opponent pacing, and timers risked surviving unmounts or resets into new rounds.
- **Root Cause**:
  1. Overly aggressive instant move dispatch executed synchronously within the same event tick as the player's tap.
  2. Board cells lacked an `isComputerThinking` lock state during opponent delay periods.
- **What was fixed**:
  1. Added explicit `export const COMPUTER_MOVE_DELAY_MS = 700;` constant controlling computer reply timing.
  2. Player moves render immediately upon cell tap; computer opponent waits exactly 700 ms before playing its reply.
  3. Displayed animated `"Computer's turn..."` indicator badge with subtle pulsing animation during the 700 ms wait.
  4. Disabled board cell interactions and guarded `handleCellClick` during computer thinking to prevent double moves or race conditions.
  5. Comprehensive timer cleanup (`clearTimeout`): cleared on component unmount, on Restart/Reset Scores, on Play Again, and when the game ends, ensuring late timers never place marks into new games.
  6. Immediate game completion: If player's move ends the game (win or draw), outcome and modal display instantly with zero delay and no computer move. If computer move ends the game, outcome displays immediately after computer mark appears.
  7. Retained core rule-ordered AI logic without extra difficulty levels (win -> block -> center -> corner -> free cell).
  8. 7 dedicated Vitest unit/component tests using fake timers (`vi.useFakeTimers()`) verifying 700 ms delay, input locking, immediate win handling, unmount cleanup, and reset cleanup.

### Carrom
- **What was broken**:
  1. The striker could not be released or shot reliably when pointer events exited the canvas bounds.
  2. The computer opponent was slow, used complex external physics, and didn't aim with proper geometry.
  3. The UI relied on awkward sliders and 3D transforms rather than mobile-first 1-finger touch gestures.
- **Root Cause**:
  1. `pointerup` was listened only on the `<canvas>` element without `setPointerCapture` or global window listeners, causing drag-release events outside the canvas to be lost.
  2. The AI used a generic delay with rudimentary random angle noise rather than computing the line-of-sight contact point behind coins toward pockets.
  3. External `matter-js` engine had unnecessary weight and required non-standard step syncing.
- **What was fixed**:
  1. Replaced controls with single-finger touch gestures: drag left/right along the baseline to place the striker; press and drag backward (slingshot gesture) to aim with a dotted line and dynamic power ring; release shoots; short drags cancel safely.
  2. Added `e.target.setPointerCapture` and global `window` `pointerup`/`pointercancel` listeners so releases anywhere on screen reliably fire the striker.
  3. Implemented a pure, lightweight 2D physics engine with fixed sub-stepping, circle-circle momentum transfer (0.92 restitution), wall cushions, friction deceleration, rest detection, and 4 corner pocket detection.
  4. Implemented geometric AI shot calculation: evaluates candidate coins and pockets, calculates aim point behind coin, adds subtle noise, and aims and fires smoothly under 0.8s without "thinking" spinners.
  5. Implemented standard two-player rules: 9 White, 9 Black, 1 Queen in concentric center layout, consecutive turns on own coin pockets, mandatory Queen cover rule, striker fouls with due coins, and standard game-over scoring.
  6. Removed all sliders and 3D perspective tilts; delivered a clean, square, mobile-first 2D board fitting 360x640 mobile viewports with zero horizontal overflow.

---

## [2.0.1] - Performance, AI Speed & Board Hub Stabilization

- **Tic Tac Clash**: Removed artificial 400ms setTimeout and heavy state delays; replaced with instant rule-based move selection (win -> block -> center -> corner -> free cell).
- **Chess Royale**: Streamlined local pass-and-play and single-level responsive AI replying in ~200ms; eliminated redundant difficulty buttons and clock complexity.
- **Carrom Clash**: Polished baseline placement and direct slingshot pullback aiming; removed extra difficulty controls for focused, bug-free tabletop physics.
- **Poker Arena**: Accelerated AI decision delay to 250ms for snappy, fluid heads-up gameplay.
- **Rummy Market**: Reduced bot turn wait from 800ms to 250ms with instant meld updates.
- **Uno Zone**: Reduced bot turn delay from 700ms to 250ms for immediate play responses.
- **Sudoku Clash**: Cleaned number inputs and validated zero NaN displays.
- **Blackjack Vault**: Verified 6-deck shoe and instant deal/hit resolutions.

---

## [2.0.0] - Complete Mobile Game Rebuild & Official Rule Engine Release

Major release upgrading all 8 games from basic showcases into complete, official-rule, polished mobile titles comparable to top Play Store games.

### Architecture & Engines
- **Pure Rule Engines (Zero React Dependencies)**: Every game is driven by an isolated, unit-tested engine implementing official rules, legal action generation, and victory/draw resolution.
- **Official Rules Enforced**:
  - **Chess Royale**: Integrated standard FIDE rules via `chess.js` (castling kingside/queenside, en passant, promotion picker, check, checkmate, stalemate, draw by repetition/50 moves). Added Minimax search with piece-square evaluation tables across Easy, Medium, and Hard.
  - **Carrom Clash**: Replaced custom Euler physics with official ICF rigid-body simulation via `matter-js`. Implemented White (10), Black (5), Queen (3 bonus / 25 cover), mandatory Queen cover shots, striker fouls, due coins, and rest detection.
  - **Blackjack Vault**: Vegas Strip rules with 6-deck shoe (312 cards, cut card reshuffle), Hit, Stand, Double Down, Split pairs (playing simultaneous hands), Insurance side bet (2:1 payout), and Dealer stands on 17.
  - **Poker Arena**: Full heads-up Texas Hold'em engine with 7-card evaluator (all 10 hand ranks + kickers), blinds rotation, betting rounds (Preflop, Flop, Turn, River, Showdown), Pot-Odds AI, and all-in side pots.
  - **Rummy Market**: Official 13-card Indian Rummy engine with pure sequence validation, wild/printed jokers, sets, declare validation, and 80-point penalty cap.
  - **Uno Zone**: Full 108-card official Mattel deck with action effects executed before win checks (+2, Reverse, Skip, Wild, Wild +4), Call UNO / Catch UNO penalty rules, and 500-point tournament scoring.
  - **Sudoku Clash**: Backtracking solver & procedural puzzle generator (Easy, Medium, Hard), 3-strikes rule, Pencil Notes mode (candidate numbers), Hint deduction engine, and Undo stack.
  - **Tic Tac Clash**: Unbeatable Minimax AI on Hard mode, Best-of-5 tournament series scoring, and winning combination strike lines.

### Mobile-First Controls & UI Polish
- **Direct Manipulation**:
  - Replaced Carrom slider positioning with direct baseline touch dragging and intuitive pullback slingshot aiming.
  - Large touch targets (≥48x48px) across all interactive elements, keypads, and card slots.
  - Added CSS 3D perspective board / table transforms with Low Graphics fallback toggles.
- **Unified GameShell & How to Play**:
  - Standardized How to Play modal auto-displayed on first launch and accessible via HUD, covering Goal, Controls, Rules, Scoring, Win/Loss conditions, and Pro Tips.
  - Live turn indicators, clocks/timers, captured piece trays, and scoreboard counters.

---

## [1.1.0] - Production Cleanup & Design Refinement

### Design System & Visual Polish
- **Binding Taste Standards**: Implemented the 13-point "KEEP THESE IN MIND" (`DESIGN_TASTE.md`) system guidelines from `docs/DESIGN.md`.
- **Eradication of Emoji**: Replaced all emojis in category pills, Quick Play rows, game cards, victory messages, and game shells with Google Material Symbols and clean typography.
- **Single Icon System**: Standardized on Google Material Symbols (`outlined`); uninstalled `lucide-react` to eliminate mixed icon styles and reduce bundle size.
- **Header Overlap & Stacking Fix**: Resolved header-hero bleed by anchoring `<header>` at `fixed z-50` with `<main className="pt-20 pb-28">`, eliminating clipping and text bleed across all viewport sizes.
- **Consistent Touch Targets**: Enforced 48x48px minimum touch targets and accessible `focus-visible` keyboard rings across all buttons, controls, and numpads.

### Card Territory Unification
- **Design Token Harmonization**: Rebuilt `CardTerritorySelect.jsx` using shared surface tokens (`bg-surface-container`, `text-on-surface`, `border-outline-variant/30`), eliminating one-off ad-hoc colors.
- **Nested Route Integrity**: Card Territory remains a single catalog item (`/games/card-territory`) containing nested child routes (`/blackjack`, `/poker`, `/rummy`, `/uno`), preserving deep linking and back navigation.
- **Card Artwork Integration**: Fitted each card game tile with real 1:1 WebP artwork from `public/games/`.

### Game Catalog & Artwork
- **Local WebP Previews**: Downloaded and configured dedicated WebP assets for all 9 games in `public/games/` with fixed aspect ratios (`4:3` for catalog, `1:1` for subgames) and dark gradient overlays for WCAG AA readability.
- **Accurate Category Counts**: Category chips dynamically compute accurate game counts directly from the game registry.
- **Asset Specification**: Created `docs/ASSETS.md` documenting dimensions, aspect ratios, filenames, and fallback strategies.

### Continue Playing & State Persistence
- **Zero-State Restraint**: Section renders *nothing* (no empty containers or placeholder boxes) when no recent or resumable games exist in storage.
- **Typed Storage Engine**: Enhanced `src/lib/storage.js` with `getRecentPlays()`, `recordRecentPlay()`, `saveResumeData()`, and `clearResumeData()`.
- **Deduplicated & Capped**: Tracks newest plays first, capped at 5 items, automatically clears when matches conclude, and gracefully handles corrupted storage.

---

## [1.0.0] - Modern React JS Release

### Global Architecture
- **Framework & Language**: Built with pure React JS (JSX) + Vite + Tailwind CSS + Zustand.
- **Audio Synthesis**: Replaced unmanaged ad-hoc audio elements and unresumed contexts with a unified procedural Web Audio API engine (`src/lib/audio.js`) with instant user mute toggles.
- **Unified Game Shell**: Created `<GameShell>` providing a standardized top HUD, Back to Hub button, live score/stat badges, pause modal, how-to-play dialog, and fullscreen support.
- **Error Boundaries**: Wrapped each game inside `<GameErrorBoundary>` to isolate in-game crashes from taking down the hub portal.
- **Persistent Storage**: Created `src/lib/storage.js` with structured data management for user settings, game stats, and high scores.
- **Confetti & Celebrations**: Integrated lightweight `canvas-confetti` into `<GameOverModal>` with zero DOM element memory leaks.

### Carrom Clash (`/games/carrom`)
- **Physics Loop Cleanup**: Replaced unbounded raw intervals with managed `requestAnimationFrame` loops cleanly cancelled on component unmount.
- **High-DPI Canvas Scaling**: Fixed blurred coordinate physics by separating canvas buffer dimensions (`700x700`) from responsive CSS scaling.
- **Striker Baseline Control**: Added a dedicated baseline positioning slider and drag pull-back aiming vector line to eliminate mouse/touch offset bugs.
- **Foul Handling**: Striker pocketing now reliably penalizes score and returns striker to baseline instead of getting stuck in pockets.
- **Queen Pocketing**: Added queen cover status indicator and points tallying.

### Chess Royale (`/games/chess`)
- **Synchronous Engine Stall Fix**: AI move calculations are scheduled asynchronously with non-blocking evaluation delays, eliminating UI freezing.
- **Pawn Promotion**: Streamlined promotion directly into queens to prevent unstyled native select dropdown bugs.
- **Capture Logic**: Cleaned up board matrix mutations and added capture sound synthesis.
- **Game End & King Capture**: Checkmate and King capture correctly trigger the victory modal and stats recording.

### Sudoku Clash (`/games/sudoku`)
- **Timer Interval Leaks**: Timer `setInterval` is now strictly cleared upon game completion, pause, or unmount.
- **Keyboard Traps**: Numpad buttons no longer steal physical keyboard arrow focus; players can navigate the 9x9 grid via arrow keys or mouse seamlessly.
- **Strike System**: Added 3-strike conflict detection with visual error feedback and sound effects.

### Tic Tac Clash (`/games/tictactoe`)
- **Confetti Leaks**: Replaced infinite append of canvas nodes with single-shot particles.
- **Smart AI & 2-Player Hotseat**: Added mode toggle allowing solo play against tactical AI or local 2-player pass-and-play.
- **Winning Line Highlight**: Highlight winning triplets across row, column, or diagonal combinations.

### Card Territory Saloon (`/games/card-territory`)
- **Iframe Architecture Removal**: Eliminated `<iframe>` with 80KB base64 `srcdoc` strings in favor of idiomatic nested React Router routes (`/games/card-territory/*`).
- **Unified Saloon Wallet**: Player coins and gems are preserved across Blackjack, Poker, Rummy, and Uno Zone with free refill capabilities when coins fall low.
- **Blackjack Vault (`/games/card-territory/blackjack`)**:
  - Implemented proper soft Ace deduction (calculating 1 vs 11).
  - Added Double Down mechanics with 2x bet deduction and single-card deal.
  - Added 3:2 payout for natural 21.
- **Poker Arena (`/games/card-territory/poker`)**:
  - Replaced buggy blind desyncs with clear street progression: Deal -> Flop -> Turn -> River -> Showdown.
  - Evaluates 5-card poker combinations (Straight Flush, Quads, Full House, Flush, Straight, etc.).
- **Rummy Market (`/games/card-territory/rummy`)**:
  - Replaced broken drag-and-drop touch interactions with intuitive click-to-select and draw/discard actions.
  - Added hand sorting helper button.
- **Uno Zone (`/games/card-territory/uno`)**:
  - Fixed color picker modal bypassing bugs by automatically setting active color on Wild drops.
  - AI player accurately tracks discard pile matches.
