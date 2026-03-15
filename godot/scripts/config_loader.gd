extends Node
class_name ConfigLoader

const CONFIG_PATH := "res://data/config.json"
const DEFAULT_CONFIG := {
	"schemaVersion": 1,
	"buildId": "godot-dev",
	"runtimeMode": "online",
	"apiBaseUrl": "http://127.0.0.1:5001/my-litrpg-gameztrui-3416-da75c/us-central1/api",
	"syncCommandPath": "/sync/command",
	"syncPullPath": "/sync/pull",
	"telemetryPath": "/telemetry",
	"storyStartPath": "/story/start",
	"storyPollPath": "/story/poll",
}


func load_runtime_config(config_path: String = CONFIG_PATH) -> Dictionary:
	var merged: Dictionary = DEFAULT_CONFIG.duplicate(true)
	if not FileAccess.file_exists(config_path):
		return merged

	var file := FileAccess.open(config_path, FileAccess.READ)
	if file == null:
		return merged

	var raw := file.get_as_text()
	file.close()
	if raw.strip_edges().is_empty():
		return merged

	var parsed: Variant = JSON.parse_string(raw)
	if typeof(parsed) != TYPE_DICTIONARY:
		return merged

	for key in parsed.keys():
		merged[key] = parsed[key]
	return merged
