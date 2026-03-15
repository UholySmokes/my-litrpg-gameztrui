extends Panel
class_name CharacterCreationPanel

const CharacterCreationController := preload("res://scripts/character_creation_controller.gd")

@onready var _title_label: Label = %CreationTitleLabel
@onready var _step_label: Label = %CreationStepLabel
@onready var _body_label: RichTextLabel = %CreationBodyLabel
@onready var _back_button: Button = %CreationBackButton
@onready var _next_button: Button = %CreationNextButton
@onready var _name_input: LineEdit = %CreationNameInput

var _controller: CharacterCreationController = null
var _current_step_id: String = ""
var _current_step_data: Dictionary = {}
var _option_list: Array = []
var _selected_index: int = -1
var _attr_keys: Array = []
var _option_title: String = ""
var _option_intro: String = ""
var _option_mode: String = "single"
var _selected_option_id: String = ""
var _selected_option_ids: Array = []


func bind_controller(ctrl: CharacterCreationController) -> void:
	_controller = ctrl
	_controller.step_changed.connect(_on_step_changed)
	_controller.state_changed.connect(_on_state_changed)
	_back_button.pressed.connect(_on_back_pressed)
	_next_button.pressed.connect(_on_next_pressed)
	_name_input.text_submitted.connect(_on_name_submitted)
	_name_input.text_changed.connect(_on_name_changed)
	_name_input.hide()


func _on_step_changed(step_id: String, step_index: int, data: Dictionary) -> void:
	_current_step_id = step_id
	_current_step_data = data.duplicate(true)
	_option_list.clear()
	_attr_keys.clear()
	_selected_index = -1
	_option_title = ""
	_option_intro = ""
	_option_mode = "single"
	_selected_option_id = ""
	_selected_option_ids.clear()
	_name_input.hide()

	var total := _controller.get_total_steps()
	_step_label.text = "Step %d / %d" % [step_index + 1, total]
	_back_button.disabled = not _controller.can_go_back()

	match step_id:
		"mode":
			_render_option_step(
				"CREATION MODE",
				"Choose how much planning you want to do up front.",
				Array(data.get("modes", [])),
				{"id": String(data.get("mode", ""))}
			)
		"name":
			_render_name_step(data)
		"system":
			_render_option_step(
				"SYSTEM / CHEAT",
				"Choose your core System before the rest of creation. It will change the options and skills available later.",
				Array(data.get("systems", [])),
				Dictionary(data.get("selected", {}))
			)
		"origin":
			_render_option_step(
				"ORIGIN",
				"Pick the background that fits your system and early route.",
				Array(data.get("origins", [])),
				Dictionary(data.get("selected", {})),
				Array(data.get("recommendedIds", []))
			)
		"race":
			_render_option_step(
				"RACE",
				"Choose a race. System recommendations are highlighted first.",
				Array(data.get("races", [])),
				Dictionary(data.get("selected", {})),
				Array(data.get("recommendedIds", []))
			)
		"class":
			_render_option_step(
				"CLASS",
				"Pick your main class. This combines with race, profession, and system to shape your starting skills.",
				Array(data.get("classes", [])),
				Dictionary(data.get("selected", {})),
				Array(data.get("recommendedIds", []))
			)
		"multiclass":
			_render_option_step(
				"MULTICLASS",
				"Advanced mode only. Choose a secondary class or stay focused on one path.",
				Array(data.get("options", [])),
				Dictionary(data.get("selected", {}))
			)
		"profession":
			_render_option_step(
				"PROFESSION",
				"Choose the craft or trade that adds extra utility and starter skills.",
				Array(data.get("professions", [])),
				Dictionary(data.get("selected", {})),
				Array(data.get("recommendedIds", []))
			)
		"attributes":
			_render_attributes_step(data)
		"skills":
			_render_skills_step(data)
		"perks":
			var perk_cfg: Dictionary = data.get("config", {})
			_render_multi_option_step(
				"PERKS",
				"Pick %d-%d perks. Enter toggles the highlighted entry and Next continues."
				% [int(perk_cfg.get("minPicks", 1)), int(perk_cfg.get("maxPicks", 2))],
				Array(perk_cfg.get("options", [])),
				Array(data.get("selected", []))
			)
		"trees":
			var tree_cfg: Dictionary = data.get("config", {})
			_render_option_step(
				"STARTER TREE",
				"Advanced mode only. Choose the branch you want to plan around first.",
				Array(tree_cfg.get("options", [])),
				{"id": String((Array(data.get("selected", []))[0] if Array(data.get("selected", [])).size() > 0 else ""))}
			)
		"alignment":
			_render_option_step(
				"ALIGNMENT",
				"Choose the moral axis your run starts from.",
				Array(data.get("alignments", [])),
				Dictionary(data.get("selected", {}))
			)
		"review":
			_render_review_step(data)

	_update_next_state()


