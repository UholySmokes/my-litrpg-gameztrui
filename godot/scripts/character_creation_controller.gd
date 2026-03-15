extends Node
class_name CharacterCreationController

signal step_changed(step_id: String, step_index: int, step_data: Dictionary)
signal state_changed(character_data: Dictionary)
signal creation_completed(character_data: Dictionary)

const DATA_PATH := "res://data/character_options.json"

var _options: Dictionary = {}
var _steps: Array = []
var _step_index: int = 0
var _advanced_unlocked: bool = false
var _creation_mode: String = "basic"

var character_name: String = ""
var selected_system: Dictionary = {}
var selected_origin: Dictionary = {}
var selected_race: Dictionary = {}
var selected_class: Dictionary = {}
var selected_secondary_class: Dictionary = {}
var selected_profession: Dictionary = {}
var selected_alignment: Dictionary = {}
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


func load_options() -> void:
	var file := FileAccess.open(DATA_PATH, FileAccess.READ)
	if file == null:
		push_error("CharacterCreationController: cannot open %s" % DATA_PATH)
		return

	var json_text := file.get_as_text()
	file.close()

	var json := JSON.new()
	if json.parse(json_text) != OK:
		push_error("CharacterCreationController: JSON parse error - %s" % json.get_error_message())
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
	return String(_steps[_step_index])


func get_step_index() -> int:
	return _step_index


func get_total_steps() -> int:
	return _steps.size()


func get_systems() -> Array:
	return _get_array("systems")


func get_origins() -> Array:
	return _get_system_option_array("origins")


func get_races() -> Array:
	return _get_system_option_array("races")


func get_classes() -> Array:
	return _get_system_option_array("classes")


func get_secondary_classes() -> Array:
	var options := _get_system_option_array("secondaryClasses", "classes")
	var filtered: Array = []
	var selected_class_id := String(selected_class.get("id", ""))
	for raw in options:
		if typeof(raw) != TYPE_DICTIONARY:
			continue
		var entry: Dictionary = raw
		if String(entry.get("id", "")) == selected_class_id:
			continue
		filtered.append(entry)
	return filtered


func get_professions() -> Array:
	return _get_system_option_array("professions")


func get_alignments() -> Array:
	return _get_array("alignments")


func get_perk_config() -> Dictionary:
	var base_cfg: Dictionary = Dictionary(_options.get("perks", {})).duplicate(true)
	base_cfg["options"] = _get_system_option_array("perks", "perks")
	return base_cfg


func get_tree_config() -> Dictionary:
	var base_cfg: Dictionary = Dictionary(_options.get("trees", {})).duplicate(true)
	base_cfg["options"] = _get_system_option_array("starterTrees", "trees")
	return base_cfg


func get_attribute_config() -> Dictionary:
	return Dictionary(_options.get("attributes", {})).duplicate(true)


