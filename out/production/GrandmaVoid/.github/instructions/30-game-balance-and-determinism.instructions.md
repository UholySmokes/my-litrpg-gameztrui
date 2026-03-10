---
applyTo: "{packages/game-core/src/**/*,src/systems/**/*,tests/unit/**/*}"
description: "Keep gameplay deterministic, testable, and balance-friendly."
---

# Game Balance and Determinism

Core rules:
1. Use deterministic RNG helpers for gameplay randomness.
2. Keep reducers and game-state updates pure (no hidden side effects).
3. Keep IDs stable and serialization-safe.
4. Store balancing/tuning numbers in config/data, not inline magic values.

When adding or changing mechanics:
- Preserve existing object shapes unless migration is intentional.
- Add or update focused tests for changed behavior.
- Document assumptions that affect balance (damage scaling, cooldowns, costs).

Goal:
- Reproducible simulations, predictable saves, and safer balancing changes.
