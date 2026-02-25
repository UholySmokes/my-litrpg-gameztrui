extends Draggable

var _home_position: Vector2
var _go_home: bool

# Called when the node enters the scene tree for the first time.
func _ready() -> void:
	super()
	_home_position = global_position
	drag_ended.connect(_on_drag_ended)

func _on_drag_ended(target: Area2D):
	if not target:
		_go_home = true

func _physics_process(delta: float) -> void:
	super(delta)
	if _go_home:
		_go_home = false
		global_position = _home_position