func get_current_skill_pool() -> Dictionary:
	var system_grants := _resolve_system_skill_grants()
	var profession_grants := _resolve_profession_skill_grants()
	if selected_system.is_empty() or selected_race.is_empty() or selected_class.is_empty():
		return {
			"activeSkills": [],
			"passiveSkills": [],
			"grantedSystemActiveSkills": system_grants.active,
			"grantedSystemPassiveSkills": system_grants.passive,
			"grantedProfessionActiveSkills": profession_grants.active,
			"grantedProfessionPassiveSkills": profession_grants.passive,
			"grantedActiveSkills": _merge_skill_entries_unique(system_grants.active + profession_grants.active),
			"grantedPassiveSkills": _merge_skill_entries_unique(system_grants.passive + profession_grants.passive),
			"loadouts": [],
			"requiredActiveSkills": 3,
			"requiredPassiveSkills": 6,
			"minActiveSkills": 3,
			"minPassiveSkills": 6,
			"blockedSkillIds": [],
			"slotBonuses": {"active": 0, "passive": 0},
		}

	var signature := _build_skill_signature(
		String(selected_system.get("id", "")),
		String(selected_race.get("id", "")),
		String(selected_class.get("id", "")),
	)
	var pools_by_signature: Dictionary = Dictionary(_options.get("skillPoolsBySignature", {}))
	var base_pool: Dictionary = Dictionary(pools_by_signature.get(signature, {})).duplicate(true)
	base_pool = _hydrate_skill_pool(base_pool)
	var combined_granted_active := _merge_skill_entries_unique(
		Array(base_pool.get("grantedActiveSkills", [])) + system_grants.active + profession_grants.active
	)
	var combined_granted_passive := _merge_skill_entries_unique(
		Array(base_pool.get("grantedPassiveSkills", [])) + system_grants.passive + profession_grants.passive
	)
	base_pool["grantedSystemActiveSkills"] = system_grants.active
	base_pool["grantedSystemPassiveSkills"] = system_grants.passive
	base_pool["grantedProfessionActiveSkills"] = profession_grants.active
	base_pool["grantedProfessionPassiveSkills"] = profession_grants.passive
	base_pool["grantedActiveSkills"] = combined_granted_active
	base_pool["grantedPassiveSkills"] = combined_granted_passive
	base_pool["slotBonuses"] = Dictionary(base_pool.get("slotBonuses", {"active": 0, "passive": 0}))
	return base_pool


func get_current_system_option_state() -> Dictionary:
	return _get_system_option_state()


func get_character_summary() -> Dictionary:
	return _build_character_summary()


func get_step_data(step_id: String = "") -> Dictionary:
	var target_step := step_id if not step_id.is_empty() else get_current_step()
	return _build_step_data(target_step)


func next_step() -> bool:
	var validation := _validate_current_step()
	if not bool(validation.get("valid", false)):
		push_warning(
			"CharacterCreationController: step '%s' invalid - %s"
			% [get_current_step(), String(validation.get("error", "unknown"))]
		)
		return false

	if _step_index >= _steps.size() - 1:
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
	return bool(_validate_current_step().get("valid", false))


func can_go_back() -> bool:
	return _step_index > 0


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
	_prune_downstream_selections()
	_emit_step()


func select_system(system_id: String) -> void:
	selected_system = _find_entry_by_id(get_systems(), system_id)
	_prune_downstream_selections()
	_emit_state()


func select_origin(origin_id: String) -> void:
	selected_origin = _find_entry_by_id(get_origins(), origin_id)
	_prune_downstream_selections()
	_emit_state()


func select_race(race_id: String) -> void:
	selected_race = _find_entry_by_id(get_races(), race_id)
	_prune_downstream_selections()
	_emit_state()


func select_class(class_id: String) -> void:
	selected_class = _find_entry_by_id(get_classes(), class_id)
	_prune_downstream_selections()
	_emit_state()


func select_secondary_class(class_id: String) -> void:
	if class_id.strip_edges().is_empty() or class_id == "__none__":
		selected_secondary_class = {}
		_emit_state()
		return
	selected_secondary_class = _find_entry_by_id(get_secondary_classes(), class_id)
	_prune_downstream_selections()
	_emit_state()


func select_profession(profession_id: String) -> void:
	selected_profession = _find_entry_by_id(get_professions(), profession_id)
	_prune_downstream_selections()
	_emit_state()


func select_alignment(alignment_id: String) -> void:
	selected_alignment = _find_entry_by_id(get_alignments(), alignment_id)
	_emit_state()


func toggle_perk(perk_id: String) -> void:
	var cfg := get_perk_config()
	var max_picks := int(cfg.get("maxPicks", 2))
	if selected_perks.has(perk_id):
		selected_perks.erase(perk_id)
		_emit_state()
		return
	if selected_perks.size() >= max_picks:
		return
	selected_perks.append(perk_id)
	_emit_state()


