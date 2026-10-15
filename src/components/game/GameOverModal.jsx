import { useEffect } from 'react';
import confetti from 'canvas-confetti';
import { Button } from '@/components/ui/Button';

export const GameOverModal = ({ isOpen, won, score, highScore, message, onRestart, onExit }) => {
  useEffect(() => {
    if (isOpen && won) {
      try {
        confetti({
          particleCount: 60,
          spread: 60,
          origin: { y: 0.6 },
        });
      } catch {
        // graceful fallback
      }
    }
  }, [isOpen, won]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-surface-container-lowest/80 backdrop-blur-md">
      <div className="bg-surface-container border border-outline-variant/30 rounded-DEFAULT p-6 sm:p-8 max-w-sm w-full text-center shadow-2xl space-y-4">
        <div className="w-14 h-14 mx-auto rounded-full flex items-center justify-center bg-surface-container-highest text-secondary shadow-md border border-outline-variant/30">
          <span className="material-symbols-outlined text-[32px]">
            {won ? 'emoji_events' : 'sports_score'}
          </span>
        </div>

        <div>
          <h2 className="font-headline-md text-headline-md font-extrabold text-on-surface">
            {won ? 'Match Won' : 'Match Finished'}
          </h2>
          <p className="text-body-sm text-on-surface-variant mt-1">
            {message || (won ? 'Well played!' : 'Good attempt.')}
          </p>
        </div>

        <div className="bg-surface-container-low rounded-DEFAULT p-3 border border-outline-variant/20 grid grid-cols-2 gap-3">
          <div>
            <div className="text-[11px] text-outline uppercase font-semibold">
              Final Score
            </div>
            <div className="font-headline-sm font-bold text-on-surface font-mono mt-0.5">{score ?? 0}</div>
          </div>
          <div>
            <div className="text-[11px] text-outline uppercase font-semibold">
              High Score
            </div>
            <div className="font-headline-sm font-bold text-secondary font-mono mt-0.5">
              {highScore ?? 0}
            </div>
          </div>
        </div>

        <div className="pt-2 flex flex-col gap-2">
          {onRestart && (
            <Button
              variant="primary"
              size="md"
              icon={<span className="material-symbols-outlined text-[20px]">refresh</span>}
              onClick={onRestart}
            >
              Play Again
            </Button>
          )}
          {onExit && (
            <Button
              variant="surface"
              size="md"
              icon={<span className="material-symbols-outlined text-[20px]">arrow_back</span>}
              onClick={onExit}
            >
              Return to Hub
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};
