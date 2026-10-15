# RealWorldGames — Indoor Games Portal (React JS)

A modern, high-performance web gaming portal and game hub built with **pure React JS**, Vite, Tailwind CSS, Zustand, and Web Audio API. Converted faithfully from standalone legacy HTML games into a cohesive, responsive application.

---

## 🎮 Playable Games in the Hub

1. **Carrom Clash (`/games/carrom`)**
   - Official ICF rules powered by `matter-js` rigid-body physics.
   - Direct touch baseline positioning (no sliders) and slingshot pullback aiming with power ring.
   - White (10 pts), Black (5 pts), Queen (3 bonus / 25 cover), mandatory Queen cover shot, fouls returning coins to center circle, and 3 AI difficulty levels.
2. **Chess Royale (`/games/chess`)**
   - Full FIDE rules engine (`chess.js`) with castling, en passant, pawn promotion picker, check/checkmate, stalemate, and draw conditions.
   - Minimax search with piece-square evaluation tables across Easy, Medium, and Hard.
   - 3D perspective board toggle, clocks (Blitz, Rapid, Untimed), captured piece trays, and move list.
3. **Sudoku Clash (`/games/sudoku`)**
   - Backtracking solver & procedural puzzle generator (Easy, Medium, Hard).
   - Pencil Notes mode for candidate numbers, Hint deduction engine, Undo stack, and 3-strikes rule.
4. **Tic Tac Clash (`/games/tictactoe`)**
   - Mathematically optimal Minimax AI on Hard mode, Best-of-5 tournament series scoring, and strike-line animations.
5. **Card Territory Saloon (`/games/card-territory`)**
   - Saloon hub with 4 card games:
     - **Blackjack Vault (`/games/card-territory/blackjack`)**: 6-deck shoe with shuffle penetration, Hit, Stand, Double Down, Split pairs, Insurance against Dealer Ace, and Dealer stands on 17.
     - **Poker Arena (`/games/card-territory/poker`)**: Heads-up Texas Hold’em with 7-card hand evaluator, blinds rotation, Preflop/Flop/Turn/River betting rounds, and pot-odds AI.
     - **Rummy Market (`/games/card-territory/rummy`)**: Official 13-card Indian Rummy with pure sequence validation, wild/printed jokers, sets, declare validation, and 80-point penalty cap.
     - **Uno Zone (`/games/card-territory/uno`)**: Full 108-card official Mattel deck with action effects executed before win checks, Call UNO / Catch UNO penalty rules, and 500-point tournament scoring.

---

## 🛠️ Tech Stack & Decisions

- **Framework**: Vite + React 18 (pure JavaScript / JSX)
- **Routing**: React Router 6 with nested sub-routes for Card Territory
- **Styling**: Tailwind CSS with custom gaming tokens, dark/light surface gradients, responsive grid layouts
- **State Management**: Zustand for global settings, favorites, and synchronized Card Territory vault wallet
- **Audio**: Web Audio API procedural synthesis (zero audio lag, lightweight, auto-resuming, user mute preference)
- **Testing**: Vitest + React Testing Library + JSDOM
- **Code Quality**: ESLint + Prettier

---

## 🚀 Quickstart & Scripts

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Run unit and smoke tests
npm run test

# Run ESLint check (zero warnings)
npm run lint

# Format code with Prettier
npm run format

# Production build
npm run build

# Preview production build locally
npm run preview
```

---

## 📂 Folder Structure

```
├── legacy-games/                 # Original standalone HTML games (read-only reference)
├── docs/
│   ├── AUDIT.md                  # Comprehensive game audit, rules, and flaw analysis
│   ├── DESIGN.md                 # Design system tokens, benchmarking, taste rules
│   ├── ASSETS.md                 # Game artwork catalog and responsive aspect ratio specs
│   └── CLEANUP.md                # Production refinement, audit compliance, and waste removal report
├── src/
│   ├── App.jsx                   # Central routing & game error boundary wrapping
│   ├── main.jsx                  # React DOM entry point
│   ├── app/
│   │   └── store.js              # Zustand store (settings, favorites, card vault)
│   ├── components/
│   │   ├── ui/                   # Reusable UI primitives (Button, Modal, Badge)
│   │   └── game/                 # GameShell (HUD, fullscreen, sound, pause), GameOverModal, ErrorBoundary
│   ├── features/
│   │   ├── hub/                  # Home Hub page, category filters, game registry
│   │   └── games/                # Game implementations
│   │       ├── carrom/           # Canvas 2D Carrom with physics loop
│   │       ├── chess/            # Chess board and AI logic
│   │       ├── sudoku/           # Sudoku grid and number puzzle
│   │       ├── tictactoe/        # Tic Tac Toe logic and AI
│   │       └── card-territory/   # Saloon parent & nested sub-games (blackjack, poker, rummy, uno)
│   ├── lib/
│   │   ├── audio.js              # Web Audio procedural sound synthesizer
│   │   ├── storage.js            # Typed localStorage wrapper with legacy migration
│   │   └── utils.js              # Class merging utilities
│   └── styles/
│       └── globals.css           # Custom scrollbars, glow utilities, theme variables
```

---

## ➕ How to Add a New Game

Adding a new game requires only two simple steps:

1. Create your game folder in `src/features/games/<game-id>/index.jsx` wrapping it in `<GameShell>`.
2. Register the game in `src/features/hub/registry.js` with its title, category, rules, controls, and `lazy(() => import('@/features/games/<game-id>'))`.

The game hub, routing, dynamic lazy-loading, error boundary, and high scores will immediately connect automatically.
