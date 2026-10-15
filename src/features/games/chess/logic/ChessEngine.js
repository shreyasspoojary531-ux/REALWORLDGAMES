import { Chess } from 'chess.js';
import { GameEngine } from '@/lib/engineInterface';

// Piece value weights for AI evaluation
const PIECE_VALUES = {
  p: 100,
  n: 320,
  b: 330,
  r: 500,
  q: 900,
  k: 20000,
};

// Complete Piece-Square Positional Tables (favoring center control, development, king safety)
const PAWN_TABLE = [
  0,  0,  0,  0,  0,  0,  0,  0,
  50, 50, 50, 50, 50, 50, 50, 50,
  10, 10, 20, 30, 30, 20, 10, 10,
  5,  5, 10, 25, 25, 10,  5,  5,
  0,  0,  0, 20, 20,  0,  0,  0,
  5, -5,-10,  0,  0,-10, -5,  5,
  5, 10, 10,-20,-20, 10, 10,  5,
  0,  0,  0,  0,  0,  0,  0,  0,
];

const KNIGHT_TABLE = [
  -50,-40,-30,-30,-30,-30,-40,-50,
  -40,-20,  0,  0,  0,  0,-20,-40,
  -30,  0, 10, 15, 15, 10,  0,-30,
  -30,  5, 15, 20, 20, 15,  5,-30,
  -30,  0, 15, 20, 20, 15,  0,-30,
  -30,  5, 10, 15, 15, 10,  5,-30,
  -40,-20,  0,  5,  5,  0,-20,-40,
  -50,-40,-30,-30,-30,-30,-40,-50,
];

const BISHOP_TABLE = [
  -20,-10,-10,-10,-10,-10,-10,-20,
  -10,  0,  0,  0,  0,  0,  0,-10,
  -10,  0,  5, 10, 10,  5,  0,-10,
  -10,  5,  5, 10, 10,  5,  5,-10,
  -10,  0, 10, 10, 10, 10,  0,-10,
  -10, 10, 10, 10, 10, 10, 10,-10,
  -10,  5,  0,  0,  0,  0,  5,-10,
  -20,-10,-10,-10,-10,-10,-10,-20,
];

const ROOK_TABLE = [
  0,  0,  0,  0,  0,  0,  0,  0,
  5, 10, 10, 10, 10, 10, 10,  5,
 -5,  0,  0,  0,  0,  0,  0, -5,
 -5,  0,  0,  0,  0,  0,  0, -5,
 -5,  0,  0,  0,  0,  0,  0, -5,
 -5,  0,  0,  0,  0,  0,  0, -5,
 -5,  0,  0,  0,  0,  0,  0, -5,
  0,  0,  0,  5,  5,  0,  0,  0,
];

const QUEEN_TABLE = [
  -20,-10,-10, -5, -5,-10,-10,-20,
  -10,  0,  0,  0,  0,  0,  0,-10,
  -10,  0,  5,  5,  5,  5,  0,-10,
   -5,  0,  5,  5,  5,  5,  0, -5,
    0,  0,  5,  5,  5,  5,  0, -5,
  -10,  5,  5,  5,  5,  5,  0,-10,
  -10,  0,  5,  0,  0,  0,  0,-10,
  -20,-10,-10, -5, -5,-10,-10,-20,
];

const KING_TABLE = [
  -30,-40,-40,-50,-50,-40,-40,-30,
  -30,-40,-40,-50,-50,-40,-40,-30,
  -30,-40,-40,-50,-50,-40,-40,-30,
  -30,-40,-40,-50,-50,-40,-40,-30,
  -20,-30,-30,-40,-40,-30,-30,-20,
  -10,-20,-20,-20,-20,-20,-20,-10,
   20, 20,  0,  0,  0,  0, 20, 20,
   20, 30, 10,  0,  0, 10, 30, 20,
];

