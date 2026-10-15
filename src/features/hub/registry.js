import { lazy } from 'react';

export const GAMES = [
  {
    id: 'carrom',
    title: 'Carrom Clash',
    description:
      'Precision tabletop board game. Aim your striker, pocket carrom men, and claim the Queen.',
    category: 'tabletop',
    badge: 'Physics 2D',
    accentColor: '#4cd7f6',
    thumbnail: '/games/carrom.webp',
    iconName: 'adjust',
    canResume: true,
    controls: {
      mouse: [
        'Drag bottom baseline bar to position striker',
        'Drag aiming arrow to set power & angle',
        'Release to strike',
      ],
      touch: ['Slide position bar left/right', 'Drag and pull back to shoot'],
      keyboard: ['Arrow Keys / A, D: Position striker', 'Space: Shoot with current aim'],
    },
    rules: [
      'Pocket white (10 pts) and black (5 pts) carrom men.',
      'The red Queen (25 pts) must be covered by pocketing another carrom man on the same or next turn.',
      'Pocketing the striker is a foul: -5 pts and a penalty piece returns to board center.',
    ],
    tips: [
      'Use corner board rebounds for tricky bank shots.',
      'Avoid putting maximum power on close-range shots.',
    ],
    component: lazy(() => import('@/features/games/carrom')),
  },
  {
    id: 'chess',
    title: 'Chess Royale',
    description:
      'The classic game of strategy. Challenge intelligent AI levels or play local pass-and-play.',
    category: 'board',
    badge: 'Strategy',
    accentColor: '#8083ff',
    thumbnail: '/games/chess.webp',
    iconName: 'chess',
    canResume: true,
    controls: {
      mouse: ['Click piece to inspect legal moves', 'Click highlighted square to move'],
      touch: ['Tap piece, then tap destination square'],
      keyboard: [
        'Arrow keys: Navigate board',
        'Enter / Space: Select & Move piece',
        'U: Undo move',
      ],
    },
    rules: [
      'Standard FIDE chess rules with check, checkmate, stalemate, castling, and en passant.',
      'Pawn promotion opens an interactive piece selection drawer.',
      'Choose between Novice, Club, and Master AI difficulty.',
    ],
    tips: [
      'Control the center squares (e4, d4, e5, d5) early.',
      'Develop knights and bishops before launching queen attacks.',
    ],
    component: lazy(() => import('@/features/games/chess')),
  },
  {
    id: 'sudoku',
    title: 'Sudoku Clash',
    description:
      'Crisp 9x9 logic puzzle with smart candidate notes, multiple difficulties, and error checking.',
    category: 'puzzle',
    badge: 'Logic',
    accentColor: '#4edea3',
    thumbnail: '/games/sudoku.webp',
    iconName: 'grid_on',
    canResume: true,
    controls: {
      mouse: [
        'Click cell to highlight row, column & 3x3 box',
        'Click virtual numpad or action buttons',
      ],
      touch: ['Tap cell, tap numpad digits'],
      keyboard: [
        'Arrow keys: Navigate grid',
        '1-9: Enter number',
        'Backspace / Delete: Erase',
        'N: Toggle pencil notes mode',
      ],
    },
    rules: [
      'Fill every row, column, and 3x3 box with digits 1 through 9 with zero repeats.',
      'Select between Relaxed mode or 3-Strikes Challenge mode.',
      'Use pencil notes to track possibilities without guessing.',
    ],
    tips: ['Look for "naked singles" — cells where only one number can mathematically fit.'],
    component: lazy(() => import('@/features/games/sudoku')),
  },
  {
    id: 'tictactoe',
    title: 'Tic Tac Clash',
    description:
      'Tic-Tac-Toe reimagined: Classic 3x3 with offensive and defensive AI tactical defense.',
    category: 'board',
    badge: 'Quick Duel',
    accentColor: '#ffb4ab',
    thumbnail: '/games/tictactoe.webp',
    iconName: 'close',
    canResume: false,
    controls: {
      mouse: ['Click cell to place X or O mark'],
      touch: ['Tap cell to place mark'],
      keyboard: ['Arrow keys: Navigate cells', 'Space / Enter: Confirm placement'],
    },
    rules: [
      'Classic 3x3: Align 3 marks horizontally, vertically, or diagonally.',
      'Single player vs Tactical AI or local 2-player pass and play.',
    ],
    tips: ['Control the center cell early to maximize winning combinations.'],
    component: lazy(() => import('@/features/games/tictactoe')),
  },
  {
    id: 'card-territory',
    title: 'Card Territory',
    description:
      'The tactical card realm featuring Blackjack, Poker Arena, Rummy Market, and Uno Zone.',
    category: 'cards',
    badge: 'Card Vault',
    accentColor: '#c0c1ff',
    thumbnail: '/games/card-territory.webp',
    iconName: 'style',
    canResume: false,
    controls: {
      mouse: [
        'Select card games from vault',
        'Interactive card dealing, melds, and betting controls',
      ],
      touch: ['Tap cards to inspect, play, or discard'],
      keyboard: ['Hotkeys for card actions: H (Hit), S (Stand), C (Call), F (Fold)'],
    },
    rules: [
      'Enter the Card Territory saloon with your persistent coin & gem vault.',
      'Play Blackjack Vault, Poker Arena, Rummy Market, or Uno Zone.',
      'Winnings and chips update your global profile and high scores.',
    ],
    tips: ['Visit Card Territory to switch between all 4 card games without losing your stack!'],
    component: lazy(() => import('@/features/games/card-territory')),
  },
];

export const CATEGORIES = [
  { id: 'all', label: 'All Games', iconName: 'apps' },
  { id: 'cards', label: 'Card Games', iconName: 'style' },
  { id: 'puzzle', label: 'Puzzle', iconName: 'extension' },
  { id: 'tabletop', label: 'Tabletop', iconName: 'sports_esports' },
  { id: 'board', label: 'Board Games', iconName: 'grid_view' },
];
