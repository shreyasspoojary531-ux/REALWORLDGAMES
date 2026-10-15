import { useState, useRef, useEffect, useCallback } from 'react';
import { GameShell } from '@/components/game/GameShell';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { useAudio } from '@/lib/audio';
import { storage } from '@/lib/storage';
import { UnoEngine, COLORS } from './logic/UnoEngine';

const COLOR_CLASSES = {
  red: 'bg-rose-600 border-rose-400 text-white shadow-rose-900/40',
  blue: 'bg-blue-600 border-blue-400 text-white shadow-blue-900/40',
  green: 'bg-emerald-600 border-emerald-400 text-white shadow-emerald-900/40',
  yellow: 'bg-amber-400 border-amber-200 text-slate-950 font-black shadow-amber-900/40',
  wild: 'bg-gradient-to-tr from-rose-500 via-amber-400 to-blue-500 border-white text-white',
};

export const Uno = () => {
  const audio = useAudio();
  const engineRef = useRef(new UnoEngine());

  const [engineState, setEngineState] = useState(() =>
    engineRef.current.init({ playerCount: 3, targetScore: 500 })
  );
  const [pendingWildCard, setPendingWildCard] = useState(null); // card waiting for color selection
  const [isBotThinking, setIsBotThinking] = useState(false);
  const [showScoreTableModal, setShowScoreTableModal] = useState(false);
  const [stats, setStats] = useState(() => storage.getStats('uno'));

  const resolveRoundEnd = useCallback((winnerIdx) => {
    const playerWon = winnerIdx === 0;
    if (playerWon) {
      audio.win();
      storage.recordGameEnd('uno', true, 100);
    } else {
      audio.error();
      storage.recordGameEnd('uno', false, 0);
    }
    setStats(storage.getStats('uno'));
  }, [audio]);

  // Computer bots AI action loop (<0.5s turnaround)
  useEffect(() => {
    const isBotTurn = engineState.activePlayerIdx !== 0;
    if (isBotTurn && !engineState.isRoundOver && !isBotThinking) {
      setIsBotThinking(true);
      const timer = setTimeout(() => {
        const action = engineRef.current.computeBotAction(engineState.activePlayerIdx);
        if (action?.card) {
          audio.cardFlip();
        } else {
          audio.cardDeal();
        }

        const nextState = engineRef.current.getState();
        setEngineState(nextState);
        setIsBotThinking(false);

        if (nextState.isRoundOver) {
          resolveRoundEnd(nextState.roundWinner);
        }
      }, 250); // Fluid 250ms delay (strictly <0.5s)
      return () => clearTimeout(timer);
    }
  }, [engineState.activePlayerIdx, engineState.isRoundOver, isBotThinking, audio, resolveRoundEnd]);

  const handleCardClick = (card) => {
    if (engineState.activePlayerIdx !== 0 || isBotThinking || engineState.isRoundOver) return;

    if (!engineRef.current.isCardPlayable(card)) {
      audio.error();
      return;
    }

    if (card.color === 'wild') {
      setPendingWildCard(card);
      return;
    }

    playCardDirect(card.id, card.color);
  };

  const playCardDirect = (cardId, chosenColor) => {
    audio.cardFlip();
    engineRef.current.playCard(cardId, chosenColor);
    const nextState = engineRef.current.getState();
    setEngineState(nextState);
    setPendingWildCard(null);

    if (nextState.isRoundOver) {
      resolveRoundEnd(nextState.roundWinner);
    }
  };

  const handlePlayerDraw = () => {
    if (engineState.activePlayerIdx !== 0 || isBotThinking || engineState.isRoundOver || engineState.hasDrawnThisTurn) {
      return;
    }
    audio.cardDeal();
    engineRef.current.playerDraw();
    setEngineState(engineRef.current.getState());
  };

  const handlePassTurn = () => {
    if (engineState.activePlayerIdx !== 0 || !engineState.hasDrawnThisTurn) return;
    audio.click();
    engineRef.current.passTurn();
    setEngineState(engineRef.current.getState());
  };

  const handleCallUno = () => {
    audio.tap();
    engineRef.current.callUno(0);
    setEngineState(engineRef.current.getState());
  };

  const nextRound = () => {
    audio.cardDeal();
    if (engineState.isMatchOver) {
      engineRef.current.init({ playerCount: 3, targetScore: 500 });
    } else {
      engineRef.current.currentRound += 1;
      engineRef.current.startRound();
    }
    setEngineState(engineRef.current.getState());
  };

  const isPlayerTurn = engineState.activePlayerIdx === 0 && !engineState.isRoundOver;
  const canCallUno = engineState.playerHand.length <= 2 && !engineState.players[0].calledUno;

  const activePlayerName = engineState.players[engineState.activePlayerIdx]?.name || 'Player';

  return (
    <GameShell
      gameId="uno"
      title="Uno Zone"
      category="Cards"
      accentColor="#ef4444"
      turnIndicator={
        isBotThinking
          ? `${activePlayerName} Deciding...`
          : isPlayerTurn
            ? engineState.hasDrawnThisTurn
              ? 'Play Drawn Card or Pass'
              : 'Your Turn (Play or Draw)'
            : `${activePlayerName}'s Turn`
      }
      score={engineState.players[0].totalScore}
      highScore={stats.highScore}
      howToPlay={{
        goal: 'Be the first player to empty your hand in each round. First player to reach 500 tournament match points wins.',
        rules: [
          'Full 108-card official Uno deck with 4 colors (Red, Blue, Green, Yellow) and 3 computer opponents.',
          'Match the top discard by Color, Number, or Action symbol.',
          'Action Cards: Skip (next player loses turn), Reverse (reverses direction; acts as Skip in 2-player heads-up), Draw Two (+2 cards and forfeited turn).',
          'Wild Cards: Wild (choose color), Wild Draw Four (+4 cards, choose color, forfeited turn).',
          'Draw Rule: Draw 1 card if you cannot play. You may play the drawn card immediately if valid.',
          'UNO Call: You MUST tap CALL UNO when you have 1 card left! If you forget, you automatically draw 2 penalty cards on next turn.',
          'Computers call UNO automatically on their final cards.',
          'Scoring: Round winner receives points from cards left in opponents\' hands (Numbers = face value | Actions = 20 pts | Wilds = 50 pts). First to 500 points wins the tournament.',
        ],
        controls: {
          touch: [
            'Tap any valid card in your hand fan to play',
            'Tap Draw Pile in the center to draw a card',
            'Tap CALL UNO button when down to your final card',
            'Tap Scoreboard to inspect total match score standings',
          ],
          mouse: ['Click valid card to play', 'Click Draw pile to draw', 'Click color swatch sheet for Wild cards'],
        },
        scoring: 'Round winner scores sum of opponent cards: Numbers = face value | Action cards = 20 pts | Wild cards = 50 pts. Play to 500 points.',
        winLose: 'First to empty hand wins the round. First to 500 total points wins the tournament match.',
        tips: [
          'Watch the rotation arrow in the center to anticipate turns.',
          'Save Wild Draw Four cards for when an opponent holds 1 or 2 cards.',
        ],
      }}
      onRestart={() => {
        engineRef.current.init({ playerCount: 3, targetScore: 500 });
        setEngineState(engineRef.current.getState());
      }}
    >
      <div className="flex-1 flex flex-col items-center justify-between p-2 sm:p-5 max-w-2xl mx-auto w-full select-none text-slate-100 min-h-[580px]">
        {/* Top Header: Opponents Row (Bot 1 on Left, Bot 2 on Right) */}
        <div className="w-full flex items-center justify-between px-2 pt-1 pb-1">
          {/* Bot 1 Station */}
          <div className={`flex flex-col items-center p-2 rounded-xl transition-colors border ${
            engineState.activePlayerIdx === 1 ? 'bg-rose-950/40 border-rose-500 shadow-md shadow-rose-950/50' : 'bg-surface-container border-outline-variant/30'
          }`}>
            <div className="flex items-center gap-1.5 mb-1">
              <span className="text-[11px] font-bold text-slate-300">Bot 1</span>
              <span className="font-mono text-[10px] font-bold text-amber-400 bg-slate-900 px-1.5 py-0.5 rounded border border-slate-700">
                {engineState.players[1].cardCount} Cards
              </span>
              {engineState.players[1].calledUno && (
                <span className="text-[9px] bg-rose-600 text-white font-black px-1.5 py-0.2 rounded-full animate-bounce">
                  UNO!
                </span>
              )}
            </div>
            <div className="flex items-center gap-0.5 min-h-[36px]">
              {Array.from({ length: Math.min(engineState.players[1].cardCount, 8) }).map((_, i) => (
                <div
                  key={i}
                  className="w-5 h-8 rounded-md bg-slate-800 border border-slate-700 shadow-sm"
                />
              ))}
            </div>
          </div>

          {/* Central Scoreboard Trigger & Round Info */}
          <div className="flex flex-col items-center gap-1">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
              Round {engineState.currentRound}
            </span>
            <button
              onClick={() => setShowScoreTableModal(true)}
              className="text-[10px] font-bold text-slate-300 bg-surface-container px-2.5 py-0.5 rounded-full border border-outline-variant/30 hover:bg-surface-container-high transition-colors"
            >
              Scoreboard (500)
            </button>
          </div>

          {/* Bot 2 Station */}
          <div className={`flex flex-col items-center p-2 rounded-xl transition-colors border ${
            engineState.activePlayerIdx === 2 ? 'bg-rose-950/40 border-rose-500 shadow-md shadow-rose-950/50' : 'bg-surface-container border-outline-variant/30'
          }`}>
            <div className="flex items-center gap-1.5 mb-1">
              <span className="text-[11px] font-bold text-slate-300">Bot 2</span>
              <span className="font-mono text-[10px] font-bold text-amber-400 bg-slate-900 px-1.5 py-0.5 rounded border border-slate-700">
                {engineState.players[2]?.cardCount ?? 0} Cards
              </span>
              {engineState.players[2]?.calledUno && (
                <span className="text-[9px] bg-rose-600 text-white font-black px-1.5 py-0.2 rounded-full animate-bounce">
                  UNO!
                </span>
              )}
            </div>
            <div className="flex items-center gap-0.5 min-h-[36px]">
              {Array.from({ length: Math.min(engineState.players[2]?.cardCount ?? 0, 8) }).map((_, i) => (
                <div
                  key={i}
                  className="w-5 h-8 rounded-md bg-slate-800 border border-slate-700 shadow-sm"
                />
              ))}
            </div>
          </div>
        </div>

        {/* Center Felt Board: Draw Pile, Top Discard, Direction Indicator */}
        <div className="w-full flex flex-col items-center gap-2 my-2">
          {/* Turn Direction & Active Color Pill */}
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1 bg-surface-container-high border border-outline-variant/40 px-3 py-1 rounded-full text-[11px] shadow">
              <span className="material-symbols-outlined text-[15px] text-cyan-400">
                {engineState.direction === 1 ? 'rotate_right' : 'rotate_left'}
              </span>
              <span className="font-bold text-slate-300">
                {engineState.direction === 1 ? 'Clockwise' : 'Counter-Clockwise'}
              </span>
            </div>

            <div className="flex items-center gap-1 bg-surface-container-high border border-outline-variant/40 px-3 py-1 rounded-full text-[11px] shadow">
              <span
                className="w-3 h-3 rounded-full border border-white/50"
                style={{
                  backgroundColor:
                    engineState.activeColor === 'red'
                      ? '#e11d48'
                      : engineState.activeColor === 'blue'
                        ? '#2563eb'
                        : engineState.activeColor === 'green'
                          ? '#059669'
                          : '#f59e0b',
                }}
              />
              <span className="font-bold uppercase font-mono text-slate-200">
                {engineState.activeColor}
              </span>
            </div>
          </div>

          {/* Cards Table: Draw Deck & Discard Card */}
          <div className="flex items-center justify-center gap-6 sm:gap-8 py-2">
            {/* Draw Pile */}
            <div
              onClick={handlePlayerDraw}
              className={`w-16 h-24 sm:w-20 sm:h-28 rounded-2xl bg-slate-900 border-2 border-slate-700 flex flex-col items-center justify-center cursor-pointer shadow-xl select-none transition-transform active:scale-95 ${
                isPlayerTurn && !engineState.hasDrawnThisTurn
                  ? 'hover:border-cyan-400 ring-2 ring-cyan-400/50 animate-pulse'
                  : 'opacity-70'
              }`}
            >
              <span className="font-black text-xs text-slate-300">DRAW</span>
              <span className="text-[10px] text-slate-500 font-mono mt-1">
                ({engineState.drawPileCount})
              </span>
            </div>

            {/* Top Discard Card with Active Color Glow */}
            {engineState.topDiscard && (
              <div className="relative">
                <div
                  className={`w-16 h-24 sm:w-20 sm:h-28 rounded-2xl border-2 shadow-2xl flex flex-col items-center justify-center select-none font-black text-xl transition-all ${
                    COLOR_CLASSES[engineState.topDiscard.color] || COLOR_CLASSES.wild
                  }`}
                >
                  <span>{engineState.topDiscard.val}</span>
                  <span className="text-[10px] uppercase tracking-wider opacity-80 mt-1 font-mono">
                    {engineState.activeColor}
                  </span>
                </div>

                <span
                  className="absolute -inset-2 rounded-3xl opacity-40 blur-md pointer-events-none"
                  style={{
                    backgroundColor:
                      engineState.activeColor === 'red'
                        ? '#e11d48'
                        : engineState.activeColor === 'blue'
                          ? '#2563eb'
                          : engineState.activeColor === 'green'
                            ? '#059669'
                            : '#f59e0b',
                  }}
                />
              </div>
            )}
          </div>

          {/* Round Finish Results Banner */}
          {engineState.isRoundOver && (
            <div className="flex flex-col items-center gap-1.5 bg-surface-container border border-outline-variant/40 px-6 py-2.5 rounded-2xl shadow-xl animate-fadeIn text-center max-w-sm w-full">
              <span className="text-xs font-black text-amber-400 uppercase tracking-wide">
                {engineState.roundWinner === 0
                  ? 'You Won The Round!'
                  : `${engineState.players[engineState.roundWinner]?.name || 'Bot'} Won The Round!`}
              </span>
              <span className="text-[11px] text-slate-300 font-mono">
                Tournament: You {engineState.players[0].totalScore} - Bot 1 {engineState.players[1].totalScore} - Bot 2 {engineState.players[2]?.totalScore ?? 0}
              </span>
              <Button variant="primary" size="sm" onClick={nextRound} className="mt-1">
                {engineState.isMatchOver ? 'Play Again (New Match)' : 'Next Round'}
              </Button>
            </div>
          )}
        </div>

        {/* Player Hand Fan (Fits 360px phones without horizontal overflow) */}
        <div className="w-full flex flex-col items-center gap-1.5">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-300">
              Your Cards ({engineState.playerHand.length})
            </span>
            <span className="font-mono text-xs font-bold text-cyan-400 bg-surface-container px-2 py-0.5 rounded-full border border-outline-variant/30">
              Score: {engineState.players[0].totalScore} pts
            </span>
            {engineState.players[0].calledUno && (
              <span className="text-[10px] bg-rose-600 text-white font-black px-2 py-0.5 rounded-full">
                UNO!
              </span>
            )}
          </div>

          {/* Horizontal scrollable / wrapping hand with only valid cards highlighted */}
          <div className="w-full overflow-x-auto pb-1 scrollbar-none flex items-center justify-start sm:justify-center gap-1.5 px-2 max-w-xl min-h-[96px]">
            {engineState.playerHand.map((card) => {
              const playable = engineRef.current.isCardPlayable(card);
              const isHighlight = playable && isPlayerTurn;

              return (
                <div
                  key={card.id}
                  onClick={() => handleCardClick(card)}
                  className={`w-13 h-20 sm:w-16 sm:h-24 rounded-xl border-2 flex-shrink-0 flex flex-col items-center justify-center font-black select-none cursor-pointer transition-all ${
                    COLOR_CLASSES[card.color] || COLOR_CLASSES.wild
                  } ${
                    isHighlight
                      ? 'hover:-translate-y-2 ring-2 ring-white/90 shadow-lg scale-105'
                      : 'opacity-50 saturate-50 pointer-events-none'
                  }`}
                >
                  <span className="text-sm sm:text-base font-black">{card.val}</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Thumb Zone Controls: Call UNO, Pass Turn */}
        <div className="w-full max-w-md pt-2 pb-1 border-t border-slate-800 flex items-center justify-center gap-2.5">
          {canCallUno && (
            <Button
              variant="danger"
              size="md"
              onClick={handleCallUno}
              className="animate-pulse"
              icon={<span className="material-symbols-outlined text-[18px]">campaign</span>}
            >
              Call UNO!
            </Button>
          )}

          {isPlayerTurn && engineState.hasDrawnThisTurn && (
            <Button
              variant="surface"
              size="md"
              onClick={handlePassTurn}
              icon={<span className="material-symbols-outlined text-[18px]">forward</span>}
            >
              Pass Turn
            </Button>
          )}

          {isPlayerTurn && !engineState.hasDrawnThisTurn && (
            <Button
              variant="primary"
              size="md"
              onClick={handlePlayerDraw}
              icon={<span className="material-symbols-outlined text-[18px]">add_box</span>}
            >
              Draw Card
            </Button>
          )}
        </div>
      </div>

      {/* Color Chooser Modal Sheet for Wild Cards */}
      <Modal
        isOpen={Boolean(pendingWildCard)}
        onClose={() => setPendingWildCard(null)}
        title="Select New Color"
        maxWidth="sm"
      >
        <div className="p-4 text-center space-y-4">
          <p className="text-body-sm text-slate-300">
            Choose the active color for the table:
          </p>
          <div className="grid grid-cols-2 gap-3">
            {COLORS.map((color) => (
              <button
                key={color}
                onClick={() => {
                  if (pendingWildCard) {
                    playCardDirect(pendingWildCard.id, color);
                  }
                }}
                className={`py-4 rounded-2xl font-black text-sm uppercase shadow-lg transition-transform active:scale-95 border-2 ${COLOR_CLASSES[color]}`}
              >
                {color}
              </button>
            ))}
          </div>
        </div>
      </Modal>

      {/* Match Scoreboard Modal Table */}
      <Modal
        isOpen={showScoreTableModal}
        onClose={() => setShowScoreTableModal(false)}
        title="Tournament Score Table"
        maxWidth="md"
      >
        <div className="p-4 space-y-4">
          <div className="flex items-center justify-between text-xs text-slate-400 pb-2 border-b border-slate-700">
            <span>Target: 500 Points</span>
            <span>Current Round: {engineState.currentRound}</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs font-mono">
              <thead>
                <tr className="border-b border-slate-700 text-slate-400">
                  <th className="py-2">Round</th>
                  <th className="py-2">Winner</th>
                  <th className="py-2 text-right">Pts Awarded</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {engineState.roundHistory.length === 0 ? (
                  <tr>
                    <td colSpan={3} className="py-4 text-center text-slate-500">
                      No completed rounds yet.
                    </td>
                  </tr>
                ) : (
                  engineState.roundHistory.map((r) => (
                    <tr key={r.round}>
                      <td className="py-2 text-slate-300">#{r.round}</td>
                      <td className="py-2 text-amber-400 font-bold">{r.winnerName}</td>
                      <td className="py-2 text-right text-emerald-400 font-bold">+{r.pointsAwarded}</td>
                    </tr>
                  ))
                )}
                <tr className="font-bold border-t border-slate-600 bg-surface-container">
                  <td className="py-2.5">Total</td>
                  <td className="py-2.5 text-cyan-300">You: {engineState.players[0].totalScore}</td>
                  <td className="py-2.5 text-right text-amber-300">
                    Bot 1: {engineState.players[1].totalScore} | Bot 2: {engineState.players[2]?.totalScore ?? 0}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          <Button variant="primary" size="md" onClick={() => setShowScoreTableModal(false)} className="w-full">
            Back to Match
          </Button>
        </div>
      </Modal>
    </GameShell>
  );
};
