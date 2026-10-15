# GAME-AUDIT.md — Comprehensive Mobile Game Audit & Engine Requirements

This audit inspects every game in the registry according to the **Definition of a Complete Game** and **Mobile-First Controls** defined in `AGENTS.md`.

---

## Game Ranking by Distance from Complete

| Priority | Game | Current State | Missing Requirements & Gap Score |
| :--- | :--- | :--- | :--- |
| **1** | **Chess Royale** | Showpiece move mockup, no check/mate/stalemate/castling | 9/10 (Requires full FIDE engine, AI search, clocks, 3D board) |
| **2** | **Carrom Clash** | Rudimentary Euler physics, slider aim, no foul rules | 9/10 (Requires Matter.js physics, slingshot touch, official ICF rules, AI) |
| **3** | **Poker Arena** | Rudimentary heads-up, fixed bets, no side pots/blinds | 8/10 (Requires full Texas Hold'em engine, betting rounds, AI styles) |
| **4** | **Rummy Market** | Ad-hoc 10-card draw, no meld validation or declare | 9/10 (Requires 13-card Rummy engine, pure/impure sequences, declare, points) |
| **5** | **Uno Zone** | Simplified match, no reverse/challenge/UNO button | 7/10 (Requires 108-card engine, reverse, challenge, UNO call penalty, match pts) |
| **6** | **Blackjack Vault** | Basic hit/stand/double, missing split, insurance, shoe | 6/10 (Requires 6-deck shoe, split hands, insurance, dealer peek, bankroll) |
| **7** | **Sudoku Clash** | Single static puzzle, no difficulty, notes, or hints | 7/10 (Requires puzzle generator/solver, notes mode, undo, difficulties) |
| **8** | **Tic Tac Clash** | Simple board, heuristic AI, single reset | 4/10 (Requires minimax AI, series match score, win-line animation) |

---

## 1. Chess Royale (`/games/chess`)

### Current State & What Exists
- 8x8 matrix rendering with piece glyphs.
- Basic movement rules (pawns move forward, knights L-shape, etc.) without check validation.
- Primitive turn alternating between White and Black.

### What is Missing & What is Wrong
- **Illegal Moves Allowed**: King can move into check; pieces can move while king is in check.
- **Missing Rules**: Castling (kingside/queenside with path & check verification), En Passant, Pawn Promotion chooser (Queen, Rook, Bishop, Knight), Checkmate detection, Stalemate, Threefold repetition, Fifty-move rule, Insufficient material.
- **Controls**: Only click-to-select; lacks drag-and-drop piece snapping preview.
- **AI**: Random move picker with no evaluation or minimax search.
- **Clocks & Game Modes**: No chess clocks (Blitz 3/5 min, Rapid 10 min, Untimed); no PGN export; no captured pieces tray.

### What a Real Mobile Game Requires
1. Pure engine wrapping `chess.js` enforcing 100% legal FIDE rules and state serialization.
2. AI Opponent (Easy: random/depth 1 with error; Medium: depth 2-3 minimax; Hard: depth 4 minimax with piece-square evaluation tables) running asynchronously without blocking UI.
3. Mobile touch controls: Tap-to-move with square highlight indicators AND direct drag-and-drop with snap preview.
4. Clocks (Blitz 3m/5m, Rapid 10m, Untimed), captured piece trays, move list, undo, flip board, PGN export.
5. 3D depth perspective board with wood/metallic materials and lighting.

---

## 2. Carrom Clash (`/games/carrom`)

### Current State & What Exists
- HTML5 Canvas with custom Euler circle collision detection.
- Range slider for baseline positioning.
- Basic queen scoring without cover verification.

### What is Missing & What is Wrong
- **Physics**: Circles clip through each other or stick together at high speeds due to Euler integration rather than rigid-body physics.
- **Controls**: Uses an HTML range slider to position striker; aiming requires counter-intuitive clicking. Breaks mobile-first direct manipulation.
- **Rules & Fouls**: Pocketing the striker does not return penalty coins to board; pocketing opponent coin does not penalize or award turn properly; Queen is pocketed without mandatory immediate cover shot.
- **Game Modes**: No AI opponent; no pass-and-play mode with rotating board view; no match scoring to 25 points.

### What a Real Mobile Game Requires
1. Pure physics engine powered by `matter-js` with restitution, friction, damping, board cushions, and pockets.
2. Direct touch slingshot controls: Thumb-drag striker directly along baseline; pullback aiming vector with dotted guideline and power gauge; release to shoot.
3. Official ICF rules: White (10 pts), Black (5 pts), Queen (3 bonus / 25 cover), mandatory Queen cover shot, fouls returning coins to center circle, turn continuation on legal pockets.
4. 3 AI difficulty levels with calibrated aim angle jitter and power variance.
5. 2-player pass-and-play mode with 180° board rotation for the active player.
6. Rest detection: waits until all bodies reach zero velocity before handing over turn.

---

## 3. Blackjack Vault (`/games/card-territory/blackjack`)

### Current State & What Exists
- Basic Hit, Stand, Double Down for single hand.
- Simple soft Ace adjustment.

### What is Missing & What is Wrong
- **Missing Rules**: Split pairs (playing 2 simultaneous hands), Insurance against Dealer Ace, Dealer Blackjack peek.
- **Deck Management**: Infinite single deck reshuffle on every deal instead of standard 6-deck shoe with cut card.
- **Payouts**: Fixed payouts without insurance side bet or accurate blackjack payout logic.

### What a Real Mobile Game Requires
1. Pure `BlackjackEngine` with standard Vegas rules: 6-deck shoe with shuffle penetration, dealer stands on soft 17, blackjack pays 3:2.
2. Complete player actions: Hit, Stand, Double Down, Split (up to 2 hands on identical rank cards), Insurance (2:1 payout).
3. Persistent chips wallet with quick re-bet, chip denominations (5, 25, 100, 500), and statistics (hands played, win rate, blackjacks).
4. CSS 3D card dealing, flipping, and stacking animations.

---

## 4. Poker Arena (`/games/card-territory/poker`)

### Current State & What Exists
- Heads-up Texas Hold'em layout.
- Fixed bet sizes with basic community cards deal.

### What is Missing & What is Wrong
- **No Betting Rounds**: Lacks true No-Limit betting structure with rotating Dealer/Small Blind/Big Blind buttons.
- **No Side Pots**: All-in situations fail to calculate main and side pots.
- **Hand Evaluator**: Rudimentary string matching fails on complex 7-card combinations and kicker tie-breaking.
- **AI**: Opponent bets arbitrarily without table position or hand strength logic.

### What a Real Mobile Game Requires
1. Pure `PokerEngine` with 7-card hand evaluator (Royal Flush, Straight Flush, Four of a Kind, Full House, Flush, Straight, Three of a Kind, Two Pair, One Pair, High Card) and kicker comparisons.
2. Full betting flow: Pre-Flop, Flop, Turn, River with Check, Call, Raise (pot, 1/2 pot, slider, all-in), Fold.
3. Proper pot management with side pots for all-ins.
4. AI Personalities (Tight-Passive on Easy, Loose-Aggressive on Medium, Balanced-Calculated on Hard).
5. Tournament elimination: match continues until one player wins all chips.

---

## 5. Rummy Market (`/games/card-territory/rummy`)

### Current State & What Exists
- 10-card Gin-like dealing with stock and discard piles.
- Discard button with basic card count check.

### What is Missing & What is Wrong
- **No Meld Validation**: Players can discard anything and claim victory without valid sequences or sets.
- **Wrong Variant Rules**: Lacks official 13-card rules, pure sequence requirements, printed/wild jokers, and point calculation for losing hands.
- **Controls**: Clunky click-and-discard with no group organization or visual meld slots.

### What a Real Mobile Game Requires
1. Pure `RummyEngine` for official 13-Card Indian Rummy:
   - Must have at least 2 sequences; at least one must be a **Pure Sequence** (no joker).
   - Valid sets of 3 or 4 cards with matching ranks and different suits.
   - Wild Joker selected at random from deck + Printed Jokers.
2. Draw from Open Discard or Closed Stock, Discard to finish turn, Declare with show card.
3. Scoring: Winner gets 0 points; losing players scored based on unmelded cards (Aces/Face = 10, Number = face value, max 80 points penalty).
4. Card grouping UI: Drag or tap to organize cards into Groups/Melds with live validation feedback ("Pure Sequence", "Set", "Invalid").

---

## 6. Uno Zone (`/games/card-territory/uno`)

### Current State & What Exists
- Matching color or number, simple Skip and +2.
- Hardcoded Wild logic without color selection dialog.

### What is Missing & What is Wrong
- **Missing Actions**: Reverse card (changes turn direction), Wild Draw 4 challenge rule, Calling "UNO" button with penalty.
- **Deck & Shuffling**: Discard pile never reshuffled into draw pile when empty.
- **Scoring**: No cumulative round/match scoring (winner scores sum of opponent's remaining cards; first to 500 wins match).

### What a Real Mobile Game Requires
1. Pure `UnoEngine` with complete 108-card deck: 4 colors (Red, Blue, Green, Yellow), numbers 0-9, Skip, Reverse, Draw Two, Wild, Wild Draw Four.
2. Turn rotation with clockwise/counter-clockwise direction tracking.
3. Calling "UNO" button: If player has 1 card left and fails to tap UNO before opponent's turn, draw 2 cards penalty.
4. Color selector sheet for Wild and Wild Draw 4 cards.
5. Official match scoring to 500 points across rounds.
6. CSS 3D hand fan and play animations.

---

## 7. Sudoku Clash (`/games/sudoku`)

### Current State & What Exists
- Single static 9x9 hardcoded puzzle.
- Basic keypad with strike count on conflict.

### What is Missing & What is Wrong
- **No Difficulty Levels**: Only one puzzle; no random generation or procedural seed.
- **Missing Features**: No Pencil Notes (candidate numbers), no Hint button, no Undo/Redo stack.
- **Strict Scoring**: Lacks timing bonuses and streak stats.

### What a Real Mobile Game Requires
1. Pure `SudokuEngine` with procedural puzzle generator (Easy, Medium, Hard) guaranteeing unique solution.
2. Pencil Notes mode: Toggle notes to jot down candidates in cells with auto-clearing upon digit placement.
3. Hint system: Explains next logical deduction (naked single, hidden single).
4. Undo/Redo history stack, conflict validator, timer with pause/resume, and saved progress state.

---

## 8. Tic Tac Clash (`/games/tictactoe`)

### Current State & What Exists
- Basic 3x3 grid with X and O marks.
- Simple heuristic block/win check.

### What is Missing & What is Wrong
- **AI**: Predictable and beatable on all modes; lacks unbeatable Minimax algorithm.
- **Match Flow**: Single game ends immediately without series scoring (Best of 3 / Best of 5).
- **Visuals**: Static line highlight without animated strike vector.

### What a Real Mobile Game Requires
1. Pure `TicTacToeEngine` with Minimax algorithm (Hard: mathematically unbeatable 100% win/draw; Medium: 75% optimal; Easy: 30% optimal).
2. Match Series mode: First to 3 wins (Best of 5), with live round score counter.
3. Pass-and-play 2-Player mode and Solo vs AI mode.
4. SVG win-line strike animation and responsive grid touch targets.
