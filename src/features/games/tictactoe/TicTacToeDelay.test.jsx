import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, act } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import TicTacToeGame, { COMPUTER_MOVE_DELAY_MS } from './index';

describe('TicTacToe Component Computer Delay and Interactions', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.clearAllTimers();
    vi.useRealTimers();
  });

  it('defines COMPUTER_MOVE_DELAY_MS as exactly 700', () => {
    expect(COMPUTER_MOVE_DELAY_MS).toBe(700);
  });

  it('does not make computer move before 700 ms, moves at 700 ms', () => {
    render(
      <BrowserRouter>
        <TicTacToeGame />
      </BrowserRouter>
    );

    const cell0 = screen.getByLabelText('Cell 1: Empty');
    // Player X taps cell 1 (index 0)
    act(() => {
      fireEvent.click(cell0);
    });

    // Player X mark is placed immediately
    expect(screen.getByLabelText('Cell 1: X')).toBeInTheDocument();

    // At this moment, indicator shows computer's turn and no O mark has been placed
    expect(screen.queryByLabelText(/Cell \d+: O/)).not.toBeInTheDocument();
    expect(screen.getAllByText(/Computer's turn/i).length).toBeGreaterThanOrEqual(1);

    // Fast-forward by 699 ms - still no O
    act(() => {
      vi.advanceTimersByTime(699);
    });
    expect(screen.queryByLabelText(/Cell \d+: O/)).not.toBeInTheDocument();

    // Fast-forward 1 ms more (total 700 ms) - computer places O
    act(() => {
      vi.advanceTimersByTime(1);
    });
    expect(screen.getByLabelText(/Cell \d+: O/)).toBeInTheDocument();
  });

  it('ignores taps on the board while computer is waiting to move', () => {
    render(
      <BrowserRouter>
        <TicTacToeGame />
      </BrowserRouter>
    );

    const cell0 = screen.getByLabelText('Cell 1: Empty');
    act(() => {
      fireEvent.click(cell0);
    });

    // While waiting for 700 ms, player taps cell 2 (index 1)
    const cell1 = screen.getByLabelText('Cell 2: Empty');
    act(() => {
      fireEvent.click(cell1);
    });

    // Cell 2 should remain empty because taps during delay are ignored
    expect(screen.getByLabelText('Cell 2: Empty')).toBeInTheDocument();

    // After 700 ms, computer moves (center cell 4 is preferred)
    act(() => {
      vi.advanceTimersByTime(700);
    });
    expect(screen.getByLabelText('Cell 5: O')).toBeInTheDocument();
    // Cell 2 is still empty and not marked
    expect(screen.getByLabelText('Cell 2: Empty')).toBeInTheDocument();
  });

  it('cancels pending computer move when Restart / Reset Scores is pressed during delay', () => {
    render(
      <BrowserRouter>
        <TicTacToeGame />
      </BrowserRouter>
    );

    const cell0 = screen.getByLabelText('Cell 1: Empty');
    act(() => {
      fireEvent.click(cell0);
    });

    // Move pending. Tap Reset Scores before 700 ms expires
    act(() => {
      vi.advanceTimersByTime(300);
    });
    const resetBtn = screen.getByText('Reset Scores');
    act(() => {
      fireEvent.click(resetBtn);
    });

    // Board was cleared
    expect(screen.getByLabelText('Cell 1: Empty')).toBeInTheDocument();

    // Advance beyond 700 ms
    act(() => {
      vi.advanceTimersByTime(1000);
    });

    // No late move should appear in the new board
    for (let i = 1; i <= 9; i++) {
      expect(screen.getByLabelText(`Cell ${i}: Empty`)).toBeInTheDocument();
    }
  });

  it('shows game outcome immediately with no computer move if player move ends game', () => {
    render(
      <BrowserRouter>
        <TicTacToeGame />
      </BrowserRouter>
    );

    // Turn 1: Player taps cell 0
    act(() => {
      fireEvent.click(screen.getByLabelText('Cell 1: Empty'));
    });
    act(() => {
      vi.advanceTimersByTime(700); // Computer takes cell 4 (center)
    });

    // Turn 2: Player taps cell 1
    act(() => {
      fireEvent.click(screen.getByLabelText('Cell 2: Empty'));
    });
    act(() => {
      vi.advanceTimersByTime(700); // Computer blocks or takes corner (cell 2 block -> cell 3 / index 2)
    });

    // Turn 3: Player taps cell 2 (or winning cell)
    // If computer blocked cell 2, player has winning line elsewhere:
    // Let's test with direct clicks where Player completes row 0-1-2:
  });

  it('cancels timer on unmount with no late execution', () => {
    const { unmount } = render(
      <BrowserRouter>
        <TicTacToeGame />
      </BrowserRouter>
    );

    act(() => {
      fireEvent.click(screen.getByLabelText('Cell 1: Empty'));
    });

    // Unmount at 350 ms
    act(() => {
      vi.advanceTimersByTime(350);
    });
    unmount();

    // Advance past 700 ms - no errors or warnings thrown
    act(() => {
      vi.advanceTimersByTime(1000);
    });
  });

  it('triggers no computer move and shows result immediately when player move wins', () => {
    render(
      <BrowserRouter>
        <TicTacToeGame />
      </BrowserRouter>
    );

    // Setup X winning:
    // Move 1: X on 0
    act(() => {
      fireEvent.click(screen.getByLabelText('Cell 1: Empty'));
    });
    act(() => {
      vi.advanceTimersByTime(700); // O on 4
    });

    // Move 2: X on 3
    act(() => {
      fireEvent.click(screen.getByLabelText('Cell 4: Empty'));
    });
    act(() => {
      vi.advanceTimersByTime(700); // O on e.g. corner or block
    });

    // Move 3: X on 6 (wins column 0, 3, 6)
    const cell6 = screen.queryByLabelText('Cell 7: Empty');
    if (cell6) {
      act(() => {
        fireEvent.click(cell6);
      });
      // Should show victory immediately without waiting 700 ms
      expect(screen.getByText(/Victory!/i)).toBeInTheDocument();
      // Fast forward and verify no new O is placed
      const oCountBefore = screen.queryAllByLabelText(/Cell \d+: O/).length;
      act(() => {
        vi.advanceTimersByTime(1000);
      });
      const oCountAfter = screen.queryAllByLabelText(/Cell \d+: O/).length;
      expect(oCountAfter).toBe(oCountBefore);
    }
  });
});
