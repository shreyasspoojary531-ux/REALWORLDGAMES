import { GameEngine } from '@/lib/engineInterface';
import { SeededRNG } from '@/lib/rng';

export class SudokuEngine extends GameEngine {
  constructor(rng = new SeededRNG()) {
    super();
    this.rng = rng;
    this.initialGrid = Array.from({ length: 9 }, () => Array(9).fill(0));
    this.currentGrid = Array.from({ length: 9 }, () => Array(9).fill(0));
    this.solution = Array.from({ length: 9 }, () => Array(9).fill(0));
    this.notes = Array.from({ length: 9 }, () => Array.from({ length: 9 }, () => new Set()));
    this.strikes = 0;
    this.maxStrikes = 3;
    this.difficulty = 'medium';
    this.history = [];
    this.isGameOver = false;
    this.hasWon = false;
  }

  init(config = {}) {
    this.difficulty = config.difficulty || 'medium';
    this.strikes = 0;
    this.history = [];
    this.isGameOver = false;
    this.hasWon = false;

    // 1. Generate full solved board
    const full = Array.from({ length: 9 }, () => Array(9).fill(0));
    this.fillGrid(full);
    this.solution = full.map((row) => [...row]);

    // 2. Remove numbers based on difficulty
    const cluesTarget = this.difficulty === 'easy' ? 44 : this.difficulty === 'hard' ? 28 : 34;
    const puzzle = full.map((row) => [...row]);

    const cells = [];
    for (let r = 0; r < 9; r++) {
      for (let c = 0; c < 9; c++) {
        cells.push([r, c]);
      }
    }
    const shuffledCells = this.rng.shuffle(cells);

    let cluesRemaining = 81;
    for (const [r, c] of shuffledCells) {
      if (cluesRemaining <= cluesTarget) break;
      const backup = puzzle[r][c];
      puzzle[r][c] = 0;

      // Quick solvability check
      if (this.countSolutions(puzzle.map((row) => [...row])) !== 1) {
        puzzle[r][c] = backup; // Put back if multiple solutions
      } else {
        cluesRemaining--;
      }
    }

    this.initialGrid = puzzle.map((row) => [...row]);
    this.currentGrid = puzzle.map((row) => [...row]);
    this.notes = Array.from({ length: 9 }, () => Array.from({ length: 9 }, () => new Set()));

    return this.getState();
  }

  fillGrid(grid) {
    const nums = [1, 2, 3, 4, 5, 6, 7, 8, 9];
    for (let r = 0; r < 9; r++) {
      for (let c = 0; c < 9; c++) {
        if (grid[r][c] === 0) {
          const shuffled = this.rng.shuffle(nums);
          for (const num of shuffled) {
            if (this.isValidPlacement(grid, r, c, num)) {
              grid[r][c] = num;
              if (this.fillGrid(grid)) return true;
              grid[r][c] = 0;
            }
          }
          return false;
        }
      }
    }
    return true;
  }

  countSolutions(grid, countRef = { count: 0 }) {
    for (let r = 0; r < 9; r++) {
      for (let c = 0; c < 9; c++) {
        if (grid[r][c] === 0) {
          for (let num = 1; num <= 9; num++) {
            if (this.isValidPlacement(grid, r, c, num)) {
              grid[r][c] = num;
              this.countSolutions(grid, countRef);
              grid[r][c] = 0;
              if (countRef.count >= 2) return countRef.count;
            }
          }
          return countRef.count;
        }
      }
    }
    countRef.count++;
    return countRef.count;
  }

  isValidPlacement(grid, r, c, num) {
    for (let i = 0; i < 9; i++) {
      if (grid[r][i] === num && i !== c) return false;
      if (grid[i][c] === num && i !== r) return false;
    }
    const boxR = Math.floor(r / 3) * 3;
    const boxC = Math.floor(c / 3) * 3;
    for (let i = 0; i < 3; i++) {
      for (let j = 0; j < 3; j++) {
        const curR = boxR + i;
        const curC = boxC + j;
        if (grid[curR][curC] === num && (curR !== r || curC !== c)) return false;
      }
    }
    return true;
  }

