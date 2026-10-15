import { describe, it, expect, beforeEach } from 'vitest';
import { TicTacToeEngine, WINNING_COMBOS } from './TicTacToeEngine';

describe('TicTacToeEngine', () => {
  let engine;

  beforeEach(() => {
    engine = new TicTacToeEngine();
    engine.init();
  });

  it('initializes an empty 9-cell board and sets player X to move', () => {
    const state = engine.getState();
    expect(state.board.every((c) => c === null)).toBe(true);
    expect(state.turn).toBe('X');
    expect(state.isRoundOver).toBe(false);
  });

  it('detects every winning combo correctly', () => {
    for (const combo of WINNING_COMBOS) {
      const testEngine = new TicTacToeEngine();
      testEngine.init();
      // Directly populate board with winning line
      const board = Array(9).fill(null);
      combo.forEach((idx) => {
        board[idx] = 'X';
      });
      const res = testEngine.checkBoardWinner(board);
      expect(res.winner).toBe('X');
      expect(res.combo).toEqual(combo);
    }
  });

  it('does not allow moving into an already occupied cell', () => {
    engine.applyAction(0); // X plays 0
    const illegalAttempt = engine.applyAction(0); // Try playing 0 again
    expect(illegalAttempt).toBe(false);
    expect(engine.turn).toBe('O'); // Turn remained unchanged
  });

  it('computer wins when it can', () => {
    // Setup board where O has cells 0 and 1, and cell 2 is open
    engine.board[0] = 'O';
    engine.board[1] = 'O';
    engine.board[3] = 'X';
    engine.board[4] = 'X';
    engine.turn = 'O';

    const bestMove = engine.computeBestMove();
    expect(bestMove).toBe(2);
  });

  it('computer blocks opponent winning threat', () => {
    // Setup board where X has cells 0 and 1, and cell 2 is open
    engine.board[0] = 'X';
    engine.board[1] = 'X';
    engine.turn = 'O';

    const bestMove = engine.computeBestMove();
    expect(bestMove).toBe(2);
  });

  it('computer prefers center when available, then corners', () => {
    // Empty board
    expect(engine.computeBestMove()).toBe(4); // Center

    // Center occupied
    engine.board[4] = 'X';
    const cornerMove = engine.computeBestMove();
    expect([0, 2, 6, 8]).toContain(cornerMove);
  });

  it('detects draws correctly and records score', () => {
    // 0:X, 1:O, 2:X
    // 3:X, 4:O, 5:O
    // 6:O, 7:X, 8:X
    const sequence = [0, 1, 2, 4, 3, 5, 7, 6, 8];
    for (const cell of sequence) {
      engine.applyAction(cell);
    }
    const state = engine.getState();
    expect(state.isRoundOver).toBe(true);
    expect(state.roundWinner).toBe('draw');
    expect(state.scores.draws).toBe(1);
  });

  it('supports resetRound while preserving running scores', () => {
    engine.applyAction(0);
    engine.applyAction(3);
    engine.applyAction(1);
    engine.applyAction(4);
    engine.applyAction(2); // X wins

    expect(engine.scores.X).toBe(1);
    engine.resetRound();

    const state = engine.getState();
    expect(state.board.every((c) => c === null)).toBe(true);
    expect(state.turn).toBe('X');
    expect(state.scores.X).toBe(1);
  });
});
