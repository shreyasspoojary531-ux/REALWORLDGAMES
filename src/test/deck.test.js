import { describe, it, expect } from 'vitest';
import {
  createStandardDeck,
  calculateHandValue,
  shuffleDeck,
} from '../features/games/card-territory/shared/deck';

describe('Deck Logic & Card Mechanics', () => {
  it('creates a standard 52-card deck', () => {
    const deck = createStandardDeck();
    expect(deck).toHaveLength(52);
  });

  it('correctly calculates Blackjack hand totals including soft Aces', () => {
    // Ace + King = 21 (Natural Blackjack)
    expect(
      calculateHandValue([
        { rank: 'A', value: 11 },
        { rank: 'K', value: 10 },
      ])
    ).toBe(21);

    // Ace + 7 + 8 = 16 (Ace converts to 1 instead of busting)
    expect(
      calculateHandValue([
        { rank: 'A', value: 11 },
        { rank: '7', value: 7 },
        { rank: '8', value: 8 },
      ])
    ).toBe(16);

    // Two Aces = 12 (11 + 1)
    expect(
      calculateHandValue([
        { rank: 'A', value: 11 },
        { rank: 'A', value: 11 },
      ])
    ).toBe(12);
  });

  it('shuffles deck properly', () => {
    const deck = createStandardDeck();
    const shuffled = shuffleDeck(deck);
    expect(shuffled).toHaveLength(52);
  });
});
