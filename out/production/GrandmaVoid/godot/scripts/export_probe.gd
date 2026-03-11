extends SceneTree

func _initialize() -> void:
	var platform := EditorExportPlatformAndroid.new()
	print("platform=", platform)
	var presets := platform.get_current_presets()
	print("presets_count=", presets.size())
	for preset in presets:
		if preset is EditorExportPreset:
			print("preset_name=", preset.get_name())
	quit()
