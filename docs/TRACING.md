# Tracing

This repo supports **opt-in OpenTelemetry tracing** for Node entrypoints (simulation scripts, local tooling).

## AI Toolkit trace viewer

1. In VS Code, run the command: `AI Toolkit: Open Tracing` (command id: `ai-mlstudio.tracing.open`).
2. This starts a local OTLP collector and opens the trace viewer.

The default OTLP endpoint used by this repo is:
- `http://localhost:4318/v1/traces`

## Enable tracing (Windows PowerShell)

```powershell
$env:TRACE_ENABLED = "1"
node .\sim_gamestart_fixed.js
```

## Disable tracing

Tracing is disabled by default. Unset `TRACE_ENABLED` or set it to `0`.

## Instrumented flow

When tracing is enabled, spans are created around:
- `executeAction()` in `src/core/ActionDispatcher.js`
- `gameReducer()` in `src/core/gameReducer.js`
- `emit()` in `src/core/EventBus.js`

This is designed to help debug the action → state transition → event emission loop.
