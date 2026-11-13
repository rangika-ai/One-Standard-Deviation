import { useMemo, useState, type CSSProperties } from "react";
import { auditHierarchy, type AuditFinding } from "./audit";
import { buildHierarchy, detectFractals, type Bar, type FractalBar } from "./fractal";
import { makeSampleData } from "./sampleData";

const colors = ["#7f8a91", "#4de1c1", "#b69cff", "#ffb65c"];
const fmt = (value: number) => value.toFixed(2);
const clock = (value: number) => new Intl.DateTimeFormat("en-AU", { hour: "2-digit", minute: "2-digit", hour12: false, timeZone: "UTC" }).format(value);

function Chart({ raw, levels, visible, selected, onSelect }: { raw: Bar[]; levels: FractalBar[][]; visible: Set<number>; selected: FractalBar | null; onSelect: (bar: FractalBar) => void }) {
  const width = 1200, height = 560, pad = { top: 24, right: 74, bottom: 42, left: 18 };
  const shownRaw = raw.slice(-180), start = shownRaw[0].time, end = shownRaw.at(-1)!.time;
  const active = levels.map((bars, i) => ({ bars: bars.filter((b) => b.time >= start), level: i + 1 })).filter((x) => visible.has(x.level));
  const all: Bar[] = [shownRaw, ...active.map((item) => item.bars)].flat();
  const low = Math.min(...all.map((b) => b.low)), high = Math.max(...all.map((b) => b.high)), range = high - low || 1;
  const x = (time: number) => pad.left + ((time - start) / (end - start || 1)) * (width - pad.left - pad.right);
  const y = (price: number) => pad.top + ((high - price) / range) * (height - pad.top - pad.bottom);
  const rawStep = (width - pad.left - pad.right) / shownRaw.length;
  const grid = Array.from({ length: 6 }, (_, i) => high - (range * i) / 5);
  return <svg className="chart" viewBox={`0 0 ${width} ${height}`} role="img" aria-label="Recursive fractal price chart">
    {grid.map((price) => <g key={price}><line x1={pad.left} x2={width-pad.right} y1={y(price)} y2={y(price)} className="grid"/><text x={width-pad.right+12} y={y(price)+4} className="axis-label">{fmt(price)}</text></g>)}
    {shownRaw.map((bar) => { const bx=x(bar.time), up=bar.close>=bar.open; return <g key={bar.id} opacity={visible.has(0)?.58:.08}><line x1={bx} x2={bx} y1={y(bar.high)} y2={y(bar.low)} stroke={up?"#799b93":"#9a7070"}/><rect x={bx-rawStep*.28} width={Math.max(1.4,rawStep*.56)} y={y(Math.max(bar.open,bar.close))} height={Math.max(1,Math.abs(y(bar.open)-y(bar.close)))} fill={up?"#799b93":"#9a7070"}/></g>; })}
    {active.map(({bars,level}) => bars.map((bar) => { const bx=x(bar.time), chosen=selected?.id===bar.id; return <g key={bar.id} className="fractal-mark" onClick={()=>onSelect(bar)} role="button" tabIndex={0} onKeyDown={(e)=>e.key==="Enter"&&onSelect(bar)}><line x1={x(Math.max(start,bar.startTime))} x2={bx} y1={y(bar.close)} y2={y(bar.close)} stroke={colors[level]} opacity={chosen?.65:.12} strokeDasharray="3 4"/><line x1={bx} x2={bx} y1={y(bar.high)} y2={y(bar.low)} stroke={colors[level]} strokeWidth={chosen?5:Math.max(2,5-level*.65)} opacity={chosen?1:.84}/><circle cx={bx} cy={y(bar.close)} r={chosen?7:4.5} fill="#0a0d0f" stroke={colors[level]} strokeWidth="2"/><path d={`M ${bx-4} ${bar.secondPivot.kind==="FH"?y(bar.high)-8:y(bar.low)+8} l 8 0 l -4 ${bar.secondPivot.kind==="FH"?-6:6} z`} fill={colors[level]}/></g>; }))}
    <text x={pad.left} y={height-14} className="axis-label">{clock(start)} UTC</text><text x={width-pad.right} y={height-14} textAnchor="end" className="axis-label">{clock(end)} UTC</text>
  </svg>;
}

const Status = ({ finding }: { finding: AuditFinding }) => <div className="audit-row"><span className={`status ${finding.pass?"pass":"fail"}`}>{finding.pass?"PASS":"FAIL"}</span><div><strong>{finding.name}</strong><p>{finding.detail}</p></div></div>;

