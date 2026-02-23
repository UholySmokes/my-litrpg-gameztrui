extends Panel
class_name ProsePanel

@onready var _title_label: Label = %TitleLabel
@onready var _body_label: RichTextLabel = %BodyLabel


func set_story(title_text: String, body_text: String) -> void:
	_title_label.text = title_text
	_body_label.text = body_text


func append_line(text_line: String) -> void:
	if _body_label.text.is_empty():
		_body_label.text = text_line
	else:
		_body_label.text += "\n" + text_line
