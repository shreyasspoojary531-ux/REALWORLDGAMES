import { describe, it, expect, beforeEach } from 'vitest';
import { CarromEngine, BOARD_SIZE } from './CarromEngine';

describe('CarromEngine', () => {
  let engine;

  beforeEach(() => {
    engine = new CarromEngine();
    engine.init();
  });

  it('initializes with 19 carrom men (9 white, 9 black, 1 queen) and a striker', () => {
    const state = engine.getState();
    expect(state.coins.length).toBe(19);
    expect(state.coins.filter((c) => c.type === 'white').length).toBe(9);
    expect(state.coins.filter((c) => c.type === 'black').length).toBe(9);
    expect(state.coins.filter((c) => c.type === 'queen').length).toBe(1);
    expect(state.striker).toBeDefined();
    expect(state.turn).toBe('player1');
    expect(state.queenState).toBe('on_board');
  });

  it('clamps striker baseline placement within safe boundary', () => {
    engine.setStrikerPosition(50); // too far left
    expect(engine.striker.x).toBeGreaterThanOrEqual(145);

    engine.setStrikerPosition(BOARD_SIZE - 20); // too far right
    expect(engine.striker.x).toBeLessThanOrEqual(BOARD_SIZE - 145);
  });

  it('fires the striker with given impulse and initiates active shot', () => {
    const fired = engine.fireStriker({ x: 0, y: -1 }, 75);
    expect(fired).toBe(true);
    expect(engine.isShotActive).toBe(true);
    expect(engine.striker.vy).toBeLessThan(0);
  });

  it('transfers motion upon collision between bodies', () => {
    // Position striker right in front of queen and fire upward
    const center = BOARD_SIZE / 2;
    engine.striker.x = center;
    engine.striker.y = center + 50;
    engine.fireStriker({ x: 0, y: -1 }, 80);

    const initialQueenY = engine.coins.find((c) => c.type === 'queen').y;
    // Step physics forward
    for (let i = 0; i < 20; i++) {
      engine.step(1 / 60);
    }

    const currentQueen = engine.coins.find((c) => c.type === 'queen');
    // Queen must have moved forward due to transferred momentum
    expect(currentQueen.y).toBeLessThan(initialQueenY);
  });

  it('stops bodies eventually due to friction', () => {
    engine.fireStriker({ x: 0, y: -1 }, 50);
    // Step forward until resting
    let resting = false;
    for (let i = 0; i < 300; i++) {
      const res = engine.step(1 / 60);
      if (res.isResting) {
        resting = true;
        break;
      }
    }
    expect(resting).toBe(true);
    expect(engine.striker.vx).toBe(0);
    expect(engine.striker.vy).toBe(0);
  });

  it('removes a coin that enters a pocket', () => {
    // Place a coin near top-left pocket and shoot it in
    const testCoin = engine.coins[0];
    testCoin.x = 55;
    testCoin.y = 55;
    testCoin.vx = -5;
    testCoin.vy = -5;
    engine.isShotActive = true;

    let pocketed = false;
    for (let i = 0; i < 10; i++) {
      const { pocketedThisStep } = engine.step(1 / 60);
      if (pocketedThisStep.some((c) => c.id === testCoin.id)) {
        pocketed = true;
        break;
      }
    }
    expect(pocketed).toBe(true);
    expect(testCoin.pocketed).toBe(true);
  });

  it('resolves queen cover requirement correctly', () => {
    // 1. Queen pocketed -> queenState becomes pending_cover
    const outcome1 = engine.resolveTurn([{ type: 'queen' }]);
    expect(outcome1.queenState).toBe('pending_cover');
    expect(engine.queenCoverBy).toBe('player1');

    // 2. Next shot covers with white coin -> queen covered!
    const outcome2 = engine.resolveTurn([{ type: 'white' }]);
    expect(outcome2.queenState).toBe('covered');
    expect(engine.scores.player1).toBeGreaterThanOrEqual(3);
  });

  it('returns queen to center if cover shot fails', () => {
    engine.resolveTurn([{ type: 'queen' }]);
    expect(engine.queenState).toBe('pending_cover');

    // Missed cover shot (no own coins pocketed)
    const outcome = engine.resolveTurn([]);
    expect(outcome.queenState).toBe('on_board');
    expect(engine.queenCoverBy).toBe(null);
  });

  it('handles striker foul penalty and due coins', () => {
    const initialTurn = engine.turn;
    const outcome = engine.resolveTurn([{ type: 'striker' }]);
    expect(engine.pendingDueCoins[initialTurn]).toBe(1);
    expect(outcome.turn).toBe('player2'); // Turn lost on foul
  });

  it('computes AI shot parameters using geometric candidate evaluation', () => {
    const shot = engine.computeAiShot();
    expect(shot).toBeDefined();
    expect(shot.strikerX).toBeGreaterThanOrEqual(145);
    expect(shot.strikerX).toBeLessThanOrEqual(BOARD_SIZE - 145);
    expect(shot.power).toBeGreaterThanOrEqual(10);
    expect(shot.vector).toBeDefined();
  });

  it('correctly serializes and deserializes game state', () => {
    engine.scores.player1 = 5;
    const serialized = engine.serialize();
    const newEngine = new CarromEngine();
    newEngine.deserialize(serialized);

    expect(newEngine.scores.player1).toBe(5);
  });
});
