extends SceneTree

func _initialize() -> void:
	await process_frame
	var cfg := ConfigFile.new()
	var err := cfg.load("res://export_presets.cfg")
	if err != OK:
		print("cfg load error=", err)
		quit()
		return

	var platform := EditorExportPlatformAndroid.new()
	var preset := platform.create_preset()

	for key in cfg.get_section_keys("preset.0"):
		if key == "name" or key == "platform":
			continue
		preset.set(key, cfg.get_value("preset.0", key))
	for key in cfg.get_section_keys("preset.0.options"):
		preset.set(key, cfg.get_value("preset.0.options", key))

	preset.set("name", "Diag Force Internal")
	platform.clear_messages()
	var result := platform.export_project(preset, true, "D:/ai t6ext/my-litrpg-gameztrui/build/android/diag-force-internal.apk")
	print("export_result=", result)
	var count := platform.get_message_count()
	print("messages=", count)
	for i in range(count):
		print("msg[", i, "] type=", platform.get_message_type(i), " cat=", platform.get_message_category(i), " text=", platform.get_message_text(i))

	quit()
