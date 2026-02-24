extends SceneTree

const CONFIG_PATH := "res://data/config.json"
const MAIN_SCENE_PATH := "res://scenes/Main.tscn"


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
			root.free()

	if failures.size() > 0:
		for item in failures:
			printerr("[godot-headless-smoke] " + item)
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