func toggle_tree(tree_id: String) -> void:
	var cfg := get_tree_config()
	var max_picks := int(cfg.get("maxPicks", 1))
	if selected_trees.has(tree_id):
		selected_trees.erase(tree_id)
		_emit_state()
		return
	if selected_trees.size() >= max_picks:
		selected_trees.clear()
	selected_trees.append(tree_id)
	_emit_state()


func toggle_active_skill(skill_id: String) -> void:
	var pool := get_current_skill_pool()
	var allowed_ids := _skill_ids_from_entries(Array(pool.get("activeSkills", [])))
	if not allowed_ids.has(skill_id):
		return
	var max_active := int(pool.get("requiredActiveSkills", 3))
	if selected_active_skills.has(skill_id):
		selected_active_skills.erase(skill_id)
		selected_skill_loadout_id = ""
		_emit_state()
		return
	if selected_active_skills.size() >= max_active:
		return
	selected_active_skills.append(skill_id)
	selected_skill_loadout_id = ""
	_emit_state()


func toggle_passive_skill(skill_id: String) -> void:
	var pool := get_current_skill_pool()
	var allowed_ids := _skill_ids_from_entries(Array(pool.get("passiveSkills", [])))
	if not allowed_ids.has(skill_id):
		return
	var max_passive := int(pool.get("requiredPassiveSkills", 6))
	if selected_passive_skills.has(skill_id):
		selected_passive_skills.erase(skill_id)
		selected_skill_loadout_id = ""
		_emit_state()
		return
	if selected_passive_skills.size() >= max_passive:
		return
	selected_passive_skills.append(skill_id)
	selected_skill_loadout_id = ""
	_emit_state()


func select_skill_loadout(loadout_id: String) -> void:
	if loadout_id.strip_edges().is_empty() or loadout_id == "__none__":
		selected_skill_loadout_id = ""
		_emit_state()
		return
	for raw in Array(get_current_skill_pool().get("loadouts", [])):
		if typeof(raw) != TYPE_DICTIONARY:
			continue
		var entry: Dictionary = raw
		if String(entry.get("id", "")) != loadout_id:
			continue
		selected_skill_loadout_id = loadout_id
		selected_active_skills = Array(entry.get("activeSkillIds", [])).duplicate()
		selected_passive_skills = Array(entry.get("passiveSkillIds", [])).duplicate()
		_emit_state()
		return


func allocate_attribute(attr: String, delta: int) -> bool:
	if not attribute_points.has(attr):
		return false
	var new_val := int(attribute_points[attr]) + delta
	var cfg := get_attribute_config()
	var min_val := int(cfg.get("minValue", 1))
	var max_val := int(cfg.get("maxValue", 30))
	if new_val < min_val or new_val > max_val:
		return false
	if delta > 0 and free_points < delta:
		return false
	attribute_points[attr] = new_val
	free_points -= delta
	_emit_state()
	return true


func _build_steps() -> Array:
	var raw_steps := Array(_options.get("steps", []))
	var steps: Array = []
	for raw in raw_steps:
		var step_id := String(raw)
		if not _advanced_unlocked and step_id == "mode":
			continue
		if _creation_mode != "advanced" and (step_id == "multiclass" or step_id == "trees"):
			continue
		steps.append(step_id)
	return steps


func _reset_attributes() -> void:
	var cfg := get_attribute_config()
	attribute_points = Dictionary(cfg.get("base", {})).duplicate(true)
	free_points = int(cfg.get("freePoints", 15))


func _reset_selections() -> void:
	character_name = ""
	selected_system = {}
	selected_origin = {}
	selected_race = {}
	selected_class = {}
	selected_secondary_class = {}
	selected_profession = {}
	selected_alignment = {}
	selected_trees.clear()
	selected_perks.clear()
	selected_skill_loadout_id = ""
	selected_active_skills.clear()
	selected_passive_skills.clear()


func _get_array(key: String) -> Array:
	return Array(_options.get(key, [])).duplicate(true)


