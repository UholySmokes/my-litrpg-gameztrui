extends Node
class_name CharacterCreationController
## Manages the character-creation state machine.
## Reads from res://data/character_options.json and emits signals as the
## player progresses through the creation steps.

signal step_changed(step_id: String, step_index: int, step_data: Dictionary)
signal state_changed(character_data: Dictionary)
signal creation_completed(character_data: Dictionary)

const DATA_PATH := "res://data/character_options.json"

# ── runtime state ──────────────────────────────────────────────────
var _options: Dictionary = {}          # parsed character_options.json
var _steps: Array = []                 # ordered step ids
var _step_index: int = 0
var _advanced_unlocked: bool = false
var _creation_mode: String = "basic"   # "basic" | "advanced"

# selections
var character_name: String = ""
var selected_race: Dictionary = {}
var selected_class: Dictionary = {}
var selected_secondary_class: Dictionary = {}
var selected_origin: Dictionary = {}
var selected_alignment: Dictionary = {}
var selected_archetype: Dictionary = {}
var selected_trees: Array = []
var selected_perks: Array = []
var selected_skill_loadout_id: String = ""
var attribute_points: Dictionary = {}
var free_points: int = 0
var selected_active_skills: Array = []
var selected_passive_skills: Array = []

func set_advanced_unlocked(value: bool) -> void:
	_advanced_unlocked = value
	if not _advanced_unlocked:
		_creation_mode = "basic"


func set_preferred_creation_mode(value: String) -> void:
	var normalized := value.strip_edges().to_lower()
	if normalized != "basic" and normalized != "advanced":
		normalized = "basic"
	_creation_mode = normalized

# ── public API ─────────────────────────────────────────────────────

func load_options() -> void:
	var file := FileAccess.open(DATA_PATH, FileAccess.READ)
	if file == null:
		push_error("CharacterCreationController: cannot open %s" % DATA_PATH)
		return
	var json_text := file.get_as_text()
	file.close()

	var json := JSON.new()
	var err := json.parse(json_text)
	if err != OK:
		push_error("CharacterCreationController: JSON parse error – %s" % json.get_error_message())
		return

	_options = json.data if json.data is Dictionary else {}
	if not _advanced_unlocked:
		_creation_mode = "basic"
	elif _creation_mode != "basic" and _creation_mode != "advanced":
		_creation_mode = "basic"
	_steps = _build_steps()
	_reset_selections()
	_reset_attributes()
	_step_index = 0
	_emit_step()


func get_steps() -> Array:
	return _steps.duplicate()


func get_current_step() -> String:
	if _step_index < 0 or _step_index >= _steps.size():
		return ""
	return _steps[_step_index]


func get_step_index() -> int:
	return _step_index


func get_total_steps() -> int:
	return _steps.size()


func get_races() -> Array:
	return Array(_options.get("races", []))


func get_classes() -> Array:
	return Array(_options.get("classes", []))


func get_attribute_config() -> Dictionary:
	return _options.get("attributes", {})


func get_skill_config() -> Dictionary:
	return _options.get("skills", {})

func get_origins() -> Array:
	return Array(_options.get("origins", []))


func get_alignments() -> Array:
	return Array(_options.get("alignments", []))


func get_archetypes() -> Array:
	return Array(_options.get("archetypes", []))


func get_perk_config() -> Dictionary:
	return _options.get("perks", {})


func get_tree_config() -> Dictionary:
	return _options.get("trees", {})


func get_character_summary() -> Dictionary:
	return _build_character_summary()


# ── navigation ─────────────────────────────────────────────────────

func next_step() -> bool:
	var validation := _validate_current_step()
	if not validation.valid:
		push_warning("CharacterCreationController: step '%s' invalid – %s" % [get_current_step(), validation.error])
		return false

	if _step_index >= _steps.size() - 1:
		# last step → complete
		_finalize()
		return true

	_step_index += 1
	_emit_step()
	return true


func prev_step() -> bool:
	if _step_index <= 0:
		return false
	_step_index -= 1
	_emit_step()
	return true


func can_go_next() -> bool:
	return _validate_current_step().valid


func can_go_back() -> bool:
	return _step_index > 0


# ── selection helpers ──────────────────────────────────────────────

func set_character_name(value: String) -> void:
	character_name = value.strip_edges()
	_emit_state()


func set_creation_mode(value: String) -> void:
	var normalized := value.strip_edges().to_lower()
	if normalized != "basic" and normalized != "advanced":
		normalized = "basic"
	_creation_mode = normalized
	if _creation_mode == "basic":
		selected_secondary_class = {}
		selected_trees.clear()
	_steps = _build_steps()
	_step_index = _steps.find("name")
	if _step_index < 0:
		_step_index = 0
	_emit_step()


func select_race(race_id: String) -> void:
	for r in get_races():
		if String(r.get("id", "")) == race_id:
			selected_race = r
			_emit_state()
			return
	push_warning("CharacterCreationController: unknown race '%s'" % race_id)


func select_class(class_id: String) -> void:
	for c in get_classes():
		if String(c.get("id", "")) == class_id:
			selected_class = c
			_emit_state()
			return
	push_warning("CharacterCreationController: unknown class '%s'" % class_id)

