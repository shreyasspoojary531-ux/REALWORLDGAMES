const STORAGE_KEYS = {
  SETTINGS: 'rwg_settings_v2',
  FAVORITES: 'rwg_favorites_v2',
  STATS: 'rwg_stats_v2',
  RECENT_GAMES: 'rwg_recent_games_v2',
  RESUME_DATA: 'rwg_resume_data_v2',
  SEEN_HELP: 'rwg_seen_help_v2',
  VAULT: 'cardTerritoryVault', // compatible with legacy games
};

export const defaultSettings = {
  theme: 'dark',
  soundEnabled: true,
  hapticsEnabled: true,
  reducedMotion: false,
  lowGraphics: false,
};

export const defaultVault = {
  coins: 1000,
  gems: 10,
  name: `Player_${Math.floor(1000 + Math.random() * 9000)}`,
  lifetimeWinnings: 0,
  games: {},
};

export const storage = {
  getSettings() {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.SETTINGS);
      return data ? { ...defaultSettings, ...JSON.parse(data) } : defaultSettings;
    } catch {
      return defaultSettings;
    }
  },

  saveSettings(settings) {
    try {
      localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(settings));
    } catch (e) {
      console.warn('Failed to save settings to localStorage', e);
    }
  },

  getFavorites() {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.FAVORITES);
      return data ? JSON.parse(data) : ['carrom', 'chess', 'card-territory'];
    } catch {
      return ['carrom', 'chess', 'card-territory'];
    }
  },

  saveFavorites(favorites) {
    try {
      localStorage.setItem(STORAGE_KEYS.FAVORITES, JSON.stringify(favorites));
    } catch (e) {
      console.warn('Failed to save favorites to localStorage', e);
    }
  },

  getStats(gameId) {
    try {
      const data = localStorage.getItem(`${STORAGE_KEYS.STATS}_${gameId}`);
      return data ? JSON.parse(data) : { played: 0, won: 0, highScore: 0 };
    } catch {
      return { played: 0, won: 0, highScore: 0 };
    }
  },

  recordGameEnd(gameId, won, score, timeSeconds) {
    try {
      const current = this.getStats(gameId);
      const updated = {
        played: current.played + 1,
        won: current.won + (won ? 1 : 0),
        highScore: Math.max(current.highScore, score || 0),
        bestTime:
          won && timeSeconds
            ? current.bestTime
              ? Math.min(current.bestTime, timeSeconds)
              : timeSeconds
            : current.bestTime,
        lastPlayed: Date.now(),
      };
      localStorage.setItem(`${STORAGE_KEYS.STATS}_${gameId}`, JSON.stringify(updated));

      // Record in recent games
      this.recordRecentPlay(gameId);

      // When game finishes, clear resumable in-progress state
      this.clearResumeData(gameId);
    } catch (e) {
      console.warn(`Failed to record stats for ${gameId}`, e);
    }
  },

  getVault() {
    try {
      const raw = localStorage.getItem(STORAGE_KEYS.VAULT);
      if (!raw) {
        this.saveVault(defaultVault);
        return defaultVault;
      }
      return { ...defaultVault, ...JSON.parse(raw) };
    } catch {
      return defaultVault;
    }
  },

  saveVault(vault) {
    try {
      localStorage.setItem(STORAGE_KEYS.VAULT, JSON.stringify(vault));
    } catch (e) {
      console.warn('Failed to save vault to localStorage', e);
    }
  },

  // --------------------------------------------------------------------------
  // CONTINUE PLAYING & RESUME MANAGEMENT
  // --------------------------------------------------------------------------

  getRecentPlays() {
    try {
      const raw = localStorage.getItem(STORAGE_KEYS.RECENT_GAMES);
      if (!raw) return [];
      const parsed = JSON.parse(raw);
      if (!Array.isArray(parsed)) return [];

      // Validate entries and sort newest first, max 5, deduplicated
      const valid = parsed
        .filter((item) => item && typeof item === 'object' && typeof item.gameId === 'string')
        .sort((a, b) => (b.lastPlayedAt || 0) - (a.lastPlayedAt || 0));

      const seen = new Set();
      const deduped = [];
      for (const entry of valid) {
        if (!seen.has(entry.gameId)) {
          seen.add(entry.gameId);
          deduped.push(entry);
        }
        if (deduped.length >= 5) break;
      }
      return deduped;
    } catch {
      return [];
    }
  },

  recordRecentPlay(gameId) {
    if (!gameId || typeof gameId !== 'string') return;
    try {
      const recents = this.getRecentPlays();
      const filtered = recents.filter((r) => r.gameId !== gameId);
      const updated = [{ gameId, lastPlayedAt: Date.now() }, ...filtered].slice(0, 5);
      localStorage.setItem(STORAGE_KEYS.RECENT_GAMES, JSON.stringify(updated));
    } catch (e) {
      console.warn('Failed to record recent play', e);
    }
  },

  saveResumeData(gameId, data) {
    if (!gameId) return;
    try {
      const raw = localStorage.getItem(STORAGE_KEYS.RESUME_DATA);
      const allResume = raw ? JSON.parse(raw) : {};
      allResume[gameId] = {
        data,
        savedAt: Date.now(),
      };
      localStorage.setItem(STORAGE_KEYS.RESUME_DATA, JSON.stringify(allResume));
      this.recordRecentPlay(gameId);
    } catch (e) {
      console.warn('Failed to save resume data', e);
    }
  },

  getResumeData(gameId) {
    if (!gameId) return null;
    try {
      const raw = localStorage.getItem(STORAGE_KEYS.RESUME_DATA);
      if (!raw) return null;
      const allResume = JSON.parse(raw);
      return allResume[gameId]?.data || null;
    } catch {
      return null;
    }
  },

  clearResumeData(gameId) {
    if (!gameId) return;
    try {
      const raw = localStorage.getItem(STORAGE_KEYS.RESUME_DATA);
      if (!raw) return;
      const allResume = JSON.parse(raw);
      if (allResume[gameId]) {
        delete allResume[gameId];
        localStorage.setItem(STORAGE_KEYS.RESUME_DATA, JSON.stringify(allResume));
      }
    } catch (e) {
      console.warn('Failed to clear resume data', e);
    }
  },

  hasSeenHelp(gameId) {
    if (!gameId) return true;
    try {
      const raw = localStorage.getItem(STORAGE_KEYS.SEEN_HELP);
      const list = raw ? JSON.parse(raw) : [];
      return Array.isArray(list) && list.includes(gameId);
    } catch {
      return false;
    }
  },

  setSeenHelp(gameId) {
    if (!gameId) return;
    try {
      const raw = localStorage.getItem(STORAGE_KEYS.SEEN_HELP);
      const list = raw ? JSON.parse(raw) : [];
      if (!list.includes(gameId)) {
        list.push(gameId);
        localStorage.setItem(STORAGE_KEYS.SEEN_HELP, JSON.stringify(list));
      }
    } catch (e) {
      console.warn('Failed to save seen help status', e);
    }
  },
};
