import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { GAMES, CATEGORIES } from './registry';
import { CardTerritorySubGames } from '@/features/games/card-territory/registry';
import { useAppStore } from '@/app/store';
import { storage } from '@/lib/storage';
import { Button } from '@/components/ui/Button';

export const Hub = () => {
  const navigate = useNavigate();
  const { favorites, toggleFavorite } = useAppStore();
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [activeTab, setActiveTab] = useState('home');

  // Filter game catalog based on active category
  const catalogGames = useMemo(() => {
    if (selectedCategory === 'all') return GAMES;
    return GAMES.filter((g) => g.category === selectedCategory);
  }, [selectedCategory]);

  // Query real recent plays from typed storage wrapper
  const recentPlays = useMemo(() => {
    const rawRecents = storage.getRecentPlays();
    return rawRecents
      .map((entry) => {
        // Resolve either main game or card territory subgame
        const mainMatch = GAMES.find((g) => g.id === entry.gameId);
        if (mainMatch) {
          return {
            gameId: entry.gameId,
            title: mainMatch.title,
            thumbnail: mainMatch.thumbnail,
            category: mainMatch.category,
            path: `/games/${mainMatch.id}`,
            canResume: mainMatch.canResume,
            lastPlayedAt: entry.lastPlayedAt,
          };
        }
        const cardMatch = CardTerritorySubGames.find((g) => g.id === entry.gameId);
        if (cardMatch) {
          return {
            gameId: entry.gameId,
            title: cardMatch.title,
            thumbnail: cardMatch.thumbnail,
            category: 'cards',
            path: cardMatch.path,
            canResume: cardMatch.canResume,
            lastPlayedAt: entry.lastPlayedAt,
          };
        }
        return null;
      })
      .filter(Boolean)
      .slice(0, 5);
  }, []);

  const featuredGame = GAMES[0]; // Carrom Clash

  return (
    <div className="bg-surface text-on-surface font-body-md text-body-md min-h-screen flex flex-col antialiased selection:bg-primary-container selection:text-on-primary-container">
      {/* 1. FIXED TOP HEADER */}
      <header className="fixed top-0 left-0 right-0 z-50 pt-safe bg-surface/90 backdrop-blur-xl border-b border-surface-container-high shadow-md">
        <div className="h-16 px-gutter flex items-center justify-between gap-space-sm max-w-5xl mx-auto">
          {/* Logo Branding */}
          <div
            className="flex items-center gap-space-sm cursor-pointer select-none"
            onClick={() => navigate('/')}
          >
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-primary to-secondary flex items-center justify-center text-on-primary font-bold shadow-md shrink-0">
              <span className="material-symbols-outlined text-[20px]">sports_esports</span>
            </div>
            <div className="flex flex-col">
              <span className="font-headline-sm text-headline-sm text-on-surface font-extrabold tracking-tight leading-none">
                ArcadePulse
              </span>
              <span className="font-label-sm text-label-sm text-secondary uppercase tracking-wider mt-0.5">
                Game Hub
              </span>
            </div>
          </div>

          {/* Action icon buttons */}
          <div className="flex items-center gap-1">
            <button
              aria-label="Search games catalog"
              className="w-12 h-12 flex items-center justify-center rounded-full text-on-surface-variant hover:text-secondary hover:bg-surface-container/60 transition-colors"
              type="button"
              onClick={() => {
                const el = document.getElementById('catalog-section');
                el?.scrollIntoView({ behavior: 'smooth' });
              }}
            >
              <span className="material-symbols-outlined text-[22px]">search</span>
            </button>
            <button
              aria-label="Settings and options"
              className="w-12 h-12 flex items-center justify-center rounded-full text-on-surface-variant hover:text-secondary hover:bg-surface-container/60 transition-colors"
              type="button"
              onClick={() => setActiveTab('settings')}
            >
              <span className="material-symbols-outlined text-[22px]">settings</span>
            </button>
          </div>
        </div>
      </header>

      {/* 2. MAIN HUB STREAM */}
      <main className="flex-1 flex flex-col w-full pt-20 pb-28 max-w-5xl mx-auto px-gutter space-y-space-md">
        {/* HERO SHOWCASE: FEATURED GAME */}
        <section className="pt-2">
          <div className="relative w-full rounded-lg overflow-hidden bg-surface-container-low shadow-xl">
            <div className="relative w-full aspect-[16/10] sm:aspect-[21/9] overflow-hidden">
              <img
                className="w-full h-full object-cover select-none"
                alt={featuredGame.title}
                src={featuredGame.thumbnail}
                loading="eager"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-surface-container-lowest via-surface-container-lowest/60 to-transparent" />
              <div className="absolute inset-0 bg-gradient-to-r from-surface-container-lowest/80 via-transparent to-transparent" />

              {/* Badges on Hero */}
              <div className="absolute top-3 left-3 right-3 flex items-center justify-between">
                <span className="px-2.5 py-1 rounded-full bg-surface-container-lowest/80 backdrop-blur-md text-secondary font-label-sm text-label-sm font-bold uppercase tracking-wider">
                  Featured Game
                </span>
                <span className="px-2.5 py-1 rounded-full bg-surface-container-lowest/80 backdrop-blur-md text-on-surface font-label-sm text-label-sm font-semibold flex items-center gap-1">
                  <span className="material-symbols-outlined text-tertiary text-[16px]">verified</span>
                  60 FPS
                </span>
              </div>

              {/* Hero Overlay Content */}
              <div className="absolute bottom-4 left-4 right-4 flex flex-col gap-2 max-w-xl">
                <div>
                  <span className="px-2 py-0.5 rounded-full bg-secondary/20 text-secondary font-label-sm text-label-sm font-bold uppercase tracking-wider">
                    {featuredGame.category}
                  </span>
                  <h2 className="font-headline-lg-mobile sm:font-headline-lg text-headline-lg-mobile sm:text-headline-lg text-on-surface font-extrabold tracking-tight leading-tight mt-1">
                    {featuredGame.title}
                  </h2>
                  <p className="font-body-sm sm:font-body-md text-body-sm sm:text-body-md text-on-surface-variant line-clamp-2 mt-0.5">
                    {featuredGame.description}
                  </p>
                </div>

                <div className="flex items-center gap-2 pt-1">
                  <Button
                    variant="primary"
                    size="md"
                    onClick={() => navigate(`/games/${featuredGame.id}`)}
                    icon={<span className="material-symbols-outlined text-[20px]">sports_esports</span>}
                  >
                    Play Now
                  </Button>
                  <button
                    aria-label={favorites.includes(featuredGame.id) ? 'Remove bookmark' : 'Bookmark game'}
                    onClick={() => toggleFavorite(featuredGame.id)}
                    className={`w-12 h-12 rounded-full bg-surface-container-highest/80 backdrop-blur-md flex items-center justify-center transition-colors ${
                      favorites.includes(featuredGame.id) ? 'text-secondary' : 'text-on-surface'
                    }`}
                    type="button"
                  >
                    <span className="material-symbols-outlined text-[22px]">
                      {favorites.includes(featuredGame.id) ? 'bookmark_added' : 'bookmark_add'}
                    </span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* 3. CONTINUE PLAYING (RENDERED ONLY IF USER HAS REAL RECENT PLAYS) */}
        {recentPlays.length > 0 && (
          <section className="flex flex-col gap-space-xs pt-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <span className="material-symbols-outlined text-secondary text-[20px]">history</span>
                <h2 className="font-headline-sm text-headline-sm text-on-surface font-bold tracking-tight">
                  Continue Playing
                </h2>
              </div>
              <span className="font-label-sm text-label-sm text-outline">
                {recentPlays.length} Recent
              </span>
            </div>

            <div className="flex gap-3 overflow-x-auto no-scrollbar snap-x snap-mandatory pt-1 pb-2">
              {recentPlays.map((item) => (
                <div
                  key={item.gameId}
                  className="snap-start shrink-0 w-[240px] rounded-DEFAULT bg-surface-container p-2.5 flex flex-col gap-2 shadow-md border border-outline-variant/30"
                >
                  <div className="relative w-full h-28 rounded-lg overflow-hidden bg-surface-container-highest">
                    <img
                      src={item.thumbnail}
                      alt={item.title}
                      className="w-full h-full object-cover"
                      loading="lazy"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-surface-container-lowest/80 via-transparent to-transparent" />
                    <span className="absolute top-2 left-2 px-2 py-0.5 rounded-full bg-surface-container-lowest/80 backdrop-blur-sm text-secondary font-label-sm text-label-sm uppercase font-semibold">
                      {item.category}
                    </span>
                    <button
                      onClick={() => navigate(item.path)}
                      aria-label={`${item.canResume ? 'Continue' : 'Play again'} ${item.title}`}
                      className="absolute bottom-2 right-2 w-9 h-9 rounded-full bg-primary text-on-primary flex items-center justify-center shadow-lg active:scale-90 transition-transform"
                      type="button"
                    >
                      <span className="material-symbols-outlined text-[20px]">play_arrow</span>
                    </button>
                  </div>
                  <div className="flex flex-col min-w-0">
                    <h3 className="font-headline-sm text-headline-sm text-on-surface truncate">
                      {item.title}
                    </h3>
                    <span className="font-body-sm text-body-sm text-tertiary font-semibold mt-0.5">
                      {item.canResume ? 'Continue' : 'Play again'}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* 4. CATEGORY FILTER CHIPS */}
        <section className="pt-2">
          <div className="flex gap-2 overflow-x-auto no-scrollbar">
            {CATEGORIES.map((cat) => {
              const count = cat.id === 'all' ? GAMES.length : GAMES.filter((g) => g.category === cat.id).length;
              return (
                <button
                  key={cat.id}
                  onClick={() => setSelectedCategory(cat.id)}
                  className={`shrink-0 min-h-[48px] px-4 py-2 rounded-full font-label-md text-label-md flex items-center gap-2 transition-all active:scale-95 ${
                    selectedCategory === cat.id
                      ? 'bg-primary text-on-primary shadow-md'
                      : 'bg-surface-container text-on-surface-variant hover:text-on-surface hover:bg-surface-container-high'
                  }`}
                  type="button"
                >
                  <span className="material-symbols-outlined text-[18px]">{cat.iconName}</span>
                  <span>{cat.label}</span>
                  <span className="ml-0.5 px-2 py-0.5 rounded-full bg-surface-container-highest/80 text-on-surface font-label-sm text-label-sm font-bold">
                    {count}
                  </span>
                </button>
              );
            })}
          </div>
        </section>

        {/* 5. CARD TERRITORY REALM SHOWCASE */}
        <section className="pt-2">
          <div className="relative w-full rounded-lg overflow-hidden bg-surface-container-high shadow-xl border border-outline-variant/30">
            <div className="relative w-full aspect-[16/9] sm:aspect-[21/9] overflow-hidden">
              <img
                className="w-full h-full object-cover"
                alt="Card Territory Astral Arena"
                src="/games/card-territory.webp"
                loading="lazy"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-surface-container-highest via-surface-container-highest/60 to-transparent" />
              <div className="absolute inset-0 bg-gradient-to-r from-surface-container-highest/80 via-transparent to-transparent" />

              <div className="absolute top-3 left-3 flex items-center gap-2">
                <span className="px-2.5 py-1 rounded-full bg-primary-container text-on-primary-container font-label-sm text-label-sm uppercase tracking-wider font-bold flex items-center gap-1">
                  <span className="material-symbols-outlined text-[16px]">style</span>
                  Card Territory
                </span>
              </div>
            </div>

            <div className="p-4 bg-surface-container-highest flex flex-col gap-3">
              <div>
                <h2 className="font-headline-md text-headline-md text-on-surface font-extrabold tracking-tight">
                  The Tactical Card Realm
                </h2>
                <p className="font-body-sm text-body-sm text-on-surface-variant mt-1">
                  Enter the card hub: Blackjack Vault, Poker Arena, Rummy Market, and Uno Zone.
                </p>
              </div>

              {/* Subgame cards with real previews and no emoji */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {CardTerritorySubGames.map((sub) => (
                  <div
                    key={sub.id}
                    onClick={() => navigate(sub.path)}
                    className="p-2 rounded-DEFAULT bg-surface-container flex flex-col items-center text-center gap-1 cursor-pointer hover:bg-surface-bright transition-colors"
                  >
                    <div className="w-12 h-12 rounded-lg overflow-hidden bg-surface-container-highest mb-1">
                      <img src={sub.thumbnail} alt={sub.title} className="w-full h-full object-cover" />
                    </div>
                    <span className="font-label-sm text-label-sm text-on-surface font-bold truncate w-full">
                      {sub.title}
                    </span>
                    <span className="font-body-sm text-body-sm text-outline text-[10px]">
                      {sub.descriptor}
                    </span>
                  </div>
                ))}
              </div>

              <Button
                variant="secondary"
                size="md"
                onClick={() => navigate('/games/card-territory')}
                icon={<span className="material-symbols-outlined text-[20px]">arrow_forward</span>}
              >
                Enter Realm
              </Button>
            </div>
          </div>
        </section>

        {/* 6. ALL GAMES CATALOG GRID */}
        <section id="catalog-section" className="pt-2 flex flex-col gap-space-xs">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <span className="material-symbols-outlined text-secondary text-[20px]">grid_view</span>
              <h2 className="font-headline-sm text-headline-sm text-on-surface font-bold tracking-tight">
                Game Catalog
              </h2>
            </div>
            <span className="font-label-sm text-label-sm text-outline">
              Showing {catalogGames.length}
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
            {catalogGames.map((game) => (
              <div
                key={game.id}
                className="rounded-DEFAULT bg-surface-container p-3 flex flex-col justify-between gap-3 shadow-md border border-outline-variant/30 hover:border-secondary/40 transition-colors"
              >
                <div className="flex flex-col gap-2">
                  <div className="relative w-full aspect-[4/3] rounded-lg overflow-hidden bg-surface-container-highest">
                    <img
                      src={game.thumbnail}
                      alt={game.title}
                      className="w-full h-full object-cover"
                      loading="lazy"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-surface-container-lowest/80 via-transparent to-transparent" />
                    <span className="absolute top-2 left-2 px-2 py-0.5 rounded-full bg-surface-container-lowest/80 backdrop-blur-sm text-secondary font-label-sm text-label-sm font-semibold uppercase">
                      {game.category}
                    </span>
                  </div>

                  <div>
                    <h3 className="font-headline-sm text-headline-sm text-on-surface font-bold truncate">
                      {game.title}
                    </h3>
                    <p className="font-body-sm text-body-sm text-on-surface-variant line-clamp-2 mt-0.5">
                      {game.description}
                    </p>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-1 border-t border-surface-container-highest">
                  <span className="text-xs text-outline uppercase font-semibold">
                    {game.badge}
                  </span>
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={() => navigate(`/games/${game.id}`)}
                    icon={<span className="material-symbols-outlined text-[18px]">play_arrow</span>}
                  >
                    Launch
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* 7. REFINED EDITORIAL FOOTER */}
        <footer className="pt-6 pb-2 text-center text-body-sm text-outline border-t border-surface-container-high">
          ArcadePulse Game Hub · All games playable in-engine
        </footer>
      </main>

      {/* 3. FIXED BOTTOM NAVIGATION BAR */}
      <nav className="fixed bottom-0 left-0 right-0 z-50 pb-safe bg-surface/90 backdrop-blur-xl border-t border-surface-container-high shadow-lg">
        <div className="flex items-center justify-around h-16 max-w-lg mx-auto px-space-xs">
          <button
            onClick={() => setActiveTab('home')}
            className={`relative flex flex-col items-center justify-center w-14 h-12 min-w-[48px] min-h-[48px] transition-colors ${
              activeTab === 'home' ? 'text-secondary' : 'text-on-surface-variant hover:text-on-surface'
            }`}
          >
            <span className="material-symbols-outlined text-[22px]">sports_esports</span>
            <span className="font-label-sm text-label-sm mt-0.5">Home</span>
            {activeTab === 'home' && (
              <span className="absolute -top-1 w-6 h-0.5 rounded-full bg-secondary" />
            )}
          </button>

          <button
            onClick={() => {
              setActiveTab('games');
              const el = document.getElementById('catalog-section');
              el?.scrollIntoView({ behavior: 'smooth' });
            }}
            className={`relative flex flex-col items-center justify-center w-14 h-12 min-w-[48px] min-h-[48px] transition-colors ${
              activeTab === 'games' ? 'text-secondary' : 'text-on-surface-variant hover:text-on-surface'
            }`}
          >
            <span className="material-symbols-outlined text-[22px]">grid_view</span>
            <span className="font-label-sm text-label-sm mt-0.5">Games</span>
            {activeTab === 'games' && (
              <span className="absolute -top-1 w-6 h-0.5 rounded-full bg-secondary" />
            )}
          </button>

          <button
            onClick={() => {
              setActiveTab('cards');
              navigate('/games/card-territory');
            }}
            className={`relative flex flex-col items-center justify-center w-14 h-12 min-w-[48px] min-h-[48px] transition-colors ${
              activeTab === 'cards' ? 'text-secondary' : 'text-on-surface-variant hover:text-on-surface'
            }`}
          >
            <span className="material-symbols-outlined text-[22px]">style</span>
            <span className="font-label-sm text-label-sm mt-0.5">Cards</span>
            {activeTab === 'cards' && (
              <span className="absolute -top-1 w-6 h-0.5 rounded-full bg-secondary" />
            )}
          </button>
        </div>
      </nav>
    </div>
  );
};
