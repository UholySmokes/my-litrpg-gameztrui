# Magic Rollout Layers

This project supports phased rollout of the magic system via:

```json
{
  "config": {
    "magicRollout": {
      "layerA": true,
      "layerB": true,
      "layerC": true,
      "layerD": true
    }
  }
}
```

Default is all layers enabled.

## Layer map

- `layerA`: Ambient ecology snapshot and detailed `SENSE` world context (biome/time/weather/anomalies/sources).
- `layerB`: Resource depth mechanics (storage decay, contamination, interference) and `PURGE`.
- `layerC`: Risk spectrum mechanics (resonance pressure, overload events, resonance-oriented `SENSE` details).
- `layerD`: Progression/pacing hooks (perk training/ranks, pattern unlock persistence, combat cast-time staging).

## Presets

### A-only

```json
{
  "magicRollout": { "layerA": true, "layerB": false, "layerC": false, "layerD": false }
}
```

Use when you want environmental flavor with minimal gameplay impact.

### A+B

```json
{
  "magicRollout": { "layerA": true, "layerB": true, "layerC": false, "layerD": false }
}
```

Adds storage/contamination/interference depth, but keeps resonance drama and progression hooks off.

### A+B+C

```json
{
  "magicRollout": { "layerA": true, "layerB": true, "layerC": true, "layerD": false }
}
```

Adds resonance and overload outcomes, while keeping progression/cast-time staging off.

### all

```json
{
  "magicRollout": { "layerA": true, "layerB": true, "layerC": true, "layerD": true }
}
```

Full current system.

## Practical notes

- If `layerB` is disabled, `magic_purge` returns unavailable by design.
- If `layerC` is disabled, overload surges and resonance pressure effects are disabled.
- If `layerD` is disabled:
  - perk training/rank progression is disabled,
  - pattern unlock progression is disabled,
  - combat `magic_release` cast-time staging is disabled (release resolves immediately).

## Runtime toggle example

If you want to switch layers during a playtest, update state config:

```js
dispatch({
  type: "UPDATE_STATE",
  payload: {
    config: {
      ...state.config,
      magicRollout: { layerA: true, layerB: true, layerC: false, layerD: false },
    },
  },
});
```

