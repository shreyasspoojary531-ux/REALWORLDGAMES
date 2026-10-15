import { describe, it, expect, beforeEach } from 'vitest';
import {
  BlackjackEngine,
  calculateHandValue,
  createDeck,
  shuffleDeck,
} from './BlackjackEngine';

describe('BlackjackEngine', () => {
  let engine;

  beforeEach(() => {
    engine = new BlackjackEngine();
    engine.init({ bankroll: 1000, bet: 50 });
  });

  it('initializes a standard 52-card deck', () => {
    const deck = createDeck();
    expect(deck.length).toBe(52);
  });

  it('shuffles cards using Fisher-Yates shuffle', () => {
    const deck = createDeck();
    const shuffled = shuffleDeck(deck);
    expect(shuffled.length).toBe(52);
  });

  it('reshuffles automatically when fewer than 15 cards remain', () => {
    engine.deck = engine.deck.slice(0, 10); // 10 cards left
    engine.resetRound();
    expect(engine.deck.length).toBe(52);
  });

  it('correctly calculates hand values and adjusts Aces from 11 to 1', () => {
    // Single Ace + 7 = 18 (Soft)
    const softHand = [
      { rank: 'A', value: 11 },
      { rank: '7', value: 7 },
    ];
    expect(calculateHandValue(softHand)).toEqual({
      total: 18,
      isSoft: true,
      isBlackjack: false,
      isBust: false,
    });

    // Two Aces: 11 + 1 = 12
    const twoAces = [
      { rank: 'A', value: 11 },
      { rank: 'A', value: 11 },
    ];
    expect(calculateHandValue(twoAces).total).toBe(12);

    // Ace + 8 + 5 = 14 (Hard, Ace reduced from 11 to 1)
    const hardHand = [
      { rank: 'A', value: 11 },
      { rank: '8', value: 8 },
      { rank: '5', value: 5 },
    ];
    expect(calculateHandValue(hardHand).total).toBe(14);
    expect(calculateHandValue(hardHand).isSoft).toBe(false);
  });

  it('detects natural Blackjack (Ace + 10-value card on deal)', () => {
    const naturalHand = [
      { rank: 'A', value: 11 },
      { rank: 'K', value: 10 },
    ];
    const val = calculateHandValue(naturalHand);
    expect(val.isBlackjack).toBe(true);
    expect(val.total).toBe(21);
  });

  it('detects busts when hand exceeds 21', () => {
    const bustHand = [
      { rank: '10', value: 10 },
      { rank: '9', value: 9 },
      { rank: '5', value: 5 },
    ];
    const val = calculateHandValue(bustHand);
    expect(val.isBust).toBe(true);
    expect(val.total).toBe(24);
  });

  it('dealer draws until 17 or more and stands on all 17s', () => {
    engine.dealerHand = [
      { rank: '8', value: 8 },
      { rank: '6', value: 6 }, // Total 14 -> must hit
    ];
    engine.playerHand = [
      { rank: '10', value: 10 },
      { rank: '9', value: 9 }, // Total 19
    ];

    engine.resolveDealerTurn();
    const dVal = calculateHandValue(engine.dealerHand);
    expect(dVal.total).toBeGreaterThanOrEqual(17);
  });

  it('pays 3 to 2 for natural Blackjack', () => {
    engine.currentBet = 100;
    engine.bankroll = 900; // 1000 - 100 bet
    engine.playerHand = [
      { rank: 'A', value: 11 },
      { rank: 'K', value: 10 },
    ];
    engine.dealerHand = [
      { rank: '9', value: 9 },
      { rank: '8', value: 8 },
    ];

    engine.evaluatePayouts();
    expect(engine.roundResult.outcome).toBe('blackjack');
    expect(engine.roundResult.winnings).toBe(250); // 100 * 2.5
    expect(engine.bankroll).toBe(1150); // 900 + 250
  });

  it('pays 1 to 1 for standard win', () => {
    engine.currentBet = 50;
    engine.bankroll = 950;
    engine.playerHand = [
      { rank: '10', value: 10 },
      { rank: '10', value: 10 }, // 20
    ];
    engine.dealerHand = [
      { rank: '10', value: 10 },
      { rank: '8', value: 8 }, // 18
    ];

    engine.evaluatePayouts();
    expect(engine.roundResult.outcome).toBe('win');
    expect(engine.roundResult.winnings).toBe(100);
    expect(engine.bankroll).toBe(1050);
  });

  it('returns bet on push (tie)', () => {
    engine.currentBet = 50;
    engine.bankroll = 950;
    engine.playerHand = [
      { rank: '10', value: 10 },
      { rank: '9', value: 9 }, // 19
    ];
    engine.dealerHand = [
      { rank: '10', value: 10 },
      { rank: '9', value: 9 }, // 19
    ];

    engine.evaluatePayouts();
    expect(engine.roundResult.outcome).toBe('push');
    expect(engine.roundResult.winnings).toBe(50);
    expect(engine.bankroll).toBe(1000);
  });

  it('handles loss and bust without returning bet', () => {
    engine.currentBet = 50;
    engine.bankroll = 950;
    engine.playerHand = [
      { rank: '10', value: 10 },
      { rank: '8', value: 8 },
      { rank: '5', value: 5 }, // 23 Bust
    ];
    engine.dealerHand = [
      { rank: '10', value: 10 },
      { rank: '7', value: 7 },
    ];

    engine.evaluatePayouts();
    expect(engine.roundResult.outcome).toBe('bust');
    expect(engine.roundResult.winnings).toBe(0);
    expect(engine.bankroll).toBe(950);
  });

  it('allows Double Down on first two cards only', () => {
    engine.deal();
    if (engine.phase === 'player_turn') {
      expect(engine.getLegalActions()).toContain('double');
      const prevBet = engine.currentBet;
      engine.doubleDown();
      expect(engine.playerHand.length).toBe(3);
      expect(engine.phase).toBe('round_over');
      expect(engine.currentBet).toBe(prevBet * 2);
    }
  });

  it('supports resetting balance to 1000 when bankrupt', () => {
    engine.bankroll = 0;
    engine.resetBalance();
    expect(engine.bankroll).toBe(1000);
    expect(engine.phase).toBe('betting');
  });
});