  enterDigit(r, c, num) {
    if (this.isGameOver || this.initialGrid[r][c] !== 0) return { success: false };

    // Record history
    this.history.push({
      r,
      c,
      prevVal: this.currentGrid[r][c],
      prevNotes: new Set(this.notes[r][c]),
    });

    // Check if correct against solution
    const isCorrect = this.solution[r][c] === num;

    if (!isCorrect) {
      this.strikes++;
      if (this.strikes >= this.maxStrikes) {
        this.isGameOver = true;
        this.hasWon = false;
      }
      return { success: false, conflict: true, strikes: this.strikes, gameOver: this.isGameOver };
    }

    this.currentGrid[r][c] = num;
    this.notes[r][c].clear();

    // Auto-remove note candidate in row, col, and 3x3 box
    this.cleanNotes(r, c, num);

    // Check completion
    if (this.checkWin()) {
      this.isGameOver = true;
      this.hasWon = true;
    }

    return { success: true, strikes: this.strikes, won: this.hasWon };
  }

  toggleNote(r, c, num) {
    if (this.isGameOver || this.initialGrid[r][c] !== 0 || this.currentGrid[r][c] !== 0) {
      return false;
    }
    if (this.notes[r][c].has(num)) {
      this.notes[r][c].delete(num);
    } else {
      this.notes[r][c].add(num);
    }
    return true;
  }

  erase(r, c) {
    if (this.isGameOver || this.initialGrid[r][c] !== 0) return false;
    this.history.push({
      r,
      c,
      prevVal: this.currentGrid[r][c],
      prevNotes: new Set(this.notes[r][c]),
    });
    this.currentGrid[r][c] = 0;
    this.notes[r][c].clear();
    return true;
  }

  undo() {
    if (this.history.length === 0 || this.isGameOver) return false;
    const last = this.history.pop();
    this.currentGrid[last.r][last.c] = last.prevVal;
    this.notes[last.r][last.c] = last.prevNotes;
    return true;
  }

  getHint(r, c) {
    if (this.isGameOver || this.initialGrid[r][c] !== 0) return null;
    const correctVal = this.solution[r][c];
    this.enterDigit(r, c, correctVal);
    return correctVal;
  }

  cleanNotes(r, c, num) {
    for (let i = 0; i < 9; i++) {
      this.notes[r][i].delete(num);
      this.notes[i][c].delete(num);
    }
    const boxR = Math.floor(r / 3) * 3;
    const boxC = Math.floor(c / 3) * 3;
    for (let i = 0; i < 3; i++) {
      for (let j = 0; j < 3; j++) {
        this.notes[boxR + i][boxC + j].delete(num);
      }
    }
  }

  checkWin() {
    for (let r = 0; r < 9; r++) {
      for (let c = 0; c < 9; c++) {
        if (this.currentGrid[r][c] !== this.solution[r][c]) {
          return false;
        }
      }
    }
    return true;
  }

  getLegalActions() {
    return [1, 2, 3, 4, 5, 6, 7, 8, 9];
  }

  isTerminal() {
    return {
      terminal: this.isGameOver,
      won: this.hasWon,
      strikes: this.strikes,
    };
  }

  getScore() {
    const mult = this.difficulty === 'hard' ? 300 : this.difficulty === 'medium' ? 200 : 100;
    return this.hasWon ? mult - this.strikes * 25 : 0;
  }

  getState() {
    return {
      initialGrid: this.initialGrid.map((r) => [...r]),
      currentGrid: this.currentGrid.map((r) => [...r]),
      notes: this.notes.map((row) => row.map((set) => Array.from(set))),
      strikes: this.strikes,
      maxStrikes: this.maxStrikes,
      difficulty: this.difficulty,
      isGameOver: this.isGameOver,
      hasWon: this.hasWon,
    };
  }

  serialize() {
    return {
      initialGrid: this.initialGrid,
      currentGrid: this.currentGrid,
      difficulty: this.difficulty,
      strikes: this.strikes,
    };
  }

  deserialize(data) {
    if (!data) return;
    this.initialGrid = data.initialGrid || this.initialGrid;
    this.currentGrid = data.currentGrid || this.currentGrid;
    this.difficulty = data.difficulty || 'medium';
    this.strikes = data.strikes || 0;
  }
}
