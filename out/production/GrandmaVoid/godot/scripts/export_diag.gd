@tool
extends SceneTree

func _initialize() -> void:
	var platform := EditorExportPlatform.new()
	var presets := platform.get_current_presets()
	print("presets_count=", presets.size())
	for preset in presets:
		if not (preset is EditorExportPreset):
			continue
		var name := preset.get_name()
		print("preset=", name)
		if name == "Android Internal Debug":
			platform.clear_messages()
			var result := platform.export_project(preset, true, "D:/ai t6ext/my-litrpg-gameztrui/build/android/diag-internal.apk")
			print("export_result=", result)
			var count := platform.get_message_count()
			print("messages=", count)
			for i in range(count):
				print("msg[", i, "] type=", platform.get_message_type(i), " cat=", platform.get_message_category(i), " text=", platform.get_message_text(i))
	quit()
