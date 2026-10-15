# Legacy Games Audit Report

This audit documents every legacy HTML game in `./legacy-games/`, including detailed game rules, controls, scoring, win/lose conditions, assets, code architecture, bugs, UI/UX flaws, and accessibility issues.

---

## 1. Inventory & Structure Overview

| Game ID | Title | File | Rendering Tech | Audio Engine | State Persistence | Sub-games / Modes |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| `carrom` | Carrom Clash | `carrom.html` | HTML5 Canvas 2D + Physics | Web Audio Synth | In-memory only (Lost on reload) | Practice, Quick Play, AI levels (Casual, Master, Legend) |
| `chess` | Chess Royale | `chess.html` | DOM Grid + Unicode Glyphs | Web Audio Synth | In-memory only | Solo vs AI (Novice, Club, Master), 2P Local, Daily Puzzle |
| `sudoku` | Sudoku Clash | `sudoku.html` | DOM Grid 9x9 + SVG | Web Audio Synth | In-memory only | Easy, Medium, Hard, Expert, Daily Puzzle |
| `tictactoe`| Tic Tac Clash | `tictactoe.html` | DOM + Canvas (confetti/trails) | Web Audio Synth | `localStorage['ticTacClashMeta']` | Classic 3x3, Grid 4x4, Ultimate (Grid of Grids), AI levels |
| `card-territory` | Card Territory Hub | `card-territory.html` | DOM Hub + Base64 Iframe bundle | None in parent | `localStorage['cardTerritoryVault']` | Bundles 4 card games: Blackjack Vault, Rummy Market, Poker Arena, Uno Zone |
| `card-territory/blackjack` | Blackjack Vault | `card-territory-bj.html` | Canvas + DOM HUD | Web Audio Synth | Parent Vault (`window.parent`) | Classic Blackjack (Hit, Stand, Double Down, Split) |
| `card-territory/rummy` | Rummy Market | `card-territory-rm.html` | Canvas + DOM Hand Cards | Web Audio Synth | Parent Vault (`window.parent`) | Indian Rummy / Gin Rummy (Runs, Sets, Meld, Discard) |
| `card-territory/poker` | Poker Arena | `card-territory-pk.html` | DOM Poker Table + SVG | Web Audio Synth | Parent Vault (`window.parent`) | Texas Hold'em (Flop, Turn, River, AI Betting, Showdown) |
| `card-territory/uno` | Uno Zone | `card-territory-un.html` | DOM Cards + CSS 3D | Web Audio Synth | Parent Vault (`window.parent`) | Uno Matching (Colors, Values, Skip, Reverse, Draw Two, Wild, Wild Draw 4) |

---

## 2. Detailed Game Audits

### 2.1 Carrom Clash (`legacy-games/carrom.html`)
- **Title**: Carrom Clash
- **Rules**:
  - Traditional tabletop board game where a striker is flicked to pocket Carrom men (white: 10 pts, black: 5 pts, Queen / red: 25 pts).
  - Queen must be "covered" by pocketing another carrom man on the same or consecutive turn.
  - Striker foul: pocketing the striker incurs a penalty (-5 pts and return of a piece).
- **Controls**:
  - Mouse / Touch: Drag horizontal striker positioning bar at the baseline. Drag aiming line backwards or in direction to adjust flick impulse power and angle. Release to shoot.
- **Scoring & Win/Lose Conditions**:
  - Accumulate highest points or pocket all assigned pieces.
  - Winner reaches target score first or clears board with queen cover.
- **Assets & Libraries**:
  - Zero external image assets or libraries; procedural canvas drawing for board, pegs, pockets, and carrom men.
  - Procedural sound synthesis via Web Audio API oscillators and gain envelopes.
- **Bugs, Flaws & Anti-patterns**:
  1. *Memory / Loop leaks*: Physics loop runs unbounded with `requestAnimationFrame` and does not throttle background tabs.
  2. *Responsive scaling*: Fixed coordinate physics (`800x800`) scaled naively via CSS transforms causes blurriness on high-DPI screens and touch offset calculation errors on mobile resize.
  3. *State reset*: Quitting or restarting mid-turn leaves striker state dirty, sometimes freezing striker placement.
  4. *Multiplayer stub*: "Multiplayer / Custom Room / Online" button opens an alert/mock modal that says "needs a server to find anyone".
  5. *AudioContext resume*: On some mobile browsers, audio fails to start because `AudioContext` isn't resumed on initial touch.

