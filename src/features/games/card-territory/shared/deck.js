export const SUITS = ['♠', '♥', '♦', '♣'];
export const SUIT_COLORS = {
  '♠': 'text-slate-100',
  '♥': 'text-rose-500',
  '♦': 'text-rose-500',
  '♣': 'text-slate-100',
};

export const RANKS = ['2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K', 'A'];

export function createStandardDeck() {
  const deck = [];
  for (const suit of SUITS) {
    for (let r = 0; r < RANKS.length; r++) {
      const rank = RANKS[r];
      let value = r + 2;
      if (rank === 'A') value = 11;
      else if (['K', 'Q', 'J'].includes(rank)) value = 10;

      deck.push({
        id: `${rank}-${suit}-${Math.random().toString(36).slice(2, 7)}`,
        suit,
        rank,
        value,
      });
    }
  }
  return shuffleDeck(deck);
}

export function shuffleDeck(deck) {
  const shuffled = [...deck];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

export function calculateHandValue(cards) {
  let total = 0;
  let aces = 0;
  for (const card of cards) {
    if (card.rank === 'A') {
      aces++;
      total += 11;
    } else {
      total += card.value;
    }
  }
  while (total > 21 && aces > 0) {
    total -= 10;
    aces--;
  }
  return total;
}
