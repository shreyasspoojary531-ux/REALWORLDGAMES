import { useState, useEffect, useRef, useCallback } from 'react';
import { GameShell } from '@/components/game/GameShell';
import { GameOverModal } from '@/components/game/GameOverModal';
import { Button } from '@/components/ui/Button';
import { useAudio } from '@/lib/audio';
import { storage } from '@/lib/storage';
import { ChessEngine } from './logic/ChessEngine';
import { ChessPiece } from './ChessPiece';

export default function ChessGame() {
  const audio = useAudio();
  const engineRef = useRef(new ChessEngine());
  const [engineState, setEngineState] = useState(() => engineRef.current.init());

  const [selectedSquare, setSelectedSquare] = useState(null);
  const [legalMoves, setLegalMoves] = useState([]);
  const [lastMove, setLastMove] = useState(null);
  const [isAiThinking, setIsAiThinking] = useState(false);
  const [mode, setMode] = useState('pve'); // 'pve' (vs Computer) | 'pvp' (Pass and Play)
  const [playerColor] = useState('w'); // Player is White
  const [isFlipped, setIsFlipped] = useState(false);
  const [showMoveList, setShowMoveList] = useState(false);

  // Promotion sheet: { from, to }
  const [pendingPromotion, setPendingPromotion] = useState(null);

  // Drag & drop state
  const [draggedSquare, setDraggedSquare] = useState(null);

  // Game over state
  const [isGameOver, setIsGameOver] = useState(false);
  const [gameResult, setGameResult] = useState(null);

  const [stats, setStats] = useState(() => storage.getStats('chess'));

  const finishGame = useCallback((terminal) => {
    setIsGameOver(true);

    let won = false;
    let message = '';

    if (terminal.reason === 'checkmate') {
      won = terminal.winner === playerColor;
      message = won
        ? 'Checkmate! You won the game.'
        : mode === 'pvp'
          ? `Checkmate! ${terminal.winner === 'w' ? 'White' : 'Black'} won.`
          : 'Checkmate! Computer won.';
      if (won) audio.win();
      else audio.error();
    } else {
      won = false;
      message = `Draw by ${terminal.reason || 'agreement'}!`;
      audio.click();
    }

    setGameResult({
      won,
      message,
      pgn: engineRef.current.exportPGN(),
    });

    storage.recordGameEnd('chess', won, won ? 1000 : terminal.winner === 'draw' ? 250 : 0);
    setStats(storage.getStats('chess'));
  }, [playerColor, mode, audio]);

  const initGame = useCallback(() => {
    engineRef.current.init({ playerColor });
    const state = engineRef.current.getState();
    setEngineState(state);
    setSelectedSquare(null);
    setLegalMoves([]);
    setLastMove(null);
    setIsAiThinking(false);
    setIsGameOver(false);
    setGameResult(null);
    setPendingPromotion(null);
    setDraggedSquare(null);
  }, [playerColor]);

  // Execute move helper
  const executeMove = useCallback((action) => {
    try {
      const { move, state } = engineRef.current.applyAction(action);
      audio.cardFlip();
      setEngineState(state);
      setLastMove({ from: move.from, to: move.to });
      setSelectedSquare(null);
      setLegalMoves([]);
      setPendingPromotion(null);
      setDraggedSquare(null);

      const terminal = engineRef.current.isTerminal();
      if (terminal.terminal) {
        finishGame(terminal);
      }
    } catch (e) {
      console.warn('Illegal move attempted:', e);
      audio.error();
    }
  }, [audio, finishGame]);

  // Computer Opponent turn dispatch (under 400ms hard cap, instant response without stalled thinking flag)
  useEffect(() => {
    if (mode !== 'pve' || isGameOver) return;
    if (engineState.turn !== playerColor && !isAiThinking) {
      setIsAiThinking(true);
      // Small timeout allows board to render player move smoothly before AI search
      const timer = setTimeout(() => {
        try {
          const aiMove = engineRef.current.getBestMove();
          if (aiMove) {
            const { move, state } = engineRef.current.applyAction(aiMove);
            setEngineState(state);
            setLastMove({ from: move.from, to: move.to });
            audio.cardDeal();

            const terminal = engineRef.current.isTerminal();
            if (terminal.terminal) {
              finishGame(terminal);
            }
          }
        } finally {
          setIsAiThinking(false);
        }
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [engineState.turn, mode, playerColor, isGameOver, isAiThinking, audio, finishGame]);

  const handleSquareClick = (square) => {
    if (isGameOver || isAiThinking) return;
    if (mode === 'pve' && engineState.turn !== playerColor) return;

    // Check if target square is among legal moves for currently selected square
    const matchingMove = legalMoves.find((m) => m.to === square);
    if (matchingMove && selectedSquare) {
      // Check for pawn promotion
      if (matchingMove.flags.includes('p') || (matchingMove.piece === 'p' && (square[1] === '8' || square[1] === '1'))) {
        setPendingPromotion({ from: selectedSquare, to: square });
        return;
      }

      executeMove({ from: selectedSquare, to: square });
      return;
    }

    // Selecting a piece
    const moves = engineRef.current.getLegalActions(square);
    if (moves.length > 0) {
      audio.tap();
      setSelectedSquare(square);
      setLegalMoves(moves);
    } else {
      setSelectedSquare(null);
      setLegalMoves([]);
    }
  };

  // Drag and drop handlers
  const handleDragStart = (e, square) => {
    if (isGameOver || isAiThinking) {
      e.preventDefault();
      return;
    }
    if (mode === 'pve' && engineState.turn !== playerColor) {
      e.preventDefault();
      return;
    }
    const piece = engineRef.current.chess.get(square);
    if (!piece || piece.color !== engineState.turn) {
      e.preventDefault();
      return;
    }
    setDraggedSquare(square);
    setSelectedSquare(square);
    const moves = engineRef.current.getLegalActions(square);
    setLegalMoves(moves);
    e.dataTransfer.setData('text/plain', square);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDrop = (e, targetSquare) => {
    e.preventDefault();
    const fromSquare = draggedSquare || selectedSquare;
    if (!fromSquare || fromSquare === targetSquare) {
      setDraggedSquare(null);
      return;
    }

    const matchingMove = legalMoves.find((m) => m.to === targetSquare);
    if (matchingMove) {
      if (matchingMove.flags.includes('p') || (matchingMove.piece === 'p' && (targetSquare[1] === '8' || targetSquare[1] === '1'))) {
        setPendingPromotion({ from: fromSquare, to: targetSquare });
        return;
      }
      executeMove({ from: fromSquare, to: targetSquare });
    }
    setDraggedSquare(null);
  };

  const handleUndo = () => {
    if (isGameOver || isAiThinking || engineState.history.length === 0) return;
    audio.click();
    if (mode === 'pve') {
      engineRef.current.undo();
      if (engineState.history.length > 1) {
        engineRef.current.undo();
      }
    } else {
      engineRef.current.undo();
    }
    setEngineState(engineRef.current.getState());
    setSelectedSquare(null);
    setLegalMoves([]);
    setLastMove(null);
    setPendingPromotion(null);
  };

  // 8x8 matrix ranks and files
  const ranks = isFlipped ? [1, 2, 3, 4, 5, 6, 7, 8] : [8, 7, 6, 5, 4, 3, 2, 1];
  const files = isFlipped ? ['h', 'g', 'f', 'e', 'd', 'c', 'b', 'a'] : ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'];
  const getSquareName = (r, f) => `${f}${r}`;

  // Formatted history pairs
  const movePairs = [];
  for (let i = 0; i < engineState.history.length; i += 2) {
    movePairs.push({
      num: Math.floor(i / 2) + 1,
      white: engineState.history[i]?.san || '',
      black: engineState.history[i + 1]?.san || '',
    });
  }

  return (
    <GameShell
      gameId="chess"
      title="Chess Royale"
      category="Strategy"
      accentColor="#38bdf8"
      turnIndicator={
        isAiThinking
          ? 'Computer calculating...'
          : `${engineState.turn === 'w' ? 'White' : 'Black'} to move`
      }
      score={(stats?.gamesWon || 0) * 100}
      highScore={stats?.highScore || 0}
      howToPlay={{
        goal: "Checkmate the opponent's King so it is under unavoidable attack with no legal move to escape.",
        rules: [
          'White moves first, then turns alternate.',
          'Pawns move 1 square forward (or 2 on first move) and capture diagonally 1 square.',
          'Knights move in an L-shape (2 squares in one direction, 1 perpendicular) and leap over pieces.',
          'Bishops move diagonally any distance.',
          'Rooks move orthogonally along ranks and files.',
          'Queens move diagonally or orthogonally any distance.',
          'Kings move 1 square in any direction.',
          'Castling: Move King 2 squares toward Rook, sheltered behind pawns (only if neither moved and transit squares are safe).',
          'En Passant: Capture opponent pawn that just moved two squares past your adjacent pawn.',
          'Pawn Promotion: Choose Queen, Rook, Bishop, or Knight when reaching opposite back rank.',
          'Draws: Stalemate (no legal move, not in check), Threefold Repetition, 50-move rule, or Insufficient Material.',
        ],
        controls: {
          touch: [
            'Tap your piece to see valid destination squares.',
            'Tap destination square to move or tap a highlighted piece to capture.',
            'Drag and drop pieces directly onto destination squares.',
          ],
          mouse: [
            'Click piece to select, click target to move, or drag and drop.',
            'Undo reverses moves; Flip rotates the board.',
          ],
        },
        scoring: 'Win by Checkmate (+1000 pts), Draw by Stalemate/Repetition (+250 pts).',
        winLose: 'Win by checkmating your opponent. Lose if your King is checkmated.',
        tips: [
          'Develop knights and bishops toward the center early.',
          'Castle within the first 10 moves to keep your King secure.',
          'Look for undefended pieces and fork opportunities.',
        ],
      }}
      onRestart={initGame}
    >
      <div className="flex-1 flex flex-col items-center justify-start p-2 sm:p-4 max-w-lg mx-auto w-full select-none">
        {/* Top Info Tray: Opponent Info & Captured White Pieces */}
        <div className="w-full flex items-center justify-between bg-surface-container/80 border border-outline-variant/30 px-3 py-2 rounded-xl mb-2 text-xs">
          <div className="flex items-center gap-2">
            <span className="w-3.5 h-3.5 rounded-full bg-slate-900 border border-slate-600 inline-block" />
            <span className="font-bold text-on-surface">
              {mode === 'pve' ? 'Computer' : 'Black'}
            </span>
            {isAiThinking && (
              <span className="text-[10px] bg-secondary/20 text-secondary px-2 py-0.5 rounded-full font-semibold animate-pulse">
                Thinking...
              </span>
            )}
            {engineState.turn === 'b' && engineState.inCheck && (
              <span className="text-[10px] bg-rose-600 text-white px-2 py-0.5 rounded-full font-bold">
                Check!
              </span>
            )}
          </div>

          {/* Captured White pieces by Black */}
          <div className="flex items-center gap-1 overflow-x-auto max-w-[150px] min-h-[24px]">
            {engineState.captured.w.map((p, i) => (
              <div key={i} className="w-4 h-4 sm:w-5 sm:h-5">
                <ChessPiece type={p} color="w" className="w-full h-full drop-shadow" />
              </div>
            ))}
          </div>
        </div>

        {/* Board Container: fills width, strictly square aspect-ratio, zero horizontal overflow */}
        <div className="w-full aspect-square max-w-[420px] rounded-xl overflow-hidden border-2 border-amber-950/70 shadow-2xl bg-amber-950/20 p-1">
          <div
            className="w-full h-full grid grid-cols-8 grid-rows-8 border border-amber-900/60 rounded-lg overflow-hidden shadow-inner bg-[#b58863]"
            role="grid"
            aria-label="Chess Board"
          >
            {ranks.map((rank) =>
              files.map((file) => {
                const sq = getSquareName(rank, file);
                const isLight = (file.charCodeAt(0) - 97 + rank) % 2 !== 0;
                const isSelected = selectedSquare === sq;
                const isLegal = legalMoves.some((m) => m.to === sq);
                const isCapture = legalMoves.some((m) => m.to === sq && m.captured);
                const isLast = lastMove && (lastMove.from === sq || lastMove.to === sq);

                const piece = engineRef.current.chess.get(sq);
                const isCheckedKing = piece && piece.type === 'k' && piece.color === engineState.turn && engineState.inCheck;

                return (
                  <div
                    key={sq}
                    onClick={() => handleSquareClick(sq)}
                    onDragOver={handleDragOver}
                    onDrop={(e) => handleDrop(e, sq)}
                    className={`relative flex items-center justify-center cursor-pointer select-none transition-colors ${
                      isLight ? 'bg-[#f0d9b5]' : 'bg-[#b58863]'
                    } ${isLast ? 'after:absolute after:inset-0 after:bg-yellow-400/35' : ''} ${
                      isCheckedKing ? 'ring-2 ring-inset ring-rose-600 after:absolute after:inset-0 after:bg-rose-600/40' : ''
                    } ${isSelected ? 'ring-2 ring-inset ring-cyan-400 bg-cyan-200/40' : ''}`}
                  >
                    {/* Legal move destination indicator */}
                    {isLegal && !isCapture && (
                      <span className="w-3.5 h-3.5 sm:w-4 sm:h-4 rounded-full bg-emerald-500/75 shadow-sm z-10 pointer-events-none" />
                    )}

                    {/* Legal capture indicator */}
                    {isLegal && isCapture && (
                      <span className="absolute inset-1 rounded-full border-2 border-rose-500 bg-rose-500/20 z-10 pointer-events-none" />
                    )}

                    {/* Board piece */}
                    {piece && (
                      <div
                        draggable={!isGameOver && !isAiThinking && (mode === 'pvp' || piece.color === playerColor)}
                        onDragStart={(e) => handleDragStart(e, sq)}
                        className={`w-full h-full p-0.5 sm:p-1 flex items-center justify-center transition-transform duration-150 ${
                          isSelected ? 'scale-110 -translate-y-0.5' : ''
                        } ${piece.color === engineState.turn && (mode === 'pvp' || piece.color === playerColor) ? 'cursor-grab active:cursor-grabbing' : ''}`}
                      >
                        <ChessPiece
                          type={piece.type}
                          color={piece.color}
                          className="w-full h-full max-w-[90%] max-h-[90%] drop-shadow"
                        />
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Bottom Info Tray: Player Info & Captured Black Pieces */}
        <div className="w-full flex items-center justify-between bg-surface-container/80 border border-outline-variant/30 px-3 py-2 rounded-xl mt-2 text-xs">
          <div className="flex items-center gap-2">
            <span className="w-3.5 h-3.5 rounded-full bg-white border border-slate-300 inline-block" />
            <span className="font-bold text-on-surface">
              {mode === 'pve' ? 'You (White)' : 'White'}
            </span>
            {engineState.turn === 'w' && engineState.inCheck && (
              <span className="text-[10px] bg-rose-600 text-white px-2 py-0.5 rounded-full font-bold">
                Check!
              </span>
            )}
          </div>

          {/* Captured Black pieces by White */}
          <div className="flex items-center gap-1 overflow-x-auto max-w-[150px] min-h-[24px]">
            {engineState.captured.b.map((p, i) => (
              <div key={i} className="w-4 h-4 sm:w-5 sm:h-5">
                <ChessPiece type={p} color="b" className="w-full h-full drop-shadow" />
              </div>
            ))}
          </div>
        </div>

        {/* Primary In-Game Controls */}
        <div className="w-full pt-3 flex items-center justify-between gap-1.5 flex-wrap">
          <Button
            variant="primary"
            size="sm"
            onClick={initGame}
            icon={<span className="material-symbols-outlined text-[18px]">restart_alt</span>}
          >
            New Match
          </Button>

          <Button
            variant="surface"
            size="sm"
            onClick={handleUndo}
            disabled={engineState.history.length === 0 || isAiThinking || isGameOver}
            icon={<span className="material-symbols-outlined text-[18px]">undo</span>}
          >
            Undo
          </Button>

          <Button
            variant="surface"
            size="sm"
            onClick={() => setIsFlipped(!isFlipped)}
            icon={<span className="material-symbols-outlined text-[18px]">swap_vert</span>}
          >
            Flip
          </Button>

          <Button
            variant="surface"
            size="sm"
            onClick={() => setShowMoveList(!showMoveList)}
            icon={<span className="material-symbols-outlined text-[18px]">format_list_numbered</span>}
          >
            Moves ({engineState.history.length})
          </Button>

          {/* Mode Switcher: Play vs Computer or Pass and Play */}
          <button
            onClick={() => {
              setMode(mode === 'pve' ? 'pvp' : 'pve');
              initGame();
            }}
            className="px-2.5 py-1.5 text-xs font-semibold rounded-lg border border-outline-variant/30 bg-surface-container text-on-surface hover:border-secondary transition-colors"
          >
            {mode === 'pve' ? 'vs Computer' : 'Pass & Play'}
          </button>
        </div>

        {/* Collapsible Move List Drawer */}
        {showMoveList && (
          <div className="w-full mt-3 p-3 bg-surface-container/90 border border-outline-variant/30 rounded-xl max-h-36 overflow-y-auto">
            <div className="flex items-center justify-between pb-1 mb-2 border-b border-outline-variant/20 text-xs font-bold text-on-surface-variant">
              <span>Move History</span>
              <button
                onClick={() => setShowMoveList(false)}
                className="text-on-surface-variant hover:text-on-surface text-[14px]"
              >
                ✕
              </button>
            </div>
            {movePairs.length === 0 ? (
              <div className="text-center text-xs text-on-surface-variant/60 py-2">
                No moves played yet.
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-x-4 gap-y-1 text-xs font-mono">
                {movePairs.map((pair) => (
                  <div key={pair.num} className="flex items-center justify-between px-1 py-0.5 rounded bg-surface-container-high/40">
                    <span className="text-on-surface-variant w-6">{pair.num}.</span>
                    <span className="text-on-surface font-semibold flex-1 text-left">{pair.white}</span>
                    <span className="text-on-surface-variant flex-1 text-right">{pair.black}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Pawn Promotion Bottom Sheet / Drawer */}
      {pendingPromotion && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-xs p-2 sm:p-4">
          <div className="w-full max-w-sm bg-surface-container-high border border-outline-variant/40 rounded-t-2xl sm:rounded-2xl p-5 shadow-2xl space-y-4 animate-in slide-in-from-bottom duration-200">
            <div className="text-center">
              <h3 className="text-title-medium font-bold text-on-surface">Promote Pawn</h3>
              <p className="text-body-sm text-on-surface-variant mt-1">
                Select a piece to promote your pawn:
              </p>
            </div>

            <div className="grid grid-cols-4 gap-2.5 pt-1">
              {[
                { type: 'q', label: 'Queen' },
                { type: 'r', label: 'Rook' },
                { type: 'b', label: 'Bishop' },
                { type: 'n', label: 'Knight' },
              ].map((p) => (
                <button
                  key={p.type}
                  onClick={() => {
                    executeMove({
                      from: pendingPromotion.from,
                      to: pendingPromotion.to,
                      promotion: p.type,
                    });
                  }}
                  className="flex flex-col items-center justify-center p-3 rounded-xl bg-surface-container hover:bg-secondary/20 border border-outline-variant/30 active:scale-95 transition-all"
                >
                  <div className="w-9 h-9 flex items-center justify-center">
                    <ChessPiece type={p.type} color={engineState.turn} className="w-full h-full" />
                  </div>
                  <span className="text-xs font-bold text-on-surface mt-1.5">{p.label}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Game Over Modal */}
      <GameOverModal
        isOpen={isGameOver}
        won={Boolean(gameResult?.won)}
        score={gameResult?.won ? 1000 : 0}
        highScore={stats?.highScore || 0}
        message={gameResult?.message || 'Game concluded.'}
        onRestart={initGame}
        onExit={() => window.location.assign('/')}
      />
    </GameShell>
  );
}
