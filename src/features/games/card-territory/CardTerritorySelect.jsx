import { useState } from 'react';
import { CardTerritorySubGames } from './registry';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { useNavigate } from 'react-router-dom';

export const CardTerritorySelect = () => {
  const navigate = useNavigate();
  const [showRules, setShowRules] = useState(false);

  return (
    <div className="min-h-screen bg-surface text-on-surface flex flex-col antialiased">
      {/* 1. TOP HEADER */}
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
          <h1 className="font-headline-sm text-headline-sm text-on-surface font-bold tracking-tight flex items-center gap-2">
            <span className="material-symbols-outlined text-secondary text-[22px]">style</span>
            Card Territory
          </h1>
        </div>

        <button
          onClick={() => setShowRules(true)}
          className="w-12 h-12 flex items-center justify-center rounded-full text-on-surface-variant hover:text-secondary transition-colors"
          type="button"
          aria-label="Card Territory Rules"
        >
          <span className="material-symbols-outlined text-[22px]">help</span>
        </button>
      </header>

      {/* 2. MAIN REALM CONTENT */}
      <main className="flex-1 max-w-5xl mx-auto w-full px-gutter py-space-md space-y-space-md">
        {/* Clean Editorial Hero Banner */}
        <div className="relative w-full rounded-lg overflow-hidden bg-surface-container-low shadow-xl">
          <div className="relative w-full aspect-[16/9] sm:aspect-[21/9] overflow-hidden">
            <img
              src="/games/card-territory.webp"
              alt="Card Territory Astral Arena"
              className="w-full h-full object-cover select-none"
              loading="eager"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-surface-container-lowest via-surface-container-lowest/60 to-transparent" />
            <div className="absolute inset-0 bg-gradient-to-r from-surface-container-lowest/80 via-transparent to-transparent" />

            <div className="absolute bottom-4 left-4 right-4 flex flex-col gap-2 max-w-xl">
              <span className="px-2.5 py-0.5 rounded-full bg-primary-container/90 text-on-primary-container font-label-sm text-label-sm font-bold w-fit uppercase tracking-wider">
                Tactical Card Realm
              </span>
              <h2 className="font-headline-lg text-headline-lg text-on-surface font-extrabold tracking-tight leading-tight">
                Select Your Table
              </h2>
              <p className="font-body-md text-body-md text-on-surface-variant">
                Four card game variants featuring distinct rules, tactical decisions, and clean mechanics.
              </p>
            </div>
          </div>
        </div>

        {/* 3. SUBGAMES 2-COLUMN CATALOG GRID */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-space-md">
          {CardTerritorySubGames.map((game) => (
            <div
              key={game.id}
              className="bg-surface-container rounded-DEFAULT p-4 border border-outline-variant/30 flex flex-col justify-between shadow-md hover:border-secondary/40 transition-all duration-200"
            >
              <div className="space-y-3">
                <div className="relative w-full aspect-[16/9] rounded-lg overflow-hidden bg-surface-container-highest">
                  <img
                    src={game.thumbnail}
                    alt={game.title}
                    className="w-full h-full object-cover"
                    loading="lazy"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-surface-container-lowest/80 via-transparent to-transparent" />
                  <span className="absolute top-2 left-2 px-2 py-0.5 rounded-full bg-surface-container-lowest/80 backdrop-blur-sm text-secondary font-label-sm text-label-sm font-semibold">
                    {game.descriptor}
                  </span>
                </div>

                <div>
                  <h3 className="font-headline-sm text-headline-sm text-on-surface font-bold tracking-tight">
                    {game.title}
                  </h3>
                  <p className="font-body-sm text-body-sm text-on-surface-variant mt-1 line-clamp-2">
                    {game.description}
                  </p>
                </div>
              </div>

              <div className="pt-4 flex items-center justify-end">
                <Button
                  variant="primary"
                  size="md"
                  onClick={() => navigate(game.path)}
                  icon={<span className="material-symbols-outlined text-[18px]">play_arrow</span>}
                >
                  Play {game.title.split(' ')[0]}
                </Button>
              </div>
            </div>
          ))}
        </div>
      </main>

      {/* Rules Modal */}
      <Modal isOpen={showRules} onClose={() => setShowRules(false)} title="Card Territory Overview">
        <div className="space-y-3 text-body-sm text-on-surface-variant">
          <p>
            Card Territory bundles four standalone card disciplines:
          </p>
          <ul className="list-disc list-inside space-y-1.5 text-on-surface">
            <li><strong>Blackjack Vault:</strong> Hit, Stand, and Double Down against the dealer aiming for 21.</li>
            <li><strong>Poker Arena:</strong> Texas Hold’em single-table action with Flop, Turn, and River.</li>
            <li><strong>Rummy Market:</strong> Organize suited sequences and card sets to declare victory.</li>
            <li><strong>Uno Zone:</strong> Match colors, numbers, and manage action penalties.</li>
          </ul>
        </div>
      </Modal>
    </div>
  );
};
