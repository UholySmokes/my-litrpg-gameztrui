@tool
extends EditorScript

func _run() -> void:
	var platform := EditorExportPlatformAndroid.new()
	var presets := platform.get_current_presets()
	print("presets_count=", presets.size())
	for preset in presets:
		if preset is EditorExportPreset:
			print("preset_name=", preset.get_name())
