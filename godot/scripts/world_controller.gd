extends Node2D

const TILE_SIZE := 32
const LOCAL_SAVE_PATH := "user://slice_save.json"
const IMMEDIATE_TRIGGER_TYPES := ["INTERACT", "ZONE_EXIT", "ENCOUNTER_GATE", "SAVEPOINT"]

@export var run_id: String = "slice-run-001"

@onready var _map_background: ColorRect = %MapBackground
@onready var _player: ColorRect = %Player
@onready var _npc_guide: ColorRect = %NpcGuide
@onready var _auth_client: FirebaseAuthClient = %AuthClient
@onready var _sync_client: SyncClient = %SyncClient
@onready var _trigger_queue: TriggerQueue = %TriggerQueue
@onready var _prose_panel: ProsePanel = %ProsePanel

var _manifest: Dictionary = {}
var _content_version: String = ""
var _current_map_id: String = ""
var _client_seq: int = 0
var _quest_flags: Dictionary = {}
var _local_cooldowns_ms: Dictionary = {}
var _flush_timer: Timer
var _sync_in_flight: bool = false
var _last_savepoint_seq: int = 0


func _ready() -> void:
	_manifest = _load_manifest()
	_content_version = _hash_manifest(_manifest)

	if run_id.strip_edges().is_empty():
		run_id = "slice-run-%d" % int(Time.get_unix_time_from_system())

	var start: Dictionary = _manifest.get("start", {})
	_current_map_id = str(start.get("mapId", "map_village_square"))
	_set_player_tile(Vector2i(int(start.get("x", 3)), int(start.get("y", 3))))
	_update_scene_for_map()
	_render_story()

	_sync_client.auth_client_path = _auth_client.get_path()
	_sync_client.sync_rejected.connect(_on_sync_rejected)
	await _auth_client.ensure_session()

	_flush_timer = Timer.new()
	_flush_timer.one_shot = false
	_flush_timer.wait_time = 0.05
	_flush_timer.autostart = true
	add_child(_flush_timer)
	_flush_timer.timeout.connect(_on_flush_timer_timeout)


func _unhandled_key_input(event: InputEvent) -> void:
	if not (event is InputEventKey and event.pressed and not event.echo):
		return
	var key_event := event as InputEventKey
	match key_event.keycode:
		KEY_W, KEY_UP:
			await _try_move(Vector2i(0, -1))
		KEY_S, KEY_DOWN:
			await _try_move(Vector2i(0, 1))
		KEY_A, KEY_LEFT:
			await _try_move(Vector2i(-1, 0))
		KEY_D, KEY_RIGHT:
			await _try_move(Vector2i(1, 0))
		KEY_E:
			await _try_interact()
		KEY_F:
			await _try_savepoint()
		KEY_L:
			await _load_checkpoint_and_pull()
		_:
			pass


func _on_flush_timer_timeout() -> void:
	if _sync_in_flight:
		return
	if not _trigger_queue.should_flush():
		return
	_sync_in_flight = true
	var response := await _trigger_queue.flush_pending(_sync_client)
	await _handle_sync_response(response)
	_sync_in_flight = false


func _try_move(direction: Vector2i) -> void:
	var current_tile := _get_player_tile()
	var next_tile := current_tile + direction
	if not _within_map_bounds(_current_map_id, next_tile):
		return
	_set_player_tile(next_tile)
	await _process_tile_triggers(next_tile)


func _try_interact() -> void:
	var trigger_hit := _find_nearest_trigger("INTERACT")
	if trigger_hit.is_empty():
		_prose_panel.append_line("No one responds.")
		return
	if not _local_precheck_trigger(trigger_hit.id, trigger_hit.def, 2):
		return
	await _send_immediate_commit(trigger_hit.id, trigger_hit.def)


func _try_savepoint() -> void:
	var trigger_hit := _find_nearest_trigger("SAVEPOINT")
	if trigger_hit.is_empty():
		_prose_panel.append_line("No savepoint in reach.")
		return
	if not _local_precheck_trigger(trigger_hit.id, trigger_hit.def, 2):
		return
	await _send_immediate_commit(trigger_hit.id, trigger_hit.def)


func _process_tile_triggers(tile: Vector2i) -> void:
	var triggers := _find_triggers_at_tile(_current_map_id, tile)
	for hit in triggers:
		var trigger_id := String(hit.id)
		var def: Dictionary = hit.def
		var trigger_type := String(def.get("type", ""))
		if trigger_type == "ENTER_TILE":
			if not _local_precheck_trigger(trigger_id, def, 0, false):
				continue
			var queued := _build_commit_envelope(trigger_id, def)
			if queued.is_empty():
				continue
			_trigger_queue.queue_enter_tile(queued)
		elif IMMEDIATE_TRIGGER_TYPES.has(trigger_type):
			if not _local_precheck_trigger(trigger_id, def, 0, false):
				continue
			await _send_immediate_commit(trigger_id, def)

	if _trigger_queue.should_flush():
		var response := await _trigger_queue.flush_pending(_sync_client)
		await _handle_sync_response(response)


