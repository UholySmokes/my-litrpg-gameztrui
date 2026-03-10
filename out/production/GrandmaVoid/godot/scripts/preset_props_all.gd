extends SceneTree

func _initialize() -> void:
	await process_frame
	var platform := EditorExportPlatformAndroid.new()
	var preset := platform.create_preset()
	var props := preset.get_property_list()
	print("props_count=", props.size())
	for prop in props:
		print(String(prop.get("name", "")), " | usage=", int(prop.get("usage", 0)), " | type=", int(prop.get("type", 0)))
	quit()
