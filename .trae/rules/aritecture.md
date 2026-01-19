---
alwaysApply: false
description: Apply during initialization, data loading, or state updates. Ensure strict separation of data from logic, enforce object inheritance rules, and synchronize the central global state as the single source of truth.
---
 ## 3. Architecture & State Management

Data vs. Logic Separation: Do not hardcode room descriptions or item stats inside your code logic.

Rule: Store world data (rooms, items, NPCs) in external files (JSON, YAML, or a Database). The code should simply load this data.

Object-Oriented Design (OOD):

Create a base class Entity with properties like name, description, and location.

Extend this into Item, Room, and Actor. This ensures every object in the game shares the same fundamental rules (e.g., everything has a description).

The "Global State" Manager: Maintain a central state object that tracks:

Current location.

Inventory list.

"Flags" (boolean values for puzzles solved, e.g., has_met_king = true). 