extends Node

signal hover_target_changed(new_source: Draggable, old_source: Draggable)
signal dragging(draggable: Draggable)
signal dropped(draggable: Draggable)

var _hover_targets: Dictionary
var _hover_source: Draggable
var _drag_source: Draggable

func try_hover(draggable: Draggable, enter: bool):
	if enter:
		_hover_targets[draggable.get_instance_id()] = true
	else:
		_hover_targets.erase(draggable.get_instance_id())
	_update_hover()

func _update_hover():
	var new_hover_source = null
	for candidate in _hover_targets.keys():
		var source = instance_from_id(candidate)
		if source:
			if not new_hover_source:
				new_hover_source = source
			else:
				# Pick the highest index
				if new_hover_source.get_index() < source.get_index():
					new_hover_source = source
	if not is_instance_valid(_hover_source):
		_hover_source = null
	if new_hover_source != _hover_source:
		if _hover_source:
			_hover_source.hovering(false)
		if new_hover_source:
			new_hover_source.hovering(true)
		DragEvents.hover_target_changed.emit(new_hover_source, _hover_source)
		_hover_source = new_hover_source

func try_drag(draggable: Draggable, start: bool):
	if start:
		_start_drag(draggable)
	else:
		_end_drag(draggable)

func _start_drag(draggable: Draggable):
	if draggable != _hover_source:
		push_error('attempt to drag non-hovered node', draggable)
		return false
	if _drag_source:
		push_error('attempt to drag but something else is already dragging', draggable)
		return false
	
	_drag_source = draggable
	draggable.dragging(true)
	DragEvents.dragging.emit(draggable)

func _end_drag(draggable: Draggable):
	draggable.dragging(false)
	if _drag_source == draggable:
		DragEvents.dropped.emit(draggable)
		_drag_source = null
