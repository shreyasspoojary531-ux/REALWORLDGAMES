import { describe, it, expect, beforeEach } from 'vitest';
import { storage, defaultSettings } from './storage';

describe('Storage Utility & Continue Playing Logic', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('returns default settings when storage is empty', () => {
    const settings = storage.getSettings();
    expect(settings).toEqual(defaultSettings);
  });

  it('persists and retrieves user settings', () => {
    storage.saveSettings({ ...defaultSettings, soundEnabled: false });
    const settings = storage.getSettings();
    expect(settings.soundEnabled).toBe(false);
  });

  it('returns default vault and tracks coins & lifetime winnings', () => {
    const vault = storage.getVault();
    expect(vault.coins).toBe(1000);

    storage.saveVault({ ...vault, coins: 1500, lifetimeWinnings: 500 });
    const updated = storage.getVault();
    expect(updated.coins).toBe(1500);
    expect(updated.lifetimeWinnings).toBe(500);
  });

  it('records game end results and updates high scores', () => {
    storage.recordGameEnd('testGame', true, 250);
    const stats = storage.getStats('testGame');
    expect(stats.played).toBe(1);
    expect(stats.won).toBe(1);
    expect(stats.highScore).toBe(250);

    storage.recordGameEnd('testGame', true, 100);
    const stats2 = storage.getStats('testGame');
    expect(stats2.played).toBe(2);
    expect(stats2.highScore).toBe(250);
  });

  it('returns empty array when no recent games played (empty state)', () => {
    const recents = storage.getRecentPlays();
    expect(recents).toEqual([]);
  });

  it('records, sorts newest first, deduplicates, and limits recents to 5', () => {
    storage.recordRecentPlay('game1');
    storage.recordRecentPlay('game2');
    storage.recordRecentPlay('game3');
    storage.recordRecentPlay('game4');
    storage.recordRecentPlay('game5');
    storage.recordRecentPlay('game6'); // 6th game pushes oldest out

    const recents = storage.getRecentPlays();
    expect(recents).toHaveLength(5);
    expect(recents[0].gameId).toBe('game6');
    expect(recents.map((r) => r.gameId)).not.toContain('game1');

    // Playing game2 again should bring it to the top without duplicates
    storage.recordRecentPlay('game2');
    const updated = storage.getRecentPlays();
    expect(updated).toHaveLength(5);
    expect(updated[0].gameId).toBe('game2');
    const ids = updated.map((r) => r.gameId);
    expect(new Set(ids).size).toBe(5);
  });

  it('saves and clears resume data on game completion', () => {
    storage.saveResumeData('sudoku', { board: [[1, 2]], timer: 45 });
    const saved = storage.getResumeData('sudoku');
    expect(saved).toEqual({ board: [[1, 2]], timer: 45 });

    // When game finishes, resume data is cleared
    storage.recordGameEnd('sudoku', true, 800, 45);
    const cleared = storage.getResumeData('sudoku');
    expect(cleared).toBeNull();
  });

  it('handles corrupt or non-array localStorage data without crashing', () => {
    localStorage.setItem('rwg_recent_games_v2', '{"corrupted": true}');
    expect(storage.getRecentPlays()).toEqual([]);

    localStorage.setItem('rwg_recent_games_v2', 'invalid-json{{{');
    expect(storage.getRecentPlays()).toEqual([]);

    localStorage.setItem('rwg_resume_data_v2', 'not-json');
    expect(storage.getResumeData('any')).toBeNull();
  });
});
