---
trigger: model_decision
description: When refactoring large files like useGameState.js
---

# Refactor Rules

1. When refactoring large files like useGameState.js, do not use partial patches.
2. Use python util/file_manager.py to overwrite the entire file to ensure architectural integrity.