func _on_state_changed(_character_data: Dictionary) -> void:
	if _controller == null or not visible:
		return
	_on_step_changed(_controller.get_current_step(), _controller.get_step_index(), _controller.get_step_data())


func _on_back_pressed() -> void:
	if _controller:
		_controller.prev_step()


func _on_next_pressed() -> void:
	if _controller:
		_controller.next_step()


func _on_name_submitted(_text: String) -> void:
	if _controller:
		_controller.next_step()


func _on_name_changed(new_text: String) -> void:
	if _controller:
		_controller.set_character_name(new_text)
		_update_next_state()


func _unhandled_key_input(event: InputEvent) -> void:
	if not visible or _controller == null:
		return
	if not (event is InputEventKey and event.pressed and not event.echo):
		return

	var key := (event as InputEventKey).keycode
	if _current_step_id == "name":
		return

	if _current_step_id == "attributes" and _attr_keys.size() > 0:
		match key:
			KEY_UP:
				_selected_index = maxi(_selected_index - 1, 0)
				_refresh_attribute_display()
			KEY_DOWN:
				_selected_index = mini(_selected_index + 1, _attr_keys.size() - 1)
				_refresh_attribute_display()
			KEY_RIGHT:
				if _selected_index >= 0 and _selected_index < _attr_keys.size():
					_controller.allocate_attribute(String(_attr_keys[_selected_index]), 1)
			KEY_LEFT:
				if _selected_index >= 0 and _selected_index < _attr_keys.size():
					_controller.allocate_attribute(String(_attr_keys[_selected_index]), -1)
			KEY_ENTER, KEY_KP_ENTER:
				_controller.next_step()
		get_viewport().set_input_as_handled()
		return

	if _option_list.size() > 0:
		match key:
			KEY_UP:
				_selected_index = maxi(_selected_index - 1, 0)
				_refresh_options_display()
			KEY_DOWN:
				_selected_index = mini(_selected_index + 1, _option_list.size() - 1)
				_refresh_options_display()
			KEY_ENTER, KEY_KP_ENTER:
				_confirm_option_selection()
		get_viewport().set_input_as_handled()
		return

	if _current_step_id == "review" and (key == KEY_ENTER or key == KEY_KP_ENTER):
		_controller.next_step()
		get_viewport().set_input_as_handled()


func _render_name_step(data: Dictionary) -> void:
	_title_label.text = "NAME"
	_name_input.show()
	_name_input.text = String(data.get("currentName", ""))
	_name_input.grab_focus()
	_body_label.text = "Enter your character's name.\nPress Enter or Next to continue."


func _render_option_step(
	title: String,
	intro: String,
	options: Array,
	selected: Dictionary,
	recommended_ids: Array = []
) -> void:
	_option_title = title
	_option_intro = intro
	_option_mode = "single"
	_option_list = options.duplicate(true)
	_selected_option_id = String(selected.get("id", ""))
	_selected_index = 0 if _option_list.size() > 0 else -1
	if not _selected_option_id.is_empty():
		for index in _option_list.size():
			var entry: Dictionary = _option_list[index]
			if String(entry.get("id", "")) == _selected_option_id:
				_selected_index = index
				break
	_current_step_data["recommendedIds"] = recommended_ids.duplicate()
	_refresh_options_display()


func _render_multi_option_step(title: String, intro: String, options: Array, selected_ids: Array) -> void:
	_option_title = title
	_option_intro = intro
	_option_mode = "multi"
	_option_list = options.duplicate(true)
	_selected_option_ids = selected_ids.duplicate()
	_selected_index = 0 if _option_list.size() > 0 else -1
	_refresh_options_display()


