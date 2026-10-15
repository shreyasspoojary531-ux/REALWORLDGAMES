import { Suspense } from 'react';
import { Routes, Route } from 'react-router-dom';
import { Hub } from '@/features/hub/Hub';
import { GAMES } from '@/features/hub/registry';
import { GameErrorBoundary } from '@/components/game/GameErrorBoundary';

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Hub />} />

      {/* Register all games dynamically via the centralized registry */}
      {GAMES.map((game) => {
        const GameComponent = game.component;
        return (
          <Route
            key={game.id}
            path={`/games/${game.id}/*`}
            element={
              <GameErrorBoundary fallbackTitle={`${game.title} Error`}>
                <Suspense
                  fallback={
                    <div className="min-h-screen bg-surface flex flex-col items-center justify-center text-on-surface-variant gap-3">
                      <div className="w-10 h-10 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
                      <span className="font-label-sm text-label-sm uppercase tracking-widest text-outline">
                        Loading {game.title}...
                      </span>
                    </div>
                  }
                >
                  <GameComponent />
                </Suspense>
              </GameErrorBoundary>
            }
          />
        );
      })}

      {/* 404 Catch-all */}
      <Route
        path="*"
        element={
          <div className="min-h-screen bg-surface flex flex-col items-center justify-center text-on-surface p-4 text-center">
            <h1 className="font-display-hero text-display-hero mb-2 font-extrabold text-primary">404</h1>
            <p className="text-body-md text-on-surface-variant mb-6">Game or route not found in hub.</p>
            <a
              href="/"
              className="bg-primary text-on-primary font-bold px-6 py-2.5 rounded-full text-sm transition-all hover:bg-primary-fixed"
            >
              Return to Hub
            </a>
          </div>
        }
      />
    </Routes>
  );
}
