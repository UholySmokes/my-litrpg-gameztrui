# Middleware Dependency Graph

**Generated:** 2026-02-02T19:26:03.791Z

## Visual Dependency Graph

This graph shows the relationships between endpoints, shared middleware, and external services.

```mermaid
graph TB
    classDef endpoint fill:#4A90E2,stroke:#2E5C8A,color:#fff
    classDef middleware fill:#50C878,stroke:#2E7D4E,color:#fff
    classDef external fill:#F5A623,stroke:#B87A1A,color:#fff
    classDef azure fill:#0078D4,stroke:#004C87,color:#fff

    UTILS[azure-ai-utils.js]:::middleware
    durable_functions[durable-functions]:::external
    _azure_identity[@azure/identity]:::azure
    crypto[crypto]:::external
    fs[fs]:::external
    path[path]:::external

    VOIDVERSEFUNCTION[VoidverseFunction\n /api/VoidverseFunction]:::endpoint
    VOIDVERSEFUNCTION --> durable_functions
    FACTORY_RUN[factory-run\nget|post /api/factory/run]:::endpoint
    FACTORY_RUN -->|uses 12 functions| UTILS
    FACTORY_RUN --> _azure_identity
    FACTORY_RUN --> crypto
    FACTORY_RUN --> fs
    FACTORY_RUN --> path
    NARRATE[narrate\npost /api/narrate]:::endpoint
    NARRATE -->|uses 12 functions| UTILS
    NARRATE --> _azure_identity
    QUEST_CREATE[quest-create\npost /api/quest/create]:::endpoint
    QUEST_CREATE -->|uses 12 functions| UTILS
    QUEST_CREATE --> _azure_identity

    UTILS --> crypto
    UTILS --> redis
    UTILS --> undici
```

## Dependency Matrix

| Endpoint | Middleware | Azure Identity | Durable Functions | Redis | Other |
|----------|:----------:|:--------------:|:-----------------:|:-----:|:-----:|
| VoidverseFunction | - | - | ✓ | - | - |
| factory-run | ✓ | ✓ | - | - | 3 |
| narrate | ✓ | ✓ | - | - | - |
| quest-create | ✓ | ✓ | - | - | - |

## Legend

- 🔵 **Blue nodes**: API Endpoints (Azure Functions)
- 🟢 **Green node**: Shared middleware (azure-ai-utils.js)
- 🟠 **Orange nodes**: External npm packages
- 🔷 **Azure blue nodes**: Azure-specific services

## How to View

The Mermaid diagram can be rendered in:
- GitHub (automatic rendering in markdown files)
- VS Code (with Mermaid extension)
- [Mermaid Live Editor](https://mermaid.live)