export function App() {
  const [wing,setWing]=useState(2), [visible,setVisible]=useState(new Set([0,1,2,3])), [selected,setSelected]=useState<FractalBar|null>(null);
  const raw=useMemo(()=>makeSampleData(),[]);
  const levels=useMemo(()=>buildHierarchy(raw,{wing,maxLevels:3}),[raw,wing]);
  const pivots=useMemo(()=>detectFractals(raw,wing),[raw,wing]);
  const audit=useMemo(()=>auditHierarchy(raw,levels,wing),[raw,levels,wing]);
  const toggle=(level:number)=>setVisible((current)=>{const next=new Set(current);next.has(level)?next.delete(level):next.add(level);return next;});
  return <main>
    <header className="topbar"><div className="brand"><span className="brand-mark">F</span><div><strong>Fractal Structure Lab</strong><small>Recursive market geometry</small></div></div><div className="market"><span className="pulse"/> SYNTH / 1M <b>{fmt(raw.at(-1)!.close)}</b></div><div className="research-badge">RESEARCH BUILD <span>0.1</span></div></header>
    <section className="hero"><div><p className="eyebrow">STRUCTURE, NOT TIME</p><h1>See the market<br/><em>fold into itself.</em></h1></div><p className="intro">Each bar is bounded by a confirmed fractal high and low. Its close is the price that confirmed the second pivot. Then the same logic runs again—on its own output.</p></section>
    <section className="workspace"><div className="chart-head"><div><span className="section-number">01</span><h2>Recursive structure</h2><p>{raw.length} raw observations · {pivots.length} confirmed pivots</p></div><div className="levels">{[0,1,2,3].map((level)=><button key={level} className={visible.has(level)?"active":""} style={{"--level":colors[level]} as CSSProperties} onClick={()=>toggle(level)}><i/>{level===0?"RAW":`F${level}`} <span>{level===0?raw.length:levels[level-1]?.length??0}</span></button>)}</div></div><Chart raw={raw} levels={levels} visible={visible} selected={selected} onSelect={setSelected}/><div className="legend"><span><i className="line-symbol"/> FH–FL range</span><span><i className="close-symbol"/> confirmation close</span><span><i className="pivot-symbol"/> second confirmed pivot</span></div></section>
    <section className="lower-grid"><aside className="panel controls"><span className="section-number">02</span><h2>Method</h2><label><span>Fractal wing <b>{wing}</b></span><input type="range" min="1" max="4" value={wing} onChange={(e)=>{setWing(Number(e.target.value));setSelected(null)}}/></label><div className="rule"><small>CONFIRMATION</small><strong>{wing} closed bars to the right</strong><p>No pivot exists before its right wing has closed.</p></div><div className="rule"><small>PAIRING</small><strong>Alternating + extreme replacement</strong><p>Repeated highs or lows collapse to the most extreme confirmed pivot.</p></div><div className="rule"><small>RECURSION</small><strong>Same engine, every level</strong><p>F2 is calculated exclusively from completed F1 bars.</p></div></aside>
    <section className="panel inspection"><span className="section-number">03</span><h2>Structure inspector</h2>{selected?<><div className="selected-title"><span style={{color:colors[selected.level]}}>F{selected.level}</span><strong>{selected.secondPivot.kind} confirmed at {clock(selected.confirmationTime)}</strong></div><div className="metric-grid"><div><small>FH</small><b>{fmt(selected.fractalHigh)}</b></div><div><small>FL</small><b>{fmt(selected.fractalLow)}</b></div><div><small>CLOSE</small><b>{fmt(selected.close)}</b></div><div><small>RANGE</small><b>{fmt(selected.high-selected.low)}</b></div></div><p className="trace">Built from {selected.sourceIds.length} raw observations. The close belongs to <code>{selected.secondPivot.confirmationId}</code>, never the pivot candle.</p></>:<div className="empty-state"><div className="target"/><strong>Select a fractal bar</strong><p>Inspect its extremes, confirmation close and raw provenance.</p></div>}</section>
    <section className="panel audit"><div className="audit-heading"><div><span className="section-number">04</span><h2>Feasibility audit</h2></div><div className="score">{audit.filter(x=>x.pass).length}/{audit.length}<small>gates passed</small></div></div>{audit.map((item)=><Status key={item.name} finding={item}/>)}</section></section>
    <footer><strong>FSL / 001</strong><span>Deterministic prototype · Synthetic data · Not trading advice</span><span>Every mark is reproducible</span></footer>
  </main>;
}
