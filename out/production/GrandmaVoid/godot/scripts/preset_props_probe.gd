extends SceneTree

func _initialize() -> void:
	await process_frame
	var platform := EditorExportPlatformAndroid.new()
	var preset := platform.create_preset()
	print("preset class=", preset)
	var props := preset.get_property_list()
	for prop in props:
		var name := String(prop.get("name", ""))
		if name.begins_with("option/") or name.contains("export") or name.contains("preset") or name.contains("path"):
			print(name)
	quit()
