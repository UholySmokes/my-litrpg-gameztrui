# Make Godot Slice Runnable

## Summary
Use the existing vertical-slice scene as the Godot app entrypoint and fix the current GDScript parse blocker so the project both launches from the Godot Run button and passes the existing smoke harness.

## Implementation Changes
- Set the application main scene in [`D:\Apps\my-litrpg-gameztrui\godot\project.godot`](/D:/Apps/my-litrpg-gameztrui/godot/project.godot) to `res://scenes/Main.tscn`.
- Treat [`D:\Apps\my-litrpg-gameztrui\godot\scenes\Main.tscn`](/D:/Apps/my-litrpg-gameztrui/godot/scenes/Main.tscn) as the canonical startup scene; do not add a title screen, bootstrap scene, or separate character-creation entry flow in this change.
- Fix the typed-GDScript parse failure in [`D:\Apps\my-litrpg-gameztrui\godot\scripts\world_controller.gd`](/D:/Apps/my-litrpg-gameztrui/godot/scripts/world_controller.gd) around the `create_character` sync response handling by replacing inferred `:=` locals that currently derive from `Variant` values with explicit typed/narrowed variables. The goal is to preserve the existing logic while avoiding “Variant inferred type” warnings/errors in Godot 4.6.
- Keep the current scene behavior intact after startup:
  - load runtime config and manifest
  - start in `map_village_square`
  - preserve existing fallback prose/runtime behavior
  - preserve current character-creation gate behavior if that config is added later

## Interfaces / Behavior
- No public API or schema changes.
- Internal behavior change:
  - Godot editor Run should launch the existing main slice instead of showing “no main scene defined.”
  - `world_controller.gd` should compile cleanly under the repo’s current Godot warning policy.

## Test Plan
- Run `npm run test:godot:headless` and require a clean pass.
- Open/run the Godot project from the editor and verify the project boots directly into the existing main scene instead of the Project Manager error.
- Verify the main scene instantiates without parse errors and reaches its normal startup path with map render nodes, sync/story nodes, and sprite hooks present.

## Assumptions
- The requested outcome is a runnable Godot slice, not a new menu or launcher UX.
- `res://scenes/Main.tscn` is the intended startup scene; repo evidence supports this via README, editor metadata, and the smoke harness.
- The currently observed blocker set is exactly:
  - missing `run/main_scene` in `project.godot`
  - typed inference errors in `world_controller.gd`
