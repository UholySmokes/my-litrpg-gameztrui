extends Panel
class_name CharacterCreationPanel
## Overlay UI for character creation. Renders the current step's title,
## options list, and navigation controls inside a CanvasLayer panel.
## Works with CharacterCreationController to drive the flow.

const CharacterCreationController := preload("res://scripts/character_creation_controller.gd")

@onready var _title_label: Label = %CreationTitleLabel
@onready var _step_label: Label = %CreationStepLabel
@onready var _body_label: RichTextLabel = %CreationBodyLabel
@onready var _back_button: Button = %CreationBackButton
@onready var _next_button: Button = %CreationNextButton
@onready var _name_input: LineEdit = %CreationNameInput

var _controller: CharacterCreationController = null
var _option_list: Array = []       # current selectable option entries
var _selected_index: int = -1      # keyboard cursor within _option_list
var _attr_keys: Array = []         # ordered attribute keys for attribute step
var _option_title: String = ""
var _option_mode: String = "single" # "single" | "multi"
var _option_intro: String = ""
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


# ── signal handlers ────────────────────────────────────────────────

func _on_step_changed(step_id: String, step_index: int, data: Dictionary) -> void:
	_option_list.clear()
	_selected_index = -1
	_attr_keys.clear()
	_option_title = ""
	_option_mode = "single"
	_option_intro = ""
	_selected_option_id = ""
	_selected_option_ids.clear()
	_name_input.hide()

	var total: int = _controller.get_total_steps()
	_step_label.text = "Step %d / %d" % [step_index + 1, total]
	_back_button.disabled = not _controller.can_go_back()

	match step_id:
		"mode":
			_render_option_step("CREATION MODE", data.get("modes", []), { "id": String(data.get("mode", "")) })
		"name":
			_render_name_step(data)
		"race":
			_render_option_step("Choose Your Race", data.get("races", []), data.get("selected", {}))
		"class":
			_render_option_step("Choose Your Class", data.get("classes", []), data.get("selected", {}))
		"multiclass":
			_render_option_step("MULTICLASS (ADVANCED)", data.get("options", []), data.get("selected", {}))
		"origin":
			_render_option_step("ORIGIN", data.get("origins", []), data.get("selected", {}))
		"attributes":
			_render_attributes_step(data)
		"skills":
			_render_option_step("STARTER SKILLS", data.get("loadouts", []), { "id": String(data.get("selectedLoadoutId", "")) })
		"perks":
			var perk_cfg: Dictionary = data.get("config", {})
			_option_intro = "Pick %dâ€“%d perks. Enter toggles, Next continues." % [
				int(perk_cfg.get("minPicks", 1)),
				int(perk_cfg.get("maxPicks", 2)),
			]
			_render_multi_option_step("PERKS", Array(perk_cfg.get("options", [])), Array(data.get("selected", [])))
		"archetype":
			_render_option_step("ARCHETYPE SYSTEM", data.get("archetypes", []), data.get("selected", {}))
		"trees":
			var tree_cfg: Dictionary = data.get("config", {})
			_option_intro = "Choose one starter tree to plan early progression."
			_render_option_step(
				"STARTER TREE (ADVANCED)",
				Array(tree_cfg.get("options", [])),
				{ "id": String((Array(data.get("selected", []))[0] if Array(data.get("selected", [])).size() > 0 else "")) }
			)
		"alignment":
			_render_option_step("ALIGNMENT", data.get("alignments", []), data.get("selected", {}))
		"review":
			_render_review_step(data)

	_update_next_state()


func _on_state_changed(character_data: Dictionary) -> void:
	if not _controller:
		return
	if not visible:
		return
	var step_id: String = _controller.get_current_step()
	match step_id:
		"perks":
			_selected_option_ids = Array(character_data.get("perks", []))
			_refresh_options_display()
			_update_next_state()
		"attributes":
			_refresh_attribute_display()
		_:
			pass


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


# ── keyboard input ─────────────────────────────────────────────────

func _unhandled_key_input(event: InputEvent) -> void:
	if not visible:
		return
	if not (event is InputEventKey and event.pressed and not event.echo):
		return

	var key := (event as InputEventKey).keycode
	var step_id: String = _controller.get_current_step() if _controller else ""

	# Name step: let LineEdit handle input
	if step_id == "name":
		return

	# Attribute step: arrow keys adjust attributes
	if step_id == "attributes" and _attr_keys.size() > 0:
		match key:
			KEY_UP:
				_selected_index = maxi(_selected_index - 1, 0)
				_refresh_attribute_display()
			KEY_DOWN:
				_selected_index = mini(_selected_index + 1, _attr_keys.size() - 1)
				_refresh_attribute_display()
			KEY_RIGHT:
				if _selected_index >= 0 and _selected_index < _attr_keys.size():
					_controller.allocate_attribute(_attr_keys[_selected_index], 1)
					_refresh_attribute_display()
			KEY_LEFT:
				if _selected_index >= 0 and _selected_index < _attr_keys.size():
					_controller.allocate_attribute(_attr_keys[_selected_index], -1)
					_refresh_attribute_display()
			KEY_ENTER, KEY_KP_ENTER:
				_controller.next_step()
		get_viewport().set_input_as_handled()
		return

	# Option steps (race, class, etc.)
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

	# Review step
	if step_id == "review":
		if key == KEY_ENTER or key == KEY_KP_ENTER:
			_controller.next_step()
			get_viewport().set_input_as_handled()


