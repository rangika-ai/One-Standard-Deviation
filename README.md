# Fractal Structure Lab

A research prototype for recursive, confirmed-fractal charting. Raw candles produce F1 structure bars; those completed bars become the input to F2 and F3.

## Model

- A pivot is confirmed only after `wing` closed bars exist to its right.
- Same-kind pivots are reduced by retaining the most extreme pivot.
- A derived bar joins two alternating pivots.
- Its high and low are FH and FL; its close is the close of the source bar that confirms the second pivot.
- Higher levels use only completed bars from the previous level.

## Run

```bash
npm install --cache .npm-cache
npm run dev
```

Validation:

```bash
npm run check
```

The included data is deterministic and synthetic. This prototype establishes calculation and visualization feasibility; it does not establish trading efficacy.

FH and FL remain literal fractal extremes. A confirmation close can sit outside that range, so this is a custom structural bar rather than conventional OHLC.
