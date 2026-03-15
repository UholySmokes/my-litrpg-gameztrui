extends SceneTree

func _initialize() -> void:
	var classes := ClassDB.get_class_list()
	classes.sort()
	for c in classes:
		if String(c).contains("ExportPlatform"):
			print(c)
	quit()