# ── render helpers ─────────────────────────────────────────────────

func _render_name_step(data: Dictionary) -> void:
	_title_label.text = "IDENTITY"
	_name_input.show()
	_name_input.text = String(data.get("currentName", ""))
	_name_input.grab_focus()
	_body_label.text = "Enter your character's name.\nPress Enter or Next to continue."


func _render_option_step(title: String, options: Array, selected: Dictionary) -> void:
	_option_title = title
	_title_label.text = title
	_option_list = options
	var sel_id := String(selected.get("id", ""))
	_option_mode = "single"
	_selected_option_id = sel_id
	_selected_index = -1

	var lines: PackedStringArray = []
	for i in options.size():
		var opt: Dictionary = options[i]
		var opt_id := String(opt.get("id", ""))
		var opt_name := String(opt.get("name", "???"))
		var opt_desc := String(opt.get("description", ""))
		var marker := ""
		if opt_id == sel_id:
			marker = " [SELECTED]"
			_selected_index = i
		elif i == 0 and _selected_index < 0:
			_selected_index = 0

		lines.append("%s%s" % [opt_name, marker])
		if not opt_desc.is_empty():
			lines.append("  %s" % opt_desc)

		# Show passive if present
		var passive: Dictionary = opt.get("passive", {})
		if not passive.is_empty():
			lines.append("  Passive: %s – %s" % [
				String(passive.get("name", "")),
				String(passive.get("description", "")),
			])
		lines.append("")

	_body_label.text = "\n".join(lines)
	_refresh_options_display()


func _render_multi_option_step(title: String, options: Array, selected_ids: Array) -> void:
	_option_title = title
	_title_label.text = title
	_option_list = options
	_option_mode = "multi"
	_selected_option_ids = selected_ids.duplicate()
	_selected_index = 0 if _option_list.size() > 0 else -1
	_refresh_options_display()


func _render_attributes_step(data: Dictionary) -> void:
	_title_label.text = "ATTRIBUTES"
	var points: Dictionary = data.get("points", {})
	var fp: int = int(data.get("freePoints", 0))
	_attr_keys = Array(points.keys())
	_attr_keys.sort()
	_selected_index = 0 if _attr_keys.size() > 0 else -1
	_refresh_attribute_display()


func _render_skills_step(data: Dictionary) -> void:
	_title_label.text = "SKILLS"
	var cfg: Dictionary = data.get("config", {})
	var max_active: int = int(cfg.get("maxActiveSkills", 3))
	var max_passive: int = int(cfg.get("maxPassiveSkills", 6))
	_body_label.text = (
		"Skill selection is simplified in the current build.\n" +
		"You will unlock skills as you progress through the world.\n\n" +
		"Max Active Slots: %d\nMax Passive Slots: %d\n\n" % [max_active, max_passive] +
		"Press Next to continue."
	)


func _render_review_step(data: Dictionary) -> void:
	_title_label.text = "REVIEW"
	_next_button.text = "CONFIRM"
	var lines: PackedStringArray = []
	lines.append("Name:  %s" % String(data.get("name", "—")))

	var race: Dictionary = data.get("race", {})
	lines.append("Race:  %s" % String(race.get("name", "—")))

	var cls: Dictionary = data.get("class", {})
	lines.append("Class: %s  (%s)" % [String(cls.get("name", "—")), String(cls.get("resourceSystem", ""))])
	lines.append("")

	lines.append("── Attributes ──")
	var attrs: Dictionary = data.get("attributes", {})
	var keys := Array(attrs.keys())
	keys.sort()
	for k in keys:
		lines.append("  %-14s %d" % [String(k).capitalize(), int(attrs[k])])
	lines.append("  Free Points:   %d" % int(data.get("freePointsRemaining", 0)))
	lines.append("")

	lines.append("Mode:  %s" % String(data.get("mode", "basic")).capitalize())

	var secondary: Dictionary = data.get("secondaryClass", {})
	if not secondary.is_empty():
		lines.append("Multiclass: %s" % String(secondary.get("name", "")))

	var origin: Dictionary = data.get("origin", {})
	lines.append("Origin: %s" % String(origin.get("name", "")))

	var arch: Dictionary = data.get("archetype", {})
	lines.append("Archetype: %s" % String(arch.get("name", "")))

	var alignment: Dictionary = data.get("alignment", {})
	lines.append("Alignment: %s" % String(alignment.get("name", "")))
	lines.append("")

	var active: Array = Array(data.get("activeSkills", []))
	var passive: Array = Array(data.get("passiveSkills", []))
	if active.size() > 0 or passive.size() > 0:
		lines.append("Starter Skills:")
		if active.size() > 0:
			lines.append("  Active:  %s" % ", ".join(active))
		if passive.size() > 0:
			lines.append("  Passive: %s" % ", ".join(passive))
		lines.append("")

	var perks: Array = Array(data.get("perks", []))
	lines.append("Perks: %s" % ("(none)" if perks.is_empty() else ", ".join(perks)))

	var trees: Array = Array(data.get("trees", []))
	if trees.size() > 0:
		lines.append("Starter Tree: %s" % ", ".join(trees))
	lines.append("")
	lines.append("Press CONFIRM to begin your adventure.")

	_body_label.text = "\n".join(lines)


