import { GameEngine } from '@/lib/engineInterface';

export const WINNING_COMBOS = [
  [0, 1, 2], [3, 4, 5], [6, 7, 8], // Rows
  [0, 3, 6], [1, 4, 7], [2, 5, 8], // Columns
  [0, 4, 8], [2, 4, 6],             // Diagonals
];

export class TicTacToeEngine extends GameEngine {
  constructor() {
    super();
    this.board = Array(9).fill(null);
    this.turn = 'X'; // 'X' (player 1) | 'O' (player 2 / Computer)
    this.scores = { X: 0, O: 0, draws: 0 };
    this.mode = 'pve'; // 'pve' (Player vs Computer) | 'pvp' (Pass and Play)
    this.isRoundOver = false;
    this.roundWinner = null;
    this.winningCombo = [];
  }

  init(config = {}) {
    this.mode = config.mode || 'pve';
    this.scores = { X: 0, O: 0, draws: 0 };
    this.resetRound();
    return this.getState();
  }

  resetRound() {
    this.board = Array(9).fill(null);
    this.turn = 'X';
    this.isRoundOver = false;
    this.roundWinner = null;
    this.winningCombo = [];
  }

  getLegalActions() {
    if (this.isRoundOver) return [];
    return this.board
      .map((val, idx) => (val === null ? idx : null))
      .filter((idx) => idx !== null);
  }

  applyAction(cellIndex) {
    if (this.isRoundOver || this.board[cellIndex] !== null) {
      return false;
    }

    this.board[cellIndex] = this.turn;
    const outcome = this.checkBoardWinner(this.board);

    if (outcome) {
      this.isRoundOver = true;
      this.roundWinner = outcome.winner;
      this.winningCombo = outcome.combo;

      if (outcome.winner === 'X') this.scores.X++;
      else if (outcome.winner === 'O') this.scores.O++;
      else this.scores.draws++;

      return { outcome, state: this.getState() };
    }

    this.turn = this.turn === 'X' ? 'O' : 'X';
    return { outcome: null, state: this.getState() };
  }

  checkBoardWinner(board) {
    for (const combo of WINNING_COMBOS) {
      const [a, b, c] = combo;
      if (board[a] && board[a] === board[b] && board[a] === board[c]) {
        return { winner: board[a], combo };
      }
    }
    if (board.every((cell) => cell !== null)) {
      return { winner: 'draw', combo: [] };
    }
    return null;
  }

  /**
   * Fast rule-ordered AI move selector:
   * 1. Win if possible
   * 2. Block opponent win
   * 3. Take center (cell 4)
   * 4. Take a corner (cells 0, 2, 6, 8)
   * 5. Take any free cell
   */
  computeBestMove() {
    const legal = this.getLegalActions();
    if (legal.length === 0) return null;

    // 1. Win if possible
    for (const move of legal) {
      this.board[move] = 'O';
      const outcome = this.checkBoardWinner(this.board);
      this.board[move] = null;
      if (outcome && outcome.winner === 'O') {
        return move;
      }
    }

    // 2. Block opponent win
    for (const move of legal) {
      this.board[move] = 'X';
      const outcome = this.checkBoardWinner(this.board);
      this.board[move] = null;
      if (outcome && outcome.winner === 'X') {
        return move;
      }
    }

    // 3. Take center if available
    if (this.board[4] === null) {
      return 4;
    }

    // 4. Take a corner if available
    const corners = [0, 2, 6, 8].filter((c) => this.board[c] === null);
    if (corners.length > 0) {
      return corners[0];
    }

    // 5. Take any free cell
    return legal[0];
  }

  isTerminal() {
    return {
      terminal: this.isRoundOver,
      winner: this.roundWinner,
      combo: this.winningCombo,
    };
  }

  getScore() {
    return {
      scores: this.scores,
    };
  }

  getState() {
    return {
      board: [...this.board],
      turn: this.turn,
      isRoundOver: this.isRoundOver,
      roundWinner: this.roundWinner,
      winningCombo: [...this.winningCombo],
      scores: { ...this.scores },
      mode: this.mode,
    };
  }

  serialize() {
    return {
      scores: this.scores,
      mode: this.mode,
    };
  }

  deserialize(data) {
    if (!data) return;
    this.scores = data.scores || { X: 0, O: 0, draws: 0 };
    this.mode = data.mode || 'pve';
  }
}