func _get_system_option_state() -> Dictionary:
	if selected_system.is_empty():
		return _current_raw_option_state()
	var by_id: Dictionary = Dictionary(_options.get("systemOptionsById", {}))
	var option_state: Variant = by_id.get(String(selected_system.get("id", "")), {})
	if typeof(option_state) == TYPE_DICTIONARY and not option_state.is_empty():
		return Dictionary(option_state).duplicate(true)
	return _current_raw_option_state()


func _get_system_option_array(key: String, fallback_key: String = "") -> Array:
	var option_state := _get_system_option_state()
	var value: Variant = option_state.get(key, [])
	if value is Array:
		return Array(value).duplicate(true)
	var fallback_name := fallback_key if not fallback_key.is_empty() else key
	if key == "perks":
		return Array(Dictionary(_options.get("perks", {})).get("options", [])).duplicate(true)
	if key == "starterTrees":
		return Array(Dictionary(_options.get("trees", {})).get("options", [])).duplicate(true)
	return Array(_options.get(fallback_name, [])).duplicate(true)


func _find_entry_by_id(options: Array, entry_id: String) -> Dictionary:
	for raw in options:
		if typeof(raw) != TYPE_DICTIONARY:
			continue
		var entry: Dictionary = raw
		if String(entry.get("id", "")) == entry_id:
			return entry.duplicate(true)
	return {}


func _contains_entry(options: Array, entry_id: String) -> bool:
	if entry_id.is_empty():
		return false
	for raw in options:
		if typeof(raw) != TYPE_DICTIONARY:
			continue
		if String((raw as Dictionary).get("id", "")) == entry_id:
			return true
	return false


func _get_skill_index() -> Dictionary:
	return Dictionary(_options.get("skillIndex", {}))


func _resolve_skill_by_id(skill_id: String) -> Dictionary:
	var value: Variant = _get_skill_index().get(skill_id, {})
	if typeof(value) == TYPE_DICTIONARY:
		return Dictionary(value).duplicate(true)
	return {}


func _current_raw_option_state() -> Dictionary:
	return {
		"origins": _get_array("origins"),
		"races": _get_array("races"),
		"classes": _get_array("classes"),
		"secondaryClasses": _get_array("classes"),
		"professions": _get_array("professions"),
		"perks": Array(Dictionary(_options.get("perks", {})).get("options", [])).duplicate(true),
		"starterTrees": Array(Dictionary(_options.get("trees", {})).get("options", [])).duplicate(true),
		"recommendedOriginIds": [],
		"recommendedRaceIds": [],
		"recommendedClassIds": [],
		"recommendedProfessionIds": [],
		"attributeBias": {"primary": [], "secondary": []},
	}


func _build_skill_signature(system_id: String, race_id: String, class_id: String) -> String:
	return "%s|%s|%s" % [system_id, race_id, class_id]


func _resolve_system_skill_grants() -> Dictionary:
	if selected_system.is_empty():
		return {"active": [], "passive": []}
	var profile := Dictionary(selected_system.get("characterCreation", {}))
	var skill_rules := Dictionary(profile.get("skillRules", {}))
	var active: Array = []
	var passive: Array = []
	for raw_id in Array(skill_rules.get("grantActiveIds", [])):
		var skill := _resolve_skill_by_id(String(raw_id))
		if not skill.is_empty():
			active.append(skill)
	for raw_id in Array(skill_rules.get("grantPassiveIds", [])):
		var skill := _resolve_skill_by_id(String(raw_id))
		if not skill.is_empty():
			passive.append(skill)
	return {
		"active": _merge_skill_entries_unique(active),
		"passive": _merge_skill_entries_unique(passive),
	}


