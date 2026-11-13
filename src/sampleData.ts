import type { Bar } from "./fractal";

const random = (seed: number) => {
  let state = seed >>> 0;
  return () => {
    state = (state * 1664525 + 1013904223) >>> 0;
    return state / 4294967296;
  };
};

export const makeSampleData = (count = 320, seed = 731): Bar[] => {
  const next = random(seed);
  const start = Date.UTC(2025, 0, 6, 9, 30);
  let close = 100;
  return Array.from({ length: count }, (_, index) => {
    const wave = Math.sin(index / 8) * 0.65 + Math.sin(index / 25) * 0.35;
    const drift = index < count * 0.42 ? 0.055 : index < count * 0.7 ? -0.04 : 0.025;
    const open = close;
    close = Math.max(70, open + wave * 0.22 + drift + (next() - 0.5) * 1.1);
    const high = Math.max(open, close) + 0.15 + next() * 0.75;
    const low = Math.min(open, close) - 0.15 - next() * 0.75;
    return {
      id: `R-${index}`,
      time: start + index * 60_000,
      open,
      high,
      low,
      close,
    };
  });
};
