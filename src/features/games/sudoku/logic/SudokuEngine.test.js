import { describe, it, expect, beforeEach } from 'vitest';
import { SudokuEngine } from './SudokuEngine';

describe('SudokuEngine', () => {
  let engine;

  beforeEach(() => {
    engine = new SudokuEngine();
    engine.init({ difficulty: 'easy' });
  });

  it('generates a valid 9x9 puzzle grid with clues based on difficulty', () => {
    const state = engine.getState();
    expect(state.initialGrid.length).toBe(9);
    expect(state.currentGrid.length).toBe(9);
    expect(state.strikes).toBe(0);

    const clueCount = state.initialGrid.flat().filter((x) => x > 0).length;
    expect(clueCount).toBeGreaterThanOrEqual(30);
  });

  it('accurately verifies placement conflicts against the generated solution', () => {
    // Find an empty cell
    let targetR = -1;
    let targetC = -1;
    for (let r = 0; r < 9; r++) {
      for (let c = 0; c < 9; c++) {
        if (engine.initialGrid[r][c] === 0) {
          targetR = r;
          targetC = c;
          break;
        }
      }
      if (targetR !== -1) break;
    }

    const correct = engine.solution[targetR][targetC];
    const wrong = (correct % 9) + 1; // Different number

    // Enter wrong digit
    const resWrong = engine.enterDigit(targetR, targetC, wrong);
    expect(resWrong.conflict).toBe(true);
    expect(engine.strikes).toBe(1);

    // Enter correct digit
    const resCorrect = engine.enterDigit(targetR, targetC, correct);
    expect(resCorrect.success).toBe(true);
    expect(engine.currentGrid[targetR][targetC]).toBe(correct);
  });

  it('supports candidate pencil notes toggle and auto-clearing', () => {
    let targetR = 0;
    let targetC = 0;
    for (let r = 0; r < 9; r++) {
      for (let c = 0; c < 9; c++) {
        if (engine.initialGrid[r][c] === 0) {
          targetR = r;
          targetC = c;
          break;
        }
      }
    }

    engine.toggleNote(targetR, targetC, 3);
    expect(engine.notes[targetR][targetC].has(3)).toBe(true);

    engine.toggleNote(targetR, targetC, 3);
    expect(engine.notes[targetR][targetC].has(3)).toBe(false);
  });

  it('supports undoing a move', () => {
    let targetR = 0;
    let targetC = 0;
    for (let r = 0; r < 9; r++) {
      for (let c = 0; c < 9; c++) {
        if (engine.initialGrid[r][c] === 0) {
          targetR = r;
          targetC = c;
          break;
        }
      }
    }

    const correct = engine.solution[targetR][targetC];
    engine.enterDigit(targetR, targetC, correct);
    expect(engine.currentGrid[targetR][targetC]).toBe(correct);

    engine.undo();
    expect(engine.currentGrid[targetR][targetC]).toBe(0);
  });

  it('triggers 3-strike defeat when player makes 3 mistakes', () => {
    let targetR = 0;
    let targetC = 0;
    for (let r = 0; r < 9; r++) {
      for (let c = 0; c < 9; c++) {
        if (engine.initialGrid[r][c] === 0) {
          targetR = r;
          targetC = c;
          break;
        }
      }
    }

    const wrong = (engine.solution[targetR][targetC] % 9) + 1;
    engine.enterDigit(targetR, targetC, wrong);
    engine.enterDigit(targetR, targetC, wrong);
    const res3 = engine.enterDigit(targetR, targetC, wrong);

    expect(res3.gameOver).toBe(true);
    expect(engine.isGameOver).toBe(true);
    expect(engine.hasWon).toBe(false);
  });
});
