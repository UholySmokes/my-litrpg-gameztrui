extends Node
class_name CharacterCreationController
## Manages the character-creation state machine.
## Reads from res://data/character_options.json and emits signals as the
## player progresses through the creation steps.

signal step_changed(step_id: String, step_index: int, step_data: Dictionary)
signal creation_completed(character_data: Dictionary)

const DATA_PATH := "res://data/character_options.json"

# ── runtime state ──────────────────────────────────────────────────
var _options: Dictionary = {}          # parsed character_options.json
var _steps: Array = []                 # ordered step ids
var _step_index: int = 0

# selections
var character_name: String = ""
var selected_race: Dictionary = {}
var selected_class: Dictionary = {}
var attribute_points: Dictionary = {}
var free_points: int = 0
var selected_active_skills: Array = []
var selected_passive_skills: Array = []

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
	_steps = Array(_options.get("steps", []))
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


func select_race(race_id: String) -> void:
	for r in get_races():
		if String(r.get("id", "")) == race_id:
			selected_race = r
			return
	push_warning("CharacterCreationController: unknown race '%s'" % race_id)


func select_class(class_id: String) -> void:
	for c in get_classes():
		if String(c.get("id", "")) == class_id:
			selected_class = c
			return
	push_warning("CharacterCreationController: unknown class '%s'" % class_id)


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
	return true


# ── internals ──────────────────────────────────────────────────────

func _reset_attributes() -> void:
	var cfg := get_attribute_config()
	var base: Dictionary = cfg.get("base", {})
	attribute_points = base.duplicate()
	free_points = int(cfg.get("freePoints", 15))


func _validate_current_step() -> Dictionary:
	var step_id := get_current_step()
	match step_id:
		"name":
			if character_name.strip_edges().is_empty():
				return { "valid": false, "error": "Name is required" }
		"race":
			if selected_race.is_empty():
				return { "valid": false, "error": "Must select a race" }
		"class":
			if selected_class.is_empty():
				return { "valid": false, "error": "Must select a class" }
		"attributes":
			if free_points < 0:
				return { "valid": false, "error": "Over-spent attribute points" }
		"skills":
			# Skills step is optional in the simplified flow for now
			pass
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
		"name":
			return { "currentName": character_name }
		"race":
			return { "races": get_races(), "selected": selected_race }
		"class":
			return { "classes": get_classes(), "selected": selected_class }
		"attributes":
			return {
				"points": attribute_points.duplicate(),
				"freePoints": free_points,
				"config": get_attribute_config(),
			}
		"skills":
			return {
				"config": get_skill_config(),
				"activeSkills": selected_active_skills.duplicate(),
				"passiveSkills": selected_passive_skills.duplicate(),
			}
		"review":
			return _build_character_summary()
	return {}


func _build_character_summary() -> Dictionary:
	return {
		"name": character_name,
		"race": selected_race.duplicate(),
		"class": selected_class.duplicate(),
		"attributes": attribute_points.duplicate(),
		"freePointsRemaining": free_points,
		"activeSkills": selected_active_skills.duplicate(),
		"passiveSkills": selected_passive_skills.duplicate(),
	}


func _finalize() -> void:
	var character_data := _build_character_summary()
	print("=== CHARACTER CREATION COMPLETE (Godot) ===")
	print(JSON.stringify(character_data, "\t"))
	creation_completed.emit(character_data)
