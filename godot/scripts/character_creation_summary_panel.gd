extends Panel
class_name CharacterCreationSummaryPanel

const CharacterCreationController := preload("res://scripts/character_creation_controller.gd")

@onready var _title_label: Label = %SummaryTitleLabel
@onready var _body_label: RichTextLabel = %SummaryBodyLabel

var _controller: CharacterCreationController = null


func bind_controller(ctrl: CharacterCreationController) -> void:
	_controller = ctrl
	_controller.state_changed.connect(_on_state_changed)
	_controller.step_changed.connect(_on_step_changed)
	_render(_controller.get_character_summary())


func _on_step_changed(_step_id: String, _step_index: int, _data: Dictionary) -> void:
	if _controller:
		_render(_controller.get_character_summary())


func _on_state_changed(character_data: Dictionary) -> void:
	_render(character_data)


func _render(data: Dictionary) -> void:
	_title_label.text = "SUMMARY"

	var lines: PackedStringArray = []
	lines.append("Mode: %s" % String(data.get("mode", "basic")).capitalize())
	lines.append("Name: %s" % _entity_name({"name": String(data.get("name", ""))}))
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
		lines.append("  %-10s %d" % [String(key).capitalize(), int(attrs[key])])
	lines.append("  Free: %d" % int(data.get("freePointsRemaining", 0)))

	lines.append("")
	lines.append("Selected Active: %s" % _join_or_none(_skill_name_list(Array(data.get("activeSkills", [])))))
	lines.append("Selected Passive: %s" % _join_or_none(_skill_name_list(Array(data.get("passiveSkills", [])))))

	var system_granted: Dictionary = data.get("systemGrantedSkills", {})
	var system_granted_entries: Array = (
		Array(system_granted.get("active", []))
		+ Array(system_granted.get("passive", []))
	)
	lines.append(
		"System Grants: %s"
		% _join_or_none(
			_skill_name_list(system_granted_entries)
		)
	)

	var profession_granted: Dictionary = data.get("professionGrantedSkills", {})
	var profession_granted_entries: Array = (
		Array(profession_granted.get("active", []))
		+ Array(profession_granted.get("passive", []))
	)
	lines.append(
		"Profession Grants: %s"
		% _join_or_none(
			_skill_name_list(profession_granted_entries)
		)
	)

	var perks: Array = Array(data.get("perks", []))
	if perks.size() > 0:
		lines.append("Perks: %s" % ", ".join(perks))

	var trees: Array = Array(data.get("trees", []))
	if trees.size() > 0:
		lines.append("Trees: %s" % ", ".join(trees))

	_body_label.text = "\n".join(lines)


func _entity_name(entry: Dictionary) -> String:
	var value := String(entry.get("name", "")).strip_edges()
	return value if not value.is_empty() else "None"


func _skill_name_list(entries: Array) -> Array:
	var names: Array = []
	var seen: Dictionary = {} # id -> true
	var name_counts: Dictionary = {} # name -> count
	var resolved: Array = [] # [{name, source, id, has_id}]
	for raw in entries:
		if typeof(raw) != TYPE_DICTIONARY:
			continue
		var entry := raw as Dictionary
		var entry_id := String(entry.get("id", "")).strip_edges()
		var name := String(entry.get("name", "")).strip_edges()
		if name.is_empty() and not entry_id.is_empty():
			name = entry_id
		if name.is_empty():
			continue

		var dedupe_key := entry_id if not entry_id.is_empty() else ("name:" + name.to_lower())
		if seen.has(dedupe_key):
			continue
		seen[dedupe_key] = true

		var owner_type := String(entry.get("source", entry.get("ownerType", ""))).strip_edges().to_lower()
		if owner_type == "universal":
			owner_type = "general"

		resolved.append({
			"name": name,
			"source": owner_type,
			"id": entry_id,
			"has_id": not entry_id.is_empty(),
		})
		name_counts[name] = int(name_counts.get(name, 0)) + 1

	for item in resolved:
		var n := String(item.get("name", ""))
		if int(name_counts.get(n, 0)) <= 1:
			names.append(n)
			continue
		var src := String(item.get("source", ""))
		if not src.is_empty():
			names.append("%s (%s)" % [n, src])
			continue
		if bool(item.get("has_id", false)):
			names.append("%s [%s]" % [n, String(item.get("id", ""))])
		else:
			names.append(n)
	return names


func _join_or_none(values: Array) -> String:
	if values.is_empty():
		return "None"
	var strings: PackedStringArray = []
	for raw in values:
		strings.append(String(raw))
	return ", ".join(strings)
