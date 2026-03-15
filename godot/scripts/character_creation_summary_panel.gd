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
	lines.append(
		"System Grants: %s"
		% _join_or_none(
			_skill_name_list(Array(system_granted.get("active", [])))
			+ _skill_name_list(Array(system_granted.get("passive", [])))
		)
	)

	var profession_granted: Dictionary = data.get("professionGrantedSkills", {})
	lines.append(
		"Profession Grants: %s"
		% _join_or_none(
			_skill_name_list(Array(profession_granted.get("active", [])))
			+ _skill_name_list(Array(profession_granted.get("passive", [])))
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
	var strings: PackedStringArray = []
	for raw in values:
		strings.append(String(raw))
	return ", ".join(strings)