func _resolve_profession_skill_grants() -> Dictionary:
	if selected_profession.is_empty():
		return {"active": [], "passive": []}
	var active: Array = []
	var passive: Array = []
	var skill_ids: Array = []
	if selected_profession.has("tier1Skills"):
		skill_ids = Array(selected_profession.get("tier1Skills", []))
	elif selected_profession.has("tierUnlocks"):
		var tier_unlocks: Dictionary = selected_profession.get("tierUnlocks", {})
		var tier_one: Dictionary = tier_unlocks.get("1", tier_unlocks.get(1, {}))
		skill_ids = Array(tier_one.get("skills", []))
	for raw_id in skill_ids:
		var skill := _resolve_skill_by_id(String(raw_id))
		if skill.is_empty():
			continue
		var slot_type := String(skill.get("slotType", skill.get("type", "active"))).to_lower()
		if slot_type == "passive":
			passive.append(skill)
		else:
			active.append(skill)
	return {
		"active": _merge_skill_entries_unique(active),
		"passive": _merge_skill_entries_unique(passive),
	}


func _merge_skill_entries_unique(entries: Array) -> Array:
	var merged: Array = []
	var seen: Array = []
	for raw in entries:
		if typeof(raw) != TYPE_DICTIONARY:
			continue
		var entry: Dictionary = raw
		var skill_id := String(entry.get("id", ""))
		if skill_id.is_empty() or seen.has(skill_id):
			continue
		seen.append(skill_id)
		merged.append(entry.duplicate(true))
	return merged


func _skill_ids_from_entries(entries: Array) -> Array:
	var ids: Array = []
	for raw in entries:
		if typeof(raw) != TYPE_DICTIONARY:
			continue
		var skill_id := String((raw as Dictionary).get("id", ""))
		if skill_id.is_empty() or ids.has(skill_id):
			continue
		ids.append(skill_id)
	return ids


func _ids_from_entries(entries: Array) -> Array:
	var ids: Array = []
	for raw in entries:
		if typeof(raw) != TYPE_DICTIONARY:
			continue
		var entry_id := String((raw as Dictionary).get("id", ""))
		if entry_id.is_empty() or ids.has(entry_id):
			continue
		ids.append(entry_id)
	return ids


func _filter_id_selection(selected_ids: Array, allowed_ids: Array, max_count: int = -1) -> Array:
	var filtered: Array = []
	for raw in selected_ids:
		var value := String(raw)
		if value.is_empty() or not allowed_ids.has(value) or filtered.has(value):
			continue
		filtered.append(value)
		if max_count >= 0 and filtered.size() >= max_count:
			break
	return filtered


func _resolve_selected_skill_entries(selected_ids: Array) -> Array:
	var entries: Array = []
	for raw_id in selected_ids:
		var skill := _resolve_skill_by_id(String(raw_id))
		if not skill.is_empty():
			entries.append(skill)
	return _merge_skill_entries_unique(entries)


func _resolve_skill_entries_from_value(value: Variant) -> Array:
	var entries: Array = []
	for raw in Array(value):
		if typeof(raw) == TYPE_DICTIONARY:
			entries.append(Dictionary(raw).duplicate(true))
			continue
		var skill := _resolve_skill_by_id(String(raw))
		if not skill.is_empty():
			entries.append(skill)
	return _merge_skill_entries_unique(entries)


