import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { useAppStore } from '@/app/store';
import { storage } from '@/lib/storage';

export const GameShell = ({
  gameId,
  title,
  category,
  accentColor = '#4cd7f6',
  rules = [],
  controls = {},
  tips = [],
  howToPlay = null,
  score,
  highScore,
  turnIndicator,
  timer,
  onRestart,
  isPaused,
  onTogglePause,
  children,
}) => {
  const navigate = useNavigate();
  const { settings, updateSettings } = useAppStore();
  const [showHelp, setShowHelp] = useState(false);
  const [activeHelpTab, setActiveHelpTab] = useState('rules');
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Auto-show How to Play on first launch
  useEffect(() => {
    if (gameId && !storage.hasSeenHelp(gameId)) {
      setShowHelp(true);
      storage.setSeenHelp(gameId);
    }
  }, [gameId]);

  useEffect(() => {
    const handleKey = (e) => {
      if (e.key === 'Escape') {
        if (showHelp) {
          setShowHelp(false);
        } else if (onTogglePause) {
          onTogglePause();
        }
      } else if (e.key === 'm' || e.key === 'M') {
        if (!e.target.matches('input, textarea')) {
          updateSettings({ soundEnabled: !settings.soundEnabled });
        }
      }
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [showHelp, onTogglePause, settings.soundEnabled, updateSettings]);

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {});
      setIsFullscreen(true);
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen().catch(() => {});
      }
      setIsFullscreen(false);
    }
  };

  const resolvedHowToPlay = howToPlay || {
    goal: 'Compete, score points, and outsmart your opponent or beat your high score.',
    rules: rules,
    controls: controls,
    scoring: 'Score points by completing objectives, winning hands, or clearing boards.',
    winLose: 'Win by achieving the primary objective; defeat occurs if you run out of moves or resources.',
    tips: tips,
  };

  return (
    <div className="flex flex-col min-h-screen bg-surface text-on-surface select-none antialiased touch-pan-x touch-pan-y">
      {/* Top Game HUD Bar */}
      <header className="h-16 border-b border-surface-container-high bg-surface/90 backdrop-blur-xl px-gutter flex items-center justify-between sticky top-0 z-40 max-w-5xl mx-auto w-full">
        <div className="flex items-center gap-space-sm">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate('/')}
            icon={<span className="material-symbols-outlined text-[20px]">arrow_back</span>}
            aria-label="Back to Hub"
          >
            Hub
          </Button>
          <div className="h-4 w-px bg-outline-variant/40" />
          <div className="flex items-center gap-2">
            <span
              className="w-2.5 h-2.5 rounded-full inline-block"
              style={{ backgroundColor: accentColor }}
            />
            <h1 className="font-headline-sm text-headline-sm text-on-surface font-bold tracking-tight">
              {title}
            </h1>
            {category && (
              <span className="hidden sm:inline-block text-[10px] font-bold uppercase tracking-wider text-secondary bg-surface-container px-2 py-0.5 rounded-full border border-outline-variant/30">
                {category}
              </span>
            )}
          </div>
        </div>

        {/* Center Live HUD (Score / Turn / Timer) */}
        <div className="flex items-center gap-2.5 text-body-sm">
          {turnIndicator && (
            <div className="flex items-center gap-1.5 bg-surface-container-high px-3 py-1 rounded-full border border-outline-variant/40 shadow-sm animate-fadeIn">
              <span className="w-2 h-2 rounded-full bg-secondary animate-pulse" />
              <span className="text-xs font-bold text-on-surface">{turnIndicator}</span>
            </div>
          )}

          {timer !== undefined && (
            <div className="flex items-center gap-1 bg-surface-container px-2.5 py-1 rounded-full border border-outline-variant/30 font-mono text-xs text-on-surface font-bold">
              <span className="material-symbols-outlined text-[14px] text-secondary">schedule</span>
              <span>{timer}</span>
            </div>
          )}

          {score !== undefined && (
            <div className="flex items-center gap-1.5 bg-surface-container px-3 py-1 rounded-full border border-outline-variant/30">
              <span className="text-on-surface-variant text-xs">Score:</span>
              <span className="font-bold text-on-surface font-mono">{score}</span>
            </div>
          )}

          {highScore !== undefined && (
            <div className="hidden sm:flex items-center gap-1.5 bg-surface-container-low px-3 py-1 rounded-full border border-outline-variant/20">
              <span className="text-outline text-xs">Best:</span>
              <span className="font-bold text-secondary font-mono">{highScore}</span>
            </div>
          )}
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-1">
          {onTogglePause && (
            <button
              onClick={onTogglePause}
              aria-label={isPaused ? 'Resume game' : 'Pause game'}
              className="w-12 h-12 flex items-center justify-center rounded-full text-on-surface-variant hover:text-on-surface hover:bg-surface-container/60 transition-colors"
              type="button"
            >
              <span className="material-symbols-outlined text-[22px]">
                {isPaused ? 'play_arrow' : 'pause'}
              </span>
            </button>
          )}
          <button
            onClick={() => updateSettings({ soundEnabled: !settings.soundEnabled })}
            aria-label={settings.soundEnabled ? 'Mute sound' : 'Unmute sound'}
            className="w-12 h-12 flex items-center justify-center rounded-full text-on-surface-variant hover:text-on-surface hover:bg-surface-container/60 transition-colors"
            type="button"
          >
            <span className="material-symbols-outlined text-[22px]">
              {settings.soundEnabled ? 'volume_up' : 'volume_off'}
            </span>
          </button>
          <button
            onClick={() => setShowHelp(true)}
            aria-label="How to play"
            className="w-12 h-12 flex items-center justify-center rounded-full text-on-surface-variant hover:text-on-surface hover:bg-surface-container/60 transition-colors"
            type="button"
          >
            <span className="material-symbols-outlined text-[22px]">help</span>
          </button>
          <button
            onClick={toggleFullscreen}
            aria-label={isFullscreen ? 'Exit fullscreen' : 'Enter fullscreen'}
            className="w-12 h-12 hidden sm:flex items-center justify-center rounded-full text-on-surface-variant hover:text-on-surface hover:bg-surface-container/60 transition-colors"
            type="button"
          >
            <span className="material-symbols-outlined text-[22px]">
              {isFullscreen ? 'fullscreen_exit' : 'fullscreen'}
            </span>
          </button>
        </div>
      </header>

      {/* Main Game Stage */}
      <main className="flex-1 flex flex-col relative overflow-hidden bg-surface overscroll-none select-none">
        {children}
      </main>

      {/* Pause Modal */}
      {isPaused && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-surface-container-lowest/80 backdrop-blur-md">
          <div className="bg-surface-container border border-outline-variant/30 rounded-DEFAULT p-6 sm:p-8 max-w-sm w-full text-center shadow-2xl space-y-4">
            <h2 className="font-headline-md text-headline-md font-bold text-on-surface">Game Paused</h2>
            <p className="text-body-sm text-on-surface-variant">Your match progress is saved.</p>
            <div className="pt-2 flex flex-col gap-2.5">
              <Button
                variant="primary"
                size="md"
                onClick={onTogglePause}
                icon={<span className="material-symbols-outlined text-[20px]">play_arrow</span>}
              >
                Resume Match
              </Button>
              {onRestart && (
                <Button
                  variant="surface"
                  size="md"
                  onClick={() => {
                    onTogglePause();
                    onRestart();
                  }}
                  icon={<span className="material-symbols-outlined text-[20px]">refresh</span>}
                >
                  Restart
                </Button>
              )}
              <Button
                variant="surface"
                size="md"
                onClick={() => {
                  setShowHelp(true);
                }}
                icon={<span className="material-symbols-outlined text-[20px]">help</span>}
              >
                How to Play
              </Button>
              <div className="flex items-center justify-between px-3 py-2 bg-surface rounded-lg border border-outline-variant/30 text-xs text-on-surface-variant">
                <span>Low Graphics (2.5D)</span>
                <input
                  type="checkbox"
                  checked={Boolean(settings.lowGraphics)}
                  onChange={(e) => updateSettings({ lowGraphics: e.target.checked })}
                  className="accent-secondary w-4 h-4 cursor-pointer"
                />
              </div>
              <Button variant="ghost" size="md" onClick={() => navigate('/')}>
                Exit to Hub
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* How to Play Modal with comprehensive sections */}
      <Modal
        isOpen={showHelp}
        onClose={() => setShowHelp(false)}
        title={`How to Play ${title}`}
        maxWidth="lg"
      >
        <div className="space-y-4 text-body-sm text-on-surface-variant">
          {/* Navigation Tabs */}
          <div className="flex items-center gap-1.5 border-b border-outline-variant/30 pb-2 overflow-x-auto">
            {['rules', 'controls', 'scoring', 'tips'].map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveHelpTab(tab)}
                className={`px-3 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider transition-colors ${
                  activeHelpTab === tab
                    ? 'bg-secondary text-surface shadow'
                    : 'text-on-surface-variant hover:text-on-surface hover:bg-surface-container'
                }`}
              >
                {tab}
              </button>
            ))}
          </div>

          {/* Goal & Rules */}
          {activeHelpTab === 'rules' && (
            <div className="space-y-3">
              <div className="bg-surface-container p-3 rounded-lg border border-outline-variant/20">
                <span className="text-xs font-bold uppercase text-secondary block mb-1">Goal</span>
                <p className="text-on-surface text-sm leading-relaxed">{resolvedHowToPlay.goal}</p>
              </div>

              <div>
                <span className="text-xs font-bold uppercase text-on-surface-variant block mb-1.5">
                  Official Rules
                </span>
                <ul className="space-y-1.5 list-disc list-inside text-on-surface text-xs leading-relaxed">
                  {(Array.isArray(resolvedHowToPlay.rules) ? resolvedHowToPlay.rules : []).map(
                    (rule, idx) => (
                      <li key={idx}>{rule}</li>
                    )
                  )}
                </ul>
              </div>

              {resolvedHowToPlay.winLose && (
                <div className="bg-surface-container-low p-2.5 rounded-lg border border-outline-variant/20 text-xs">
                  <span className="font-bold text-on-surface block mb-0.5">Win / Loss Conditions:</span>
                  <p className="text-on-surface-variant">{resolvedHowToPlay.winLose}</p>
                </div>
              )}
            </div>
          )}

          {/* Controls */}
          {activeHelpTab === 'controls' && (
            <div className="space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 bg-surface-container p-3 rounded-DEFAULT border border-outline-variant/30 text-xs">
                {resolvedHowToPlay.controls?.touch || resolvedHowToPlay.controls?.mouse ? (
                  <div>
                    <div className="font-bold text-secondary mb-1 flex items-center gap-1">
                      <span className="material-symbols-outlined text-[16px]">touch_app</span>
                      <span>Mobile Touch / Gestures</span>
                    </div>
                    {(resolvedHowToPlay.controls.touch || resolvedHowToPlay.controls.mouse).map(
                      (c, i) => (
                        <div key={i} className="text-on-surface-variant py-0.5">
                          • {c}
                        </div>
                      )
                    )}
                  </div>
                ) : null}

                {resolvedHowToPlay.controls?.keyboard && (
                  <div>
                    <div className="font-bold text-primary mb-1 flex items-center gap-1">
                      <span className="material-symbols-outlined text-[16px]">keyboard</span>
                      <span>Desktop Keyboard</span>
                    </div>
                    {resolvedHowToPlay.controls.keyboard.map((c, i) => (
                      <div key={i} className="text-on-surface-variant py-0.5">
                        • {c}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Scoring */}
          {activeHelpTab === 'scoring' && (
            <div className="space-y-3">
              <div className="bg-surface-container p-3 rounded-lg border border-outline-variant/20 text-xs leading-relaxed">
                <span className="font-bold text-secondary uppercase block mb-1">Scoring System</span>
                <p className="text-on-surface">{resolvedHowToPlay.scoring}</p>
              </div>
            </div>
          )}

          {/* Strategy Tips */}
          {activeHelpTab === 'tips' && (
            <div className="space-y-2">
              <span className="text-xs font-bold uppercase text-tertiary block mb-1">
                Pro Strategy Tips
              </span>
              <ul className="space-y-1.5 list-disc list-inside text-on-surface text-xs leading-relaxed">
                {(Array.isArray(resolvedHowToPlay.tips) ? resolvedHowToPlay.tips : []).map(
                  (tip, idx) => (
                    <li key={idx}>{tip}</li>
                  )
                )}
              </ul>
            </div>
          )}

          <div className="pt-2 flex justify-end">
            <Button variant="primary" size="sm" onClick={() => setShowHelp(false)}>
              Ready to Play
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};
