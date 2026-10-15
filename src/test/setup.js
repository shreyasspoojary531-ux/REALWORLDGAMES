import '@testing-library/jest-dom';

class AudioContextMock {
  destination = {};
  currentTime = 0;
  createOscillator() {
    return {
      type: 'sine',
      frequency: { setValueAtTime: () => {}, exponentialRampToValueAtTime: () => {} },
      connect: () => {},
      start: () => {},
      stop: () => {},
    };
  }
  createGain() {
    return {
      gain: {
        setValueAtTime: () => {},
        linearRampToValueAtTime: () => {},
        exponentialRampToValueAtTime: () => {},
      },
      connect: () => {},
    };
  }
  close() {
    return Promise.resolve();
  }
}

window.AudioContext = AudioContextMock;
window.webkitAudioContext = AudioContextMock;
