import { useState, useRef, useEffect, useCallback } from 'react';
import { GameShell } from '@/components/game/GameShell';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { useAppStore } from '@/app/store';
import { useAudio } from '@/lib/audio';
import { storage } from '@/lib/storage';
import { PlayingCard } from '../shared/PlayingCard';
import { PokerEngine } from './logic/PokerEngine';

export const Poker = () => {
  const { updateVault, refillVaultCoins } = useAppStore();
  const audio = useAudio();
  const engineRef = useRef(new PokerEngine());

  const [engineState, setEngineState] = useState(() =>
    engineRef.current.init({ playerStack: 1000, bot1Stack: 1000, bot2Stack: 1000 })
  );
  const [isAiThinking, setIsAiThinking] = useState(false);
  const [stats, setStats] = useState(() => storage.getStats('poker'));
  const [showTournamentOverModal, setShowTournamentOverModal] = useState(false);

  const humanPlayer = engineState.players[0] || { chips: 0, hand: [], streetBet: 0 };
  const bot1 = engineState.players[1] || { chips: 0, hand: [], streetBet: 0 };
  const bot2 = engineState.players[2] || { chips: 0, hand: [], streetBet: 0 };

  const syncVault = useCallback((newStack) => {
    updateVault((prev) => ({
      ...prev,
      coins: newStack,
      lifetimeWinnings: Math.max(prev.lifetimeWinnings, newStack),
    }));
  }, [updateVault]);

  const resolveHandEnd = useCallback((state) => {
    const isHumanWinner = state.handResult?.winnerId === 'player' ||
      (state.handResult?.potsAwarded && state.handResult.potsAwarded.some((p) => p.winnerIndices.includes(0)));

    if (isHumanWinner) {
      audio.win();
      storage.recordGameEnd('poker', true, state.handResult.potWon || 0);
    } else {
      audio.error();
      storage.recordGameEnd('poker', false, 0);
    }
    setStats(storage.getStats('poker'));

    if (state.tournamentWinner) {
      setShowTournamentOverModal(true);
    }
  }, [audio]);

  // Fast AI decision loop when activeTurn is a computer player
  useEffect(() => {
    const isBotTurn = engineState.activeTurn === 1 || engineState.activeTurn === 2;
    const isHandActive = engineState.street !== 'showdown' && engineState.street !== 'hand_over';

    if (isBotTurn && isHandActive && !isAiThinking) {
      setIsAiThinking(true);
      const timer = setTimeout(() => {
        const aiAction = engineRef.current.computeAiAction(engineState.activeTurn);
        if (aiAction) {
          if (aiAction.type === 'call' || aiAction.type.startsWith('raise') || aiAction.type === 'all_in') {
            audio.chips();
          } else {
            audio.click();
          }
          engineRef.current.applyAction(aiAction);
          const nextState = engineRef.current.getState();
          setEngineState(nextState);
          syncVault(nextState.players[0].chips);

          if (nextState.street === 'showdown' || nextState.street === 'hand_over') {
            resolveHandEnd(nextState);
          }
        }
        setIsAiThinking(false);
      }, 200); // Fast 200ms turnaround (<0.5s requirement)
      return () => clearTimeout(timer);
    }
  }, [engineState.activeTurn, engineState.street, isAiThinking, audio, syncVault, resolveHandEnd]);

  const handlePlayerAction = (type, amount) => {
    if (engineState.activeTurn !== 0 || isAiThinking) return;

    if (type === 'call' || type.startsWith('raise') || type === 'all_in') {
      audio.chips();
    } else {
      audio.click();
    }

    engineRef.current.applyAction({ type, amount });
    const nextState = engineRef.current.getState();
    setEngineState(nextState);
    syncVault(nextState.players[0].chips);

    if (nextState.street === 'showdown' || nextState.street === 'hand_over') {
      resolveHandEnd(nextState);
    }
  };

  const nextHand = () => {
    audio.cardDeal();
    engineRef.current.startHand();
    const nextState = engineRef.current.getState();
    setEngineState(nextState);
  };

  const restartTournament = () => {
    refillVaultCoins();
    engineRef.current.init({ playerStack: 1000, bot1Stack: 1000, bot2Stack: 1000 });
    setEngineState(engineRef.current.getState());
    setShowTournamentOverModal(false);
  };

  const callAmount = Math.max(0, engineState.currentBet - humanPlayer.streetBet);
  const isPlayerTurn = engineState.activeTurn === 0 && !engineState.handResult && engineState.street !== 'showdown' && engineState.street !== 'hand_over';

  const activeTurnName = engineState.activeTurn === 0
    ? 'Your Turn'
    : engineState.activeTurn === 1
      ? 'Bot 1 Turn'
      : 'Bot 2 Turn';

  return (
    <GameShell
      gameId="poker"
      title="Poker Arena"
      category="Cards"
      accentColor="#8b5cf6"
      turnIndicator={isAiThinking ? 'AI Deciding...' : activeTurnName}
      score={humanPlayer.chips}
      highScore={stats.highScore}
      howToPlay={{
        goal: 'Win all 3,000 chips by forming the strongest 5-card Texas Hold\'em hand or betting strategically to make opponents fold.',
        rules: [
          '3-player No-Limit Texas Hold\'em: You vs Bot 1 (Bluffer) vs Bot 2 (Tight).',
          'Small blind $10, Big blind $20. The Dealer Button (D) rotates clockwise after each hand.',
          'Streets: Preflop (2 hole cards each) -> Flop (3 community cards) -> Turn (1 card) -> River (1 card) -> Showdown.',
          'Actions: Fold, Check (pass when no bet), Call (match bet), Raise 2x BB ($40), Raise 3x BB ($60), All-in.',
          'Hand Ranks: Royal Flush > Straight Flush > 4-of-a-Kind > Full House > Flush > Straight > 3-of-a-Kind > Two Pair > One Pair > High Card.',
          'Side Pots: Calculated automatically when players are all-in for different stack amounts.',
          'Tournament elimination occurs when a player reaches $0 chips. Last player standing wins.',
        ],
        controls: {
          touch: [
            'Tap Check or Call to match bet',
            'Tap Raise 2x or 3x for quick aggressive plays',
            'Tap All-In to wager your entire remaining stack',
            'Tap Fold to surrender hand',
          ],
          mouse: [
            'Click action buttons in the bottom thumb zone',
            'Click Next Hand between rounds or Replay to start new match',
          ],
        },
        scoring: 'Tournament chips: accumulate chips to reach $3,000. Track your wins and highest bankroll in stats.',
        winLose: 'Victory when both bots are eliminated. Defeat if your stack reaches $0.',
        tips: [
          'Bot 1 bluffs occasionally with high cards, while Bot 2 only plays premium pairs and made hands.',
          'Position is power: acting after the blinds gives you crucial information on post-flop streets.',
        ],
      }}
      onRestart={restartTournament}
    >
      <div className="flex-1 flex flex-col items-center justify-between p-2 sm:p-5 max-w-2xl mx-auto w-full select-none text-slate-100 min-h-[580px]">
        {/* Top Opponents Row (Bot 1 on Left, Bot 2 on Right) */}
        <div className="w-full flex items-center justify-between gap-2 px-1 pt-1">
          {/* Bot 1 Card & Chip Box */}
          <div className={`flex flex-col items-center p-2 rounded-xl transition-colors border ${
            engineState.activeTurn === 1 ? 'bg-purple-950/40 border-purple-500 shadow-md shadow-purple-950/50' : 'bg-surface-container border-outline-variant/30'
          }`}>
            <div className="flex items-center gap-1.5 mb-1">
              <span className="text-[11px] font-bold text-slate-300">Bot 1</span>
              <span className="font-mono text-[10px] font-extrabold text-amber-400 bg-slate-900 px-1.5 py-0.5 rounded border border-slate-700">
                ${bot1.chips}
              </span>
              {bot1.isDealer && (
                <span className="w-4 h-4 rounded-full bg-amber-400 text-slate-950 text-[9px] font-black flex items-center justify-center shadow">
                  D
                </span>
              )}
            </div>
            <div className="flex items-center gap-1 min-h-[64px]">
              {bot1.hand.map((card, idx) => (
                <PlayingCard key={card.id || idx} card={card} hidden={card.hidden} small />
              ))}
            </div>
            <div className="flex items-center gap-1 mt-1 text-[10px]">
              {bot1.folded ? (
                <span className="text-rose-400 font-bold uppercase">Folded</span>
              ) : bot1.allIn ? (
                <span className="text-amber-400 font-bold uppercase animate-pulse">All-In</span>
              ) : bot1.streetBet > 0 ? (
                <span className="text-cyan-400 font-mono font-bold">Bet: ${bot1.streetBet}</span>
              ) : null}
              {bot1.evalName && <span className="text-purple-300 font-semibold">{bot1.evalName}</span>}
            </div>
          </div>

          {/* Central Match Summary / Blind Tracker */}
          <div className="flex flex-col items-center justify-center gap-0.5">
            <span className="text-[10px] tracking-wider uppercase font-bold text-slate-400">Blinds</span>
            <span className="text-[11px] font-mono font-bold text-slate-300 bg-slate-800/80 px-2 py-0.5 rounded-full border border-slate-700">
              $10 / $20
            </span>
          </div>

          {/* Bot 2 Card & Chip Box */}
          <div className={`flex flex-col items-center p-2 rounded-xl transition-colors border ${
            engineState.activeTurn === 2 ? 'bg-purple-950/40 border-purple-500 shadow-md shadow-purple-950/50' : 'bg-surface-container border-outline-variant/30'
          }`}>
            <div className="flex items-center gap-1.5 mb-1">
              <span className="text-[11px] font-bold text-slate-300">Bot 2</span>
              <span className="font-mono text-[10px] font-extrabold text-amber-400 bg-slate-900 px-1.5 py-0.5 rounded border border-slate-700">
                ${bot2.chips}
              </span>
              {bot2.isDealer && (
                <span className="w-4 h-4 rounded-full bg-amber-400 text-slate-950 text-[9px] font-black flex items-center justify-center shadow">
                  D
                </span>
              )}
            </div>
            <div className="flex items-center gap-1 min-h-[64px]">
              {bot2.hand.map((card, idx) => (
                <PlayingCard key={card.id || idx} card={card} hidden={card.hidden} small />
              ))}
            </div>
            <div className="flex items-center gap-1 mt-1 text-[10px]">
              {bot2.folded ? (
                <span className="text-rose-400 font-bold uppercase">Folded</span>
              ) : bot2.allIn ? (
                <span className="text-amber-400 font-bold uppercase animate-pulse">All-In</span>
              ) : bot2.streetBet > 0 ? (
                <span className="text-cyan-400 font-mono font-bold">Bet: ${bot2.streetBet}</span>
              ) : null}
              {bot2.evalName && <span className="text-purple-300 font-semibold">{bot2.evalName}</span>}
            </div>
          </div>
        </div>

        {/* Center Felt Board: Pots & Community Cards */}
        <div className="w-full flex flex-col items-center gap-2.5 my-2">
          {/* Pot Pill & Street Badge */}
          <div className="flex items-center gap-2">
            <div className="bg-surface-container-high border border-outline-variant/40 px-3 py-1 rounded-full flex items-center gap-1.5 shadow-lg">
              <span className="text-[11px] text-slate-400 font-bold">POT:</span>
              <span className="text-sm font-mono font-black text-amber-400">${engineState.pot}</span>
            </div>
            {engineState.sidePots && engineState.sidePots.length > 1 && (
              <span className="text-[10px] bg-slate-800 text-slate-300 border border-slate-700 px-2 py-0.5 rounded-full font-mono">
                {engineState.sidePots.length} Pots
              </span>
            )}
            <span className="text-[10px] uppercase tracking-wider font-extrabold bg-slate-800 px-2.5 py-0.5 rounded-full border border-slate-700 text-cyan-400">
              {engineState.street}
            </span>
          </div>

          {/* 5 Community Cards */}
          <div className="flex items-center gap-1.5 sm:gap-2 p-2 rounded-2xl bg-emerald-950/40 border border-emerald-800/40 shadow-inner">
            {engineState.communityCards.map((card) => (
              <PlayingCard key={card.id} card={card} />
            ))}
            {Array.from({ length: 5 - engineState.communityCards.length }).map((_, i) => (
              <div
                key={i}
                className="w-14 h-20 sm:w-16 sm:h-24 rounded-lg border-2 border-dashed border-emerald-900/40 flex items-center justify-center opacity-30 text-[10px] text-emerald-500 font-semibold"
              >
                Board
              </div>
            ))}
          </div>

          {/* Hand Result Announcement Banner */}
          {engineState.handResult && (
            <div className="flex flex-col items-center gap-1 bg-surface-container border border-outline-variant/40 px-5 py-2 rounded-xl shadow-xl animate-fadeIn text-center max-w-sm w-full">
              <span className="text-xs font-black text-amber-400 uppercase tracking-wide">
                {engineState.handResult.reason === 'fold'
                  ? `${engineState.handResult.winnerName} won $${engineState.handResult.potWon} (Opponents Folded)`
                  : `${engineState.handResult.winnerName} won $${engineState.handResult.potWon}`}
              </span>
              {engineState.handResult.evalDesc && engineState.handResult.reason !== 'fold' && (
                <span className="text-[11px] text-slate-300">
                  Winning Hand: {engineState.handResult.evalDesc}
                </span>
              )}
              <Button
                variant="primary"
                size="sm"
                onClick={nextHand}
                className="mt-1"
                icon={<span className="material-symbols-outlined text-[16px]">replay</span>}
              >
                Next Hand
              </Button>
            </div>
          )}
        </div>

        {/* Player Section (Bottom) */}
        <div className={`w-full flex flex-col items-center gap-1.5 p-2 rounded-2xl transition-colors border ${
          engineState.activeTurn === 0 ? 'bg-cyan-950/30 border-cyan-500/60 shadow-lg' : 'bg-surface-container/60 border-outline-variant/20'
        }`}>
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-200">
              Your Cards
            </span>
            <span className="font-mono text-xs font-bold text-amber-400 bg-surface-container px-2.5 py-0.5 rounded-full border border-outline-variant/30">
              Stack: ${humanPlayer.chips}
            </span>
            {humanPlayer.isDealer && (
              <span className="w-4 h-4 rounded-full bg-amber-400 text-slate-950 text-[10px] font-black flex items-center justify-center shadow">
                D
              </span>
            )}
            {humanPlayer.streetBet > 0 && (
              <span className="font-mono text-[11px] text-cyan-300 font-bold">
                Bet: ${humanPlayer.streetBet}
              </span>
            )}
            {engineState.playerEvalName && (
              <span className="text-[11px] bg-cyan-950 border border-cyan-800 text-cyan-300 px-2 py-0.5 rounded-full font-bold">
                {engineState.playerEvalName}
              </span>
            )}
          </div>

          <div className="flex items-center gap-2 min-h-[96px]">
            {humanPlayer.hand.map((card) => (
              <PlayingCard key={card.id} card={card} />
            ))}
          </div>
        </div>

        {/* Thumb Zone Action Controls */}
        <div className="w-full pt-3 pb-1 flex flex-col items-center gap-2">
          {isPlayerTurn && (
            <div className="w-full flex items-center justify-center gap-2 flex-wrap animate-fadeIn">
              <Button
                variant="danger"
                size="md"
                onClick={() => handlePlayerAction('fold')}
              >
                Fold
              </Button>

              {engineState.legalActions.includes('check') && (
                <Button
                  variant="surface"
                  size="md"
                  onClick={() => handlePlayerAction('check')}
                >
                  Check
                </Button>
              )}

              {engineState.legalActions.includes('call') && (
                <Button
                  variant="primary"
                  size="md"
                  onClick={() => handlePlayerAction('call')}
                >
                  Call (${callAmount})
                </Button>
              )}

              {engineState.legalActions.includes('raise_2bb') && (
                <Button
                  variant="gold"
                  size="md"
                  onClick={() => handlePlayerAction('raise_2bb')}
                >
                  Raise 2x ($40)
                </Button>
              )}

              {engineState.legalActions.includes('raise_3bb') && (
                <Button
                  variant="gold"
                  size="md"
                  onClick={() => handlePlayerAction('raise_3bb')}
                >
                  Raise 3x ($60)
                </Button>
              )}

              {engineState.legalActions.includes('all_in') && (
                <Button
                  variant="primary"
                  size="md"
                  onClick={() => handlePlayerAction('all_in')}
                >
                  All-In (${humanPlayer.chips})
                </Button>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Tournament Conclusion Modal */}
      <Modal
        isOpen={showTournamentOverModal}
        onClose={() => setShowTournamentOverModal(false)}
        title={engineState.tournamentWinner === 'player' ? 'Tournament Victory!' : 'Eliminated!'}
        maxWidth="sm"
      >
        <div className="p-4 text-center space-y-4">
          <p className="text-body-sm text-slate-300">
            {engineState.tournamentWinner === 'player'
              ? 'Congratulations! You eliminated all opponents and conquered the $3,000 tournament purse!'
              : 'You ran out of chips. Re-enter the tournament with a fresh 1,000 chip stack to take another shot.'}
          </p>
          <Button variant="primary" size="md" onClick={restartTournament} className="w-full">
            Play Again
          </Button>
        </div>
      </Modal>
    </GameShell>
  );
};
