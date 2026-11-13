import { auditPrefixStability, type Bar, type FractalBar } from "./fractal";

export interface AuditFinding { name: string; pass: boolean; detail: string }

export const auditHierarchy = (raw: Bar[], levels: FractalBar[][], wing: number): AuditFinding[] => {
  const all = levels.flat();
  const closes = all.every((bar) => bar.close === bar.secondPivot.confirmationClose);
  const finiteGeometry = all.every((bar) => [bar.high, bar.low, bar.close].every(Number.isFinite) && bar.high > bar.low);
  const externalCloses = all.filter((bar) => bar.close > bar.high || bar.close < bar.low).length;
  const provenance = all.every((bar) => bar.sourceIds.length > 0 && new Set(bar.sourceIds).size === bar.sourceIds.length);
  const recursive = levels.length > 1 && levels[1].every((bar) => bar.level === 2 && bar.sourceIds.every((id) => id.startsWith("R-")));
  return [
    { name: "Non-repainting confirmation", pass: auditPrefixStability(raw, wing), detail: `Every pivot is identical when replayed one bar at a time (wing ${wing}).` },
    { name: "Confirmation-close integrity", pass: closes, detail: "Every derived close is the close of the bar that confirmed its second pivot." },
    { name: "Faithful custom geometry", pass: finiteGeometry, detail: `${externalCloses} closes sit outside FH–FL and remain visible; the model does not falsify either extreme to mimic OHLC.` },
    { name: "Recursive calculation", pass: recursive, detail: `The engine produced ${levels[1]?.length ?? 0} F2 bars from completed F1 structures.` },
    { name: "Traceable provenance", pass: provenance, detail: "Every structure retains unique references to the raw observations behind it." },
  ];
};