func _hydrate_skill_pool(pool: Dictionary) -> Dictionary:
	var hydrated := pool.duplicate(true)
	if hydrated.is_empty():
		return hydrated
	if hydrated.has("activeSkills"):
		hydrated["activeSkills"] = _resolve_skill_entries_from_value(hydrated.get("activeSkills", []))
	elif hydrated.has("activeSkillIds"):
		hydrated["activeSkills"] = _resolve_skill_entries_from_value(hydrated.get("activeSkillIds", []))
	else:
		hydrated["activeSkills"] = []
	if hydrated.has("passiveSkills"):
		hydrated["passiveSkills"] = _resolve_skill_entries_from_value(hydrated.get("passiveSkills", []))
	elif hydrated.has("passiveSkillIds"):
		hydrated["passiveSkills"] = _resolve_skill_entries_from_value(hydrated.get("passiveSkillIds", []))
	else:
		hydrated["passiveSkills"] = []
	if hydrated.has("grantedActiveSkills"):
		hydrated["grantedActiveSkills"] = _resolve_skill_entries_from_value(hydrated.get("grantedActiveSkills", []))
	elif hydrated.has("grantedActiveSkillIds"):
		hydrated["grantedActiveSkills"] = _resolve_skill_entries_from_value(hydrated.get("grantedActiveSkillIds", []))
	else:
		hydrated["grantedActiveSkills"] = []
	if hydrated.has("grantedPassiveSkills"):
		hydrated["grantedPassiveSkills"] = _resolve_skill_entries_from_value(hydrated.get("grantedPassiveSkills", []))
	elif hydrated.has("grantedPassiveSkillIds"):
		hydrated["grantedPassiveSkills"] = _resolve_skill_entries_from_value(hydrated.get("grantedPassiveSkillIds", []))
	else:
		hydrated["grantedPassiveSkills"] = []
	return hydrated


func _prune_downstream_selections() -> void:
	var option_state := _get_system_option_state()
	if not selected_origin.is_empty() and not _contains_entry(Array(option_state.get("origins", [])), String(selected_origin.get("id", ""))):
		selected_origin = {}
	if not selected_race.is_empty() and not _contains_entry(Array(option_state.get("races", [])), String(selected_race.get("id", ""))):
		selected_race = {}
	if not selected_class.is_empty() and not _contains_entry(Array(option_state.get("classes", [])), String(selected_class.get("id", ""))):
		selected_class = {}
	if selected_secondary_class.is_empty():
		pass
	elif not _advanced_unlocked or _creation_mode != "advanced":
		selected_secondary_class = {}
	elif not _contains_entry(Array(option_state.get("secondaryClasses", [])), String(selected_secondary_class.get("id", ""))):
		selected_secondary_class = {}
	elif String(selected_secondary_class.get("id", "")) == String(selected_class.get("id", "")):
		selected_secondary_class = {}
	if not selected_profession.is_empty() and not _contains_entry(Array(option_state.get("professions", [])), String(selected_profession.get("id", ""))):
		selected_profession = {}

	var allowed_perk_ids := _ids_from_entries(Array(option_state.get("perks", [])))
	selected_perks = _filter_id_selection(selected_perks, allowed_perk_ids, int(get_perk_config().get("maxPicks", 2)))
	var allowed_tree_ids := _ids_from_entries(Array(option_state.get("starterTrees", [])))
	selected_trees = _filter_id_selection(selected_trees, allowed_tree_ids, int(get_tree_config().get("maxPicks", 1)))

	var skill_pool := get_current_skill_pool()
	var allowed_active_ids := _skill_ids_from_entries(Array(skill_pool.get("activeSkills", [])))
	var allowed_passive_ids := _skill_ids_from_entries(Array(skill_pool.get("passiveSkills", [])))
	selected_active_skills = _filter_id_selection(
		selected_active_skills,
		allowed_active_ids,
		int(skill_pool.get("requiredActiveSkills", 3))
	)
	selected_passive_skills = _filter_id_selection(
		selected_passive_skills,
		allowed_passive_ids,
		int(skill_pool.get("requiredPassiveSkills", 6))
	)

	if not selected_skill_loadout_id.is_empty():
		var valid_loadout := false
		for raw in Array(skill_pool.get("loadouts", [])):
			if typeof(raw) != TYPE_DICTIONARY:
				continue
			if String((raw as Dictionary).get("id", "")) == selected_skill_loadout_id:
				valid_loadout = true
				break
		if not valid_loadout:
			selected_skill_loadout_id = ""


