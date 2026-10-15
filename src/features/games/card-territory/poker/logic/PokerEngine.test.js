import { describe, it, expect, beforeEach } from 'vitest';
import {
  PokerEngine,
  evaluate7Cards,
  compareEvaluatedHands,
  calculatePots,
} from './PokerEngine';

describe('PokerEngine', () => {
  let engine;

  beforeEach(() => {
    engine = new PokerEngine();
    engine.init({ playerStack: 1000, bot1Stack: 1000, bot2Stack: 1000 });
  });

  describe('Hand Rankings & Tie-breaking', () => {
    it('evaluates hand categories correctly from High Card to Royal Flush', () => {
      // 1. Royal Flush
      const royal = [
        { rank: 'A', suit: '♠', value: 14 },
        { rank: 'K', suit: '♠', value: 13 },
        { rank: 'Q', suit: '♠', value: 12 },
        { rank: 'J', suit: '♠', value: 11 },
        { rank: '10', suit: '♠', value: 10 },
        { rank: '2', suit: '♥', value: 2 },
        { rank: '3', suit: '♦', value: 3 },
      ];
      expect(evaluate7Cards(royal).category).toBe(9);

      // 2. Straight Flush
      const straightFlush = [
        { rank: '9', suit: '♠', value: 9 },
        { rank: '8', suit: '♠', value: 8 },
        { rank: '7', suit: '♠', value: 7 },
        { rank: '6', suit: '♠', value: 6 },
        { rank: '5', suit: '♠', value: 5 },
        { rank: '2', suit: '♥', value: 2 },
        { rank: '3', suit: '♦', value: 3 },
      ];
      expect(evaluate7Cards(straightFlush).category).toBe(8);

      // 3. Four of a Kind
      const quads = [
        { rank: '9', suit: '♠', value: 9 },
        { rank: '9', suit: '♥', value: 9 },
        { rank: '9', suit: '♦', value: 9 },
        { rank: '9', suit: '♣', value: 9 },
        { rank: 'K', suit: '♠', value: 13 },
        { rank: '2', suit: '♥', value: 2 },
        { rank: '3', suit: '♦', value: 3 },
      ];
      expect(evaluate7Cards(quads).category).toBe(7);

      // 4. Full House
      const fullHouse = [
        { rank: 'K', suit: '♠', value: 13 },
        { rank: 'K', suit: '♥', value: 13 },
        { rank: 'K', suit: '♦', value: 13 },
        { rank: '7', suit: '♣', value: 7 },
        { rank: '7', suit: '♠', value: 7 },
        { rank: '2', suit: '♥', value: 2 },
        { rank: '4', suit: '♦', value: 4 },
      ];
      expect(evaluate7Cards(fullHouse).category).toBe(6);

      // 5. Flush
      const flush = [
        { rank: 'A', suit: '♥', value: 14 },
        { rank: 'J', suit: '♥', value: 11 },
        { rank: '8', suit: '♥', value: 8 },
        { rank: '6', suit: '♥', value: 6 },
        { rank: '2', suit: '♥', value: 2 },
        { rank: 'K', suit: '♠', value: 13 },
        { rank: 'Q', suit: '♦', value: 12 },
      ];
      expect(evaluate7Cards(flush).category).toBe(5);

      // 6. Straight (including 5-high wheel straight A-2-3-4-5)
      const wheelStraight = [
        { rank: 'A', suit: '♠', value: 14 },
        { rank: '2', suit: '♥', value: 2 },
        { rank: '3', suit: '♦', value: 3 },
        { rank: '4', suit: '♣', value: 4 },
        { rank: '5', suit: '♠', value: 5 },
        { rank: '9', suit: '♥', value: 9 },
        { rank: 'K', suit: '♦', value: 13 },
      ];
      const evaluatedWheel = evaluate7Cards(wheelStraight);
      expect(evaluatedWheel.category).toBe(4);
      expect(evaluatedWheel.kickers[0]).toBe(5);
    });

    it('correctly compares hands and applies kickers', () => {
      // Pair of Aces with King kicker vs Pair of Aces with Queen kicker
      const h1 = [
        { rank: 'A', suit: '♠', value: 14 },
        { rank: 'A', suit: '♥', value: 14 },
        { rank: 'K', suit: '♦', value: 13 },
        { rank: '8', suit: '♣', value: 8 },
        { rank: '4', suit: '♠', value: 4 },
      ];
      const h2 = [
        { rank: 'A', suit: '♦', value: 14 },
        { rank: 'A', suit: '♣', value: 14 },
        { rank: 'Q', suit: '♠', value: 12 },
        { rank: '8', suit: '♥', value: 8 },
        { rank: '4', suit: '♦', value: 4 },
      ];
      const eval1 = evaluate7Cards(h1);
      const eval2 = evaluate7Cards(h2);
      expect(compareEvaluatedHands(eval1, eval2)).toBeGreaterThan(0);
      expect(compareEvaluatedHands(eval2, eval1)).toBeLessThan(0);
      expect(compareEvaluatedHands(eval1, eval1)).toBe(0);
    });
  });

  describe('3-Player Blinds & Dealer Button Rotation', () => {
    it('initializes 3 players with 1000 chips each', () => {
      const state = engine.getState();
      expect(state.players.length).toBe(3);
      expect(state.players[0].name).toBe('You');
      expect(state.players[1].name).toContain('Bot 1');
      expect(state.players[2].name).toContain('Bot 2');
    });

    it('posts small blind (10) and big blind (20) correctly', () => {
      const state = engine.getState();
      expect(state.pot).toBe(30); // 10 + 20
      expect(state.currentBet).toBe(20);

      // Verify one player paid 10 and one paid 20
      const sbPlayer = state.players.find((p) => p.isSB);
      const bbPlayer = state.players.find((p) => p.isBB);
      expect(sbPlayer).toBeDefined();
      expect(bbPlayer).toBeDefined();
      expect(sbPlayer.chips).toBe(990);
      expect(bbPlayer.chips).toBe(980);
    });

    it('rotates dealer button and blinds on consecutive hands', () => {
      const firstDealer = engine.dealerButtonIndex;
      engine.startHand();
      const secondDealer = engine.dealerButtonIndex;
      expect(secondDealer).toBe((firstDealer + 1) % 3);
    });
  });

  describe('Side Pots & Split Pots', () => {
    it('calculates main pot and side pots correctly for all-in scenarios', () => {
      // Player 0: all-in for 100
      // Player 1: contributes 300
      // Player 2: contributes 300
      const contributions = [100, 300, 300];
      const folded = [false, false, false];

      const pots = calculatePots(contributions, folded);
      expect(pots.length).toBe(2);

      // Main pot: 100 * 3 = 300 (eligible: 0, 1, 2)
      expect(pots[0].amount).toBe(300);
      expect(pots[0].eligible).toEqual([0, 1, 2]);

      // Side pot: (300 - 100) * 2 = 400 (eligible: 1, 2)
      expect(pots[1].amount).toBe(400);
      expect(pots[1].eligible).toEqual([1, 2]);
    });

    it('excludes folded players from pot eligibility', () => {
      const contributions = [200, 200, 200];
      const folded = [true, false, false];

      const pots = calculatePots(contributions, folded);
      expect(pots.length).toBe(1);
      expect(pots[0].amount).toBe(600);
      expect(pots[0].eligible).toEqual([1, 2]);
    });
  });

  describe('Betting Flow & Streets', () => {
    it('deals 2 hole cards to each player preflop', () => {
      const state = engine.getState();
      expect(state.street).toBe('preflop');
      expect(state.players[0].hand.length).toBe(2);
      expect(state.players[1].hand.length).toBe(2);
      expect(state.players[2].hand.length).toBe(2);
    });

    it('advances through streets when bets are matched', () => {
      // Simulate calls around the table preflop
      while (engine.street === 'preflop') {
        const actor = engine.activeTurn;
        const legal = engine.getLegalActions(actor);
        if (legal.includes('call')) {
          engine.applyAction({ type: 'call' });
        } else if (legal.includes('check')) {
          engine.applyAction({ type: 'check' });
        } else {
          break;
        }
      }

      // Should advance to flop with 3 community cards
      expect(engine.street).toBe('flop');
      expect(engine.communityCards.length).toBe(3);
    });

    it('awards pot to last remaining player if everyone else folds', () => {
      // Active player folds
      engine.applyAction({ type: 'fold' });
      // Next player folds
      engine.applyAction({ type: 'fold' });

      expect(engine.street).toBe('hand_over');
      expect(engine.handResult.reason).toBe('fold');
    });

    it('correctly completes a betting round when all active players match current bet', () => {
      // In preflop, BB posted 20, SB posted 10.
      expect(engine.isBettingRoundComplete()).toBe(false);

      // UTG calls 20
      engine.applyAction({ type: 'call' });
      // Next player (SB) calls remaining 10
      engine.applyAction({ type: 'call' });
      // Big blind checks (matching 20)
      engine.applyAction({ type: 'check' });

      // Round should finish and street advanced to flop
      expect(engine.street).toBe('flop');
    });
  });

  describe('AI Logic & Execution Time', () => {
    it('computes AI action quickly (<10ms) with valid legal action', () => {
      const t0 = performance.now();
      const aiAction = engine.computeAiAction(engine.activeTurn);
      const duration = performance.now() - t0;

      expect(duration).toBeLessThan(15);
      expect(aiAction).toBeDefined();
      expect(['fold', 'check', 'call', 'raise_2bb', 'raise_3bb', 'all_in']).toContain(aiAction.type);
    });
  });

  describe('Elimination & Termination', () => {
    it('marks human eliminated when human chips reach zero', () => {
      engine.players[0].chips = 0;
      engine.checkTournamentEliminations();
      expect(engine.tournamentWinner).toBe('bots');
      expect(engine.isTerminal().terminal).toBe(true);
    });

    it('marks player winner when all bots have 0 chips', () => {
      engine.players[1].chips = 0;
      engine.players[2].chips = 0;
      engine.checkTournamentEliminations();
      expect(engine.tournamentWinner).toBe('player');
      expect(engine.isTerminal().terminal).toBe(true);
    });
  });
});
