import { useState, useRef, useCallback, useEffect } from 'react';
import { GameShell } from '@/components/game/GameShell';
import { GameOverModal } from '@/components/game/GameOverModal';
import { Button } from '@/components/ui/Button';
import { useAudio } from '@/lib/audio';
import { storage } from '@/lib/storage';
import { TicTacToeEngine } from './logic/TicTacToeEngine';

export const COMPUTER_MOVE_DELAY_MS = 700;

export default function TicTacToeGame() {
  const audio = useAudio();
  const engineRef = useRef(new TicTacToeEngine());
  const computerTimerRef = useRef(null);

  const [engineState, setEngineState] = useState(() => engineRef.current.init());
  const [mode, setMode] = useState('pve'); // 'pve' (Player vs Computer) | 'pvp' (Pass & Play)
  const [stats, setStats] = useState(() => storage.getStats('tictactoe'));
  const [isComputerThinking, setIsComputerThinking] = useState(false);

  // Clear any scheduled computer move timer
  const clearComputerTimer = useCallback(() => {
    if (computerTimerRef.current) {
      clearTimeout(computerTimerRef.current);
      computerTimerRef.current = null;
    }
    setIsComputerThinking(false);
  }, []);

  // Clean up on component unmount
  useEffect(() => {
    return () => {
      clearComputerTimer();
    };
  }, [clearComputerTimer]);

  // Immediate round resolution feedback
  const handleRoundOutcome = useCallback((outcome) => {
    clearComputerTimer();
    if (outcome.winner === 'X') {
      audio.win();
      storage.recordGameEnd('tictactoe', true, 50);
    } else if (outcome.winner === 'O') {
      audio.error();
      storage.recordGameEnd('tictactoe', false, 10);
    } else {
      audio.click();
      storage.recordGameEnd('tictactoe', false, 25);
    }
    setStats(storage.getStats('tictactoe'));
  }, [audio, clearComputerTimer]);

  const scheduleComputerMove = useCallback(() => {
    clearComputerTimer();
    setIsComputerThinking(true);

    computerTimerRef.current = setTimeout(() => {
      computerTimerRef.current = null;
      setIsComputerThinking(false);

      const bestMove = engineRef.current.computeBestMove();
      if (bestMove !== null) {
        audio.tap();
        const aiResult = engineRef.current.applyAction(bestMove);
        const nextState = engineRef.current.getState();
        setEngineState(nextState);

        if (aiResult && aiResult.outcome) {
          handleRoundOutcome(aiResult.outcome);
        }
      }
    }, COMPUTER_MOVE_DELAY_MS);
  }, [audio, clearComputerTimer, handleRoundOutcome]);

  const handleCellClick = (index) => {
    // If waiting for computer move, ignore taps on the board
    if (isComputerThinking) return;
    if (engineState.isRoundOver) return;
    if (mode === 'pve' && engineState.turn !== 'X') return;
    if (engineState.board[index] !== null) return;

    audio.tap();
    const result = engineRef.current.applyAction(index);
    if (!result) return;

    const nextState = engineRef.current.getState();
    setEngineState(nextState);

    // If player's move ends the game (win or draw), show result immediately
    if (result.outcome) {
      handleRoundOutcome(result.outcome);
      return;
    }

    // Schedule computer response with exactly COMPUTER_MOVE_DELAY_MS delay
    if (mode === 'pve' && nextState.turn === 'O' && !nextState.isRoundOver) {
      scheduleComputerMove();
    }
  };

  const playAgain = () => {
    clearComputerTimer();
    audio.click();
    engineRef.current.resetRound();
    setEngineState(engineRef.current.getState());
  };

  const resetAll = (newMode = mode) => {
    clearComputerTimer();
    audio.tap();
    setMode(newMode);
    engineRef.current.init({ mode: newMode });
    setEngineState(engineRef.current.getState());
  };

  const turnLabel = engineState.isRoundOver
    ? engineState.roundWinner === 'draw'
      ? 'Round ended in a Draw'
      : `Winner: Player ${engineState.roundWinner}!`
    : isComputerThinking
      ? "Computer's turn..."
      : engineState.turn === 'X'
        ? 'Player X to Move'
        : mode === 'pve'
          ? "Computer's turn"
          : 'Player O to Move';

  return (
    <GameShell
      gameId="tictactoe"
      title="Tic Tac Clash"
      category="Classic"
      accentColor="#f43f5e"
      turnIndicator={turnLabel}
      score={(stats?.gamesWon || 0) * 50}
      highScore={stats?.highScore || 0}
      howToPlay={{
        goal: 'Be the first to place three of your marks in a horizontal, vertical, or diagonal row.',
        rules: [
          'Players take turns marking empty cells on a 3x3 grid.',
          'Player X moves first, followed by Player O.',
          'Aligning 3 marks in a line immediately wins the round.',
          'If all 9 cells are filled with no 3-in-a-row, the round ends in a Draw.',
          'Modes: Player vs Computer and Pass & Play on one device.',
        ],
        controls: {
          touch: ['Tap any empty cell to place your mark'],
          mouse: ['Click any empty cell to place mark', 'Click Play Again to start the next round'],
        },
        scoring: 'Win: +50 pts | Draw: +25 pts | Loss: +10 pts.',
        winLose: 'Win by forming 3 marks in a line. Lose if opponent forms 3 marks first.',
        tips: [
          'Control the center cell early to dominate 4 potential winning lines.',
          'Take corners to set up dual-threat fork attacks that cannot be blocked.',
        ],
      }}
      onRestart={resetAll}
    >
      <div className="flex-1 flex flex-col items-center justify-between p-3 sm:p-6 max-w-md mx-auto w-full select-none">
        {/* Scoreboard: Wins, Losses, and Draws */}
        <div className="w-full flex items-center justify-between bg-surface-container/80 border border-outline-variant/30 px-4 py-2.5 rounded-2xl mb-2 text-xs">
          <div className="flex items-center gap-2">
            <span className="font-black text-rose-400 text-sm font-mono">X</span>
            <span className="font-bold text-on-surface">You:</span>
            <span className="font-mono font-bold text-base text-rose-400">{engineState.scores.X}</span>
          </div>

          <div className="flex items-center gap-1.5 px-3 py-0.5 rounded-full bg-surface text-[11px] font-bold border border-outline-variant/20 text-on-surface-variant">
            <span>Draws:</span>
            <span className="font-mono text-on-surface">{engineState.scores.draws}</span>
          </div>

          <div className="flex items-center gap-2">
            <span className="font-mono font-bold text-base text-cyan-400">{engineState.scores.O}</span>
            <span className="font-bold text-on-surface">{mode === 'pve' ? 'Computer' : 'Player 2'}:</span>
            <span className="font-black text-cyan-400 text-sm font-mono">O</span>
          </div>
        </div>

        {/* Small Computer Thinking Status Indicator */}
        <div className="min-h-[24px] flex items-center justify-center my-1">
          {isComputerThinking && (
            <div className="flex items-center gap-1.5 px-3 py-0.5 rounded-full bg-cyan-950/70 border border-cyan-800 text-cyan-300 text-xs font-bold shadow-sm animate-pulse">
              <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-ping" />
              <span>Computer&apos;s turn...</span>
            </div>
          )}
        </div>

        {/* 3x3 Square Grid fitting 360px wide */}
        <div className="w-full max-w-[340px] aspect-square bg-slate-900 border-4 border-slate-700/80 rounded-3xl grid grid-cols-3 grid-rows-3 p-2.5 gap-2.5 shadow-2xl select-none relative">
          {engineState.board.map((cell, idx) => {
            const isWinningCell = engineState.winningCombo.includes(idx);
            const isDisabled = cell !== null || engineState.isRoundOver || isComputerThinking;
            return (
              <button
                key={idx}
                type="button"
                onClick={() => handleCellClick(idx)}
                disabled={isDisabled}
                aria-label={`Cell ${idx + 1}: ${cell || 'Empty'}`}
                className={`rounded-2xl flex items-center justify-center transition-transform duration-150 select-none ${
                  isDisabled ? 'cursor-not-allowed' : 'cursor-pointer active:scale-95'
                } ${
                  isWinningCell
                    ? 'bg-rose-600/35 border-2 border-rose-500 scale-95 shadow-lg shadow-rose-950/50'
                    : 'bg-slate-800/90 hover:bg-slate-700/80 border border-slate-700/60'
                }`}
              >
                {cell === 'X' && (
                  <svg viewBox="0 0 48 48" className="w-14 h-14 sm:w-16 sm:h-16 stroke-rose-500" strokeWidth="6" strokeLinecap="round">
                    <line x1="12" y1="12" x2="36" y2="36" />
                    <line x1="36" y1="12" x2="12" y2="36" />
                  </svg>
                )}
                {cell === 'O' && (
                  <svg viewBox="0 0 48 48" className="w-14 h-14 sm:w-16 sm:h-16 fill-none stroke-cyan-400" strokeWidth="5.5">
                    <circle cx="24" cy="24" r="13" />
                  </svg>
                )}
              </button>
            );
          })}
        </div>

        {/* Immediate Round Result & Play Again Banner */}
        <div className="my-2 min-h-[44px] flex items-center justify-center">
          {engineState.isRoundOver && (
            <Button
              variant="primary"
              size="md"
              onClick={playAgain}
              icon={<span className="material-symbols-outlined text-[18px]">replay</span>}
            >
              Play Again
            </Button>
          )}
        </div>

        {/* Bottom Controls Bar */}
        <div className="w-full pt-3 border-t border-slate-800 flex items-center justify-between gap-2 flex-wrap">
          <Button
            variant="surface"
            size="sm"
            onClick={() => resetAll()}
            icon={<span className="material-symbols-outlined text-[18px]">restart_alt</span>}
          >
            Reset Scores
          </Button>

          {/* Mode Switcher: Player vs Computer & Pass and Play */}
          <button
            onClick={() => resetAll(mode === 'pve' ? 'pvp' : 'pve')}
            className="px-3 py-1.5 text-xs font-bold rounded-lg border border-outline-variant/30 bg-surface-container text-on-surface hover:border-secondary transition-colors"
          >
            {mode === 'pve' ? 'Solo vs AI' : 'Pass & Play'}
          </button>
        </div>
      </div>

      {/* Game Over Modal (triggered on winning or drawing) */}
      <GameOverModal
        isOpen={engineState.isRoundOver}
        won={engineState.roundWinner === 'X'}
        score={engineState.roundWinner === 'X' ? 50 : engineState.roundWinner === 'draw' ? 25 : 10}
        highScore={stats?.highScore || 0}
        message={
          engineState.roundWinner === 'X'
            ? 'Victory! You completed 3-in-a-row!'
            : engineState.roundWinner === 'O'
              ? `${mode === 'pve' ? 'Computer' : 'Player O'} scored 3-in-a-row!`
              : "It's a Draw! Both sides played evenly."
        }
        onRestart={playAgain}
        onExit={() => window.location.assign('/')}
      />
    </GameShell>
  );
}
