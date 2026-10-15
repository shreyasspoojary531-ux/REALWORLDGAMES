import { useState, useRef, useCallback } from 'react';
import { GameShell } from '@/components/game/GameShell';
import { Button } from '@/components/ui/Button';
import { useAudio } from '@/lib/audio';
import { storage } from '@/lib/storage';
import { BlackjackEngine } from './logic/BlackjackEngine';

const CHIP_OPTIONS = [10, 50, 100];

// Suit colors
const SUIT_COLORS = {
  '♠': 'text-slate-100',
  '♣': 'text-slate-100',
  '♥': 'text-rose-500',
  '♦': 'text-rose-500',
};

// Clean CSS Playing Card component with flip animation
const BlackjackCard = ({ card, hidden = false }) => {
  if (hidden || !card) {
    return (
      <div className="w-14 h-20 sm:w-16 sm:h-24 rounded-xl bg-gradient-to-tr from-blue-900 to-indigo-900 border-2 border-blue-400/40 flex items-center justify-center shadow-lg select-none transition-transform duration-300">
        <div className="w-9 h-14 rounded-lg border border-dashed border-blue-400/40 flex items-center justify-center text-sm font-bold text-blue-200">
          ♠
        </div>
      </div>
    );
  }

  const colorClass = SUIT_COLORS[card.suit] || 'text-slate-100';

  return (
    <div className="w-14 h-20 sm:w-16 sm:h-24 rounded-xl bg-slate-900 border-2 border-slate-700/80 shadow-lg flex flex-col justify-between p-1.5 select-none transition-transform duration-200 hover:-translate-y-0.5 animate-fadeIn">
      <div className={`text-xs font-black leading-none flex items-center justify-between ${colorClass}`}>
        <span>{card.rank}</span>
        <span className="text-[10px]">{card.suit}</span>
      </div>

      <div className={`text-xl sm:text-2xl text-center leading-none ${colorClass}`}>
        {card.suit}
      </div>

      <div className={`text-xs font-black leading-none flex items-center justify-between rotate-180 ${colorClass}`}>
        <span>{card.rank}</span>
        <span className="text-[10px]">{card.suit}</span>
      </div>
    </div>
  );
};

