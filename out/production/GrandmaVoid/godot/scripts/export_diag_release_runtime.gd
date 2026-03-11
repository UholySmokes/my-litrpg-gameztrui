extends SceneTree

func _initialize() -> void:
	await process_frame
	var platform := EditorExportPlatformAndroid.new()
	var preset := platform.create_preset()

	preset.set("name", "Diag Android Release")
	preset.set("runnable", false)
	preset.set("export_filter", "scenes")
	preset.set("export_files", PackedStringArray(["res://scenes/Main.tscn"]))
	preset.set("script_export_mode", 1)

	preset.set("gradle_build/use_gradle_build", true)
	preset.set("gradle_build/export_format", 1)
	preset.set("architectures/armeabi-v7a", false)
	preset.set("architectures/arm64-v8a", true)
	preset.set("architectures/x86", false)
	preset.set("architectures/x86_64", false)
	preset.set("version/code", 1)
	preset.set("version/name", "0.1.0-rc")
	preset.set("package/unique_name", "com.voidverse.app")
	preset.set("package/name", "Voidverse")
	preset.set("package/signed", false)

	platform.clear_messages()
	var result := platform.export_project(preset, false, "D:/ai t6ext/my-litrpg-gameztrui/build/android/diag-release.aab")
	print("export_result=", result)
	var count := platform.get_message_count()
	print("messages=", count)
	for i in range(count):
		print("msg[", i, "] type=", platform.get_message_type(i), " cat=", platform.get_message_category(i), " text=", platform.get_message_text(i))

	quit()
