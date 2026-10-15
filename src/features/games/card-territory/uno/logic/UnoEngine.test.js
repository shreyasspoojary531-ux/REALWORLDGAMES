import { describe, it, expect, beforeEach } from 'vitest';
import { UnoEngine, createUnoDeck } from './UnoEngine';

describe('UnoEngine', () => {
  let engine;

  beforeEach(() => {
    engine = new UnoEngine();
    engine.init({ playerCount: 3, targetScore: 500 });
  });

  describe('Deck and Dealing', () => {
    it('creates an official 108-card Uno deck with 4 colors and action cards', () => {
      const deck = createUnoDeck();
      expect(deck.length).toBe(108);

      // Verify 4 Wilds and 4 Wild Draw Fours
      const wilds = deck.filter((c) => c.val === 'Wild');
      const wildFours = deck.filter((c) => c.val === '+4');
      expect(wilds.length).toBe(4);
      expect(wildFours.length).toBe(4);
    });

    it('deals 7 cards to each of the 3 players and establishes initial non-wild discard', () => {
      const state = engine.getState();
      expect(state.players.length).toBe(3);
      expect(state.players[0].cardCount).toBe(7);
      expect(state.players[1].cardCount).toBe(7);
      expect(state.players[2].cardCount).toBe(7);
      expect(state.topDiscard).toBeDefined();
      expect(state.topDiscard.color).not.toBe('wild');
      expect(state.activePlayerIdx).toBe(0);
    });
  });

  describe('Card Playability and Action Cards', () => {
    it('validates playable cards by color, value, or wild property', () => {
      engine.activeColor = 'red';
      engine.topDiscard = { color: 'red', val: '5' };

      // Same color
      expect(engine.isCardPlayable({ color: 'red', val: '2' })).toBe(true);
      // Same number, different color
      expect(engine.isCardPlayable({ color: 'blue', val: '5' })).toBe(true);
      // Wild card
      expect(engine.isCardPlayable({ color: 'wild', val: 'Wild' })).toBe(true);
      // Unmatched
      expect(engine.isCardPlayable({ color: 'yellow', val: '8' })).toBe(false);
    });

    it('applies Skip card: next player forfeits turn', () => {
      engine.activeColor = 'blue';
      engine.topDiscard = { color: 'blue', val: '2' };
      engine.activePlayerIdx = 0;

      const skipCard = { id: 'skip-1', color: 'blue', val: 'Skip', points: 20 };
      const extraCard = { id: 'extra-1', color: 'blue', val: '5', points: 5 };
      engine.hands[0] = [skipCard, extraCard];

      engine.playCard(skipCard.id);
      // Player 0 plays Skip -> skips player 1 -> turn goes to player 2
      expect(engine.activePlayerIdx).toBe(2);
    });

    it('applies Reverse in 2-player game as a Skip', () => {
      const twoPlayerEngine = new UnoEngine();
      twoPlayerEngine.init({ playerCount: 2 });
      twoPlayerEngine.activeColor = 'green';
      twoPlayerEngine.topDiscard = { color: 'green', val: '4' };

      const reverseCard = { id: 'rev-1', color: 'green', val: 'Reverse', points: 20 };
      const extraCard = { id: 'extra-rev', color: 'green', val: '7', points: 7 };
      twoPlayerEngine.hands[0] = [reverseCard, extraCard];

      twoPlayerEngine.playCard(reverseCard.id);
      // In 2 players, reverse acts like a skip, keeping turn with player 0
      expect(twoPlayerEngine.activePlayerIdx).toBe(0);
    });

    it('applies Draw Two (+2): next player draws 2 cards and loses turn', () => {
      engine.activeColor = 'blue';
      engine.topDiscard = { color: 'blue', val: '3' };
      engine.activePlayerIdx = 0;

      const drawTwoCard = { id: 'd2-1', color: 'blue', val: '+2', points: 20 };
      const extraCard = { id: 'extra-d2', color: 'blue', val: '9', points: 9 };
      engine.hands[0] = [drawTwoCard, extraCard];

      const botInitialCards = engine.hands[1].length;
      engine.playCard(drawTwoCard.id);

      // Player 1 draws 2 cards and loses turn -> active turn goes to player 2
      expect(engine.hands[1].length).toBe(botInitialCards + 2);
      expect(engine.activePlayerIdx).toBe(2);
    });

    it('applies Wild Draw Four (+4): next player draws 4 cards and loses turn', () => {
      engine.activePlayerIdx = 0;
      const wildFourCard = { id: 'w4-1', color: 'wild', val: '+4', points: 50 };
      const extraCard = { id: 'extra-w4', color: 'red', val: '1', points: 1 };
      engine.hands[0] = [wildFourCard, extraCard];

      const botInitialCards = engine.hands[1].length;
      engine.playCard(wildFourCard.id, 'yellow');

      expect(engine.activeColor).toBe('yellow');
      expect(engine.hands[1].length).toBe(botInitialCards + 4);
      expect(engine.activePlayerIdx).toBe(2);
    });
  });

  describe('UNO Call & Penalty', () => {
    it('penalizes player with 2 cards if they forget to call UNO before turn advances', () => {
      engine.hands[0] = [{ id: 'card-1', color: 'red', val: '7' }];
      engine.calledUno[0] = false;

      // When next player turn begins, player 0 missed UNO penalty applies
      engine.advanceTurn(1);
      expect(engine.hands[0].length).toBe(3); // 1 + 2 penalty cards
    });

    it('does not penalize player if UNO was called', () => {
      engine.hands[0] = [{ id: 'card-1', color: 'red', val: '7' }];
      engine.callUno(0);

      engine.advanceTurn(1);
      expect(engine.hands[0].length).toBe(1);
    });
  });

  describe('Reshuffling Draw Pile', () => {
    it('reshuffles discard pile into draw pile when draw pile empties', () => {
      engine.drawPile = [];
      engine.discardPile = [
        { id: 'c1', color: 'red', val: '1' },
        { id: 'c2', color: 'blue', val: '2' },
        { id: 'c3', color: 'green', val: '3' },
      ];
      engine.topDiscard = engine.discardPile[2];

      const drawn = engine.drawCardFromPile(0);
      expect(drawn).toBeDefined();
      expect(engine.discardPile.length).toBe(1); // Only top discard remains
      expect(engine.drawPile.length).toBeGreaterThan(0);
    });
  });

  describe('Scoring & Match Termination', () => {
    it('accumulates round victory points based on all opponents remaining cards', () => {
      // Player 0 empties hand
      engine.hands[1] = [
        { color: 'red', val: '5', points: 5 },
        { color: 'blue', val: 'Skip', points: 20 },
      ];
      engine.hands[2] = [
        { color: 'wild', val: '+4', points: 50 },
      ];

      engine.resolveRoundWin(0);
      expect(engine.totalScores[0]).toBe(75); // 5 + 20 + 50
      expect(engine.isRoundOver).toBe(true);
    });

    it('terminates match when a player reaches 500 points', () => {
      engine.totalScores[0] = 480;
      engine.hands[1] = [{ color: 'wild', val: 'Wild', points: 50 }];
      engine.hands[2] = [];

      engine.resolveRoundWin(0);
      expect(engine.totalScores[0]).toBe(530);
      expect(engine.isMatchOver).toBe(true);
      expect(engine.matchWinner).toBe('player');
    });
  });

  describe('Fast AI Decisions', () => {
    it('executes bot turn instantly (<15ms)', () => {
      engine.activePlayerIdx = 1;
      const t0 = performance.now();
      const action = engine.computeBotAction(1);
      const elapsed = performance.now() - t0;

      expect(elapsed).toBeLessThan(15);
      expect(action).toBeDefined();
    });
  });
});
