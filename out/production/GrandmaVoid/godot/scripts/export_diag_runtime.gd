extends SceneTree

func _initialize() -> void:
	await process_frame
	var platform := EditorExportPlatformAndroid.new()
	var preset := platform.create_preset()

	preset.set("name", "Diag Android")
	preset.set("runnable", true)
	preset.set("export_filter", "scenes")
	preset.set("export_files", PackedStringArray(["res://scenes/Main.tscn"]))
	preset.set("script_export_mode", 1)
	preset.set("export_path", "D:/ai t6ext/my-litrpg-gameztrui/build/android/diag-script.apk")

	preset.set("gradle_build/use_gradle_build", false)
	preset.set("gradle_build/export_format", 0)
	preset.set("architectures/armeabi-v7a", false)
	preset.set("architectures/arm64-v8a", true)
	preset.set("architectures/x86", false)
	preset.set("architectures/x86_64", false)
	preset.set("version/code", 1)
	preset.set("version/name", "0.1.0-diag")
	preset.set("package/unique_name", "com.voidverse.internal")
	preset.set("package/name", "VoidverseInternal")
	preset.set("package/signed", false)

	platform.clear_messages()
	var result := platform.export_project(preset, true, "D:/ai t6ext/my-litrpg-gameztrui/build/android/diag-script.apk")
	print("export_result=", result)
	var count := platform.get_message_count()
	print("messages=", count)
	for i in range(count):
		print("msg[", i, "] type=", platform.get_message_type(i), " cat=", platform.get_message_category(i), " text=", platform.get_message_text(i))

	quit()
