import { describe, it, expect, beforeEach } from 'vitest';
import { ChessEngine } from './ChessEngine';

describe('ChessEngine', () => {
  let engine;

  beforeEach(() => {
    engine = new ChessEngine();
    engine.init();
  });

  it('initializes with standard starting board and White to move', () => {
    const state = engine.getState();
    expect(state.turn).toBe('w');
    expect(state.inCheck).toBe(false);
    expect(state.isGameOver).toBe(false);
    expect(engine.getLegalActions().length).toBe(20); // 16 pawn moves + 4 knight moves
  });

  it('executes legal pawn moves and advances turn', () => {
    const { move, state } = engine.applyAction({ from: 'e2', to: 'e4' });
    expect(move.san).toBe('e4');
    expect(state.turn).toBe('b');
    expect(engine.getLegalActions().length).toBe(20);
  });

  it('rejects illegal moves with an error', () => {
    expect(() => {
      engine.applyAction({ from: 'e2', to: 'e5' });
    }).toThrow();
  });

  it('supports undoing a move', () => {
    engine.applyAction({ from: 'e2', to: 'e4' });
    const { state } = engine.undo();
    expect(state.turn).toBe('w');
    expect(engine.getState().history.length).toBe(0);
  });

  it('detects check and checkmate correctly (Fool\'s Mate)', () => {
    // 1. f3 e5 2. g4 Qh4#
    engine.applyAction({ from: 'f2', to: 'f3' });
    engine.applyAction({ from: 'e7', to: 'e5' });
    engine.applyAction({ from: 'g2', to: 'g4' });
    engine.applyAction({ from: 'd8', to: 'h4' });

    const terminal = engine.isTerminal();
    expect(terminal.terminal).toBe(true);
    expect(terminal.reason).toBe('checkmate');
    expect(terminal.winner).toBe('b');
  });

  it('supports castling when conditions are met', () => {
    // Set up board for White Kingside castle
    engine.applyAction({ from: 'e2', to: 'e4' });
    engine.applyAction({ from: 'e7', to: 'e5' });
    engine.applyAction({ from: 'g1', to: 'f3' });
    engine.applyAction({ from: 'b8', to: 'c6' });
    engine.applyAction({ from: 'f1', to: 'c4' });
    engine.applyAction({ from: 'f8', to: 'c5' });

    // O-O
    const { move } = engine.applyAction({ from: 'e1', to: 'g1' });
    expect(move.san).toBe('O-O');
  });

  it('handles en passant captures correctly', () => {
    // 1. e4 a6 2. e5 d5 3. exd6
    engine.applyAction({ from: 'e2', to: 'e4' });
    engine.applyAction({ from: 'a7', to: 'a6' });
    engine.applyAction({ from: 'e4', to: 'e5' });
    engine.applyAction({ from: 'd7', to: 'd5' });

    const legalFromE5 = engine.getLegalActions('e5');
    const epMove = legalFromE5.find((m) => m.to === 'd6');
    expect(epMove).toBeDefined();
    expect(epMove.flags).toContain('e'); // en passant flag

    const { move } = engine.applyAction({ from: 'e5', to: 'd6' });
    expect(move.captured).toBe('p');
  });

  it('supports pawn promotion', () => {
    // Setup position 1 square from promotion
    engine.init({ fen: '8/4P3/8/8/8/8/8/4K2k w - - 0 1' });
    const { move } = engine.applyAction({ from: 'e7', to: 'e8', promotion: 'q' });
    expect(move.promotion).toBe('q');
    expect(engine.getState().board[0][4].type).toBe('q');
  });

  it('passes perft move generation benchmarks (depth 1 = 20, depth 2 = 400, depth 3 = 8902)', () => {
    expect(engine.perft(1)).toBe(20);
    expect(engine.perft(2)).toBe(400);
    expect(engine.perft(3)).toBe(8902);
  }, 15000);

  it('detects Scholar\'s Mate ending the game', () => {
    // 1. e4 e5 2. Qh5 Nc6 3. Bc4 Nf6 4. Qxf7#
    engine.applyAction({ from: 'e2', to: 'e4' });
    engine.applyAction({ from: 'e7', to: 'e5' });
    engine.applyAction({ from: 'd1', to: 'h5' });
    engine.applyAction({ from: 'b8', to: 'c6' });
    engine.applyAction({ from: 'f1', to: 'c4' });
    engine.applyAction({ from: 'g8', to: 'f6' });
    engine.applyAction({ from: 'h5', to: 'f7' });

    const terminal = engine.isTerminal();
    expect(terminal.terminal).toBe(true);
    expect(terminal.reason).toBe('checkmate');
    expect(terminal.winner).toBe('w');
  });

  it('prevents castling through check or when king is in check', () => {
    // Setup position where e1->g1 passes through f1 which is attacked by black rook on f8
    // FEN: 4k3/8/8/8/8/5r2/4P3/R3K2R w KQ - 0 1
    engine.init({ fen: '4k3/8/8/8/8/5r2/4P3/R3K2R w KQ - 0 1' });
    const movesFromE1 = engine.getLegalActions('e1');
    const castleKingside = movesFromE1.find((m) => m.to === 'g1');
    // f1 is attacked by rook on f3 -> castling through f1 is illegal
    expect(castleKingside).toBeUndefined();
  });

  it('detects stalemate ending the game as a draw', () => {
    // True stalemate position: White Queen at b6, White King at e1, Black King cornered at a8 with no legal moves
    engine.init({ fen: 'k7/8/1Q6/8/8/8/8/4K3 b - - 0 1' });
    const terminal = engine.isTerminal();
    expect(terminal.terminal).toBe(true);
    expect(terminal.reason).toBe('stalemate');
    expect(terminal.winner).toBe('draw');
  });

  it('calculates AI best move within 400ms time cap', () => {
    const start = Date.now();
    const bestMove = engine.getBestMove();
    const elapsed = Date.now() - start;

    expect(bestMove).toBeDefined();
    expect(bestMove.from).toBeDefined();
    expect(elapsed).toBeLessThan(450); // Hard cap respected
  });

  it('correctly serializes and deserializes state', () => {
    engine.applyAction({ from: 'd2', to: 'd4' });
    const serialized = engine.serialize();
    const newEngine = new ChessEngine();
    newEngine.deserialize(serialized);

    expect(newEngine.getState().turn).toBe('b');
    expect(newEngine.getState().fen).toBe(engine.getState().fen);
  });
});
