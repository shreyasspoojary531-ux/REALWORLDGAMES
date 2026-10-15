import { useRef, useEffect, useState, useCallback } from 'react';
import { GameShell } from '@/components/game/GameShell';
import { GameOverModal } from '@/components/game/GameOverModal';
import { Button } from '@/components/ui/Button';
import { useAudio } from '@/lib/audio';
import { storage } from '@/lib/storage';
import {
  CarromEngine,
  BOARD_SIZE,
  POCKET_RADIUS,
  COIN_RADIUS,
  STRIKER_RADIUS,
  PLAY_AREA_INSET,
  POCKETS,
} from './logic/CarromEngine';

export default function CarromGame() {
  const canvasRef = useRef(null);
  const audio = useAudio();
  const engineRef = useRef(new CarromEngine());

  const [engineState, setEngineState] = useState(() => engineRef.current.init());
  const [mode, setMode] = useState('pve'); // 'pve' (vs Computer) | 'pvp' (Pass & Play)

  // One-finger Touch & Mouse Gesture States
  // 1. Placement along baseline (dragging striker left/right)
  const [isPlacing, setIsPlacing] = useState(false);
  // 2. Shooting (slingshot aim: dragging backward from striker)
  const [isAiming, setIsAiming] = useState(false);
  const [aimVector, setAimVector] = useState({ x: 0, y: 0 }); // Direction striker will travel
  const [aimPower, setAimPower] = useState(0); // 0 to 100

  const [isGameOver, setIsGameOver] = useState(false);
  const [matchWinner, setMatchWinner] = useState(null);
  const [stats, setStats] = useState(() => storage.getStats('carrom'));

  // Animation frame loop ref & shot events tracker
  const animFrameRef = useRef(null);
  const pocketedInCurrentShot = useRef([]);
  const isAiShootingRef = useRef(false);

  // Synchronized refs for event handlers to prevent stale closure issues during window events
  const isAimingRef = useRef(false);
  const isPlacingRef = useRef(false);
  const aimVectorRef = useRef({ x: 0, y: 0 });
  const aimPowerRef = useRef(0);

  isAimingRef.current = isAiming;
  isPlacingRef.current = isPlacing;
  aimVectorRef.current = aimVector;
  aimPowerRef.current = aimPower;

  const initGame = useCallback((config = {}) => {
    const m = config.mode || mode;
    engineRef.current.init({ mode: m });
    setEngineState(engineRef.current.getState());
    setIsAiming(false);
    setIsPlacing(false);
    setAimPower(0);
    setIsGameOver(false);
    setMatchWinner(null);
    pocketedInCurrentShot.current = [];
    isAiShootingRef.current = false;
  }, [mode]);

  const handleMatchEnd = useCallback((terminal) => {
    setIsGameOver(true);
    const won = terminal.winner === 'player1';
    setMatchWinner(terminal.winner);
    if (won) audio.win();
    else audio.error();
    storage.recordGameEnd('carrom', won, won ? terminal.boardScore * 50 : 20);
    setStats(storage.getStats('carrom'));
  }, [audio]);

  // Smooth, instant computer player: aim & shoot in under 0.8s total, no artificial delay
  const triggerAiShot = useCallback(() => {
    if (isAiShootingRef.current) return;
    isAiShootingRef.current = true;

    // Small delay (250ms) so user can see AI take its turn
    setTimeout(() => {
      const shot = engineRef.current.computeAiShot();
      if (shot) {
        // Place striker smoothly
        engineRef.current.setStrikerPosition(shot.strikerX);
        setEngineState(engineRef.current.getState());

        // Quick 150ms aim display then fire
        setTimeout(() => {
          audio.tap();
          engineRef.current.applyAction({
            type: 'strike',
            vector: shot.vector,
            power: shot.power,
          });
          pocketedInCurrentShot.current = [];
          setEngineState(engineRef.current.getState());
          isAiShootingRef.current = false;
        }, 150);
      } else {
        isAiShootingRef.current = false;
      }
    }, 250);
  }, [audio]);

  // Render Carrom Board on Canvas
  const drawBoard = useCallback((ctx, engine) => {
    ctx.clearRect(0, 0, BOARD_SIZE, BOARD_SIZE);

    // 1. Board Surface (Warm Varnished Wood Plywood)
    ctx.fillStyle = '#edd6b1';
    ctx.fillRect(0, 0, BOARD_SIZE, BOARD_SIZE);

    // Subtle wood frame border
    ctx.lineWidth = 14;
    ctx.strokeStyle = '#2b170c';
    ctx.strokeRect(7, 7, BOARD_SIZE - 14, BOARD_SIZE - 14);

    // Inner playing boundary
    ctx.strokeStyle = '#3e2312';
    ctx.lineWidth = 3;
    ctx.strokeRect(PLAY_AREA_INSET, PLAY_AREA_INSET, BOARD_SIZE - PLAY_AREA_INSET * 2, BOARD_SIZE - PLAY_AREA_INSET * 2);

    // 2. Corner Pockets (Deep dark pocket with brass rim)
    for (const pocket of POCKETS) {
      ctx.beginPath();
      ctx.arc(pocket.x, pocket.y, POCKET_RADIUS, 0, Math.PI * 2);
      ctx.fillStyle = '#111827';
      ctx.fill();
      ctx.strokeStyle = '#b45309';
      ctx.lineWidth = 4;
      ctx.stroke();

      // Pocket inner shadow
      ctx.beginPath();
      ctx.arc(pocket.x, pocket.y, POCKET_RADIUS - 3, 0, Math.PI * 2);
      ctx.strokeStyle = '#030712';
      ctx.lineWidth = 2;
      ctx.stroke();
    }

    // 3. Center Circles (Red outer, Black inner)
    const center = BOARD_SIZE / 2;
    ctx.beginPath();
    ctx.arc(center, center, 66, 0, Math.PI * 2);
    ctx.strokeStyle = '#dc2626';
    ctx.lineWidth = 2.5;
    ctx.stroke();

    ctx.beginPath();
    ctx.arc(center, center, 33, 0, Math.PI * 2);
    ctx.strokeStyle = '#1e293b';
    ctx.lineWidth = 2;
    ctx.stroke();

    // Center focal point
    ctx.beginPath();
    ctx.arc(center, center, 4, 0, Math.PI * 2);
    ctx.fillStyle = '#dc2626';
    ctx.fill();

    // 4. Baseline Guides with Red Edge Circles
    const drawBaselines = (y, isActive) => {
      ctx.beginPath();
      ctx.moveTo(145, y);
      ctx.lineTo(BOARD_SIZE - 145, y);
      ctx.strokeStyle = isActive ? '#0284c7' : '#9ca3af';
      ctx.lineWidth = 3;
      ctx.stroke();

      // Baseline endpoint circles
      for (const cx of [145, BOARD_SIZE - 145]) {
        ctx.beginPath();
        ctx.arc(cx, y, 16, 0, Math.PI * 2);
        ctx.fillStyle = '#ef4444';
        ctx.fill();
        ctx.lineWidth = 2;
        ctx.strokeStyle = '#7f1d1d';
        ctx.stroke();

        ctx.beginPath();
        ctx.arc(cx, y, 5, 0, Math.PI * 2);
        ctx.fillStyle = '#ffffff';
        ctx.fill();
      }
    };

    drawBaselines(590, engine.turn === 'player1');
    drawBaselines(110, engine.turn === 'player2');

    // Diagonal corner guide lines
    ctx.setLineDash([4, 6]);
    ctx.strokeStyle = '#9ca3af';
    ctx.lineWidth = 1.5;
    const drawGuideLine = (x1, y1, x2, y2) => {
      ctx.beginPath();
      ctx.moveTo(x1, y1);
      ctx.lineTo(x2, y2);
      ctx.stroke();
    };
    drawGuideLine(75, 75, 230, 230);
    drawGuideLine(BOARD_SIZE - 75, 75, BOARD_SIZE - 230, 230);
    drawGuideLine(75, BOARD_SIZE - 75, 230, BOARD_SIZE - 230);
    drawGuideLine(BOARD_SIZE - 75, BOARD_SIZE - 75, BOARD_SIZE - 230, BOARD_SIZE - 230);
    ctx.setLineDash([]);

    // 5. Draw Carrom Coins with edge shading and soft drop-shadow
    for (const coin of engine.coins) {
      if (coin.pocketed) continue;

      // Soft shadow
      ctx.beginPath();
      ctx.arc(coin.x + 2, coin.y + 3, COIN_RADIUS, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(0, 0, 0, 0.22)';
      ctx.fill();

      // Coin Body
      ctx.beginPath();
      ctx.arc(coin.x, coin.y, COIN_RADIUS, 0, Math.PI * 2);
      if (coin.type === 'queen') {
        const grad = ctx.createRadialGradient(coin.x - 3, coin.y - 3, 2, coin.x, coin.y, COIN_RADIUS);
        grad.addColorStop(0, '#fb7185');
        grad.addColorStop(1, '#be123c');
        ctx.fillStyle = grad;
      } else if (coin.type === 'white') {
        const grad = ctx.createRadialGradient(coin.x - 3, coin.y - 3, 2, coin.x, coin.y, COIN_RADIUS);
        grad.addColorStop(0, '#ffffff');
        grad.addColorStop(1, '#cbd5e1');
        ctx.fillStyle = grad;
      } else {
        const grad = ctx.createRadialGradient(coin.x - 3, coin.y - 3, 2, coin.x, coin.y, COIN_RADIUS);
        grad.addColorStop(0, '#334155');
        grad.addColorStop(1, '#0f172a');
        ctx.fillStyle = grad;
      }
      ctx.fill();

      // Coin stroke
      ctx.lineWidth = 2;
      ctx.strokeStyle = coin.type === 'white' ? '#94a3b8' : coin.type === 'queen' ? '#9f1239' : '#020617';
      ctx.stroke();

      // Decorative concentric grooved rings
      ctx.beginPath();
      ctx.arc(coin.x, coin.y, 7, 0, Math.PI * 2);
      ctx.strokeStyle = coin.type === 'white' ? '#cbd5e1' : coin.type === 'queen' ? '#fda4af' : '#475569';
      ctx.lineWidth = 1.5;
      ctx.stroke();
    }

    // 6. Draw Striker
    if (engine.striker && !engine.striker.pocketed) {
      const s = engine.striker;

      // Striker shadow
      ctx.beginPath();
      ctx.arc(s.x + 2, s.y + 4, STRIKER_RADIUS, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
      ctx.fill();

      // Striker body with ivory/gold gradient
      ctx.beginPath();
      ctx.arc(s.x, s.y, STRIKER_RADIUS, 0, Math.PI * 2);
      const sGrad = ctx.createRadialGradient(s.x - 5, s.y - 5, 3, s.x, s.y, STRIKER_RADIUS);
      sGrad.addColorStop(0, '#fef3c7');
      sGrad.addColorStop(0.5, '#f59e0b');
      sGrad.addColorStop(1, '#b45309');
      ctx.fillStyle = sGrad;
      ctx.fill();

      ctx.lineWidth = 3;
      ctx.strokeStyle = '#92400e';
      ctx.stroke();

      // Center gemstone insignia
      ctx.beginPath();
      ctx.arc(s.x, s.y, 9, 0, Math.PI * 2);
      ctx.fillStyle = '#fffbeb';
      ctx.fill();
      ctx.strokeStyle = '#d97706';
      ctx.lineWidth = 1.5;
      ctx.stroke();
    }

    // 7. Slingshot Aim Guideline & Power Indicator
    if (isAiming && !engine.isShotActive && engine.striker) {
      const s = engine.striker;
      const targetX = s.x + aimVector.x * (aimPower * 2.6);
      const targetY = s.y + aimVector.y * (aimPower * 2.6);

      // Aim dotted guideline in the shot direction
      ctx.beginPath();
      ctx.setLineDash([6, 6]);
      ctx.moveTo(s.x, s.y);
      ctx.lineTo(targetX, targetY);
      ctx.strokeStyle = '#06b6d4';
      ctx.lineWidth = 3.5;
      ctx.stroke();
      ctx.setLineDash([]);

      // Power indicator arc growing around striker
      ctx.beginPath();
      ctx.arc(
        s.x,
        s.y,
        STRIKER_RADIUS + 7,
        -Math.PI / 2,
        -Math.PI / 2 + Math.PI * 2 * (aimPower / 100)
      );
      ctx.strokeStyle = aimPower > 75 ? '#ef4444' : '#06b6d4';
      ctx.lineWidth = 4.5;
      ctx.stroke();
    }
  }, [isAiming, aimVector, aimPower]);

  // Main 60fps render and physics loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let lastTime = performance.now();

    const loop = (time) => {
      const deltaSec = Math.min(0.033, (time - lastTime) / 1000);
      lastTime = time;

      const engine = engineRef.current;
      if (engine) {
        if (engine.isShotActive) {
          const { isResting, pocketedThisStep } = engine.step(deltaSec || 1 / 60);
          if (pocketedThisStep?.length > 0) {
            audio.chips();
            pocketedInCurrentShot.current.push(...pocketedThisStep);
          }

          if (isResting) {
            const outcome = engine.resolveTurn(pocketedInCurrentShot.current);
            pocketedInCurrentShot.current = [];
            setEngineState(engine.getState());

            if (outcome.terminal?.terminal) {
              handleMatchEnd(outcome.terminal);
            } else {
              // Trigger AI if turn belongs to player2 in PVE
              if (mode === 'pve' && outcome.turn === 'player2') {
                triggerAiShot();
              }
            }
          }
        }

        drawBoard(ctx, engine);
      }

      animFrameRef.current = requestAnimationFrame(loop);
    };

    animFrameRef.current = requestAnimationFrame(loop);
    return () => {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    };
  }, [mode, audio, drawBoard, handleMatchEnd, triggerAiShot]);

  // Helper to extract Canvas Board Coordinates
  const getCanvasCoords = useCallback((clientX, clientY) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    const scaleX = BOARD_SIZE / rect.width;
    const scaleY = BOARD_SIZE / rect.height;
    return {
      x: (clientX - rect.left) * scaleX,
      y: (clientY - rect.top) * scaleY,
    };
  }, []);

  // Gesture handling: Pointer Events on Canvas with setPointerCapture and window safety listeners
  const handlePointerDown = (e) => {
    if (engineRef.current.isShotActive || isGameOver) return;
    if (mode === 'pve' && engineRef.current.turn !== 'player1') return;

    try {
      e.target.setPointerCapture(e.pointerId);
    } catch {
      // Ignore if pointer capture unavailable
    }

    const coords = getCanvasCoords(e.clientX, e.clientY);
    const striker = engineRef.current.striker;
    if (!striker) return;

    const distToStriker = Math.hypot(coords.x - striker.x, coords.y - striker.y);

    // If tapping directly on/near the striker: start slingshot aiming
    if (distToStriker <= STRIKER_RADIUS * 2) {
      setIsAiming(true);
      setIsPlacing(false);
      audio.tap();
    } else {
      // If tapping along baseline: adjust placement
      const { y } = engineRef.current.getBaselineBounds();
      if (Math.abs(coords.y - y) <= 45) {
        setIsPlacing(true);
        setIsAiming(false);
        engineRef.current.setStrikerPosition(coords.x);
        setEngineState(engineRef.current.getState());
      }
    }
  };

  const handlePointerMove = useCallback((e) => {
    if (!isPlacingRef.current && !isAimingRef.current) return;
    const coords = getCanvasCoords(e.clientX, e.clientY);

    // 1. Sliding along baseline
    if (isPlacingRef.current) {
      engineRef.current.setStrikerPosition(coords.x);
      setEngineState(engineRef.current.getState());
      return;
    }

    // 2. Slingshot Aim: drag backward from striker
    if (isAimingRef.current) {
      const striker = engineRef.current.striker;
      if (!striker) return;

      const pullX = striker.x - coords.x;
      const pullY = striker.y - coords.y;
      const pullDist = Math.hypot(pullX, pullY);

      if (pullDist > 10) {
        // Clamp maximum power drag distance (140px)
        const power = Math.min(100, (pullDist / 140) * 100);
        setAimVector({ x: pullX / pullDist, y: pullY / pullDist });
        setAimPower(power);
      } else {
        setAimPower(0);
      }
    }
  }, [getCanvasCoords]);

  const handlePointerUp = useCallback(() => {
    if (isPlacingRef.current) {
      setIsPlacing(false);
    }

    if (isAimingRef.current) {
      setIsAiming(false);
      const currentPower = aimPowerRef.current;
      const currentVector = aimVectorRef.current;

      // Shot threshold: very short drag (< 12 power) cancels the shot
      if (currentPower >= 12 && (currentVector.x !== 0 || currentVector.y !== 0)) {
        audio.tap();
        engineRef.current.applyAction({
          type: 'strike',
          vector: currentVector,
          power: currentPower,
        });
        pocketedInCurrentShot.current = [];
        setEngineState(engineRef.current.getState());
      }

      setAimPower(0);
      setAimVector({ x: 0, y: 0 });
    }
  }, [audio]);

  // Global window listeners for pointerup / pointercancel so releases outside canvas are never lost
  useEffect(() => {
    const handleGlobalUp = () => {
      if (isPlacingRef.current || isAimingRef.current) {
        handlePointerUp();
      }
    };

    window.addEventListener('pointerup', handleGlobalUp);
    window.addEventListener('pointercancel', handleGlobalUp);
    return () => {
      window.removeEventListener('pointerup', handleGlobalUp);
      window.removeEventListener('pointercancel', handleGlobalUp);
    };
  }, [handlePointerUp]);

  const isPlayer1Turn = engineState.turn === 'player1';

  // Count pocketed coins
  const pocketedWhite = engineState.coins.filter((c) => c.type === 'white' && c.pocketed).length;
  const pocketedBlack = engineState.coins.filter((c) => c.type === 'black' && c.pocketed).length;

  return (
    <GameShell
      gameId="carrom"
      title="Carrom Clash"
      category="Tabletop"
      accentColor="#f59e0b"
      turnIndicator={
        isPlayer1Turn
          ? 'Your Turn (White)'
          : mode === 'pve'
            ? 'Computer Turn'
            : 'Player 2 (Black)'
      }
      score={engineState.scores.player1 * 10}
      highScore={stats?.highScore || 0}
      howToPlay={{
        goal: 'Pocket all 9 of your White coins before your opponent pockets Black, and secure the Queen.',
        rules: [
          'Placement: Slide your thumb across the baseline to position the striker.',
          'Shooting: Press on the striker and drag backward to aim direction and power. Release to shoot!',
          'Canceling: A very short drag cancels the shot without firing.',
          'Consecutive Turn: Pocketing any of your own coins gives you another turn.',
          'Queen Cover: Pocketing the Queen requires you to pocket one of your coins on the same or next shot, otherwise it returns to center.',
          'Foul: Pocketing the striker returns one of your pocketed coins to the board and passes the turn.',
        ],
        controls: {
          touch: [
            'Drag along baseline to position striker',
            'Pull backward on striker to aim and charge power',
            'Release finger to shoot',
          ],
          mouse: [
            'Click & drag baseline to slide striker position',
            'Click & pull backward on striker to aim and charge power',
            'Release mouse button to fire',
          ],
        },
        scoring: 'White coins: 10 pts each. Covered Queen: +3 bonus points. Foul: 1 coin returned.',
        winLose: 'Winner is first to pocket all coins. Score is opponent coins remaining plus 3 if Queen covered.',
        tips: [
          'Use bank shots off the cushion walls to reach coins hidden behind obstacles.',
          'Pocket the Queen only when you have an easy follow-up shot to cover it.',
        ],
      }}
      onRestart={initGame}
    >
      <div className="flex-1 flex flex-col items-center justify-start p-2 sm:p-4 max-w-lg mx-auto w-full select-none touch-none overscroll-none">
        {/* Top Info Bar: Score & Pocketed Pieces Trays */}
        <div className="w-full flex items-center justify-between bg-surface-container/80 border border-outline-variant/30 px-3 py-2 rounded-xl mb-2 text-xs">
          <div className="flex items-center gap-2">
            <span className="w-3.5 h-3.5 rounded-full bg-slate-900 border border-slate-700" />
            <span className="font-bold text-on-surface">
              {mode === 'pve' ? 'Computer' : 'Player 2'}:
            </span>
            <span className="font-mono font-bold text-secondary">{engineState.scores.player2}</span>
            <div className="flex items-center gap-0.5 ml-1">
              {Array.from({ length: pocketedBlack }).map((_, i) => (
                <span key={i} className="w-2.5 h-2.5 rounded-full bg-slate-900 border border-slate-600 inline-block" />
              ))}
            </div>
          </div>

          {/* Queen Status Indicator */}
          <div className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-surface text-[11px] font-bold border border-outline-variant/20">
            <span className="w-2.5 h-2.5 rounded-full bg-rose-600 inline-block" />
            <span>
              {engineState.queenState === 'covered'
                ? 'Queen Covered'
                : engineState.queenState === 'pending_cover'
                  ? 'Cover Pending!'
                  : 'Queen in Play'}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <span className="w-3.5 h-3.5 rounded-full bg-slate-100 border border-slate-300" />
            <span className="font-bold text-on-surface">You:</span>
            <span className="font-mono font-bold text-secondary">{engineState.scores.player1}</span>
            <div className="flex items-center gap-0.5 ml-1">
              {Array.from({ length: pocketedWhite }).map((_, i) => (
                <span key={i} className="w-2.5 h-2.5 rounded-full bg-slate-100 border border-slate-300 inline-block" />
              ))}
            </div>
          </div>
        </div>

        {/* Square Mobile-First Carrom Board Canvas Container */}
        <div className="w-full aspect-square max-w-[420px] rounded-2xl overflow-hidden border-2 border-amber-950/80 shadow-2xl bg-amber-950 p-1 touch-none select-none">
          <canvas
            ref={canvasRef}
            width={BOARD_SIZE}
            height={BOARD_SIZE}
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            className="w-full h-full cursor-crosshair touch-none select-none"
            style={{ touchAction: 'none' }}
          />
        </div>

        {/* Clean Controls & Settings Bar */}
        <div className="w-full pt-3 flex items-center justify-between gap-2 text-xs flex-wrap">
          <Button
            variant="primary"
            size="sm"
            onClick={initGame}
            icon={<span className="material-symbols-outlined text-[18px]">restart_alt</span>}
          >
            New Board
          </Button>

          {/* Mode Switcher */}
          <button
            onClick={() => {
              const nextMode = mode === 'pve' ? 'pvp' : 'pve';
              setMode(nextMode);
              initGame({ mode: nextMode });
            }}
            className="px-3 py-1.5 text-xs font-semibold rounded-lg border border-outline-variant/30 bg-surface-container text-on-surface hover:border-secondary transition-colors"
          >
            {mode === 'pve' ? 'vs Computer' : 'Pass & Play'}
          </button>
        </div>
      </div>

      <GameOverModal
        isOpen={isGameOver}
        won={matchWinner === 'player1'}
        score={engineState.scores.player1 * 10}
        highScore={stats?.highScore || 0}
        message={
          matchWinner === 'player1'
            ? 'Victory! All your coins have been pocketed.'
            : 'Opponent cleared their coins first!'
        }
        onRestart={initGame}
        onExit={() => window.location.assign('/')}
      />
    </GameShell>
  );
}