func _validate_current_step() -> Dictionary:
	var step_id := get_current_step()
	match step_id:
		"mode":
			if not _advanced_unlocked:
				return {"valid": true, "error": ""}
			if _creation_mode != "basic" and _creation_mode != "advanced":
				return {"valid": false, "error": "Choose Basic or Advanced mode"}
		"name":
			if character_name.strip_edges().is_empty():
				return {"valid": false, "error": "Name is required"}
		"system":
			if selected_system.is_empty():
				return {"valid": false, "error": "Choose a System"}
		"origin":
			if selected_origin.is_empty():
				return {"valid": false, "error": "Choose an origin"}
		"race":
			if selected_race.is_empty():
				return {"valid": false, "error": "Choose a race"}
		"class":
			if selected_class.is_empty():
				return {"valid": false, "error": "Choose a class"}
		"profession":
			if selected_profession.is_empty():
				return {"valid": false, "error": "Choose a profession"}
		"attributes":
			if free_points != 0:
				return {"valid": false, "error": "Allocate all attribute points"}
		"skills":
			var pool := get_current_skill_pool()
			if selected_active_skills.size() != int(pool.get("requiredActiveSkills", 3)):
				return {"valid": false, "error": "Select the required active skills"}
			if selected_passive_skills.size() != int(pool.get("requiredPassiveSkills", 6)):
				return {"valid": false, "error": "Select the required passive skills"}
		"perks":
			var perk_cfg := get_perk_config()
			var min_picks := int(perk_cfg.get("minPicks", 1))
			if selected_perks.size() < min_picks:
				return {"valid": false, "error": "Pick at least one perk"}
		"trees":
			if _creation_mode == "advanced":
				var tree_cfg := get_tree_config()
				var min_tree_picks := int(tree_cfg.get("minPicks", 1))
				if selected_trees.size() < min_tree_picks:
					return {"valid": false, "error": "Choose a starter tree"}
		"alignment":
			if selected_alignment.is_empty():
				return {"valid": false, "error": "Choose an alignment"}
	return {"valid": true, "error": ""}


func _emit_step() -> void:
	var step_id := get_current_step()
	step_changed.emit(step_id, _step_index, _build_step_data(step_id))


func _build_step_data(step_id: String) -> Dictionary:
	var option_state := _get_system_option_state()
	match step_id:
		"mode":
			return {
				"advancedUnlocked": _advanced_unlocked,
				"mode": _creation_mode,
				"modes": [
					{"id": "basic", "name": "Basic", "description": "Fast local singleplayer creation."},
					{"id": "advanced", "name": "Advanced", "description": "Adds multiclass and starter tree planning."},
				],
			}
		"name":
			return {"currentName": character_name}
		"system":
			return {"systems": get_systems(), "selected": selected_system}
		"origin":
			return {
				"origins": get_origins(),
				"selected": selected_origin,
				"recommendedIds": Array(option_state.get("recommendedOriginIds", [])),
			}
		"race":
			return {
				"races": get_races(),
				"selected": selected_race,
				"recommendedIds": Array(option_state.get("recommendedRaceIds", [])),
			}
		"class":
			return {
				"classes": get_classes(),
				"selected": selected_class,
				"recommendedIds": Array(option_state.get("recommendedClassIds", [])),
			}
		"multiclass":
			var options: Array = [{"id": "__none__", "name": "None", "description": "Stay single-class for now."}]
			options.append_array(get_secondary_classes())
			return {
				"enabled": _creation_mode == "advanced",
				"options": options,
				"selected": selected_secondary_class,
			}
		"profession":
			return {
				"professions": get_professions(),
				"selected": selected_profession,
				"recommendedIds": Array(option_state.get("recommendedProfessionIds", [])),
			}
		"attributes":
			return {
				"points": attribute_points.duplicate(true),
				"freePoints": free_points,
				"config": get_attribute_config(),
				"attributeBias": Dictionary(option_state.get("attributeBias", {})).duplicate(true),
			}
		"skills":
			var pool := get_current_skill_pool()
			return {
				"loadouts": Array(pool.get("loadouts", [])).duplicate(true),
				"activeSkillOptions": Array(pool.get("activeSkills", [])).duplicate(true),
				"passiveSkillOptions": Array(pool.get("passiveSkills", [])).duplicate(true),
				"grantedSystemActiveSkills": Array(pool.get("grantedSystemActiveSkills", [])).duplicate(true),
				"grantedSystemPassiveSkills": Array(pool.get("grantedSystemPassiveSkills", [])).duplicate(true),
				"grantedProfessionActiveSkills": Array(pool.get("grantedProfessionActiveSkills", [])).duplicate(true),
				"grantedProfessionPassiveSkills": Array(pool.get("grantedProfessionPassiveSkills", [])).duplicate(true),
				"grantedActiveSkills": Array(pool.get("grantedActiveSkills", [])).duplicate(true),
				"grantedPassiveSkills": Array(pool.get("grantedPassiveSkills", [])).duplicate(true),
				"blockedSkillIds": Array(pool.get("blockedSkillIds", [])).duplicate(true),
				"requiredActiveSkills": int(pool.get("requiredActiveSkills", 3)),
				"requiredPassiveSkills": int(pool.get("requiredPassiveSkills", 6)),
				"slotBonuses": Dictionary(pool.get("slotBonuses", {"active": 0, "passive": 0})).duplicate(true),
				"selectedLoadoutId": selected_skill_loadout_id,
				"activeSkills": selected_active_skills.duplicate(),
				"passiveSkills": selected_passive_skills.duplicate(),
			}
		"perks":
			return {
				"config": get_perk_config(),
				"selected": selected_perks.duplicate(),
			}
		"trees":
			return {
				"enabled": _creation_mode == "advanced",
				"config": get_tree_config(),
				"selected": selected_trees.duplicate(),
			}
		"alignment":
			return {"alignments": get_alignments(), "selected": selected_alignment}
		"review":
			return _build_character_summary()
	return {}


