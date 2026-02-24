# Gameplay Progression v1 Contract

Status: Draft (M7 progression depth slice)  
Last updated: 2026-02-24

## 1. Purpose

Define deterministic combat, inventory, and quest progression fields produced by sync command processing in M7.

## 2. Canonical Field Shape

The flattened `canonicalState` shape uses:

```json
{
  "entityStates": {
    "progression": {
      "level": 1,
      "xp": 0,
      "gold": 0,
      "inventory": [{ "id": "training_emblem", "quantity": 1 }]
    },
    "combat": {
      "encounterId": "encounter_gate_training_01",
      "status": "resolved",
      "outcome": "victory",
      "roll": 77,
      "rewards": { "xp": 40, "gold": 12, "itemId": "training_emblem", "quantity": 1 },
      "levelsGained": [],
      "resolvedAtSeq": 3,
      "resolvedAtTick": 3
    },
    "encounter": {
      "gateId": "encounter_gate_training_01",
      "status": "resolved",
      "roll": 77,
      "outcome": "win"
    },
    "lastSavepoint": {
      "triggerId": "savepoint_square_crystal",
      "mapId": "map_village_square",
      "x": 4,
      "y": 4,
      "seq": 5,
      "tick": 5,
      "progression": {
        "level": 1,
        "xp": 40,
        "gold": 12,
        "inventoryUnitCount": 1
      }
    }
  },
  "questFlags": {
    "quest_tutorial_combat_resolved": true,
    "quest_tutorial_loot_claimed": true,
    "quest_tutorial_savepoint_bound": true
  }
}
```

## 3. Deterministic Reward Policy

`ENCOUNTER_GATE` computes `roll` with deterministic RNG and applies:

1. `victory` (`roll >= 50`): `xp +40`, `gold +12`, add `training_emblem x1`.
2. `setback` (`roll < 50`): `xp +20`, `gold +4`, add `field_bandage x1`.

Leveling rule:

- Threshold per level is `level * 100` XP.
- On level-up, threshold XP is subtracted and `level` increments.

## 4. Compatibility Guarantees

- `entityStates.encounter` remains populated for compatibility.
- `entityStates.combat` is the canonical combat summary moving forward.
- Inventory ordering is deterministic (sorted by item id) and quantities are merged by id.

## 5. Save/Load Parity Notes

- `SAVEPOINT` snapshots include progression summary under `entityStates.lastSavepoint.progression`.
- Snapshot game state mirrors `entityStates.progression` into player `level`, `xp`, `gold`, and `inventory`.