func _render_attributes_step(data: Dictionary) -> void:
	_title_label.text = "ATTRIBUTES"
	var points: Dictionary = data.get("points", {})
	_attr_keys = Array(points.keys())
	_attr_keys.sort()
	_selected_index = 0 if _attr_keys.size() > 0 else -1
	_refresh_attribute_display()


func _render_skills_step(data: Dictionary) -> void:
	_option_title = "SKILLS"
	_option_intro = "Pick a loadout or build your own skill package. System and profession grants are fixed."
	_option_mode = "skills"
	_option_list.clear()

	for raw in Array(data.get("loadouts", [])):
		if typeof(raw) != TYPE_DICTIONARY:
			continue
		var loadout: Dictionary = raw
		_option_list.append({
			"kind": "loadout",
			"id": String(loadout.get("id", "")),
			"entry": loadout,
		})

	for raw in Array(data.get("activeSkillOptions", [])):
		if typeof(raw) != TYPE_DICTIONARY:
			continue
		var skill: Dictionary = raw
		_option_list.append({
			"kind": "active",
			"id": String(skill.get("id", "")),
			"entry": skill,
		})

	for raw in Array(data.get("passiveSkillOptions", [])):
		if typeof(raw) != TYPE_DICTIONARY:
			continue
		var passive: Dictionary = raw
		_option_list.append({
			"kind": "passive",
			"id": String(passive.get("id", "")),
			"entry": passive,
		})

	_selected_index = 0 if _option_list.size() > 0 else -1
	var selected_loadout_id := String(data.get("selectedLoadoutId", ""))
	if not selected_loadout_id.is_empty():
		for index in _option_list.size():
			var row: Dictionary = _option_list[index]
			if String(row.get("kind", "")) == "loadout" and String(row.get("id", "")) == selected_loadout_id:
				_selected_index = index
				break
	_refresh_options_display()


func _render_review_step(data: Dictionary) -> void:
	_title_label.text = "REVIEW"
	_next_button.text = "CONFIRM"
	var lines: PackedStringArray = []
	lines.append("Name: %s" % _display_text(String(data.get("name", "")), "None"))
	lines.append("Mode: %s" % String(data.get("mode", "basic")).capitalize())
	lines.append("")

	lines.append("System: %s" % _entity_name(Dictionary(data.get("archetypeSystem", {}))))
	lines.append("Origin: %s" % _entity_name(Dictionary(data.get("origin", {}))))
	lines.append("Race: %s" % _entity_name(Dictionary(data.get("race", {}))))
	lines.append("Class: %s" % _entity_name(Dictionary(data.get("class", {}))))

	var secondary: Dictionary = data.get("secondaryClass", {})
	if not secondary.is_empty():
		lines.append("Multiclass: %s" % _entity_name(secondary))

	lines.append("Profession: %s" % _entity_name(Dictionary(data.get("profession", {}))))
	lines.append("Alignment: %s" % _entity_name(Dictionary(data.get("alignment", {}))))
	lines.append("")

	lines.append("Attributes:")
	var attrs: Dictionary = data.get("attributes", {})
	var keys := Array(attrs.keys())
	keys.sort()
	for key in keys:
		lines.append("  %-12s %d" % [String(key).capitalize(), int(attrs[key])])
	lines.append("  Free Points: %d" % int(data.get("freePointsRemaining", 0)))
	lines.append("")

	var active_skill_names := _skill_name_list(Array(data.get("activeSkills", [])))
	var passive_skill_names := _skill_name_list(Array(data.get("passiveSkills", [])))
	lines.append("Selected Active Skills: %s" % _join_or_none(active_skill_names))
	lines.append("Selected Passive Skills: %s" % _join_or_none(passive_skill_names))

	var system_granted: Dictionary = data.get("systemGrantedSkills", {})
	lines.append(
		"System Granted Skills: %s"
		% _join_or_none(
			_skill_name_list(Array(system_granted.get("active", [])))
			+ _skill_name_list(Array(system_granted.get("passive", [])))
		)
	)

	var profession_granted: Dictionary = data.get("professionGrantedSkills", {})
	lines.append(
		"Profession Granted Skills: %s"
		% _join_or_none(
			_skill_name_list(Array(profession_granted.get("active", [])))
			+ _skill_name_list(Array(profession_granted.get("passive", [])))
		)
	)

	var perks: Array = Array(data.get("perks", []))
	lines.append("Perks: %s" % _join_or_none(perks))

	var trees: Array = Array(data.get("trees", []))
	lines.append("Starter Trees: %s" % _join_or_none(trees))

	_body_label.text = "\n".join(lines)


