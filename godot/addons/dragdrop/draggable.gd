extends CharacterBody2D
class_name Draggable

## [Optional] The drop layer to detect
@export_flags_2d_physics var drop_layer: int
## [Optional] The override drop detection node. By default, one is created using
## the collision of the Draggable and the drop_layer
@export var drop_detection: Area2D

## Best drop target. Updated each frame.
var drop_target: Area2D

# Things currently in range of this Draggable
var _candidate_targets : Array[Area2D] = []
# Filtered candidates
var drop_targets : Array[Area2D] = []

signal hovered(is_hovered: bool)
signal drag_started()
signal drop_target_changed(new_target: Area2D, old_target: Area2D)
signal drag_ended(drop_target: Area2D)

var _is_hovering := false
var _is_dragging := false
var _drag_anchor : Vector2

## Override to filter out drop targets that are never applicable for this draggable.
func on_new_drop_candidate(area: Area2D) -> void:
	_candidate_targets.push_back(area)

## Override to filter out drop targets that should be dynamically ignored, e.g based on game state.
func filter_drop_targets(targets) -> Array[Area2D]:
	return targets

## Override to sort drop targets by a metric other than distance to the draggable
func compare_drop_targets(a, b):
	var dist_a = a.global_position.distance_squared_to(global_position)
	var dist_b = b.global_position.distance_squared_to(global_position)
	return dist_a < dist_b

func _ready() -> void:
	if drop_layer > 0 and not drop_detection:
		drop_detection = Area2D.new()
		drop_detection.collision_layer = collision_layer
		drop_detection.collision_mask = drop_layer
		for child in get_children():
			if child is CollisionShape2D or child is CollisionPolygon2D:
				drop_detection.add_child(child.duplicate())
		add_child(drop_detection)
	if drop_detection:
		drop_detection.area_entered.connect(on_new_drop_candidate)
		drop_detection.area_exited.connect(_on_area_exited)
	input_event.connect(_on_input_event)
	mouse_entered.connect(_on_mouse_entered)
	mouse_exited.connect(_on_mouse_exited)

func _physics_process(delta: float) -> void:
	if _is_dragging:
		var desired_position = get_global_mouse_position() - _drag_anchor
		velocity = (desired_position - global_position) / delta
		move_and_slide()
		drop_targets = filter_drop_targets(_candidate_targets)
		drop_targets.sort_custom(compare_drop_targets)
	_check_drag_target()

func hovering(starting: bool):
	_is_hovering = starting
	hovered.emit(starting)

func dragging(starting: bool):
	if starting:
		_is_dragging = true
		move_to_front()
		z_index = 1000
		drag_started.emit()
	else:
		z_index = 0
		if _is_dragging:
			_is_dragging = false
			move_to_front()
			drag_ended.emit(drop_target)

func _check_drag_target():
	var old_target = drop_target
	if drop_targets.is_empty():
		drop_target = null
	else:
		drop_target = drop_targets[0]
	if drop_target != old_target:
		drop_target_changed.emit(drop_target, old_target)

func _input(event: InputEvent) -> void:
	if _is_dragging:
		if event is InputEventMouseButton and !event.is_pressed():
			_try_drop()

func _on_input_event(_viewport: Node, event: InputEvent, _shape_idx: int) -> void:
	if event is InputEventMouseButton:
		if event.button_index == MOUSE_BUTTON_LEFT:
			if event.is_pressed():
				_try_drag()
			else:
				_try_drop()

func _try_drag():
	if _is_hovering:
		_drag_anchor = get_local_mouse_position()
		DragEvents.try_drag(self, true)

func _try_drop():
	DragEvents.try_drag(self, false)

func _on_mouse_entered() -> void:
	DragEvents.try_hover(self, true)

func _on_mouse_exited() -> void:
	DragEvents.try_hover(self, false)

func _on_area_exited(area: Area2D) -> void:
	_candidate_targets.erase(area)
