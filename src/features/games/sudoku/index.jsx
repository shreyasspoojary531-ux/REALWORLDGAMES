import { useState, useEffect, useRef, useCallback } from 'react';
import { GameShell } from '@/components/game/GameShell';
import { GameOverModal } from '@/components/game/GameOverModal';
import { Button } from '@/components/ui/Button';
import { useAudio } from '@/lib/audio';
import { storage } from '@/lib/storage';
import { SudokuEngine } from './logic/SudokuEngine';

export default function SudokuGame() {
  const audio = useAudio();
  const engineRef = useRef(new SudokuEngine());

  const [engineState, setEngineState] = useState(() =>
    engineRef.current.init({ difficulty: 'medium' })
  );
  const [selectedCell, setSelectedCell] = useState([0, 0]);
  const [isNotesMode, setIsNotesMode] = useState(false);
  const [timer, setTimer] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [difficulty, setDifficulty] = useState('medium');
  const [stats, setStats] = useState(() => storage.getStats('sudoku'));

  const finishGame = useCallback((won) => {
    if (won) audio.win();
    else audio.error();
    storage.recordGameEnd('sudoku', won, won ? Math.max(1000 - timer, 100) : 0);
    setStats(storage.getStats('sudoku'));
  }, [timer, audio]);

  // Timer loop
  useEffect(() => {
    if (engineState.isGameOver || isPaused) return;
    const interval = setInterval(() => setTimer((t) => t + 1), 1000);
    return () => clearInterval(interval);
  }, [engineState.isGameOver, isPaused]);

  const initGame = (diff = difficulty) => {
    setDifficulty(diff);
    engineRef.current.init({ difficulty: diff });
    setEngineState(engineRef.current.getState());
    setSelectedCell([0, 0]);
    setTimer(0);
    setIsNotesMode(false);
  };

  const enterNumber = (num) => {
    if (engineState.isGameOver) return;
    const [r, c] = selectedCell;

    if (isNotesMode) {
      audio.click();
      engineRef.current.toggleNote(r, c, num);
      setEngineState(engineRef.current.getState());
      return;
    }

    const res = engineRef.current.enterDigit(r, c, num);
    if (res.conflict) {
      audio.error();
    } else if (res.success) {
      audio.tap();
    }

    const nextState = engineRef.current.getState();
    setEngineState(nextState);

    if (nextState.isGameOver) {
      finishGame(nextState.hasWon);
    }
  };

  const handleErase = () => {
    if (engineState.isGameOver) return;
    audio.click();
    const [r, c] = selectedCell;
    engineRef.current.erase(r, c);
    setEngineState(engineRef.current.getState());
  };

  const handleUndo = () => {
    if (engineState.isGameOver) return;
    audio.click();
    engineRef.current.undo();
    setEngineState(engineRef.current.getState());
  };

  const handleHint = () => {
    if (engineState.isGameOver) return;
    audio.win();
    const [r, c] = selectedCell;
    engineRef.current.getHint(r, c);
    const nextState = engineRef.current.getState();
    setEngineState(nextState);
    if (nextState.isGameOver) {
      finishGame(nextState.hasWon);
    }
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  const [selR, selC] = selectedCell;

  return (
    <GameShell
      gameId="sudoku"
      title="Sudoku Clash"
      category="Puzzle"
      accentColor="#06b6d4"
      turnIndicator={`Strikes: ${engineState.strikes} / ${engineState.maxStrikes}`}
      timer={formatTime(timer)}
      score={(stats?.gamesWon || 0) * 100}
      highScore={stats?.highScore || 0}
      isPaused={isPaused}
      onTogglePause={() => setIsPaused(!isPaused)}
      howToPlay={{
        goal: 'Fill every row, column, and 3x3 region with digits 1 through 9 without duplication.',
        rules: [
          'Each row must contain digits 1-9 with no repeats.',
          'Each column must contain digits 1-9 with no repeats.',
          'Each of the nine 3x3 blocks must contain digits 1-9 with no repeats.',
          '3-Strikes Rule: making 3 placement mistakes results in game defeat.',
          'Pencil Notes: toggle Notes mode to jot down possible candidate digits inside cells.',
        ],
        controls: {
          touch: [
            'Tap cell on 9x9 grid to select',
            'Tap number 1-9 on keypad to enter digit',
            'Tap Pencil icon to toggle candidate notes mode',
          ],
          mouse: [
            'Click grid cell or navigate via Arrow Keys',
            'Type 1-9 on keyboard or click keypad buttons',
            'Press Backspace or Delete to erase',
          ],
        },
        scoring: 'Score points based on difficulty (+100 Easy, +200 Medium, +300 Hard) plus speed bonus minus strike penalties.',
        winLose: 'Win when the full 9x9 grid is completely solved. Lose if 3 strikes occur.',
        tips: [
          'Look for rows, columns, or 3x3 blocks with only 1 or 2 missing digits first (Naked Singles).',
          'Use Pencil notes liberally on Hard difficulty to visualize intersecting exclusions.',
        ],
      }}
      onRestart={() => initGame(difficulty)}
    >
      <div className="flex-1 flex flex-col items-center justify-between p-2 sm:p-4 max-w-xl mx-auto w-full select-none">
        {/* Status Header: Difficulty & Strikes */}
        <div className="w-full flex items-center justify-between bg-surface-container/70 border border-outline-variant/30 px-3 py-2 rounded-xl mb-2 text-xs">
          {/* Difficulty Chips */}
          <div className="flex items-center gap-1 bg-surface rounded-lg p-0.5 border border-outline-variant/20">
            {['easy', 'medium', 'hard'].map((d) => (
              <button
                key={d}
                onClick={() => initGame(d)}
                className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase transition-colors ${
                  difficulty === d ? 'bg-secondary text-surface' : 'text-on-surface-variant hover:text-on-surface'
                }`}
              >
                {d}
              </button>
            ))}
          </div>

          {/* Strikes Counter */}
          <div className="flex items-center gap-1.5">
            <span className="text-on-surface-variant font-bold">Mistakes:</span>
            <div className="flex items-center gap-1">
              {[1, 2, 3].map((s) => (
                <span
                  key={s}
                  className={`w-4 h-4 rounded-full flex items-center justify-center text-[10px] font-black ${
                    s <= engineState.strikes ? 'bg-rose-600 text-white shadow-sm' : 'bg-slate-800 text-slate-500'
                  }`}
                >
                  ✕
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* 9x9 Sudoku Board */}
        <div className="w-full max-w-[380px] sm:max-w-[420px] aspect-square bg-slate-900 border-4 border-slate-700/80 rounded-2xl grid grid-cols-9 grid-rows-9 p-0.5 shadow-2xl select-none">
          {engineState.currentGrid.map((row, r) =>
            row.map((val, c) => {
              const isClue = engineState.initialGrid[r][c] !== 0;
              const isSelected = selR === r && selC === c;
              const isHighlightPeer = selR === r || selC === c || (Math.floor(selR / 3) === Math.floor(r / 3) && Math.floor(selC / 3) === Math.floor(c / 3));
              const isSameDigit = val > 0 && val === engineState.currentGrid[selR][selC];

              // Box thick borders
              const borderBottom = r % 3 === 2 && r !== 8 ? 'border-b-2 border-b-slate-600' : 'border-b border-b-slate-800/40';
              const borderRight = c % 3 === 2 && c !== 8 ? 'border-r-2 border-r-slate-600' : 'border-r border-r-slate-800/40';

              const cellNotes = engineState.notes[r][c] || [];

              return (
                <div
                  key={`${r}-${c}`}
                  onClick={() => {
                    audio.click();
                    setSelectedCell([r, c]);
                  }}
                  className={`relative flex items-center justify-center font-bold text-base sm:text-lg cursor-pointer transition-colors ${borderBottom} ${borderRight} ${
                    isSelected
                      ? 'bg-blue-600/40 ring-2 ring-cyan-400 z-10'
                      : isSameDigit
                        ? 'bg-cyan-900/40 text-cyan-200'
                        : isHighlightPeer
                          ? 'bg-slate-800/50'
                          : 'hover:bg-slate-800/30'
                  }`}
                >
                  {val > 0 ? (
                    <span className={isClue ? 'text-white font-black' : 'text-cyan-400 font-mono font-bold'}>
                      {val}
                    </span>
                  ) : (
                    /* 3x3 mini candidate notes grid */
                    <div className="grid grid-cols-3 grid-rows-3 w-full h-full p-0.5 pointer-events-none text-[8px] sm:text-[9px] font-mono text-slate-400 leading-none">
                      {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((n) => (
                        <span key={n} className="flex items-center justify-center">
                          {cellNotes.includes(n) ? n : ''}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>

        {/* Action Controls Bar: Notes Toggle, Erase, Undo, Hint */}
        <div className="w-full max-w-sm pt-2 flex items-center justify-around gap-2 text-xs">
          <Button
            variant={isNotesMode ? 'primary' : 'surface'}
            size="sm"
            onClick={() => setIsNotesMode(!isNotesMode)}
            icon={<span className="material-symbols-outlined text-[18px]">edit_note</span>}
          >
            Notes: {isNotesMode ? 'ON' : 'OFF'}
          </Button>

          <Button
            variant="surface"
            size="sm"
            onClick={handleErase}
            icon={<span className="material-symbols-outlined text-[18px]">backspace</span>}
          >
            Erase
          </Button>

          <Button
            variant="surface"
            size="sm"
            onClick={handleUndo}
            disabled={engineState.isGameOver}
            icon={<span className="material-symbols-outlined text-[18px]">undo</span>}
          >
            Undo
          </Button>

          <Button
            variant="surface"
            size="sm"
            onClick={handleHint}
            icon={<span className="material-symbols-outlined text-[18px]">lightbulb</span>}
          >
            Hint
          </Button>
        </div>

        {/* 1-9 Keypad Buttons (min 48x48px mobile touch targets) */}
        <div className="w-full max-w-sm pt-2 flex items-center justify-center gap-1.5 sm:gap-2 flex-wrap">
          {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => (
            <button
              key={num}
              onClick={() => enterNumber(num)}
              className="min-w-[48px] min-h-[48px] rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700/80 font-bold text-lg text-white shadow transition-all active:scale-95 flex items-center justify-center focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400"
            >
              {num}
            </button>
          ))}
        </div>
      </div>

      <GameOverModal
        isOpen={engineState.isGameOver}
        won={engineState.hasWon}
        score={Math.max(1000 - timer, 100)}
        highScore={stats.highScore}
        message={
          engineState.hasWon
            ? `Completed in ${formatTime(timer)} with ${engineState.strikes} mistakes!`
            : '3 Mistakes! The grid claimed defeat.'
        }
        onRestart={() => initGame(difficulty)}
        onExit={() => window.location.assign('/')}
      />
    </GameShell>
  );
}
