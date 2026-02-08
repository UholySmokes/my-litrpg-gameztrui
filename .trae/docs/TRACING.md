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
npm test
```

## Tracing the Azure Functions API

Start the Functions host from the `api/` folder (VS Code task: `func: host start`) and set `TRACE_ENABLED=1`.

```powershell
$env:TRACE_ENABLED = "1"
Push-Location .\api
npm install
func host start
Pop-Location
```

The following endpoints are wrapped in spans when tracing is enabled:
- `api/narrate` (`api/narrate/index.js`)
- `api/quest/create` (`api/quest-create/index.js`)
- `api/factory/run` (`api/factory-run/index.js`)

## Disable tracing

Tracing is disabled by default. Unset `TRACE_ENABLED` or set it to `0`.

## Instrumented flow

When tracing is enabled, spans are created around:
- `executeAction()` in `src/core/ActionDispatcher.js`
- `gameReducer()` in `src/core/gameReducer.js`
- `emit()` in `src/core/EventBus.js`

This is designed to help debug the action → state transition → event emission loop.
