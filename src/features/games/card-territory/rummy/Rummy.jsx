import { useState, useRef, useEffect, useCallback } from 'react';
import { GameShell } from '@/components/game/GameShell';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { useAudio } from '@/lib/audio';
import { storage } from '@/lib/storage';
import { PlayingCard } from '../shared/PlayingCard';
import {
  RummyEngine,
  validateDeclaration,
} from './logic/RummyEngine';

export const Rummy = () => {
  const audio = useAudio();
  const engineRef = useRef(new RummyEngine());

  const [engineState, setEngineState] = useState(() => engineRef.current.init({ scoreLimit: 200 }));
  const [selectedIdx, setSelectedIdx] = useState(null);
  const [draggedIdx, setDraggedIdx] = useState(null);
  const [isBotThinking, setIsBotThinking] = useState(false);
  const [showDeclareModal, setShowDeclareModal] = useState(false);
  const [declarationResult, setDeclarationResult] = useState(null);
  const [showScoreTableModal, setShowScoreTableModal] = useState(false);
  const [stats, setStats] = useState(() => storage.getStats('rummy'));

  // Bot AI loop (<0.5s turnaround)
  useEffect(() => {
    if (engineState.turn === 'bot' && !engineState.isHandFinished && !isBotThinking) {
      setIsBotThinking(true);
      const timer = setTimeout(() => {
        audio.cardDeal();
        engineRef.current.computeBotTurn();
        const nextState = engineRef.current.getState();
        setEngineState(nextState);
        setIsBotThinking(false);

        if (nextState.isHandFinished) {
          if (nextState.result?.winner === 'bot') {
            audio.error();
          } else {
            audio.win();
          }
          setDeclarationResult({
            isValid: true,
            winner: nextState.result?.winner,
            message: nextState.result?.message,
          });
          setShowDeclareModal(true);
        }
      }, 250);
      return () => clearTimeout(timer);
    }
  }, [engineState.turn, engineState.isHandFinished, isBotThinking, audio]);

  const handleDraw = (source) => {
    if (engineState.turn !== 'player' || engineState.turnStep !== 'draw' || engineState.isHandFinished) return;
    audio.cardDeal();
    engineRef.current.drawCard(source);
    setEngineState(engineRef.current.getState());
  };

  const handleDiscard = (cardIdToDiscard = null) => {
    if (engineState.turn !== 'player' || engineState.turnStep !== 'discard' || engineState.isHandFinished) return;

    let targetId = cardIdToDiscard;
    if (!targetId && selectedIdx !== null) {
      targetId = engineState.playerHand[selectedIdx]?.id;
    }
    if (!targetId) return;

    audio.tap();
    engineRef.current.discardCard(targetId);
    setSelectedIdx(null);
    setEngineState(engineRef.current.getState());
  };

  const handleSortHand = (type = 'suit') => {
    audio.click();
    const sorted = [...engineState.playerHand].sort((a, b) => {
      if (type === 'suit') {
        if (a.suit !== b.suit) return a.suit.localeCompare(b.suit);
        return a.num - b.num;
      }
      return a.num - b.num;
    });
    engineRef.current.playerHand = sorted;
    setEngineState(engineRef.current.getState());
  };

  // Reorder hand via drag & drop
  const handleDragStart = (idx) => {
    setDraggedIdx(idx);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
  };

  const handleDrop = (targetIdx) => {
    if (draggedIdx === null || draggedIdx === targetIdx) return;
    audio.click();
    const updated = [...engineState.playerHand];
    const [moved] = updated.splice(draggedIdx, 1);
    updated.splice(targetIdx, 0, moved);
    engineRef.current.playerHand = updated;
    setEngineState(engineRef.current.getState());
    setDraggedIdx(null);
    setSelectedIdx(targetIdx);
  };

  // Auto-group cards to evaluate meld status
  const autoGroupCards = useCallback(() => {
    return engineRef.current.autoGroupHand(engineState.playerHand);
  }, [engineState.playerHand]);

  const groups = autoGroupCards();
  const validation = validateDeclaration(
    engineState.playerHand.length === 13 ? groups : groups.slice(0, 4),
    engineState.wildJoker?.rank
  );

  const handleDeclare = () => {
    if (engineState.turn !== 'player' || engineState.playerHand.length < 13) return;

    const evalGroups = autoGroupCards();
    const evalValidation = validateDeclaration(evalGroups, engineState.wildJoker?.rank);

    if (evalValidation.isValid) {
      audio.win();
      engineRef.current.declare(evalGroups);
      const nextState = engineRef.current.getState();
      setEngineState(nextState);
      storage.recordGameEnd('rummy', true, 100);
      setStats(storage.getStats('rummy'));
      setDeclarationResult({
        isValid: true,
        winner: 'player',
        message: 'Valid Show! You won the round. Computer is penalized.',
      });
    } else {
      audio.error();
      setDeclarationResult({
        isValid: false,
        winner: null,
        message: evalValidation.message,
      });
    }
    setShowDeclareModal(true);
  };

  const nextRound = () => {
    setShowDeclareModal(false);
    if (engineState.isMatchFinished) {
      engineRef.current.init({ scoreLimit: 200 });
    } else {
      engineRef.current.currentRound += 1;
      engineRef.current.startRound();
    }
    setEngineState(engineRef.current.getState());
    setSelectedIdx(null);
  };

  return (
    <GameShell
      gameId="rummy"
      title="Rummy Market"
      category="Cards"
      accentColor="#d97706"
      turnIndicator={
        isBotThinking
          ? 'Computer Thinking...'
          : engineState.turn === 'player'
            ? engineState.turnStep === 'draw'
              ? 'Draw from Stock or Discard'
              : 'Select / Drag to Discard or Declare'
            : 'Computer Turn'
      }
      score={engineState.totalScores.player}
      highScore={stats.highScore}
      howToPlay={{
        goal: 'Variant: 13-Card Indian Rummy. Arrange all 13 cards into valid groups (at least two sequences with at least one pure sequence) before your opponent.',
        rules: [
          'Variant: Standard 13-Card Indian Rummy with 2 standard decks + jokers.',
          'Each player starts with 13 cards. A Wild Joker is randomly cut from the deck.',
          'Turn sequence: Draw 1 card from Stock or top Discard, then Discard 1 card.',
          'Pure Sequence rule: At least one sequence of 3+ consecutive cards of the exact same suit with NO jokers is strictly mandatory.',
          'Second Sequence rule: A second sequence (pure or impure with jokers) is mandatory.',
          'Remaining cards must form valid sequences or sets (3-4 cards of the same rank across different suits).',
          'Scoring: Round winner scores 0 penalty points; loser scores the sum of unmatched cards (face cards and Aces = 10 pts, numbered cards = face value, capped at 80 pts).',
          'Rounds repeat until a player reaches the 200 points score limit.',
        ],
        controls: {
          touch: [
            'Tap Stock Deck or Discard Pile to draw',
            'Tap card to select it, or drag cards horizontally to reorder',
            'Tap Discard Selected to discard, or tap Declare when melded',
            'Tap Scoreboard to inspect total score table across rounds',
          ],
          mouse: [
            'Click decks to draw',
            'Drag and drop cards in hand to arrange sequences and sets',
            'Click Sort by Suit or Rank to auto-organize',
          ],
        },
        scoring: 'Lowest cumulative score wins the match. First player to reach 200 points loses the match.',
        winLose: 'Declare first with a valid pure sequence to win the round and award 0 points to yourself.',
        tips: [
          'Always form your Pure Sequence first before trying to build sets or impure runs.',
          'Jokers (printed and wild rank) can substitute any card in sets or impure sequences.',
        ],
      }}
      onRestart={() => {
        engineRef.current.init({ scoreLimit: 200 });
        setEngineState(engineRef.current.getState());
        setSelectedIdx(null);
      }}
    >
      <div className="flex-1 flex flex-col items-center justify-between p-2 sm:p-5 max-w-4xl mx-auto w-full select-none text-slate-100 min-h-[580px]">
        {/* Top Info Bar: Score Limit & Scoreboard Trigger */}
        <div className="w-full flex items-center justify-between px-2 pt-1 pb-2">
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
              Round {engineState.currentRound}
            </span>
            <span className="text-[10px] bg-slate-800 text-slate-300 px-2 py-0.5 rounded-full border border-slate-700">
              Limit: {engineState.scoreLimit} pts
            </span>
          </div>

          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1.5 text-xs font-mono">
              <span className="text-cyan-400 font-bold">You: {engineState.totalScores.player}</span>
              <span className="text-slate-500">|</span>
              <span className="text-amber-400 font-bold">Bot: {engineState.totalScores.bot}</span>
            </div>
            <button
              onClick={() => setShowScoreTableModal(true)}
              className="text-[10px] font-bold text-slate-300 bg-surface-container px-2.5 py-1 rounded-full border border-outline-variant/30 hover:bg-surface-container-high transition-colors"
            >
              Scoreboard
            </button>
          </div>
        </div>

        {/* Table Felt: Stock, Wild Joker, Discard Pile */}
        <div className="w-full flex items-center justify-around py-3.5 px-4 bg-emerald-950/40 border border-emerald-800/40 rounded-3xl max-w-lg shadow-inner">
          {/* Closed Stock Pile */}
          <div className="flex flex-col items-center gap-1.5">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
              Stock ({engineState.stockCount})
            </span>
            <div
              onClick={() => handleDraw('stock')}
              className={`cursor-pointer transition-transform active:scale-95 ${
                engineState.turn === 'player' && engineState.turnStep === 'draw' && !engineState.isHandFinished
                  ? 'ring-2 ring-cyan-400 rounded-xl animate-pulse shadow-lg shadow-cyan-900/50'
                  : ''
              }`}
            >
              <PlayingCard hidden={true} />
            </div>
          </div>

          {/* Wild Joker Display */}
          {engineState.wildJoker && (
            <div className="flex flex-col items-center gap-1.5">
              <span className="text-[10px] font-bold uppercase tracking-wider text-amber-400">
                Wild Joker
              </span>
              <div className="rotate-6 scale-95 shadow-md">
                <PlayingCard card={engineState.wildJoker} />
              </div>
            </div>
          )}

          {/* Open Discard Pile (also acts as drop target) */}
          <div className="flex flex-col items-center gap-1.5">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
              Discard
            </span>
            <div
              onClick={() => {
                if (engineState.turnStep === 'draw') {
                  handleDraw('discard');
                } else if (engineState.turnStep === 'discard' && selectedIdx !== null) {
                  handleDiscard();
                }
              }}
              onDragOver={handleDragOver}
              onDrop={() => {
                if (draggedIdx !== null) {
                  const cardId = engineState.playerHand[draggedIdx]?.id;
                  handleDiscard(cardId);
                  setDraggedIdx(null);
                }
              }}
              className={`cursor-pointer transition-transform active:scale-95 ${
                engineState.turn === 'player' && engineState.turnStep === 'draw' && !engineState.isHandFinished
                  ? 'ring-2 ring-emerald-400 rounded-xl'
                  : engineState.turn === 'player' && engineState.turnStep === 'discard' && selectedIdx !== null
                    ? 'ring-2 ring-amber-400 rounded-xl animate-pulse'
                    : ''
              }`}
            >
              {engineState.discardTop ? (
                <PlayingCard card={engineState.discardTop} />
              ) : (
                <div className="w-16 h-24 rounded-xl border-2 border-dashed border-emerald-900/50 flex items-center justify-center text-[10px] text-emerald-600">
                  Empty
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Meld Status Badges (Pure Sequence & 2nd Sequence status) */}
        <div className="flex items-center gap-2.5 my-1.5 text-xs">
          <div
            className={`flex items-center gap-1.5 px-3 py-1 rounded-full border text-[11px] font-bold ${
              validation.pureSequenceFound
                ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                : 'bg-rose-500/20 text-rose-300 border-rose-500/40'
            }`}
          >
            <span className="material-symbols-outlined text-[14px]">
              {validation.pureSequenceFound ? 'check_circle' : 'cancel'}
            </span>
            <span>Pure Sequence</span>
          </div>

          <div
            className={`flex items-center gap-1.5 px-3 py-1 rounded-full border text-[11px] font-bold ${
              validation.secondSequenceFound
                ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                : 'bg-slate-800 text-slate-400 border-slate-700'
            }`}
          >
            <span className="material-symbols-outlined text-[14px]">
              {validation.secondSequenceFound ? 'check_circle' : 'pending'}
            </span>
            <span>2nd Sequence</span>
          </div>
        </div>

        {/* Player 13/14-Card Hand: Scrollable horizontal row / wrap that fits 360px phones */}
        <div className="w-full flex flex-col items-center gap-1.5">
          <div className="w-full flex items-center justify-between px-2 max-w-xl">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-300">
              Your Cards ({engineState.playerHand.length})
            </span>
            <div className="flex items-center gap-1.5">
              <button
                onClick={() => handleSortHand('suit')}
                className="text-[10px] font-bold text-secondary bg-surface-container px-2 py-0.5 rounded-full border border-outline-variant/30 hover:bg-surface-container-high"
              >
                Sort Suit
              </button>
              <button
                onClick={() => handleSortHand('rank')}
                className="text-[10px] font-bold text-slate-400 bg-surface-container px-2 py-0.5 rounded-full border border-outline-variant/30 hover:bg-surface-container-high"
              >
                Sort Rank
              </button>
            </div>
          </div>

          {/* Cards container: draggable & tap-to-select */}
          <div className="w-full overflow-x-auto pb-2 scrollbar-none flex items-center justify-start sm:justify-center gap-1 sm:gap-1.5 px-2 max-w-4xl min-h-[105px]">
            {engineState.playerHand.map((card, idx) => (
              <div
                key={card.id || idx}
                draggable
                onDragStart={() => handleDragStart(idx)}
                onDragOver={handleDragOver}
                onDrop={() => handleDrop(idx)}
                className="flex-shrink-0 cursor-grab active:cursor-grabbing transition-transform"
              >
                <PlayingCard
                  card={card}
                  selected={selectedIdx === idx}
                  onClick={() => {
                    audio.click();
                    setSelectedIdx(selectedIdx === idx ? null : idx);
                  }}
                />
              </div>
            ))}
          </div>
        </div>

        {/* Thumb Zone Controls: Discard & Declare */}
        <div className="w-full max-w-md pt-2 pb-1 border-t border-slate-800 flex items-center justify-center gap-2.5">
          <Button
            variant="primary"
            size="md"
            onClick={() => handleDiscard()}
            disabled={
              engineState.turn !== 'player' ||
              engineState.turnStep !== 'discard' ||
              selectedIdx === null ||
              engineState.isHandFinished
            }
            icon={<span className="material-symbols-outlined text-[18px]">publish</span>}
          >
            Discard
          </Button>

          <Button
            variant="gold"
            size="md"
            onClick={handleDeclare}
            disabled={
              engineState.turn !== 'player' ||
              engineState.playerHand.length < 13 ||
              engineState.isHandFinished
            }
            icon={<span className="material-symbols-outlined text-[18px]">verified</span>}
          >
            Declare Show
          </Button>
        </div>
      </div>

      {/* Declare Results Modal */}
      <Modal
        isOpen={showDeclareModal}
        onClose={() => setShowDeclareModal(false)}
        title="Rummy Declaration Result"
        maxWidth="sm"
      >
        <div className="p-4 text-center space-y-4">
          {declarationResult?.isValid ? (
            <div className="space-y-2">
              <span className="material-symbols-outlined text-emerald-400 text-5xl">emoji_events</span>
              <h3 className="text-lg font-black text-on-surface">
                {declarationResult.winner === 'player' ? 'Valid Show! You Won!' : 'Computer Declared Show!'}
              </h3>
              <p className="text-body-sm text-slate-300">
                {declarationResult.message}
              </p>
              <div className="p-3 bg-surface-container rounded-xl border border-outline-variant/30 text-xs">
                <div className="flex justify-between py-1">
                  <span>Your Penalty Points:</span>
                  <span className="font-mono font-bold text-amber-400">
                    {engineState.result?.winner === 'player' ? '0 pts' : `${engineState.result?.penalty || 80} pts`}
                  </span>
                </div>
                <div className="flex justify-between py-1">
                  <span>Cumulative Score:</span>
                  <span className="font-mono font-bold text-cyan-400">{engineState.totalScores.player} / {engineState.scoreLimit}</span>
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-2">
              <span className="material-symbols-outlined text-rose-500 text-5xl">warning</span>
              <h3 className="text-lg font-black text-on-surface">Invalid Declaration!</h3>
              <p className="text-body-sm text-rose-300">
                {declarationResult?.message || 'Hand does not satisfy pure sequence or group rules.'}
              </p>
            </div>
          )}

          <div className="flex items-center gap-2 pt-2">
            {declarationResult?.isValid ? (
              <Button variant="primary" size="md" onClick={nextRound} className="w-full">
                {engineState.isMatchFinished ? 'Start New Match' : 'Next Round'}
              </Button>
            ) : (
              <Button variant="surface" size="md" onClick={() => setShowDeclareModal(false)} className="w-full">
                Continue Round
              </Button>
            )}
          </div>
        </div>
      </Modal>

      {/* Cumulative Scoreboard Table Modal */}
      <Modal
        isOpen={showScoreTableModal}
        onClose={() => setShowScoreTableModal(false)}
        title="Match Score Table"
        maxWidth="md"
      >
        <div className="p-4 space-y-4">
          <div className="flex items-center justify-between text-xs text-slate-400 pb-2 border-b border-slate-700">
            <span>Score Limit: {engineState.scoreLimit} Points</span>
            <span>Current Round: {engineState.currentRound}</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs font-mono">
              <thead>
                <tr className="border-b border-slate-700 text-slate-400">
                  <th className="py-2">Round</th>
                  <th className="py-2">Winner</th>
                  <th className="py-2 text-right">You (Pts)</th>
                  <th className="py-2 text-right">Bot (Pts)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {engineState.roundHistory.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="py-4 text-center text-slate-500">
                      No completed rounds yet.
                    </td>
                  </tr>
                ) : (
                  engineState.roundHistory.map((r) => (
                    <tr key={r.round}>
                      <td className="py-2 text-slate-300">#{r.round}</td>
                      <td className="py-2 text-amber-400 font-bold uppercase">{r.winner}</td>
                      <td className="py-2 text-right text-cyan-400">{r.playerPenalty}</td>
                      <td className="py-2 text-right text-purple-400">{r.botPenalty}</td>
                    </tr>
                  ))
                )}
                <tr className="font-bold border-t border-slate-600 bg-surface-container">
                  <td className="py-2.5">Total</td>
                  <td className="py-2.5 text-slate-400">-</td>
                  <td className="py-2.5 text-right text-cyan-300 font-black">{engineState.totalScores.player}</td>
                  <td className="py-2.5 text-right text-purple-300 font-black">{engineState.totalScores.bot}</td>
                </tr>
              </tbody>
            </table>
          </div>

          <Button variant="primary" size="md" onClick={() => setShowScoreTableModal(false)} className="w-full">
            Back to Table
          </Button>
        </div>
      </Modal>
    </GameShell>
  );
};