export class ChessEngine extends GameEngine {
  constructor() {
    super();
    this.chess = new Chess();
    this.playerColor = 'w';
  }

  init(config = {}) {
    this.chess = new Chess(config.fen || undefined);
    this.playerColor = config.playerColor || 'w';
    return this.getState();
  }

  getLegalActions(fromSquare = null) {
    if (fromSquare) {
      return this.chess.moves({ square: fromSquare, verbose: true });
    }
    return this.chess.moves({ verbose: true });
  }

  applyAction(action) {
    // action: { from, to, promotion = 'q' } or string 'e4'
    const move = this.chess.move(action);
    if (!move) {
      throw new Error(`Illegal chess move: ${JSON.stringify(action)}`);
    }
    return {
      move,
      state: this.getState(),
    };
  }

  undo() {
    const move = this.chess.undo();
    return {
      move,
      state: this.getState(),
    };
  }

  isTerminal() {
    const isGameOver = this.chess.isGameOver();
    if (!isGameOver) {
      return { terminal: false, reason: null, winner: null };
    }

    if (this.chess.isCheckmate()) {
      const winner = this.chess.turn() === 'w' ? 'b' : 'w';
      return { terminal: true, reason: 'checkmate', winner };
    }

    if (this.chess.isDraw()) {
      let reason = 'draw';
      if (this.chess.isStalemate()) reason = 'stalemate';
      else if (this.chess.isThreefoldRepetition()) reason = 'threefold';
      else if (this.chess.isInsufficientMaterial()) reason = 'insufficient';
      return { terminal: true, reason, winner: 'draw' };
    }

    return { terminal: true, reason: 'game_over', winner: null };
  }

  getScore() {
    const terminal = this.isTerminal();
    if (terminal.terminal) {
      if (terminal.winner === this.playerColor) return 1000;
      if (terminal.winner === 'draw') return 250;
      return 0;
    }
    return this.evaluatePosition();
  }

  evaluatePosition() {
    let score = 0;
    const board = this.chess.board();
    for (let r = 0; r < 8; r++) {
      for (let c = 0; c < 8; c++) {
        const piece = board[r][c];
        if (!piece) continue;
        const val = PIECE_VALUES[piece.type] || 0;
        let posVal = 0;
        const idx = piece.color === 'w' ? r * 8 + c : (7 - r) * 8 + c;

        if (piece.type === 'p') posVal = PAWN_TABLE[idx] || 0;
        else if (piece.type === 'n') posVal = KNIGHT_TABLE[idx] || 0;
        else if (piece.type === 'b') posVal = BISHOP_TABLE[idx] || 0;
        else if (piece.type === 'r') posVal = ROOK_TABLE[idx] || 0;
        else if (piece.type === 'q') posVal = QUEEN_TABLE[idx] || 0;
        else if (piece.type === 'k') posVal = KING_TABLE[idx] || 0;

        const totalVal = val + posVal;
        if (piece.color === 'w') score += totalVal;
        else score -= totalVal;
      }
    }
    return score;
  }

  /**
   * Perft move path enumerator from current state
   */
  perft(depth) {
    const moves = this.chess.moves({ verbose: true });
    if (depth <= 1) return moves.length;
    let nodes = 0;
    for (const move of moves) {
      this.chess.move(move);
      nodes += this.perft(depth - 1);
      this.chess.undo();
    }
    return nodes;
  }

