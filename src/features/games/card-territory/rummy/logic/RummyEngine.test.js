import { describe, it, expect, beforeEach } from 'vitest';
import {
  RummyEngine,
  createRummyDeck,
  isPureSequence,
  isImpureSequence,
  isValidSet,
  validateDeclaration,
  getCardPenalty,
} from './RummyEngine';

describe('RummyEngine', () => {
  let engine;

  beforeEach(() => {
    engine = new RummyEngine();
    engine.init({ scoreLimit: 200 });
  });

  describe('Deck and Dealing', () => {
    it('creates a 106-card deck with 2 full decks and 2 printed jokers', () => {
      const deck = createRummyDeck();
      expect(deck.length).toBe(106);
      const printedJokers = deck.filter((c) => c.isPrintedJoker);
      expect(printedJokers.length).toBe(2);
    });

    it('deals 13 cards to both player and bot with an open wild joker', () => {
      const state = engine.getState();
      expect(state.playerHand.length).toBe(13);
      expect(state.botCardCount).toBe(13);
      expect(state.wildJoker).toBeDefined();
      expect(state.discardTop).toBeDefined();
    });
  });

  describe('Sequence and Set Validation', () => {
    it('validates a pure sequence without any jokers', () => {
      const pure = [
        { rank: '4', suit: '♠', num: 4 },
        { rank: '5', suit: '♠', num: 5 },
        { rank: '6', suit: '♠', num: 6 },
      ];
      expect(isPureSequence(pure)).toBe(true);

      // Sequence with wild or printed joker is NOT pure
      const withJoker = [
        { rank: '4', suit: '♠', num: 4 },
        { rank: '5', suit: '♠', num: 5 },
        { rank: '8', suit: '♦', num: 8, isWildJoker: true },
      ];
      expect(isPureSequence(withJoker)).toBe(false);

      const withPJ = [
        { rank: '4', suit: '♠', num: 4 },
        { rank: '5', suit: '♠', num: 5 },
        { rank: 'PJ', suit: '★', num: 0, isPrintedJoker: true },
      ];
      expect(isPureSequence(withPJ)).toBe(false);
    });

    it('validates Ace-high pure sequence Q-K-A', () => {
      const aceHigh = [
        { rank: 'Q', suit: '♥', num: 12 },
        { rank: 'K', suit: '♥', num: 13 },
        { rank: 'A', suit: '♥', num: 1 },
      ];
      expect(isPureSequence(aceHigh)).toBe(true);
    });

    it('validates an impure sequence with joker substitution', () => {
      // 7♥, Wild Joker, 9♥
      const impure = [
        { rank: '7', suit: '♥', num: 7 },
        { rank: 'K', suit: '♦', num: 13, isWildJoker: true },
        { rank: '9', suit: '♥', num: 9 },
      ];
      expect(isImpureSequence(impure, 'K')).toBe(true);
    });

    it('rejects sequence containing duplicate natural cards', () => {
      const duplicateSuit = [
        { rank: '5', suit: '♠', num: 5 },
        { rank: '5', suit: '♠', num: 5 },
        { rank: '6', suit: '♠', num: 6 },
      ];
      expect(isPureSequence(duplicateSuit)).toBe(false);
      expect(isImpureSequence(duplicateSuit, 'J')).toBe(false);
    });

    it('validates valid sets of 3 or 4 cards with distinct suits', () => {
      // 8♠, 8♥, 8♦
      const validSet = [
        { rank: '8', suit: '♠', num: 8 },
        { rank: '8', suit: '♥', num: 8 },
        { rank: '8', suit: '♦', num: 8 },
      ];
      expect(isValidSet(validSet, 'K')).toBe(true);

      // Set with joker
      const setWithJoker = [
        { rank: '8', suit: '♠', num: 8 },
        { rank: '8', suit: '♥', num: 8 },
        { rank: 'K', suit: '♣', num: 13, isWildJoker: true },
      ];
      expect(isValidSet(setWithJoker, 'K')).toBe(true);

      // Duplicate suit in set is invalid
      const duplicateSet = [
        { rank: '8', suit: '♠', num: 8 },
        { rank: '8', suit: '♠', num: 8 },
        { rank: '8', suit: '♦', num: 8 },
      ];
      expect(isValidSet(duplicateSet, 'K')).toBe(false);
    });
  });

  describe('Declaration Validation (Pure Sequence Rule & Clear Feedback)', () => {
    it('accepts valid 13-card declaration containing at least 1 pure sequence and 1 second sequence', () => {
      const pureSeq = [
        { rank: '2', suit: '♣', num: 2 },
        { rank: '3', suit: '♣', num: 3 },
        { rank: '4', suit: '♣', num: 4 },
      ];
      const secondSeq = [
        { rank: '9', suit: '♦', num: 9 },
        { rank: '10', suit: '♦', num: 10 },
        { rank: 'J', suit: '♦', num: 11 },
      ];
      const set1 = [
        { rank: 'Q', suit: '♠', num: 12 },
        { rank: 'Q', suit: '♥', num: 12 },
        { rank: 'Q', suit: '♦', num: 12 },
      ];
      const set2 = [
        { rank: '5', suit: '♠', num: 5 },
        { rank: '5', suit: '♥', num: 5 },
        { rank: '5', suit: '♣', num: 5 },
        { rank: '5', suit: '♦', num: 5 },
      ];

      const val = validateDeclaration([pureSeq, secondSeq, set1, set2], 'A');
      expect(val.isValid).toBe(true);
      expect(val.pureSequenceFound).toBe(true);
      expect(val.secondSequenceFound).toBe(true);
    });

    it('rejects declaration missing a pure sequence with clear reason', () => {
      // All sets or sequences with jokers
      const impureSeq1 = [
        { rank: '2', suit: '♣', num: 2 },
        { rank: 'A', suit: '♦', num: 1, isWildJoker: true },
        { rank: '4', suit: '♣', num: 4 },
      ];
      const impureSeq2 = [
        { rank: '9', suit: '♦', num: 9 },
        { rank: 'A', suit: '♠', num: 1, isWildJoker: true },
        { rank: 'J', suit: '♦', num: 11 },
      ];
      const set1 = [
        { rank: 'Q', suit: '♠', num: 12 },
        { rank: 'Q', suit: '♥', num: 12 },
        { rank: 'Q', suit: '♦', num: 12 },
      ];
      const set2 = [
        { rank: '5', suit: '♠', num: 5 },
        { rank: '5', suit: '♥', num: 5 },
        { rank: '5', suit: '♣', num: 5 },
        { rank: '5', suit: '♦', num: 5 },
      ];

      const val = validateDeclaration([impureSeq1, impureSeq2, set1, set2], 'A');
      expect(val.isValid).toBe(false);
      expect(val.message).toContain('Pure Sequence');
    });

    it('rejects declaration when total cards count is not 13', () => {
      const groups = [
        [
          { rank: '2', suit: '♣', num: 2 },
          { rank: '3', suit: '♣', num: 3 },
          { rank: '4', suit: '♣', num: 4 },
        ],
      ];
      const val = validateDeclaration(groups, 'A');
      expect(val.isValid).toBe(false);
      expect(val.message).toContain('13 cards');
    });
  });

  describe('Penalty Points and Scoring', () => {
    it('calculates card penalty points accurately', () => {
      expect(getCardPenalty('A')).toBe(10);
      expect(getCardPenalty('K')).toBe(10);
      expect(getCardPenalty('Q')).toBe(10);
      expect(getCardPenalty('J')).toBe(10);
      expect(getCardPenalty('10')).toBe(10);
      expect(getCardPenalty('7')).toBe(7);
      expect(getCardPenalty('2')).toBe(2);
      expect(getCardPenalty('K', true)).toBe(0); // Joker has 0 penalty
      expect(getCardPenalty('PJ')).toBe(0);
    });

    it('caps round penalty at 80 points maximum', () => {
      const heavyHand = [
        { rank: 'K' }, { rank: 'K' }, { rank: 'Q' }, { rank: 'Q' },
        { rank: 'J' }, { rank: 'J' }, { rank: '10' }, { rank: '10' },
        { rank: '9' }, { rank: '9' }, { rank: '8' }, { rank: '8' },
        { rank: 'A' },
      ];
      expect(engine.calculateHandPenalty(heavyHand)).toBe(80);
    });

    it('tracks round history and cumulative scores across rounds', () => {
      engine.totalScores.player = 120;
      engine.totalScores.bot = 80;
      engine.currentRound = 3;
      const state = engine.getState();
      expect(state.totalScores.player).toBe(120);
      expect(state.totalScores.bot).toBe(80);
      expect(state.currentRound).toBe(3);
    });
  });

  describe('Turn Flow & Fast AI Decisions', () => {
    it('executes bot turn under 15ms and discards', () => {
      engine.turn = 'bot';
      engine.turnStep = 'draw';

      const t0 = performance.now();
      engine.computeBotTurn();
      const elapsed = performance.now() - t0;

      expect(elapsed).toBeLessThan(15);
      expect(engine.botHand.length).toBe(13);
      expect(engine.turn).toBe('player');
    });
  });
});
