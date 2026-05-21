extends SceneTree

const CONFIG_PATH := "res://data/config.json"
const MANIFEST_PATH := "res://data/world_manifest.json"
const MAIN_SCENE_PATH := "res://scenes/Main.tscn"
const REQUIRED_ASSET_PATHS := [
	"res://assets/characters/traveler_idle_down.png",
	"res://assets/characters/guide_idle_down.png",
	"res://assets/tilesets/village_square_atlas.png",
	"res://assets/tilesets/training_glade_atlas.png",
	"res://assets/tilesets/ruined_outlook_atlas.png",
]


func _init() -> void:
	var failures: Array[String] = []

	var config: Dictionary = _read_json(CONFIG_PATH, failures)
	if config.is_empty():
		failures.append("Runtime config is missing or invalid.")
	else:
		_assert(config.has("apiBaseUrl"), "config.apiBaseUrl missing", failures)
		_assert(config.has("syncCommandPath"), "config.syncCommandPath missing", failures)
		_assert(config.has("syncPullPath"), "config.syncPullPath missing", failures)
		_assert(config.has("storyStartPath"), "config.storyStartPath missing", failures)
		_assert(config.has("storyPollPath"), "config.storyPollPath missing", failures)
		_assert(
			String(config.get("syncCommandPath", "")).begins_with("/sync/"),
			"syncCommandPath must be relative to api base (expected /sync/*).",
			failures,
		)
		_assert(
			String(config.get("syncPullPath", "")).begins_with("/sync/"),
			"syncPullPath must be relative to api base (expected /sync/*).",
			failures,
		)
		_assert(
			String(config.get("storyStartPath", "")).begins_with("/story/"),
			"storyStartPath must be relative to api base (expected /story/*).",
			failures,
		)
		_assert(
			String(config.get("storyPollPath", "")).begins_with("/story/"),
			"storyPollPath must be relative to api base (expected /story/*).",
			failures,
		)

	var manifest: Dictionary = _read_json(MANIFEST_PATH, failures)
	if manifest.is_empty():
		failures.append("World manifest is missing or invalid.")
	else:
		var maps: Dictionary = manifest.get("maps", {})
		_assert(maps.size() >= 3, "world_manifest must define at least 3 maps.", failures)
		_assert(maps.has("map_village_square"), "world_manifest missing map_village_square.", failures)
		_assert(maps.has("map_training_glade"), "world_manifest missing map_training_glade.", failures)
		_assert(maps.has("map_ruined_outlook"), "world_manifest missing map_ruined_outlook.", failures)

	var packed: Variant = load(MAIN_SCENE_PATH)
	if packed == null or not packed is PackedScene:
		failures.append("Main scene failed to load as PackedScene.")
	else:
		var root: Node = (packed as PackedScene).instantiate()
		if root == null:
			failures.append("Main scene could not instantiate.")
		else:
			_assert(root.has_node("ConfigLoader"), "Main scene missing ConfigLoader node.", failures)
			_assert(root.has_node("SyncClient"), "Main scene missing SyncClient node.", failures)
			_assert(root.has_node("StoryClient"), "Main scene missing StoryClient node.", failures)
			_assert(root.has_node("MapRenderer"), "Main scene missing MapRenderer node.", failures)
			_assert(root.has_node("SpriteHooks"), "Main scene missing SpriteHooks node.", failures)
			_assert(root.has_node("SpriteHooks/PlayerSpriteAnchor"), "Main scene missing PlayerSpriteAnchor.", failures)
			_assert(root.has_node("SpriteHooks/GuideSpriteAnchor"), "Main scene missing GuideSpriteAnchor.", failures)
			_assert(root.has_node("SpriteHooks/PlayerSpriteAnchor/PlayerSprite"), "Main scene missing PlayerSprite.", failures)
			_assert(root.has_node("SpriteHooks/GuideSpriteAnchor/GuideSprite"), "Main scene missing GuideSprite.", failures)
			root.free()

	for asset_path in REQUIRED_ASSET_PATHS:
		var absolute_path := ProjectSettings.globalize_path(asset_path)
		_assert(FileAccess.file_exists(absolute_path), "Missing required asset: " + asset_path, failures)

	if failures.size() > 0:
		for item in failures:
			printerr("[godot-headless-smoke] " + item)
		print("[smoke] FAIL - fix assets/config")
		quit(1)
		return

	print("[godot-headless-smoke] PASS")
	quit(0)


func _read_json(path_value: String, failures: Array[String]) -> Dictionary:
	if not FileAccess.file_exists(path_value):
		failures.append("File missing: " + path_value)
		return {}

	var file := FileAccess.open(path_value, FileAccess.READ)
	if file == null:
		failures.append("Could not open: " + path_value)
		return {}

	var text := file.get_as_text()
	file.close()
	if text.strip_edges().is_empty():
		failures.append("File empty: " + path_value)
		return {}

	var parsed: Variant = JSON.parse_string(text)
	if typeof(parsed) != TYPE_DICTIONARY:
		failures.append("JSON root must be object: " + path_value)
		return {}
	return parsed


func _assert(condition: bool, message: String, failures: Array[String]) -> void:
	if not condition:
		failures.append(message)