func _send_immediate_commit(trigger_id: String, def: Dictionary) -> void:
	if _sync_in_flight:
		return
	var envelope := _build_commit_envelope(trigger_id, def)
	if envelope.is_empty():
		return
	_sync_in_flight = true
	var response := await _trigger_queue.send_immediate(_sync_client, envelope)
	await _handle_sync_response(response)
	_sync_in_flight = false


func _build_commit_envelope(trigger_id: String, def: Dictionary) -> Dictionary:
	var trigger_type := String(def.get("type", ""))
	if trigger_type.is_empty():
		return {}
	_client_seq += 1
	var trigger_payload := {
		"triggerId": trigger_id,
		"mapId": _current_map_id,
		"x": int(def.get("x", 0)),
		"y": int(def.get("y", 0)),
	}
	var target_id := String(def.get("targetId", ""))
	if not target_id.is_empty():
		trigger_payload["targetId"] = target_id

	return {
		"id": "%s-%d" % [run_id, _client_seq],
		"runId": run_id,
		"clientId": _sync_client.client_id,
		"clientSeq": _client_seq,
		"createdAt": _iso_now(),
		"contentVersion": _content_version,
		"triggerType": trigger_type,
		"trigger": trigger_payload,
	}


func _handle_sync_response(response: Dictionary) -> void:
	if not bool(response.get("http_ok", false)):
		_prose_panel.append_line("Sync unavailable. Local traversal continues in safe mode.")
		return

	var body: Dictionary = response.get("body", {})
	if body.is_empty():
		return

	var canonical := body.get("canonicalState", {})
	if typeof(canonical) == TYPE_DICTIONARY and not canonical.is_empty():
		_apply_canonical_state(canonical)

	if bool(body.get("reconcileRequired", false)):
		_trigger_queue.clear_pending()
	await _reconcile_from_pull()

	if _last_savepoint_seq > 0 and _last_savepoint_seq >= _client_seq:
		_write_local_checkpoint()


func _reconcile_from_pull() -> void:
	var pull_response := await _sync_client.pull(run_id, 0)
	if not bool(pull_response.get("http_ok", false)):
		_prose_panel.append_line("Reconcile pull failed; staying in local safe mode.")
		return
	var body: Dictionary = pull_response.get("body", {})
	if not bool(body.get("ok", false)):
		_prose_panel.append_line("Reconcile pull returned no canonical state.")
		return
	var canonical := body.get("canonicalState", {})
	if typeof(canonical) == TYPE_DICTIONARY and not canonical.is_empty():
		_apply_canonical_state(canonical)
	_trigger_queue.clear_pending()
	_prose_panel.append_line("State reconciled to canonical sync tip.")


func _apply_canonical_state(canonical: Dictionary) -> void:
	_current_map_id = String(canonical.get("mapId", _current_map_id))
	var player_pos: Dictionary = canonical.get("playerPos", {})
	var tile := Vector2i(
		int(player_pos.get("x", 0)),
		int(player_pos.get("y", 0))
	)
	_set_player_tile(tile)
	_client_seq = int(canonical.get("seq", _client_seq))
	_quest_flags = canonical.get("questFlags", {})
	var entity_states: Dictionary = canonical.get("entityStates", {})
	var savepoint: Dictionary = entity_states.get("lastSavepoint", {})
	if typeof(savepoint) == TYPE_DICTIONARY:
		_last_savepoint_seq = int(savepoint.get("seq", _last_savepoint_seq))
	_update_scene_for_map()
	_render_story()


func _local_precheck_trigger(
	trigger_id: String,
	def: Dictionary,
	max_distance: int,
	require_los: bool = true
) -> bool:
	var trigger_tile := Vector2i(int(def.get("x", 0)), int(def.get("y", 0)))
	var player_tile := _get_player_tile()
	var dist := abs(player_tile.x - trigger_tile.x) + abs(player_tile.y - trigger_tile.y)
	if dist > max_distance:
		_prose_panel.append_line("Too far from trigger.")
		return false

	if require_los and player_tile.x != trigger_tile.x and player_tile.y != trigger_tile.y:
		_prose_panel.append_line("No line of sight to trigger.")
		return false

	var now_ms := Time.get_ticks_msec()
	var cooldown_ms := int(def.get("cooldownMs", 0))
	var last_ms := int(_local_cooldowns_ms.get(trigger_id, -cooldown_ms))
	if cooldown_ms > 0 and now_ms - last_ms < cooldown_ms:
		_prose_panel.append_line("Trigger is cooling down.")
		return false

	_local_cooldowns_ms[trigger_id] = now_ms
	return true


