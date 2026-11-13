export type Direction = "bullish" | "bearish" | "neutral";
export type PivotKind = "FH" | "FL";

export interface Bar {
  id: string;
  time: number;
  open: number;
  high: number;
  low: number;
  close: number;
  sourceIds?: string[];
}

export interface Pivot {
  id: string;
  kind: PivotKind;
  sourceIndex: number;
  confirmationIndex: number;
  price: number;
  sourceTime: number;
  confirmationTime: number;
  confirmationClose: number;
  sourceId: string;
  confirmationId: string;
}

export interface FractalBar extends Bar {
  level: number;
  startTime: number;
  endTime: number;
  confirmationTime: number;
  fractalHigh: number;
  fractalLow: number;
  confirmationClose: number;
  direction: Direction;
  sourceIds: string[];
  firstPivot: Pivot;
  secondPivot: Pivot;
}

export interface FractalSettings {
  wing: number;
  maxLevels: number;
}

export const detectFractals = (bars: Bar[], wing = 2): Pivot[] => {
  if (!Number.isInteger(wing) || wing < 1) throw new Error("wing must be a positive integer");
  const pivots: Pivot[] = [];

  for (let index = wing; index < bars.length - wing; index += 1) {
    const bar = bars[index];
    const left = bars.slice(index - wing, index);
    const right = bars.slice(index + 1, index + wing + 1);
    // Strict-left/inclusive-right assigns equal plateaus to their earliest bar.
    const isHigh = left.every((item) => bar.high > item.high) && right.every((item) => bar.high >= item.high);
    const isLow = left.every((item) => bar.low < item.low) && right.every((item) => bar.low <= item.low);
    const confirmationIndex = index + wing;
    const confirmation = bars[confirmationIndex];

    const add = (kind: PivotKind, price: number) => pivots.push({
      id: `${kind}-${bar.id}-${confirmation.id}`,
      kind,
      sourceIndex: index,
      confirmationIndex,
      price,
      sourceTime: bar.time,
      confirmationTime: confirmation.time,
      confirmationClose: confirmation.close,
      sourceId: bar.id,
      confirmationId: confirmation.id,
    });

    if (isHigh) add("FH", bar.high);
    if (isLow) add("FL", bar.low);
  }

  return pivots.sort((a, b) =>
    a.confirmationIndex - b.confirmationIndex ||
    a.sourceIndex - b.sourceIndex ||
    (a.kind === "FH" ? -1 : 1),
  );
};

export const normalizePivots = (pivots: Pivot[]): Pivot[] => {
  const result: Pivot[] = [];
  for (const pivot of pivots) {
    const previous = result.at(-1);
    if (!previous || previous.kind !== pivot.kind) {
      result.push(pivot);
      continue;
    }
    const isMoreExtreme = pivot.kind === "FH" ? pivot.price > previous.price : pivot.price < previous.price;
    if (isMoreExtreme) result[result.length - 1] = pivot;
  }
  return result;
};

const flattenSources = (bars: Bar[], start: number, end: number) => {
  const ids = bars.slice(start, end + 1).flatMap((bar) => bar.sourceIds?.length ? bar.sourceIds : [bar.id]);
  return [...new Set(ids)];
};

export const buildFractalLevel = (source: Bar[], level: number, wing = 2): FractalBar[] => {
  const pivots = normalizePivots(detectFractals(source, wing));
  const output: FractalBar[] = [];

  for (let index = 1; index < pivots.length; index += 1) {
    const first = pivots[index - 1];
    const second = pivots[index];
    if (first.kind === second.kind) continue;

    const start = Math.min(first.sourceIndex, second.sourceIndex);
    const end = second.confirmationIndex;
    const high = first.kind === "FH" ? first.price : second.price;
    const low = first.kind === "FL" ? first.price : second.price;
    const close = second.confirmationClose;
    const open = first.confirmationClose;
    output.push({
      id: `F${level}-${first.id}-${second.id}`,
      level,
      time: second.confirmationTime,
      startTime: source[start].time,
      endTime: source[end].time,
      confirmationTime: second.confirmationTime,
      open,
      high,
      low,
      close,
      fractalHigh: high,
      fractalLow: low,
      confirmationClose: close,
      direction: close > open ? "bullish" : close < open ? "bearish" : "neutral",
      sourceIds: flattenSources(source, start, end),
      firstPivot: first,
      secondPivot: second,
    });
  }
  return output;
};

export const buildHierarchy = (raw: Bar[], settings: FractalSettings): FractalBar[][] => {
  const levels: FractalBar[][] = [];
  let source: Bar[] = raw;
  for (let level = 1; level <= settings.maxLevels; level += 1) {
    const next = buildFractalLevel(source, level, settings.wing);
    levels.push(next);
    if (next.length < settings.wing * 2 + 2) break;
    source = next;
  }
  return levels;
};

export const auditPrefixStability = (bars: Bar[], wing: number) => {
  const full = detectFractals(bars, wing);
  for (let length = wing * 2 + 1; length <= bars.length; length += 1) {
    const prefix = detectFractals(bars.slice(0, length), wing);
    const eligible = full.filter((pivot) => pivot.confirmationIndex < length);
    if (JSON.stringify(prefix) !== JSON.stringify(eligible)) return false;
  }
  return true;
};
