import { create } from 'zustand';
import { storage, defaultSettings } from '@/lib/storage';

export const useAppStore = create((set, get) => ({
  settings: typeof window !== 'undefined' ? storage.getSettings() : defaultSettings,
  favorites: typeof window !== 'undefined' ? storage.getFavorites() : [],
  vault: typeof window !== 'undefined' ? storage.getVault() : storage.getVault(),

  updateSettings: (partial) => {
    const updated = { ...get().settings, ...partial };
    set({ settings: updated });
    storage.saveSettings(updated);

    if (partial.theme) {
      if (partial.theme === 'dark') {
        document.documentElement.classList.add('dark');
        document.documentElement.classList.remove('light');
      } else if (partial.theme === 'light') {
        document.documentElement.classList.add('light');
        document.documentElement.classList.remove('dark');
      } else {
        const isDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
        document.documentElement.classList.toggle('dark', isDark);
        document.documentElement.classList.toggle('light', !isDark);
      }
    }
  },

  toggleFavorite: (gameId) => {
    const { favorites } = get();
    const updated = favorites.includes(gameId)
      ? favorites.filter((id) => id !== gameId)
      : [...favorites, gameId];
    set({ favorites: updated });
    storage.saveFavorites(updated);
  },

  updateVault: (updater) => {
    const updated = updater(get().vault);
    set({ vault: updated });
    storage.saveVault(updated);
  },

  refillVaultCoins: () => {
    const updated = {
      ...get().vault,
      coins: Math.max(get().vault.coins, 1000),
    };
    set({ vault: updated });
    storage.saveVault(updated);
  },
}));
