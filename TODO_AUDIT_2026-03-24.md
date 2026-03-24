# TODO Audit — 2026-03-24

Scanned repository for common backlog markers (`TODO`, `FIXME`, `HACK`, `XXX`, `BUG`) using:

```bash
rg -n "\\b(TODO|FIXME|HACK|XXX|BUG)\\b" --glob '!node_modules/**' --glob '!.git/**' --glob '!src/dataconnect-generated/**' --glob '!**/*.lock'
```

## Open TODO items

No active code TODO markers remain in the previously flagged files after the fixes applied on 2026-03-24.

## Resolved items

1. `godot/addons/tree_maps/nodes/tree_map.gd`
   - Inherited property refresh no longer resets overridden values when parent properties change.
2. `godot/addons/tree_maps/nodes/tree_map.gd`
   - Node creation in add mode now supports the TreeMap being selected directly.
3. `godot/addons/tree_maps/nodes/tree_map.gd`
   - Newly created nodes now receive inherited visual properties via explicit parent value application.
4. `godot/sprite-editor/addons/sprite_editor/sprite_editor.gd`
   - Zoom handler now ignores non-pressed wheel events to prevent duplicate zoom calls.

## Notes

- One documentation reference to a historical TODO list was found in `LORE_AUDIT_REPORT.md:972`, but it explicitly says the list was removed.
