extends Node2D



func _on_drag_me_on_screen_1_drag_ended(drop_target: Area2D) -> void:
	$PlayByPlayLabel.text = 'You dropped target 1 on %s' % drop_target

func _on_drag_me_on_screen_2_drag_ended(drop_target: Area2D) -> void:
	$PlayByPlayLabel.text = 'You dropped target 2 on %s' % drop_target
