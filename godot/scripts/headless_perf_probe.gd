extends SceneTree

const MAIN_SCENE_PATH := "res://scenes/Main.tscn"


func _init() -> void:
	var failures: Array[String] = []
	var packed: Variant = load(MAIN_SCENE_PATH)
	if packed == null or not packed is PackedScene:
		failures.append("Main scene failed to load as PackedScene.")
		_fail_and_exit(failures)
		return

	var root: Node = (packed as PackedScene).instantiate()
	if root == null:
		failures.append("Main scene failed to instantiate.")
		_fail_and_exit(failures)
		return
	get_root().add_child(root)

	if not root.has_method("run_perf_baseline"):
		failures.append("World controller missing run_perf_baseline.")
		root.free()
		_fail_and_exit(failures)
		return

	await process_frame
	await process_frame
	var metrics: Variant = await root.call("run_perf_baseline", 240)
	if typeof(metrics) != TYPE_DICTIONARY:
		failures.append("Perf probe did not return dictionary metrics.")
		root.free()
		_fail_and_exit(failures)
		return

	var result: Dictionary = metrics
	if int(result.get("mapTransitions", 0)) < 2:
		failures.append("Expected at least 2 map transitions in baseline run.")
	if int(result.get("renderSamples", 0)) <= 0:
		failures.append("Expected render sample measurements from baseline run.")

	root.free()

	if failures.size() > 0:
		_fail_and_exit(failures)
		return

	print("[godot-perf-probe] " + JSON.stringify(result))
	quit(0)


func _fail_and_exit(failures: Array[String]) -> void:
	for failure in failures:
		printerr("[godot-perf-probe] " + failure)
	quit(1)