func select_secondary_class(class_id: String) -> void:
	if class_id.strip_edges().is_empty() or class_id == "__none__":
		selected_secondary_class = {}
		_emit_state()
		return
	for c in get_classes():
		if String(c.get("id", "")) == class_id:
			selected_secondary_class = c
			_emit_state()
			return
	push_warning("CharacterCreationController: unknown multiclass '%s'" % class_id)


func select_origin(origin_id: String) -> void:
	for o in get_origins():
		if String(o.get("id", "")) == origin_id:
			selected_origin = o
			_emit_state()
			return
	push_warning("CharacterCreationController: unknown origin '%s'" % origin_id)


func select_alignment(alignment_id: String) -> void:
	for a in get_alignments():
		if String(a.get("id", "")) == alignment_id:
			selected_alignment = a
			_emit_state()
			return
	push_warning("CharacterCreationController: unknown alignment '%s'" % alignment_id)


func select_archetype(archetype_id: String) -> void:
	for a in get_archetypes():
		if String(a.get("id", "")) == archetype_id:
			selected_archetype = a
			_emit_state()
			return
	push_warning("CharacterCreationController: unknown archetype '%s'" % archetype_id)


func toggle_perk(perk_id: String) -> void:
	var cfg := get_perk_config()
	var max_picks: int = int(cfg.get("maxPicks", 2))
	if selected_perks.has(perk_id):
		selected_perks.erase(perk_id)
		_emit_state()
		return
	if selected_perks.size() >= max_picks:
		return
	selected_perks.append(perk_id)
	_emit_state()


func toggle_active_skill(skill_id: String) -> void:
	var cfg := get_skill_config()
	var max_active: int = int(cfg.get("maxActiveSkills", 3))
	if selected_active_skills.has(skill_id):
		selected_active_skills.erase(skill_id)
		_emit_state()
		return
	if selected_active_skills.size() >= max_active:
		return
	selected_active_skills.append(skill_id)
	_emit_state()


func toggle_passive_skill(skill_id: String) -> void:
	var cfg := get_skill_config()
	var max_passive: int = int(cfg.get("maxPassiveSkills", 6))
	if selected_passive_skills.has(skill_id):
		selected_passive_skills.erase(skill_id)
		_emit_state()
		return
	if selected_passive_skills.size() >= max_passive:
		return
	selected_passive_skills.append(skill_id)
	_emit_state()

func select_skill_loadout(loadout_id: String) -> void:
	var cfg := get_skill_config()
	var loadouts: Array = Array(cfg.get("loadouts", []))
	for raw in loadouts:
		if typeof(raw) != TYPE_DICTIONARY:
			continue
		var entry: Dictionary = raw
		if String(entry.get("id", "")) != loadout_id:
			continue
		selected_skill_loadout_id = loadout_id
		selected_active_skills = Array(entry.get("activeSkills", []))
		selected_passive_skills = Array(entry.get("passiveSkills", []))
		_emit_state()
		return


func toggle_tree(tree_id: String) -> void:
	var cfg := get_tree_config()
	var max_picks: int = int(cfg.get("maxPicks", 1))
	if selected_trees.has(tree_id):
		selected_trees.erase(tree_id)
		_emit_state()
		return
	if selected_trees.size() >= max_picks:
		selected_trees.clear()
	selected_trees.append(tree_id)
	_emit_state()


func allocate_attribute(attr: String, delta: int) -> bool:
	if not attribute_points.has(attr):
		return false
	var new_val: int = attribute_points[attr] + delta
	var cfg := get_attribute_config()
	var min_val: int = int(cfg.get("minValue", 1))
	var max_val: int = int(cfg.get("maxValue", 30))
	if new_val < min_val or new_val > max_val:
		return false
	if delta > 0 and free_points < delta:
		return false
	attribute_points[attr] = new_val
	free_points -= delta
	_emit_state()
	return true


# ── internals ──────────────────────────────────────────────────────

func _build_steps() -> Array:
	var raw_steps := Array(_options.get("steps", []))
	var steps: Array = []
	for s in raw_steps:
		var step_id := String(s)
		if not _advanced_unlocked and step_id == "mode":
			continue
		if _creation_mode != "advanced" and (step_id == "multiclass" or step_id == "trees"):
			continue
		steps.append(step_id)
	return steps


func _reset_attributes() -> void:
	var cfg := get_attribute_config()
	var base: Dictionary = cfg.get("base", {})
	attribute_points = base.duplicate()
	free_points = int(cfg.get("freePoints", 15))


func _reset_selections() -> void:
	character_name = ""
	selected_race = {}
	selected_class = {}
	selected_secondary_class = {}
	selected_origin = {}
	selected_alignment = {}
	selected_archetype = {}
	selected_trees.clear()
	selected_perks.clear()
	selected_skill_loadout_id = ""
	selected_active_skills.clear()
	selected_passive_skills.clear()