func _refresh_options_display() -> void:
	if _option_mode == "skills":
		_refresh_skill_display()
		return

	_title_label.text = _option_title
	var lines: PackedStringArray = []
	if not _option_intro.is_empty():
		lines.append(_option_intro)
		lines.append("")

	var recommended_ids := Array(_current_step_data.get("recommendedIds", []))
	for index in _option_list.size():
		var entry: Dictionary = _option_list[index]
		var entry_id := String(entry.get("id", ""))
		var cursor := "-> " if index == _selected_index else "   "
		var selected_marker := ""
		if _option_mode == "multi":
			selected_marker = "[X] " if _selected_option_ids.has(entry_id) else "[ ] "
		elif entry_id == _selected_option_id and not entry_id.is_empty():
			selected_marker = "[SELECTED] "
		var recommended_marker := " [RECOMMENDED]" if recommended_ids.has(entry_id) else ""
		lines.append("%s%s%s%s" % [cursor, selected_marker, String(entry.get("name", "Unknown")), recommended_marker])
		var description := String(entry.get("description", ""))
		if not description.is_empty():
			lines.append("    %s" % description)
		if entry.has("summary") and not String(entry.get("summary", "")).is_empty():
			lines.append("    Summary: %s" % String(entry.get("summary", "")))
		if entry.has("category"):
			lines.append("    Category: %s" % String(entry.get("category", "")))
		lines.append("")

	_body_label.text = "\n".join(lines)


func _refresh_skill_display() -> void:
	_title_label.text = _option_title
	var data := _current_step_data
	var selected_loadout_id := String(data.get("selectedLoadoutId", ""))
	var selected_active_ids := Array(data.get("activeSkills", []))
	var selected_passive_ids := Array(data.get("passiveSkills", []))
	var required_active := int(data.get("requiredActiveSkills", 3))
	var required_passive := int(data.get("requiredPassiveSkills", 6))
	var slot_bonuses: Dictionary = data.get("slotBonuses", {})

	var lines: PackedStringArray = []
	lines.append(_option_intro)
	lines.append(
		"Required picks: %d active, %d passive. Slot bonuses: +%d active, +%d passive."
		% [
			required_active,
			required_passive,
			int(slot_bonuses.get("active", 0)),
			int(slot_bonuses.get("passive", 0)),
		]
	)
	lines.append("")
	lines.append(
		"Granted by System: %s"
		% _join_or_none(
			_skill_name_list(Array(data.get("grantedSystemActiveSkills", [])))
			+ _skill_name_list(Array(data.get("grantedSystemPassiveSkills", [])))
		)
	)
	lines.append(
		"Granted by Profession: %s"
		% _join_or_none(
			_skill_name_list(Array(data.get("grantedProfessionActiveSkills", [])))
			+ _skill_name_list(Array(data.get("grantedProfessionPassiveSkills", [])))
		)
	)
	var blocked_skill_ids := Array(data.get("blockedSkillIds", []))
	if blocked_skill_ids.size() > 0:
		lines.append("Blocked by System: %s" % ", ".join(blocked_skill_ids))
	lines.append("")

	lines.append("Loadouts:")
	for index in _option_list.size():
		var row: Dictionary = _option_list[index]
		if String(row.get("kind", "")) != "loadout":
			continue
		var loadout: Dictionary = row.get("entry", {})
		var cursor := "-> " if index == _selected_index else "   "
		var marker := "[SELECTED] " if String(row.get("id", "")) == selected_loadout_id else ""
		lines.append("%s%s%s" % [cursor, marker, String(loadout.get("name", "Loadout"))])
		if not String(loadout.get("description", "")).is_empty():
			lines.append("    %s" % String(loadout.get("description", "")))
	lines.append("")

	lines.append("Elective Active Skills (%d/%d):" % [selected_active_ids.size(), required_active])
	for index in _option_list.size():
		var row: Dictionary = _option_list[index]
		if String(row.get("kind", "")) != "active":
			continue
		var skill: Dictionary = row.get("entry", {})
		var skill_id := String(row.get("id", ""))
		var cursor := "-> " if index == _selected_index else "   "
		var marker := "[X] " if selected_active_ids.has(skill_id) else "[ ] "
		lines.append("%s%s%s" % [cursor, marker, String(skill.get("name", skill_id))])
		if not String(skill.get("description", "")).is_empty():
			lines.append("    %s" % String(skill.get("description", "")))
	lines.append("")

	lines.append("Elective Passive Skills (%d/%d):" % [selected_passive_ids.size(), required_passive])
	for index in _option_list.size():
		var row: Dictionary = _option_list[index]
		if String(row.get("kind", "")) != "passive":
			continue
		var passive: Dictionary = row.get("entry", {})
		var passive_id := String(row.get("id", ""))
		var cursor := "-> " if index == _selected_index else "   "
		var marker := "[X] " if selected_passive_ids.has(passive_id) else "[ ] "
		lines.append("%s%s%s" % [cursor, marker, String(passive.get("name", passive_id))])
		if not String(passive.get("description", "")).is_empty():
			lines.append("    %s" % String(passive.get("description", "")))

	_body_label.text = "\n".join(lines)


