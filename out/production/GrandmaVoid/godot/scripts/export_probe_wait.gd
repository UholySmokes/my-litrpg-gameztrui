extends SceneTree

func _initialize() -> void:
	await process_frame
	await process_frame
	await process_frame
	var platform := EditorExportPlatformAndroid.new()
	var presets := platform.get_current_presets()
	print("presets_count=", presets.size())
	for preset in presets:
		if preset is EditorExportPreset:
			print("preset_name=", preset.get_name())
	quit()
