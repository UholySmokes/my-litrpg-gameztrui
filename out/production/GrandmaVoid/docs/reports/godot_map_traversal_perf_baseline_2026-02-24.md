# Godot Map Traversal Perf Baseline (2026-02-24)

Source: `npm run test:godot:perf` via headless Godot probe.

| Metric | Value |
|--------|-------|
| mapTransitions | 240 |
| baselineIterations | 240 |
| moveSamples | 240 |
| renderSamples | 240 |
| moveAvgMs | 0.0753 |
| moveP95Ms | 0.1320 |
| renderAvgMs | 0.0548 |
| renderP95Ms | 0.1010 |

Notes:
- Baseline is a deterministic headless traversal sweep over configured maps.
- This is a regression anchor for future sprite/tile complexity changes.
