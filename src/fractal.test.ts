import { describe, expect, it } from "vitest";
import { auditPrefixStability, buildFractalLevel, buildHierarchy, detectFractals, normalizePivots, type Bar, type Pivot } from "./fractal";
import { makeSampleData } from "./sampleData";

const bars = (highs: number[], lows: number[], closes?: number[]): Bar[] => highs.map((high, i) => ({ id:`b${i}`, time:i, open:closes?.[i] ?? (high+lows[i])/2, high, low:lows[i], close:closes?.[i] ?? (high+lows[i])/2 }));

describe("fractal engine", () => {
  it("assigns the confirming bar close, not the pivot bar close", () => {
    const input=bars([2,4,9,5,3,2,1],[1,2,4,2,1,0,0],[1.5,3,8,4,2.25,.5,.2]);
    const pivot=detectFractals(input,2).find((x)=>x.kind==="FH");
    expect(pivot?.sourceId).toBe("b2");
    expect(pivot?.confirmationId).toBe("b4");
    expect(pivot?.confirmationClose).toBe(2.25);
  });

  it("replaces consecutive same-kind pivots only when more extreme", () => {
    const pivot=(kind:"FH"|"FL",price:number,id:string):Pivot=>({id,kind,price,sourceIndex:0,confirmationIndex:0,sourceTime:0,confirmationTime:0,confirmationClose:price,sourceId:id,confirmationId:id});
    const normalized=normalizePivots([pivot("FH",10,"a"),pivot("FH",12,"b"),pivot("FH",11,"c"),pivot("FL",5,"d")]);
    expect(normalized.map((x)=>x.id)).toEqual(["b","d"]);
  });

  it("builds derived bars whose close is the second pivot confirmation close", () => {
    const level=buildFractalLevel(makeSampleData(120),1,2);
    expect(level.length).toBeGreaterThan(5);
    expect(level.every((bar)=>bar.close===bar.secondPivot.confirmationClose)).toBe(true);
  });

  it("preserves FH and FL when a confirmation close sits outside the range", () => {
    const input=bars([2,4,9,5,4,3,2,4,11,8,7,6],[1,2,4,2,1,0,-1,1,9,3,2,1],[1.5,3,8,4,2,.5,0,2,10,5,4,3]);
    const level=buildFractalLevel(input,1,2);
    const external=level.find((bar)=>bar.close>bar.high||bar.close<bar.low);
    expect(external).toBeDefined();
    expect(external?.high).toBe(external?.fractalHigh);
    expect(external?.low).toBe(external?.fractalLow);
  });

  it("is prefix-stable and therefore does not repaint confirmed pivots", () => {
    expect(auditPrefixStability(makeSampleData(180),2)).toBe(true);
  });

  it("recurses over its own completed output with raw provenance", () => {
    const levels=buildHierarchy(makeSampleData(320),{wing:2,maxLevels:3});
    expect(levels.length).toBeGreaterThanOrEqual(2);
    expect(levels[0].length).toBeGreaterThan(levels[1].length);
    expect(levels[1].every((bar)=>bar.level===2 && bar.sourceIds.every((id)=>id.startsWith("R-")))).toBe(true);
  });
});
