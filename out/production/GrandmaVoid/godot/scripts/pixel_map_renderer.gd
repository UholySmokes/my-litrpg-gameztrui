extends Node2D
class_name PixelMapRenderer

const TILE_SIZE := 32
const ATLAS_COLUMNS := 3

const TILE_ATLAS_PATHS := {
	"map_village_square": "res://assets/tilesets/village_square_atlas.png",
	"map_training_glade": "res://assets/tilesets/training_glade_atlas.png",
	"map_ruined_outlook": "res://assets/tilesets/ruined_outlook_atlas.png",
}

const MAP_THEMES := {
	"map_village_square": {
		"ground": Color(0.20, 0.24, 0.30, 1.0),
		"path": Color(0.34, 0.39, 0.48, 1.0),
		"accent": Color(0.14, 0.17, 0.23, 1.0),
	},
	"map_training_glade": {
		"ground": Color(0.14, 0.28, 0.17, 1.0),
		"path": Color(0.24, 0.37, 0.20, 1.0),
		"accent": Color(0.09, 0.20, 0.12, 1.0),
	},
	"map_ruined_outlook": {
		"ground": Color(0.22, 0.18, 0.17, 1.0),
		"path": Color(0.37, 0.31, 0.28, 1.0),
		"accent": Color(0.14, 0.12, 0.11, 1.0),
	},
}

var _current_map_id: String = ""
var _map_width: int = 1
var _map_height: int = 1
var _trigger_tiles: Dictionary = {}
var _atlas_cache: Dictionary = {}


func _ready() -> void:
	_load_atlases()


func render_map(map_id: String, width: int, height: int, trigger_tiles: Array = []) -> void:
	_current_map_id = map_id
	_map_width = maxi(width, 1)
	_map_height = maxi(height, 1)
	_trigger_tiles.clear()

	for entry in trigger_tiles:
		if not (entry is Dictionary):
			continue
		var x := int(entry.get("x", -1))
		var y := int(entry.get("y", -1))
		if x < 0 or y < 0:
			continue
		_trigger_tiles[_tile_key(x, y)] = String(entry.get("type", ""))

	queue_redraw()


func _draw() -> void:
	var theme: Dictionary = _theme_for_map(_current_map_id)
	var ground: Color = theme.get("ground", Color(0.17, 0.21, 0.26, 1.0))
	var path: Color = theme.get("path", Color(0.29, 0.34, 0.40, 1.0))
	var accent: Color = theme.get("accent", Color(0.12, 0.16, 0.20, 1.0))
	var atlas: Texture2D = null
	if _atlas_cache.has(_current_map_id):
		atlas = _atlas_cache[_current_map_id] as Texture2D

	var canvas_rect := Rect2(
		Vector2.ZERO,
		Vector2(_map_width * TILE_SIZE, _map_height * TILE_SIZE)
	)
	draw_rect(canvas_rect, ground, true)

	for y in range(_map_height):
		for x in range(_map_width):
			var tile_rect := Rect2(
				Vector2(x * TILE_SIZE, y * TILE_SIZE),
				Vector2(TILE_SIZE, TILE_SIZE)
			)
			var tile_kind := _tile_kind(x, y)
			if atlas != null:
				draw_texture_rect_region(
					atlas,
					tile_rect,
					Rect2(Vector2(tile_kind * TILE_SIZE, 0), Vector2(TILE_SIZE, TILE_SIZE))
				)
			else:
				draw_rect(tile_rect.grow(-1.0), _tile_color_from_kind(tile_kind, ground, path, accent), true)
			draw_rect(tile_rect, Color(1.0, 1.0, 1.0, 0.03), false, 1.0)

			var key := _tile_key(x, y)
			if _trigger_tiles.has(key):
				var marker_color := _marker_color_for_trigger(String(_trigger_tiles.get(key, "")))
				draw_rect(tile_rect.grow(-10.0), marker_color, true)


func _load_atlases() -> void:
	_atlas_cache.clear()
	for map_id_value in TILE_ATLAS_PATHS.keys():
		var map_id := String(map_id_value)
		var path_value := String(TILE_ATLAS_PATHS[map_id_value])
		var absolute_path := ProjectSettings.globalize_path(path_value)
		if not FileAccess.file_exists(absolute_path):
			continue
		var image := Image.new()
		if image.load(absolute_path) != OK:
			continue
		var texture := ImageTexture.create_from_image(image)
		if texture != null:
			_atlas_cache[map_id] = texture


func _theme_for_map(map_id: String) -> Dictionary:
	if MAP_THEMES.has(map_id):
		return MAP_THEMES[map_id]
	return MAP_THEMES["map_village_square"]


func _tile_kind(x: int, y: int) -> int:
	if _current_map_id == "map_village_square":
		if y == 8 or x == 10:
			return 1
		if (x + y) % 5 == 0:
			return 2
		return 0

	if _current_map_id == "map_training_glade":
		if x == 0 or x == _map_width - 1 or y == 0 or y == _map_height - 1:
			return 2
		if (x * 13 + y * 7) % 6 == 0:
			return 1
		return 0

	if _current_map_id == "map_ruined_outlook":
		if y > _map_height - 3:
			return 1
		if (x * 3 + y * 5) % 7 == 0:
			return 2
		return 0

	if (x + y) % 2 == 0:
		return 0
	return 2


func _tile_color_from_kind(kind: int, ground: Color, path: Color, accent: Color) -> Color:
	var normalized: int = kind
	if normalized < 0:
		normalized = 0
	if normalized > ATLAS_COLUMNS - 1:
		normalized = ATLAS_COLUMNS - 1
	if normalized == 1:
		return path
	if normalized == 2:
		return accent
	return ground


func _marker_color_for_trigger(trigger_type: String) -> Color:
	if trigger_type == "SAVEPOINT":
		return Color(0.44, 0.95, 0.97, 0.92)
	if trigger_type == "ENCOUNTER_GATE":
		return Color(0.95, 0.63, 0.33, 0.92)
	if trigger_type == "INTERACT":
		return Color(0.76, 0.84, 1.00, 0.92)
	if trigger_type == "ZONE_EXIT":
		return Color(0.58, 0.95, 0.62, 0.92)
	return Color(1.00, 0.91, 0.42, 0.90)


func _tile_key(x: int, y: int) -> String:
	return "%d,%d" % [x, y]
