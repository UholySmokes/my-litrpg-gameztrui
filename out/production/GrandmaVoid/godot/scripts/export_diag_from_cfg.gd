extends SceneTree

func _set_key_if_supported(target: Object, key: String, value: Variant) -> void:
	var props = target.get_property_list()
	for prop in props:
		if String(prop.get("name", "")) == key:
			target.set(key, value)
			return
	print("SKIP unsupported key: ", key)

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

	var base := "preset.0"
	var options := "preset.0.options"

	for key in cfg.get_section_keys(base):
		if key == "name" or key == "platform":
			continue
		_set_key_if_supported(preset, key, cfg.get_value(base, key))
	for key in cfg.get_section_keys(options):
		_set_key_if_supported(preset, key, cfg.get_value(options, key))

	preset.set("name", "Diag From Cfg Internal")
	platform.clear_messages()
	var result := platform.export_project(preset, true, "D:/ai t6ext/my-litrpg-gameztrui/build/android/diag-from-cfg-internal.apk")
	print("export_result=", result)
	var count := platform.get_message_count()
	print("messages=", count)
	for i in range(count):
		print("msg[", i, "] type=", platform.get_message_type(i), " cat=", platform.get_message_category(i), " text=", platform.get_message_text(i))

	quit()
