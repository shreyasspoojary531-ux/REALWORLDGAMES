export const CardTerritorySubGames = [
  {
    id: 'blackjack',
    path: '/games/card-territory/blackjack',
    title: 'Blackjack Vault',
    description:
      'High-stakes 21 against the vault dealer. Double down, hit, or stand to win 3:2 payouts.',
    descriptor: 'Vault 21',
    badge: 'Dealer vs Player',
    thumbnail: '/games/blackjack.webp',
    iconName: 'playing_cards',
    canResume: true,
    rules: [
      'Aim for a hand total closer to 21 than the dealer without busting (over 21).',
      'Face cards count as 10, Aces count as 1 or 11.',
      'Dealer must hit until reaching at least soft 17.',
      'Blackjack (Ace + 10-value card) pays 3:2.',
    ],
    controls: {
      mouse: ['Click betting chips to place bet', 'Click Hit, Stand, or Double Down'],
      keyboard: ['H: Hit', 'S: Stand', 'D: Double Down'],
    },
  },
  {
    id: 'poker',
    path: '/games/card-territory/poker',
    title: 'Poker Arena',
    description:
      'No-Limit Texas Hold’em. Read the flop, bet your chips, and bluff out the AI contenders.',
    descriptor: 'Hold\'em',
    badge: 'Texas Hold’em',
    thumbnail: '/games/poker.webp',
    iconName: 'casino',
    canResume: true,
    rules: [
      'Each player receives 2 private hole cards.',
      'Five community cards are dealt across Flop (3), Turn (1), and River (1).',
      'Make the best 5-card poker hand using any combination of hole and community cards.',
      'Fold, Check, Call, or Raise to outplay opponents.',
    ],
    controls: {
      mouse: ['Click action buttons (Check, Call, Bet/Raise, Fold)'],
      keyboard: ['C: Check / Call', 'F: Fold', 'R: Raise'],
    },
  },
  {
    id: 'rummy',
    path: '/games/card-territory/rummy',
    title: 'Rummy Market',
    description:
      'Meld 13 cards into valid sequences and sets. Fast-paced trading from the market discard pile.',
    descriptor: 'Melds',
    badge: 'Melds & Sequences',
    thumbnail: '/games/rummy.webp',
    iconName: 'view_carousel',
    canResume: true,
    rules: [
      'Deal 13 cards. Form valid groups of Sets and Runs/Sequences.',
      'At least one sequence must be pure.',
      'On each turn, draw one card from closed deck or discard pile, then discard one card.',
      'Declare win when all cards form valid melds.',
    ],
    controls: {
      mouse: ['Click card to select/move', 'Click Draw and Discard buttons'],
      keyboard: ['D: Draw card', 'X: Discard selected card'],
    },
  },
  {
    id: 'uno',
    path: '/games/card-territory/uno',
    title: 'Uno Zone',
    description:
      'Chaotic matching madness. Play colors, numbers, skips, reverses, and wild draw fours.',
    descriptor: 'Zone',
    badge: 'Color Match',
    thumbnail: '/games/uno.webp',
    iconName: 'palette',
    canResume: true,
    rules: [
      'Match the top discard card by Color or Number.',
      'Action cards trigger Skips, Turn Reversals, and Draw Two penalties.',
      'Wild cards allow you to change the active color.',
      'First player to discard all their cards wins the round.',
    ],
    controls: {
      mouse: ['Click card in your hand to play', 'Click Draw Pile if you have no match'],
      keyboard: ['D: Draw card from deck'],
    },
  },
];