---

### 2.2 Chess Royale (`legacy-games/chess.html`)
- **Title**: Chess Royale
- **Rules**:
  - Full standard chess rules including piece movement, captures, checks, checkmate, stalemate, castling, en passant, and pawn promotion.
  - Custom mini-engine evaluation with minimax / alpha-beta pruning for AI difficulty levels.
- **Controls**:
  - Click / tap piece to select, highlighted valid destination squares; click destination to move.
- **Scoring & Win/Lose Conditions**:
  - Win via Checkmate, loss via Checkmate, draw via Stalemate, 50-move rule, or insufficient material.
- **Assets & Libraries**:
  - Pure HTML/CSS with Unicode chess characters (`♔`, `♕`, `♖`, `♗`, `♘`, `♙`). Web Audio sound effects.
- **Bugs, Flaws & Anti-patterns**:
  1. *AI blocking UI*: Minimax runs synchronously on main thread; at depth 3-4 on hard difficulty, causes noticeable UI freezes / frame drops. Needs Web Worker or async chunking.
  2. *Promotion UI*: Pawn promotion auto-queens in some conditions or renders unstyled dropdowns.
  3. *No keyboard accessibility*: Board is entirely non-focusable via `Tab` / arrows. Screen readers cannot perceive piece positions or moves.
  4. *Move history & undo*: Undoing during AI turn can corrupt the internal board state array.
  5. *Layout on mobile*: Board overflows horizontal viewport on screens under 380px wide.

---

### 2.3 Sudoku Clash (`legacy-games/sudoku.html`)
- **Title**: Sudoku Clash
- **Rules**:
  - Standard 9x9 Sudoku grid. Fill cells so every row, column, and 3x3 block contains digits 1 to 9 without repetition.
  - Pencil notes / candidate mode available.
  - Mistake limit (3 strikes) or relaxed mode.
- **Controls**:
  - Click cell to select, virtual keypad (1-9, erase, note) or physical keyboard numbers `1-9`, `Backspace`/`Delete`, arrow keys for navigation.
- **Scoring & Win/Lose Conditions**:
  - Win by completely and correctly filling all 81 cells. Lose if 3 strikes are accumulated (in strike mode).
  - Score based on elapsed timer, hints used, and difficulty multiplier.
- **Assets & Libraries**:
  - Pure SVG / CSS. Web Audio synthesizer for chime / click / error sound effects.
- **Bugs, Flaws & Anti-patterns**:
  1. *Timer interval leak*: `setInterval` continues ticking even when game is completed or modal is open.
  2. *Keyboard focus trap*: Numpad buttons can capture focus unexpectedly, preventing arrow key grid navigation.
  3. *Note clear bug*: When entering a definite number, candidates in conflicting row/column/box are not automatically scrubbed.
  4. *Mobile viewport*: 9x9 grid with numbers gets cramped on small mobile viewports (360px) with buttons cut off.

---

