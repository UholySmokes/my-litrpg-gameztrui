extends Panel
class_name ProsePanel

@onready var _title_label: Label = %TitleLabel
@onready var _body_label: RichTextLabel = %BodyLabel


func set_story(title_text: String, body_text: String, suggestions: Array = []) -> void:
	_title_label.text = title_text
	var cleaned_body := body_text.strip_edges()
	var suggestion_block := _format_suggestions(suggestions)
	if suggestion_block.is_empty():
		_body_label.text = cleaned_body
		return
	_body_label.text = cleaned_body + "\n\nSuggested actions:\n" + suggestion_block


func append_line(text_line: String) -> void:
	if _body_label.text.is_empty():
		_body_label.text = text_line
	else:
		_body_label.text += "\n" + text_line


func _format_suggestions(suggestions: Array) -> String:
	var lines: Array[String] = []
	for entry in suggestions:
		var text_value := _suggestion_text(entry)
		if text_value.is_empty():
			continue
		lines.append("- " + text_value)
		if lines.size() >= 3:
			break
	return "\n".join(lines)


func _suggestion_text(entry: Variant) -> String:
	if entry is Dictionary:
		return String(entry.get("t", entry.get("label", ""))).strip_edges()
	return String(entry).strip_edges()
