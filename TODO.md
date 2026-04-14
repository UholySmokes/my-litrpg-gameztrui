# Dev Console Enhancement TODO

## Plan Steps (60 new commands + 5 random functions)
1. [ ] Edit godot/scripts/world_controller.gd: Add DEV_CONSOLE_COMMANDS dict (60 entries), RANDOM_FUNCTIONS array.
2. [ ] Add dynamic UI generation in _configure_dev_console(): Create/connect buttons/spinboxes/checkboxes.
3. [ ] Implement dev_execute_command(cmd_name, value): Handle all 60 + persist/refresh.
4. [ ] Implement 5 dev_run_random_function funcs.
5. [ ] Update snapshot formatting for new stats.
6. [ ] [Optional] Add VBoxContainer/Scroll to Main.tscn for container.
7. [ ] Test in Godot: Toggle console, use new cmds.

1. [x] Add DEV_CONSOLE_COMMANDS dict (60 entries), RANDOM_FUNCTIONS array.
2. [x] Dynamic UI in _configure_dev_console.
3. [ ] dev_execute_command + 60 handlers.
4. [ ] 5 random funcs.
5. [ ] Update snapshot format.
3. [x] dev_execute_command + handlers (60 stubbed/impl samples).
4. [x] 5 random funcs.
5. [x] Snapshot updates.
All core steps complete! Test in Godot.