export const Blackjack = () => {
  const audio = useAudio();
  const engineRef = useRef(new BlackjackEngine());

  // Persistent balance storage via typed storage wrapper
  const [balance, setBalance] = useState(() => {
    try {
      const vault = storage.getVault();
      return typeof vault?.coins === 'number' ? vault.coins : 1000;
    } catch {
      return 1000;
    }
  });

  const [engineState, setEngineState] = useState(() =>
    engineRef.current.init({ bankroll: balance, bet: 50 })
  );

  const [selectedBet, setSelectedBet] = useState(50);
  const [stats, setStats] = useState(() => storage.getStats('blackjack'));

  const persistBalance = useCallback((newBalance) => {
    setBalance(newBalance);
    try {
      const currentVault = storage.getVault();
      storage.saveVault({ ...currentVault, coins: newBalance });
    } catch (e) {
      console.warn('Failed to save balance to vault:', e);
    }
  }, []);

  const handleAction = (actionType) => {
    const engine = engineRef.current;
    if (!engine) return;

    if (actionType === 'deal') {
      audio.chips();
      engine.placeBet(selectedBet);
      engine.deal();
      audio.cardDeal();
    } else if (actionType === 'hit') {
      audio.cardDeal();
      engine.hit();
    } else if (actionType === 'stand') {
      audio.click();
      engine.stand();
    } else if (actionType === 'double') {
      audio.chips();
      engine.doubleDown();
      audio.cardDeal();
    } else if (actionType === 'deal_again') {
      audio.tap();
      engine.resetRound();
    } else if (actionType === 'reset_balance') {
      audio.win();
      engine.resetBalance();
      persistBalance(1000);
    }

    const state = engine.getState();
    setEngineState(state);
    persistBalance(state.bankroll);

    // Audio feedback on round conclusion
    if (state.phase === 'round_over' && state.roundResult) {
      const res = state.roundResult;
      if (res.outcome === 'win' || res.outcome === 'blackjack') {
        audio.win();
        storage.recordGameEnd('blackjack', true, res.winnings);
      } else if (res.outcome === 'bust' || res.outcome === 'lose') {
        audio.error();
        storage.recordGameEnd('blackjack', false, 0);
      } else {
        audio.click();
        storage.recordGameEnd('blackjack', false, 10);
      }
      setStats(storage.getStats('blackjack'));
    }
  };

  const isBroke = engineState.bankroll === 0 && engineState.phase === 'betting';
  const canDeal = engineState.phase === 'betting' && engineState.bankroll >= selectedBet;

  return (
    <GameShell
      gameId="blackjack"
      title="Blackjack Vault"
      category="Cards"
      accentColor="#10b981"
      turnIndicator={
        engineState.phase === 'player_turn'
          ? 'Your Turn'
          : engineState.phase === 'dealer_turn'
            ? 'Dealer Playing...'
            : engineState.phase === 'round_over'
              ? 'Round Concluded'
              : 'Place Your Bet'
      }
      score={engineState.bankroll}
      highScore={stats?.highScore || 0}
      howToPlay={{
        goal: 'Score higher than the Dealer without exceeding 21.',
        rules: [
          'Cards 2-10 count face value; Face cards (J, Q, K) = 10; Aces automatically count as 11 or 1.',
          'Dealer draws two cards with one hidden, and hits until 17 or higher, standing on all 17s.',
          'Hit: Draw another card to increase your total.',
          'Stand: Lock in your total and resolve the Dealer hand.',
          'Double Down: Double your bet on your first two cards and receive exactly one final card.',
          'Deck: 52 cards with Fisher-Yates shuffle, reshuffled when fewer than 15 cards remain.',
        ],
        controls: {
          touch: ['Tap chip (10, 50, 100) to select bet', 'Tap Deal to start round', 'Tap Hit, Stand, or Double'],
          mouse: ['Click chips to select bet', 'Click table action buttons'],
        },
        scoring: 'Natural Blackjack pays 3 to 2. Standard win pays 1 to 1. Push returns your bet. Bust loses.',
        winLose: 'Win if your total is closer to 21 than Dealer, or if Dealer busts. Lose if you bust or Dealer scores higher.',
        tips: [
          'Always stand on hard 17 or above.',
          'Double down when you hold 11 and Dealer shows an upcard of 2 through 10.',
        ],
      }}
      onRestart={() => handleAction('deal_again')}
    >
      <div className="flex-1 flex flex-col items-center justify-between p-3 sm:p-5 max-w-lg mx-auto w-full select-none">
        {/* Top Info Bar: Balance & Current Bet */}
        <div className="w-full flex items-center justify-between bg-surface-container/80 border border-outline-variant/30 px-3.5 py-2.5 rounded-2xl mb-2 text-xs">
          <div className="flex items-center gap-1.5">
            <span className="font-bold text-on-surface">Chips:</span>
            <span className="font-mono font-bold text-sm text-emerald-400">${engineState.bankroll}</span>
          </div>

          <div className="flex items-center gap-1.5">
            <span className="text-on-surface-variant font-semibold">Deck:</span>
            <span className="font-mono font-bold text-on-surface">{engineState.deckRemaining} left</span>
          </div>

          <div className="flex items-center gap-1.5">
            <span className="text-on-surface-variant font-semibold">Bet:</span>
            <span className="font-mono font-bold text-cyan-400">${engineState.currentBet}</span>
          </div>
        </div>

        {/* Dealer Area */}
        <div className="flex flex-col items-center gap-1.5 pt-1 w-full">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Dealer Hand</span>
            {engineState.dealerValue.total > 0 && (
              <span className="text-xs bg-slate-800 border border-slate-700 px-2.5 py-0.5 rounded-full font-mono text-cyan-300 font-bold">
                {engineState.dealerValue.isSoft ? 'Soft ' : ''}
                {engineState.dealerValue.total}
              </span>
            )}
          </div>

          <div className="flex items-center justify-center gap-2 min-h-[96px] sm:min-h-[105px]">
            {engineState.dealerHand.length === 0 ? (
              <div className="text-xs text-slate-500 italic py-6">Waiting for bet...</div>
            ) : (
              engineState.dealerHand.map((card, idx) => (
                <BlackjackCard key={card.id || idx} card={card} hidden={card.hidden} />
              ))
            )}
          </div>
        </div>

        {/* Center Arena Banner: Round Result & Outcome */}
        <div className="my-2 min-h-[48px] flex items-center justify-center w-full">
          {engineState.phase === 'round_over' && engineState.roundResult && (
            <div className="flex flex-col items-center gap-2 animate-fadeIn w-full">
              <div
                className={`px-4 py-1.5 rounded-full text-xs font-bold border shadow-md flex items-center gap-2 ${
                  engineState.roundResult.outcome === 'blackjack'
                    ? 'bg-amber-500/20 text-amber-300 border-amber-500/50'
                    : engineState.roundResult.outcome === 'win'
                      ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/50'
                      : engineState.roundResult.outcome === 'push'
                        ? 'bg-blue-500/20 text-blue-300 border-blue-500/50'
                        : 'bg-rose-500/20 text-rose-300 border-rose-500/50'
                }`}
              >
                <span>
                  {engineState.roundResult.outcome === 'blackjack'
                    ? '★ NATURAL BLACKJACK! (Pays 3:2)'
                    : engineState.roundResult.outcome === 'win'
                      ? 'PLAYER WINS!'
                      : engineState.roundResult.outcome === 'push'
                        ? 'PUSH (Bet Returned)'
                        : engineState.roundResult.outcome === 'bust'
                          ? 'BUST (Exceeded 21)'
                          : 'DEALER WINS'}
                </span>
                {engineState.roundResult.winnings > 0 && (
                  <span className="font-mono font-bold">(+${engineState.roundResult.winnings})</span>
                )}
              </div>

              <Button
                variant="primary"
                size="md"
                onClick={() => handleAction('deal_again')}
                icon={<span className="material-symbols-outlined text-[18px]">replay</span>}
              >
                Deal Again
              </Button>
            </div>
          )}

          {isBroke && (
            <div className="flex flex-col items-center gap-2 animate-fadeIn">
              <span className="text-xs font-bold text-rose-400">Balance is $0!</span>
              <Button
                variant="primary"
                size="md"
                onClick={() => handleAction('reset_balance')}
                icon={<span className="material-symbols-outlined text-[18px]">account_balance_wallet</span>}
              >
                Reset Balance ($1,000)
              </Button>
            </div>
          )}
        </div>

        {/* Player Area */}
        <div className="flex flex-col items-center gap-1.5 pb-2 w-full">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Your Hand</span>
            {engineState.playerValue.total > 0 && (
              <span className="text-xs bg-slate-800 border border-slate-700 px-2.5 py-0.5 rounded-full font-mono text-cyan-300 font-bold">
                {engineState.playerValue.isSoft ? 'Soft ' : ''}
                {engineState.playerValue.total}
              </span>
            )}
          </div>

          <div className="flex items-center justify-center gap-2 min-h-[96px] sm:min-h-[105px]">
            {engineState.playerHand.length === 0 ? (
              <div className="text-xs text-slate-500 italic py-6">Place a bet to deal</div>
            ) : (
              engineState.playerHand.map((card, idx) => (
                <BlackjackCard key={card.id || idx} card={card} />
              ))
            )}
          </div>
        </div>

        {/* Bottom Console: Bet Chips (10, 50, 100) or In-Play Actions (Hit, Stand, Double) */}
        <div className="w-full pt-3 border-t border-slate-800 flex flex-col items-center gap-3">
          {engineState.phase === 'betting' && !isBroke ? (
            <div className="w-full flex flex-col items-center gap-2.5">
              {/* Chip Denominations: 10, 50, 100 */}
              <div className="flex items-center gap-3">
                {CHIP_OPTIONS.map((val) => (
                  <button
                    key={val}
                    type="button"
                    onClick={() => {
                      audio.click();
                      setSelectedBet(val);
                    }}
                    className={`w-12 h-12 rounded-full font-black text-xs border-2 shadow-lg transition-transform active:scale-95 flex items-center justify-center ${
                      selectedBet === val
                        ? 'border-emerald-400 bg-emerald-950 text-emerald-300 scale-110 ring-2 ring-emerald-400/40'
                        : 'border-slate-700 bg-slate-900 text-slate-400 hover:border-slate-500'
                    }`}
                  >
                    ${val}
                  </button>
                ))}
              </div>

              <Button
                variant="primary"
                size="md"
                onClick={() => handleAction('deal')}
                disabled={!canDeal}
                className="w-full max-w-xs"
              >
                Deal (${selectedBet})
              </Button>
            </div>
          ) : engineState.phase === 'player_turn' ? (
            <div className="flex items-center justify-center gap-2.5 flex-wrap">
              <Button
                variant="primary"
                size="md"
                onClick={() => handleAction('hit')}
                icon={<span className="material-symbols-outlined text-[18px]">add_circle</span>}
              >
                Hit
              </Button>

              <Button
                variant="surface"
                size="md"
                onClick={() => handleAction('stand')}
                icon={<span className="material-symbols-outlined text-[18px]">pan_tool</span>}
              >
                Stand
              </Button>

              {engineState.legalActions.includes('double') && (
                <Button
                  variant="gold"
                  size="md"
                  onClick={() => handleAction('double')}
                  icon={<span className="material-symbols-outlined text-[18px]">bolt</span>}
                >
                  Double (${engineState.currentBet})
                </Button>
              )}
            </div>
          ) : null}
        </div>
      </div>
    </GameShell>
  );
};