func _validate_current_step() -> Dictionary:
	var step_id := get_current_step()
	match step_id:
		"mode":
			if not _advanced_unlocked:
				return { "valid": true, "error": "" }
			if _creation_mode != "basic" and _creation_mode != "advanced":
				return { "valid": false, "error": "Choose Basic or Advanced mode" }
		"name":
			if character_name.strip_edges().is_empty():
				return { "valid": false, "error": "Name is required" }
		"race":
			if selected_race.is_empty():
				return { "valid": false, "error": "Must select a race" }
		"class":
			if selected_class.is_empty():
				return { "valid": false, "error": "Must select a class" }
		"origin":
			if selected_origin.is_empty():
				return { "valid": false, "error": "Must select an origin" }
		"attributes":
			if free_points < 0:
				return { "valid": false, "error": "Over-spent attribute points" }
		"skills":
			var cfg := get_skill_config()
			var min_active: int = int(cfg.get("minActiveSkills", 0))
			var min_passive: int = int(cfg.get("minPassiveSkills", 0))
			if selected_active_skills.size() < min_active:
				return { "valid": false, "error": "Select at least one active skill" }
			if selected_passive_skills.size() < min_passive:
				return { "valid": false, "error": "Select more passive skills" }
		"perks":
			var cfg := get_perk_config()
			var min_picks: int = int(cfg.get("minPicks", 1))
			if selected_perks.size() < min_picks:
				return { "valid": false, "error": "Pick at least one perk" }
		"archetype":
			if selected_archetype.is_empty():
				return { "valid": false, "error": "Choose an archetype" }
		"trees":
			if _creation_mode == "advanced":
				var cfg := get_tree_config()
				var min_picks: int = int(cfg.get("minPicks", 0))
				if selected_trees.size() < min_picks:
					return { "valid": false, "error": "Choose a starter tree" }
		"alignment":
			if selected_alignment.is_empty():
				return { "valid": false, "error": "Choose an alignment" }
		"review":
			# Review is always valid if we got here
			pass
	return { "valid": true, "error": "" }


func _emit_step() -> void:
	var step_id := get_current_step()
	var data := _build_step_data(step_id)
	step_changed.emit(step_id, _step_index, data)


func _build_step_data(step_id: String) -> Dictionary:
	match step_id:
		"mode":
			return {
				"advancedUnlocked": _advanced_unlocked,
				"mode": _creation_mode,
				"modes": [
					{ "id": "basic", "name": "Basic", "description": "Fast creation. Depth comes at level-ups." },
					{ "id": "advanced", "name": "Advanced", "description": "Adds multiclass + starter tree planning." }
				],
			}
		"name":
			return { "currentName": character_name }
		"race":
			return { "races": get_races(), "selected": selected_race }
		"class":
			return { "classes": get_classes(), "selected": selected_class }
		"multiclass":
			var options: Array = [{ "id": "__none__", "name": "None", "description": "Stay single-class for now." }]
			for c in get_classes():
				options.append(c)
			return {
				"enabled": _creation_mode == "advanced",
				"options": options,
				"selected": selected_secondary_class,
			}
		"origin":
			return { "origins": get_origins(), "selected": selected_origin }
		"attributes":
			return {
				"points": attribute_points.duplicate(),
				"freePoints": free_points,
				"config": get_attribute_config(),
			}
		"skills":
			return {
				"config": get_skill_config(),
				"loadouts": Array(get_skill_config().get("loadouts", [])),
				"selectedLoadoutId": selected_skill_loadout_id,
				"activeSkills": selected_active_skills.duplicate(),
				"passiveSkills": selected_passive_skills.duplicate(),
			}
		"perks":
			return {
				"config": get_perk_config(),
				"selected": selected_perks.duplicate(),
			}
		"archetype":
			return { "archetypes": get_archetypes(), "selected": selected_archetype }
		"trees":
			return {
				"enabled": _creation_mode == "advanced",
				"config": get_tree_config(),
				"selected": selected_trees.duplicate(),
			}
		"alignment":
			return { "alignments": get_alignments(), "selected": selected_alignment }
		"review":
			return _build_character_summary()
	return {}


func _build_character_summary() -> Dictionary:
	return {
		"mode": _creation_mode,
		"name": character_name,
		"race": selected_race.duplicate(),
		"class": selected_class.duplicate(),
		"secondaryClass": selected_secondary_class.duplicate(),
		"origin": selected_origin.duplicate(),
		"attributes": attribute_points.duplicate(),
		"freePointsRemaining": free_points,
		"skillLoadoutId": selected_skill_loadout_id,
		"activeSkills": selected_active_skills.duplicate(),
		"passiveSkills": selected_passive_skills.duplicate(),
		"perks": selected_perks.duplicate(),
		"archetype": selected_archetype.duplicate(),
		"trees": selected_trees.duplicate(),
		"alignment": selected_alignment.duplicate(),
	}


func _finalize() -> void:
	var character_data := _build_character_summary()
	print("=== CHARACTER CREATION COMPLETE (Godot) ===")
	print(JSON.stringify(character_data, "\t"))
	creation_completed.emit(character_data)


func _emit_state() -> void:
	state_changed.emit(_build_character_summary())