func _find_nearest_trigger(trigger_type: String) -> Dictionary:
	var map_entry: Dictionary = _manifest.get("maps", {}).get(_current_map_id, {})
	var trigger_ids: Array = map_entry.get("triggers", [])
	var player_tile := _get_player_tile()
	var best_dist := 1_000_000
	var best: Dictionary = {}
	for trigger_id in trigger_ids:
		var def: Dictionary = _manifest.get("triggers", {}).get(String(trigger_id), {})
		if String(def.get("type", "")) != trigger_type:
			continue
		var tile := Vector2i(int(def.get("x", 0)), int(def.get("y", 0)))
		var dist := abs(player_tile.x - tile.x) + abs(player_tile.y - tile.y)
		if dist < best_dist:
			best_dist = dist
			best = {
				"id": String(trigger_id),
				"def": def,
			}
	return best


func _find_triggers_at_tile(map_id: String, tile: Vector2i) -> Array:
	var hits: Array = []
	var map_entry: Dictionary = _manifest.get("maps", {}).get(map_id, {})
	var trigger_ids: Array = map_entry.get("triggers", [])
	for trigger_id in trigger_ids:
		var def: Dictionary = _manifest.get("triggers", {}).get(String(trigger_id), {})
		if int(def.get("x", -99999)) == tile.x and int(def.get("y", -99999)) == tile.y:
			hits.append({
				"id": String(trigger_id),
				"def": def,
			})
	return hits


func _within_map_bounds(map_id: String, tile: Vector2i) -> bool:
	var map_entry: Dictionary = _manifest.get("maps", {}).get(map_id, {})
	var width := int(map_entry.get("width", 1))
	var height := int(map_entry.get("height", 1))
	return tile.x >= 0 and tile.y >= 0 and tile.x < width and tile.y < height


func _set_player_tile(tile: Vector2i) -> void:
	_player.position = Vector2(tile.x * TILE_SIZE + 2, tile.y * TILE_SIZE + 2)


func _get_player_tile() -> Vector2i:
	return Vector2i(
		int(floor((_player.position.x - 2.0) / float(TILE_SIZE))),
		int(floor((_player.position.y - 2.0) / float(TILE_SIZE)))
	)


func _update_scene_for_map() -> void:
	var color := Color(0.07, 0.10, 0.13, 1.0)
	if _current_map_id == "map_village_square":
		color = Color(0.10, 0.14, 0.18, 1.0)
	if _current_map_id == "map_training_glade":
		color = Color(0.08, 0.17, 0.11, 1.0)
	_map_background.color = color

	_npc_guide.visible = _current_map_id == "map_village_square"
	_npc_guide.position = Vector2(10 * TILE_SIZE + 2, 8 * TILE_SIZE + 2)


func _render_story() -> void:
	if bool(_quest_flags.get("quest_tutorial_encounter_resolved", false)):
		_prose_panel.set_story(
			"Trial Cleared",
			"You crossed the encounter gate and returned with a story etched into the run."
		)
		return
	if bool(_quest_flags.get("quest_tutorial_started", false)):
		_prose_panel.set_story(
			"Guide's Challenge",
			"Find the training gate and step through. Return once the trial resolves."
		)
		return
	if bool(_quest_flags.get("slice_intro_seen", false)):
		_prose_panel.set_story(
			"A Voice in the Square",
			"The guide watches from the center tile. Press E near them to begin."
		)
		return
	_prose_panel.set_story(
		"Arrival",
		"Walk across the square. Trigger commits are sparse and server-validated."
	)


func _write_local_checkpoint() -> void:
	var payload := {
		"run_id": run_id,
		"client_seq": _client_seq,
	}
	var file := FileAccess.open(LOCAL_SAVE_PATH, FileAccess.WRITE)
	if file == null:
		return
	file.store_string(JSON.stringify(payload))
	file.close()


func _load_checkpoint_and_pull() -> void:
	if FileAccess.file_exists(LOCAL_SAVE_PATH):
		var file := FileAccess.open(LOCAL_SAVE_PATH, FileAccess.READ)
		if file:
			var raw := file.get_as_text()
			file.close()
			var parsed := JSON.parse_string(raw)
			if typeof(parsed) == TYPE_DICTIONARY:
				run_id = String(parsed.get("run_id", run_id))
	await _reconcile_from_pull()


func _on_sync_rejected(_payload: Dictionary) -> void:
	_prose_panel.append_line("Commit rejected by authority; reconciling...")


func _load_manifest() -> Dictionary:
	var file := FileAccess.open("res://data/world_manifest.json", FileAccess.READ)
	if file == null:
		return {}
	var text := file.get_as_text()
	file.close()
	var parsed := JSON.parse_string(text)
	if typeof(parsed) == TYPE_DICTIONARY:
		return parsed
	return {}


func _hash_manifest(manifest: Dictionary) -> String:
	var canonical := JSON.stringify(manifest, "", true)
	var hashing := HashingContext.new()
	hashing.start(HashingContext.HASH_SHA256)
	hashing.update(canonical.to_utf8_buffer())
	return hashing.finish().hex_encode()


func _iso_now() -> String:
	return Time.get_datetime_string_from_system(true).replace(" ", "T") + "Z"