func _refresh_attribute_display() -> void:
	if _controller == null:
		return
	var data := _controller.get_step_data("attributes")
	var points: Dictionary = data.get("points", {})
	var free_points := int(data.get("freePoints", 0))
	var bias: Dictionary = data.get("attributeBias", {})
	var lines: PackedStringArray = []
	lines.append("Free Points: %d" % free_points)
	lines.append("Use Left/Right to adjust and Up/Down to move.")
	var primary := Array(bias.get("primary", []))
	var secondary := Array(bias.get("secondary", []))
	if primary.size() > 0:
		lines.append("Primary Bias: %s" % ", ".join(primary))
	if secondary.size() > 0:
		lines.append("Secondary Bias: %s" % ", ".join(secondary))
	lines.append("")
	for index in _attr_keys.size():
		var key := String(_attr_keys[index])
		var cursor := "-> " if index == _selected_index else "   "
		lines.append("%s%-12s %d" % [cursor, key.capitalize(), int(points.get(key, 0))])
	_body_label.text = "\n".join(lines)
	_update_next_state()


func _confirm_option_selection() -> void:
	if _controller == null or _selected_index < 0 or _selected_index >= _option_list.size():
		return
	var step_id := _controller.get_current_step()
	var row: Dictionary = _option_list[_selected_index]
	var row_id := String(row.get("id", ""))

	match step_id:
		"mode":
			_controller.set_creation_mode(row_id)
			return
		"system":
			_controller.select_system(row_id)
		"origin":
			_controller.select_origin(row_id)
		"race":
			_controller.select_race(row_id)
		"class":
			_controller.select_class(row_id)
		"multiclass":
			_controller.select_secondary_class(row_id)
		"profession":
			_controller.select_profession(row_id)
		"alignment":
			_controller.select_alignment(row_id)
		"trees":
			_controller.toggle_tree(row_id)
		"perks":
			_controller.toggle_perk(row_id)
			return
		"skills":
			var kind := String(row.get("kind", ""))
			if kind == "loadout":
				_controller.select_skill_loadout(row_id)
			elif kind == "active":
				_controller.toggle_active_skill(row_id)
			elif kind == "passive":
				_controller.toggle_passive_skill(row_id)
			return
		_:
			return

	_update_next_state()
	_controller.next_step()


func _update_next_state() -> void:
	if _controller == null:
		return
	var on_review := _controller.get_current_step() == "review"
	_next_button.text = "CONFIRM" if on_review else "NEXT"
	_next_button.disabled = not _controller.can_go_next()


func _entity_name(entry: Dictionary) -> String:
	var value := String(entry.get("name", "")).strip_edges()
	return value if not value.is_empty() else "None"


func _display_text(value: String, fallback: String) -> String:
	return value if not value.strip_edges().is_empty() else fallback


func _skill_name_list(entries: Array) -> Array:
	var names: Array = []
	for raw in entries:
		if typeof(raw) != TYPE_DICTIONARY:
			continue
		var name := String((raw as Dictionary).get("name", "")).strip_edges()
		if name.is_empty():
			continue
		names.append(name)
	return names


func _join_or_none(values: Array) -> String:
	if values.is_empty():
		return "None"
	var names: PackedStringArray = []
	for raw in values:
		names.append(String(raw))
	return ", ".join(names)