func _refresh_options_display() -> void:
	if _option_list.is_empty():
		return

	if not _option_title.is_empty():
		_title_label.text = _option_title

	var lines: PackedStringArray = []
	if not _option_intro.is_empty():
		lines.append(_option_intro)
		lines.append("")
	for i in _option_list.size():
		var opt: Dictionary = _option_list[i]
		var opt_id := String(opt.get("id", ""))
		var opt_name := String(opt.get("name", "???"))
		var opt_desc := String(opt.get("description", ""))
		var cursor := "▸ " if i == _selected_index else "  "
		if _option_mode == "multi":
			var tick := "[X] " if _selected_option_ids.has(opt_id) else "[ ] "
			lines.append("%s%s%s" % [cursor, tick, opt_name])
		else:
			var marker := " [SELECTED]" if (not _selected_option_id.is_empty() and opt_id == _selected_option_id) else ""
			lines.append("%s%s%s" % [cursor, opt_name, marker])
		if not opt_desc.is_empty():
			lines.append("    %s" % opt_desc)

		var passive: Dictionary = opt.get("passive", {})
		if not passive.is_empty():
			lines.append("    Passive: %s" % String(passive.get("name", "")))

		if opt.has("activeSkills"):
			var active: Array = Array(opt.get("activeSkills", []))
			if active.size() > 0:
				lines.append("    Active:  %s" % ", ".join(active))
		if opt.has("passiveSkills"):
			var passive_sk: Array = Array(opt.get("passiveSkills", []))
			if passive_sk.size() > 0:
				lines.append("    Passive: %s" % ", ".join(passive_sk))
		lines.append("")

	_body_label.text = "\n".join(lines)


func _refresh_attribute_display() -> void:
	if not _controller:
		return
	var points: Dictionary = _controller.attribute_points
	var fp: int = _controller.free_points
	var lines: PackedStringArray = []
	lines.append("Free Points: %d" % fp)
	lines.append("Use ◀ ▶ to adjust, ▲ ▼ to navigate.\n")
	for i in _attr_keys.size():
		var k: String = _attr_keys[i]
		var val: int = int(points.get(k, 0))
		var cursor := "▸ " if i == _selected_index else "  "
		lines.append("%s%-14s  ◀ %2d ▶" % [cursor, k.capitalize(), val])
	_body_label.text = "\n".join(lines)
	_update_next_state()


func _confirm_option_selection() -> void:
	if _selected_index < 0 or _selected_index >= _option_list.size():
		return
	var opt: Dictionary = _option_list[_selected_index]
	var opt_id := String(opt.get("id", ""))
	var step_id: String = _controller.get_current_step()
	match step_id:
		"mode":
			_controller.set_creation_mode(opt_id)
			return
		"race":
			_controller.select_race(opt_id)
		"class":
			_controller.select_class(opt_id)
		"multiclass":
			_controller.select_secondary_class(opt_id)
		"origin":
			_controller.select_origin(opt_id)
		"skills":
			_controller.select_skill_loadout(opt_id)
		"perks":
			_controller.toggle_perk(opt_id)
			_selected_option_ids = _controller.selected_perks.duplicate()
			_refresh_options_display()
			_update_next_state()
			return
		"archetype":
			_controller.select_archetype(opt_id)
		"trees":
			_controller.toggle_tree(opt_id)
		"alignment":
			_controller.select_alignment(opt_id)
	_update_next_state()
	# Auto-advance after selection
	_controller.next_step()


func _update_next_state() -> void:
	if not _controller:
		return
	var on_review: bool = _controller.get_current_step() == "review"
	_next_button.text = "CONFIRM" if on_review else "NEXT"
	_next_button.disabled = not _controller.can_go_next()