### 2.4 Tic Tac Clash (`legacy-games/tictactoe.html`)
- **Title**: Tic Tac Clash
- **Rules**:
  - Multiple modes: Classic 3x3, Expanded 4x4 (connect 4), and Ultimate Tic-Tac-Toe (9 mini boards where the opponent's next grid is determined by your previous move).
  - Single player vs AI (Minimax with heuristic depth) or Local 2-Player pass-and-play.
- **Controls**:
  - Click / tap cell to place mark (X or O).
- **Scoring & Win/Lose Conditions**:
  - First to align required number of symbols in a line wins. Board filled without winner = Draw.
- **Assets & Libraries**:
  - Canvas confetti particle effects. Procedural Web Audio sounds.
- **Bugs, Flaws & Anti-patterns**:
  1. *Confetti animation leak*: Confetti canvas appends to DOM repeatedly on wins without disposing previous canvas nodes.
  2. *Ultimate TTT state*: Sub-board win condition highlights can misalign when sub-board ends in a tie.
  3. *LocalStorage schema*: Stores `ticTacClashMeta` without versioning or validation, leading to potential corruption if schema changes.

---

### 2.5 Card Territory Hub & Sub-Games (`legacy-games/card-territory.html`)
- **Title**: Card Territory — Indoor Games Vault
- **Concept & Architecture**:
  - A game collection bundling 4 distinct card games inside one HTML file.
  - The legacy file embedded all 4 games as Base64-encoded HTML strings (`GAME_DATA: { bj, rm, un, pk }`) and loaded them into an `<iframe>` with `srcdoc`.
  - Shared currency wallet (`cardTerritoryVault`: coins, gems, profile name, lifetime winnings) passed through `localStorage` / `window.parent`.
- **Sub-Game 1: Blackjack Vault (`card-territory-bj.html`)**:
  - *Rules*: Standard Blackjack. Dealer hits on soft 17. 3:2 payout on Blackjack, 1:1 on normal win. Supports Hit, Stand, Double, Split.
  - *Bugs*: Split logic has visual overlap of hands on mobile viewports; betting chips animation occasionally desyncs wallet count.
- **Sub-Game 2: Rummy Market (`card-territory-rm.html`)**:
  - *Rules*: Indian/Gin Rummy variant. Deal 13 cards. Form sets (3-4 of a kind) and runs/sequences (3+ consecutive suited cards). Must have at least one pure sequence. Pick from stockpile or discard pile; discard to end turn.
  - *Bugs*: Drag-and-drop card ordering gets stuck on touch devices; canvas rendering for table does not re-render properly on window orientation change.
- **Sub-Game 3: Poker Arena (`card-territory-pk.html`)**:
  - *Rules*: No-Limit Texas Hold'em (play-chips only). Pre-flop, Flop (3 community), Turn (1 community), River (1 community). Actions: Check, Call, Bet, Raise, Fold. AI players use hand strength estimation.
  - *Bugs*: Blind rotation fails to advance correctly when a player busts out; all-in side pots are not calculated (pots are merged).
- **Sub-Game 4: Uno Zone (`card-territory-un.html`)**:
  - *Rules*: 7 cards dealt. Match top discard by color or number/action. Special cards: Skip, Reverse, Draw Two, Wild, Wild Draw Four. Penalty for not calling UNO before playing penultimate card.
  - *Bugs*: Color picker modal can be bypassed by clicking outside, leaving current card color undefined; AI occasionally plays illegal card if wild card was played prior.

---

## 3. Global Flaws, Accessibility & Code Smells Across All Games

1. **Inline Everything**: Games were 1,500 - 3,000 lines of mixed inline CSS, inline HTML, and unstructured vanilla JavaScript in `<script>` tags.
2. **Missing Accessibility (a11y)**:
   - No `role`, `aria-label`, or keyboard navigation on game boards.
   - Contrast failures on dark theme gradients (e.g. muted text with contrast ratio < 3:1).
   - Motion is unconstrained; no check for `prefers-reduced-motion`.
3. **No Centralized Layout & Error Handling**:
   - If an unhandled exception occurs (e.g. audio context failure, local storage quota exceeded), the game crashes silently without error recovery.
4. **Mocked Online Features**:
   - Every legacy file had fake multiplayer / lobby modals claiming "needs a live matchmaking server". These will be cleanly replaced with true local hotseat / pass-and-play and responsive AI modes.
5. **No Shared Components**:
   - Currency bars, profile badges, modals, toast messages, and audio engines were implemented independently and incoherently across the 5 files.

---

## 4. Modern React Conversion Strategy

1. **Single Hub + Nested Route Architecture**:
   - `/`: Game Hub (Hero, search, category filter, favorites, recently played, quick stats).
   - `/games/carrom`: Carrom Clash
   - `/games/chess`: Chess Royale
   - `/games/sudoku`: Sudoku Clash
   - `/games/tictactoe`: Tic Tac Clash
   - `/games/card-territory`: Card Territory Entry & Game Selector
   - `/games/card-territory/blackjack`: Blackjack Vault
   - `/games/card-territory/rummy`: Rummy Market
   - `/games/card-territory/poker`: Poker Arena
   - `/games/card-territory/uno`: Uno Zone
2. **Shared Packages & Engine Libraries**:
   - Shared audio synthesizer (`useSoundEffects` / Web Audio manager) with user mute preference.
   - Shared standard card deck engine (`Deck`, `Card`, `shuffle`, `deal`, `evaluatePokerHand`, `evaluateRummyMelds`).
   - Shared unified Game wrapper layout: Top HUD (score, pause, rules, audio toggle, fullscreen), Game Canvas/Board, Pause Modal, How-to-Play Modal, Game Over Modal.
3. **Typed Storage**:
   - Single typed `storage` utility with schema migration, fallback, and zero crash risk when storage is blocked.
