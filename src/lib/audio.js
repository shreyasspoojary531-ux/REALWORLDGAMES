import { useCallback } from 'react';
import { useAppStore } from '@/app/store';

class SoundSynthesizer {
  constructor() {
    this.ctx = null;
  }

  getContext() {
    if (typeof window === 'undefined') return null;
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }
    return this.ctx;
  }

  playTone(freq, type = 'sine', duration = 0.12, gainLevel = 0.15) {
    const ctx = this.getContext();
    if (!ctx) return;
    try {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = type;
      osc.frequency.setValueAtTime(freq, ctx.currentTime);
      gain.gain.setValueAtTime(gainLevel, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + duration);

      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + duration);
    } catch {
      // Audio autoplay policy catch
    }
  }

  click() {
    this.playTone(600, 'sine', 0.04, 0.08);
  }

  tap() {
    this.playTone(320, 'triangle', 0.05, 0.12);
  }

  clack() {
    this.playTone(180, 'sine', 0.08, 0.2);
  }

  pocket() {
    this.playTone(220, 'sine', 0.1, 0.2);
    setTimeout(() => this.playTone(440, 'triangle', 0.15, 0.15), 50);
  }

  move() {
    this.playTone(480, 'sine', 0.06, 0.1);
  }

  capture() {
    this.playTone(240, 'triangle', 0.08, 0.18);
    setTimeout(() => this.playTone(360, 'sawtooth', 0.1, 0.12), 40);
  }

  success() {
    this.playTone(523.25, 'triangle', 0.12, 0.12); // C5
    setTimeout(() => this.playTone(659.25, 'triangle', 0.12, 0.12), 100); // E5
    setTimeout(() => this.playTone(783.99, 'triangle', 0.25, 0.15), 200); // G5
  }

  error() {
    this.playTone(220, 'sawtooth', 0.12, 0.15);
    setTimeout(() => this.playTone(180, 'sawtooth', 0.18, 0.15), 100);
  }

  win() {
    [440, 554, 659, 880].forEach((freq, idx) => {
      setTimeout(() => this.playTone(freq, 'triangle', 0.2, 0.15), idx * 120);
    });
  }

  cardDeal() {
    this.playTone(400, 'sine', 0.04, 0.08);
  }

  cardFlip() {
    this.playTone(650, 'triangle', 0.05, 0.1);
  }

  chips() {
    this.playTone(850, 'sine', 0.03, 0.09);
    setTimeout(() => this.playTone(920, 'sine', 0.03, 0.09), 30);
  }
}

export const soundSynth = new SoundSynthesizer();

export function useAudio() {
  const soundEnabled = useAppStore((state) => state.settings.soundEnabled);

  const play = useCallback(
    (action) => {
      if (soundEnabled) {
        action(soundSynth);
      }
    },
    [soundEnabled]
  );

  return {
    click: useCallback(() => play((s) => s.click()), [play]),
    tap: useCallback(() => play((s) => s.tap()), [play]),
    clack: useCallback(() => play((s) => s.clack()), [play]),
    pocket: useCallback(() => play((s) => s.pocket()), [play]),
    move: useCallback(() => play((s) => s.move()), [play]),
    capture: useCallback(() => play((s) => s.capture()), [play]),
    success: useCallback(() => play((s) => s.success()), [play]),
    error: useCallback(() => play((s) => s.error()), [play]),
    win: useCallback(() => play((s) => s.win()), [play]),
    cardDeal: useCallback(() => play((s) => s.cardDeal()), [play]),
    cardFlip: useCallback(() => play((s) => s.cardFlip()), [play]),
    chips: useCallback(() => play((s) => s.chips()), [play]),
  };
}