  /**
   * Depth-3 Alpha-Beta search with iterative deepening and a strict 400ms hard deadline.
   * Simple move ordering: captures and checks evaluated first.
   */
  getBestMove() {
    const legalMoves = this.chess.moves({ verbose: true });
    if (legalMoves.length === 0) return null;
    if (legalMoves.length === 1) return legalMoves[0];

    const isMaximizing = this.chess.turn() === 'w';
    const deadline = Date.now() + 400; // Hard cap of 400ms per move

    // Move ordering: captures first, then promotions
    const orderMoves = (moves) => {
      return [...moves].sort((a, b) => {
        const scoreA = (a.captured ? 100 + (PIECE_VALUES[a.captured] || 0) : 0) + (a.promotion ? 80 : 0);
        const scoreB = (b.captured ? 100 + (PIECE_VALUES[b.captured] || 0) : 0) + (b.promotion ? 80 : 0);
        return scoreB - scoreA;
      });
    };

    let bestMove = legalMoves[0];
    const orderedInitial = orderMoves(legalMoves);

    // Iterative deepening from depth 1 up to depth 3
    for (let currentDepth = 1; currentDepth <= 3; currentDepth++) {
      if (Date.now() >= deadline) break;

      let depthBestMove = null;
      let depthBestVal = isMaximizing ? -Infinity : Infinity;
      let isTimedOut = false;

      for (const move of orderedInitial) {
        if (Date.now() >= deadline) {
          isTimedOut = true;
          break;
        }

        this.chess.move(move);
        const evalScore = this.alphaBeta(currentDepth - 1, -Infinity, Infinity, !isMaximizing, deadline);
        this.chess.undo();

        if (Date.now() >= deadline) {
          isTimedOut = true;
          break;
        }

        if (isMaximizing ? evalScore > depthBestVal : evalScore < depthBestVal) {
          depthBestVal = evalScore;
          depthBestMove = move;
        }
      }

      if (!isTimedOut && depthBestMove) {
        bestMove = depthBestMove;
      }
    }

    return bestMove;
  }

  alphaBeta(depth, alpha, beta, isMaximizing, deadline) {
    if (Date.now() >= deadline || depth === 0 || this.chess.isGameOver()) {
      return this.evaluatePosition();
    }

    const moves = this.chess.moves({ verbose: true });
    // Move ordering: captures first
    moves.sort((a, b) => (b.captured ? 10 : 0) - (a.captured ? 10 : 0));

    if (isMaximizing) {
      let maxEval = -Infinity;
      for (const m of moves) {
        this.chess.move(m);
        const evalVal = this.alphaBeta(depth - 1, alpha, beta, false, deadline);
        this.chess.undo();
        maxEval = Math.max(maxEval, evalVal);
        alpha = Math.max(alpha, evalVal);
        if (beta <= alpha || Date.now() >= deadline) break;
      }
      return maxEval;
    } else {
      let minEval = Infinity;
      for (const m of moves) {
        this.chess.move(m);
        const evalVal = this.alphaBeta(depth - 1, alpha, beta, true, deadline);
        this.chess.undo();
        minEval = Math.min(minEval, evalVal);
        beta = Math.min(beta, evalVal);
        if (beta <= alpha || Date.now() >= deadline) break;
      }
      return minEval;
    }
  }

  getCapturedPieces() {
    const history = this.chess.history({ verbose: true });
    const captured = { w: [], b: [] }; // captured pieces by each color
    for (const move of history) {
      if (move.captured) {
        // The opponent's piece was captured
        const capturedColor = move.color === 'w' ? 'b' : 'w';
        captured[capturedColor].push(move.captured);
      }
    }
    return captured;
  }

  exportPGN() {
    return this.chess.pgn();
  }

  getState() {
    return {
      fen: this.chess.fen(),
      board: this.chess.board(),
      turn: this.chess.turn(),
      inCheck: this.chess.inCheck(),
      isCheckmate: this.chess.isCheckmate(),
      isDraw: this.chess.isDraw(),
      isGameOver: this.chess.isGameOver(),
      history: this.chess.history({ verbose: true }),
      captured: this.getCapturedPieces(),
    };
  }

  serialize() {
    return {
      fen: this.chess.fen(),
      playerColor: this.playerColor,
    };
  }

  deserialize(data) {
    if (!data || !data.fen) return;
    this.chess = new Chess(data.fen);
    this.playerColor = data.playerColor || 'w';
  }
}
