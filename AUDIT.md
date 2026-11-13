# Feasibility audit

## Verdict

The requested recursive chart is technically achievable. The prototype demonstrates confirmed FH/FL structures, confirmation-close markers, and recursive F1/F2/F3 calculation without using future information before confirmation.

It should be described as a **fractal structure chart**, not always as an OHLC candle chart. A confirmation close may lie above FH or below FL. The implementation preserves the literal fractal extremes and renders the close independently.

## Verified

- Pivots are unavailable until the configured right wing has closed.
- Replaying data one candle at a time produces the same confirmed pivots.
- Each derived close comes from the candle that confirms its second pivot.
- Consecutive pivots of one kind reduce to the most extreme confirmed pivot.
- F2 consumes completed F1 bars, and F3 consumes completed F2 bars.
- Higher structures retain references to original raw observations.
- Seeded input and deterministic calculations are reproducible.

## Open research questions

1. **Pairing definition:** compare adjacent alternating pairs with non-overlapping pairs and a rolling most-recent-FH/FL model.
2. **Close outside range:** decide whether this is desirable information, a breakout state, or a reason to avoid the term “candle.”
3. **Equal extremes:** the prototype uses a strict-left/inclusive-right rule and retains the earliest equal extreme.
4. **Higher-level sparsity:** recursive levels compress quickly; useful depth varies with timeframe, wing size, and volatility.
5. **Trading value:** structural correctness does not establish predictive edge. That requires real data, out-of-sample experiments, fees, and regime analysis.

## Recommended next validation

Connect historical OHLCV data, add replay and CSV import, and compare the pairing models across liquid assets. Measure compression, confirmation lag, continuation, reversal, and results normalized by the OSD volatility regime before using the chart for decisions.