func _build_character_summary() -> Dictionary:
	var pool := get_current_skill_pool()
	var active_entries := _resolve_selected_skill_entries(selected_active_skills)
	var passive_entries := _resolve_selected_skill_entries(selected_passive_skills)
	var system_granted := {
		"active": Array(pool.get("grantedSystemActiveSkills", [])).duplicate(true),
		"passive": Array(pool.get("grantedSystemPassiveSkills", [])).duplicate(true),
	}
	var profession_granted := {
		"active": Array(pool.get("grantedProfessionActiveSkills", [])).duplicate(true),
		"passive": Array(pool.get("grantedProfessionPassiveSkills", [])).duplicate(true),
	}
	return {
		"mode": _creation_mode,
		"name": character_name,
		"origin": selected_origin.duplicate(true),
		"race": selected_race.duplicate(true),
		"class": selected_class.duplicate(true),
		"secondaryClass": selected_secondary_class.duplicate(true),
		"profession": selected_profession.duplicate(true),
		"alignment": selected_alignment.duplicate(true),
		"archetypeSystemId": String(selected_system.get("id", "")),
		"archetypeSystem": selected_system.duplicate(true),
		"attributes": attribute_points.duplicate(true),
		"freePointsRemaining": free_points,
		"skillLoadoutId": selected_skill_loadout_id,
		"activeSkillIds": selected_active_skills.duplicate(),
		"passiveSkillIds": selected_passive_skills.duplicate(),
		"activeSkills": active_entries,
		"passiveSkills": passive_entries,
		"systemGrantedSkills": system_granted,
		"professionGrantedSkills": profession_granted,
		"blockedSkillIds": Array(pool.get("blockedSkillIds", [])).duplicate(true),
		"perks": selected_perks.duplicate(),
		"trees": selected_trees.duplicate(),
	}


func _finalize() -> void:
	var character_data := _build_character_summary()
	print("=== CHARACTER CREATION COMPLETE (Godot) ===")
	print(JSON.stringify(character_data, "\t"))
	creation_completed.emit(character_data)


func _emit_state() -> void:
	state_changed.emit(_build_character_summary())
