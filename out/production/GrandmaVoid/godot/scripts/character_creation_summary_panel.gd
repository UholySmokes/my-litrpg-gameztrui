extends Panel
class_name CharacterCreationSummaryPanel
## Right-side summary panel for the character creation wizard.

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
	lines.append("Name: %s" % String(data.get("name", "")).strip_edges())

	var race: Dictionary = data.get("race", {})
	if not race.is_empty():
		lines.append("Race: %s" % String(race.get("name", "")))

	var cls: Dictionary = data.get("class", {})
	if not cls.is_empty():
		lines.append("Class: %s" % String(cls.get("name", "")))

	var secondary: Dictionary = data.get("secondaryClass", {})
	if not secondary.is_empty():
		lines.append("MC: %s" % String(secondary.get("name", "")))

	var origin: Dictionary = data.get("origin", {})
	if not origin.is_empty():
		lines.append("Origin: %s" % String(origin.get("name", "")))

	var archetype: Dictionary = data.get("archetype", {})
	if not archetype.is_empty():
		lines.append("Archetype: %s" % String(archetype.get("name", "")))

	var alignment: Dictionary = data.get("alignment", {})
	if not alignment.is_empty():
		lines.append("Alignment: %s" % String(alignment.get("name", "")))

	lines.append("")
	lines.append("Attributes:")
	var attrs: Dictionary = data.get("attributes", {})
	var keys := Array(attrs.keys())
	keys.sort()
	for k in keys:
		lines.append("  %-10s %d" % [String(k).capitalize(), int(attrs[k])])
	lines.append("  Free: %d" % int(data.get("freePointsRemaining", 0)))

	var perks: Array = Array(data.get("perks", []))
	if perks.size() > 0:
		lines.append("")
		lines.append("Perks: %s" % ", ".join(perks))

	var trees: Array = Array(data.get("trees", []))
	if trees.size() > 0:
		lines.append("Tree: %s" % ", ".join(trees))

	_body_label.text = "\n".join(lines)

