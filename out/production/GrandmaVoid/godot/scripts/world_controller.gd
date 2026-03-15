extends Node2D

const FirebaseAuthClient := preload("res://scripts/firebase_auth_client.gd")
const SyncClient := preload("res://scripts/sync_client.gd")
const ConfigLoader := preload("res://scripts/config_loader.gd")
const TriggerQueue := preload("res://scripts/trigger_queue.gd")
const ProsePanel := preload("res://scripts/prose_panel.gd")
const CharacterCreationController := preload("res://scripts/character_creation_controller.gd")
const CharacterCreationPanel := preload("res://scripts/character_creation_panel.gd")
const CharacterCreationSummaryPanel := preload("res://scripts/character_creation_summary_panel.gd")

const TILE_SIZE := 32
const LOCAL_SAVE_PATH := "user://slice_save.json"
const PLAYER_PROFILE_PATH := "user://player_profile.json"
const IMMEDIATE_TRIGGER_TYPES := ["INTERACT", "ZONE_EXIT", "ENCOUNTER_GATE", "SAVEPOINT"]
const PERF_SAMPLE_LIMIT := 240
const PLAYER_SPRITE_PATH := "res://assets/characters/traveler_idle_down.png"
const GUIDE_SPRITE_PATH := "res://assets/characters/guide_idle_down.png"

@export var run_id: String = "slice-run-001"

@onready var _map_background: ColorRect = %MapBackground
@onready var _map_renderer = %MapRenderer
@onready var _player: ColorRect = %Player
@onready var _player_sprite_anchor: Node2D = %PlayerSpriteAnchor
@onready var _player_sprite: Sprite2D = %PlayerSprite
@onready var _npc_guide: ColorRect = %NpcGuide
@onready var _guide_sprite_anchor: Node2D = %GuideSpriteAnchor
@onready var _guide_sprite: Sprite2D = %GuideSprite
@onready var _auth_client: FirebaseAuthClient = %AuthClient
@onready var _sync_client: SyncClient = %SyncClient
@onready var _story_client = %StoryClient
@onready var _telemetry_reporter = %TelemetryReporter
@onready var _config_loader: ConfigLoader = %ConfigLoader
@onready var _trigger_queue: TriggerQueue = %TriggerQueue
@onready var _prose_panel: ProsePanel = %ProsePanel
@onready var _cc_controller: CharacterCreationController = %CharacterCreationController
@onready var _cc_panel: CharacterCreationPanel = %CharacterCreationPanel
@onready var _cc_summary_panel: CharacterCreationSummaryPanel = %CharacterCreationSummaryPanel

var _manifest: Dictionary = {}
var _content_version: String = ""
var _current_map_id: String = ""
var _client_seq: int = 0
var _quest_flags: Dictionary = {}
var _local_cooldowns_ms: Dictionary = {}
var _flush_timer: Timer
var _sync_in_flight: bool = false
var _last_savepoint_seq: int = 0
var _last_checkpoint_written_seq: int = 0
var _runtime_config: Dictionary = {}
var _telemetry_session_id: String = ""
var _telemetry_build_id: String = "godot-unknown"
var _last_story_context_key: String = ""
var _pending_story_context_key: String = ""
var _story_request_in_flight: bool = false
var _perf_move_samples_ms: Array = []
var _perf_render_samples_ms: Array = []
var _perf_map_transitions: int = 0
var _last_perf_map_id: String = ""
var _creating_character: bool = false
var _player_profile: Dictionary = {}


func _ready() -> void:
	_runtime_config = _config_loader.load_runtime_config()
	_apply_runtime_config(_runtime_config)

	_manifest = _load_manifest()
	_content_version = _hash_manifest(_manifest)

	if run_id.strip_edges().is_empty():
		run_id = "slice-run-%d" % int(Time.get_unix_time_from_system())
	_telemetry_session_id = "godot-session-%d" % int(Time.get_unix_time_from_system())
	_telemetry_build_id = String(_runtime_config.get("buildId", "godot-4.x"))

	var start: Dictionary = _manifest.get("start", {})
	_current_map_id = str(start.get("mapId", "map_village_square"))
	_load_runtime_sprite_assets()
	_set_player_tile(Vector2i(int(start.get("x", 3)), int(start.get("y", 3))))

	_player_profile = _load_player_profile()
	var created_count: int = int(_player_profile.get("characters_created", 0))
	if _cc_controller:
		_cc_controller.set_advanced_unlocked(created_count >= 1)
		_cc_controller.set_preferred_creation_mode(String(_player_profile.get("last_creation_mode", "basic")))

	# ── character creation gate ──
	var cc_cfg: Dictionary = _manifest.get("characterCreation", {})
	var cc_required: bool = cc_cfg.get("required", false)
	if cc_required and _cc_controller and _cc_panel:
		_creating_character = true
		_cc_panel.bind_controller(_cc_controller)
		if _cc_summary_panel:
			_cc_summary_panel.bind_controller(_cc_controller)
		_cc_controller.creation_completed.connect(_on_character_creation_completed)
		_cc_controller.load_options()
		# hide world elements while creating
		_player.visible = false
		_player_sprite_anchor.visible = false
		if _npc_guide:
			_npc_guide.visible = false
			_guide_sprite_anchor.visible = false
		_map_renderer.visible = false
		_prose_panel.visible = false
		_cc_panel.visible = true
		if _cc_summary_panel:
			_cc_summary_panel.visible = true
	else:
		if _cc_panel:
			_cc_panel.visible = false
		if _cc_summary_panel:
			_cc_summary_panel.visible = false
		_update_scene_for_map()
		_apply_sprite_fallback_visibility()
		_render_story()

	_sync_client.auth_client_path = _auth_client.get_path()
	_story_client.auth_client_path = _auth_client.get_path()
	if _telemetry_reporter != null:
		_telemetry_reporter.auth_client_path = _auth_client.get_path()
		_enqueue_telemetry(
			"world_ready",
			"info",
			"world_controller_ready",
			{
				"runId": run_id,
				"mapId": _current_map_id,
			}
		)
	_sync_client.sync_rejected.connect(_on_sync_rejected)
	await _auth_client.ensure_session()
	await _flush_telemetry_if_needed()
	_queue_story_refresh()

	_flush_timer = Timer.new()
	_flush_timer.one_shot = false
	_flush_timer.wait_time = 0.05
	_flush_timer.autostart = true
	add_child(_flush_timer)
	_flush_timer.timeout.connect(_on_flush_timer_timeout)


func _on_character_creation_completed(character_data: Dictionary) -> void:
	_creating_character = false
	_player_profile["characters_created"] = int(_player_profile.get("characters_created", 0)) + 1
	_player_profile["last_creation_mode"] = String(character_data.get("mode", "basic"))
	_save_player_profile(_player_profile)

	# hide creation UI
	_cc_panel.visible = false
	if _cc_summary_panel:
		_cc_summary_panel.visible = false

	# optionally switch to the post-creation map
	var cc_cfg: Dictionary = _manifest.get("characterCreation", {})
	var start_map: String = String(cc_cfg.get("startMapAfterCreation", _current_map_id))
	if not start_map.is_empty():
		_current_map_id = start_map

	# show world elements
	_player.visible = true
	_player_sprite_anchor.visible = true
	_map_renderer.visible = true
	_prose_panel.visible = true
	_update_scene_for_map()
	_apply_sprite_fallback_visibility()
	_render_story()

	# send character data to backend
	if _sync_client and _sync_client.has_method("send_command"):
		_client_seq += 1
		var command_response: Dictionary = await _sync_client.send_command(
			"create_character",
			character_data,
			run_id,
			_client_seq,
			_content_version
		)
		var command_body: Dictionary = {}
		var command_body_value: Variant = command_response.get("body", {})
		if typeof(command_body_value) == TYPE_DICTIONARY:
			command_body = command_body_value
			var canonical_state_value: Variant = command_body.get("canonicalState", {})
			if typeof(canonical_state_value) == TYPE_DICTIONARY:
				var canonical_state: Dictionary = canonical_state_value
				_client_seq = maxi(_client_seq, int(canonical_state.get("seq", _client_seq)))
		if not bool(command_response.get("http_ok", false)):
			_enqueue_telemetry(
				"character_create_sync_failed",
				"warn",
				"character_creation_command_failed",
				{
					"status": int(command_response.get("status", 0)),
					"errorCode":
						String(command_body.get("errorCode", command_response.get("error", "unknown"))),
				}
			)
		else:
			_enqueue_telemetry(
				"character_create_synced",
				"info",
				"character_creation_command_accepted",
				{
					"seq": _client_seq,
				}
			)

	_enqueue_telemetry(
		"character_created",
		"info",
		"character_creation_complete",
		{
			"name": String(character_data.get("name", "")),
			"race": String(character_data.get("race", {}).get("id", "")),
			"class": String(character_data.get("class", {}).get("id", "")),
		}
	)

	print("=== Transitioning to gameplay after character creation ===")


func _unhandled_key_input(event: InputEvent) -> void:
	if _creating_character:
		return  # let CharacterCreationPanel handle input
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
	var response: Dictionary = await _trigger_queue.flush_pending(_sync_client)
	await _handle_sync_response(response)
	_sync_in_flight = false
	await _flush_telemetry_if_needed()


func _try_move(direction: Vector2i) -> void:
	var started_us := Time.get_ticks_usec()
	var current_tile := _get_player_tile()
	var next_tile := current_tile + direction
	if not _within_map_bounds(_current_map_id, next_tile):
		return
	_set_player_tile(next_tile)
	await _process_tile_triggers(next_tile)
	_record_perf_sample(_perf_move_samples_ms, _duration_ms(started_us))


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
	var triggers: Array = _find_triggers_at_tile(_current_map_id, tile)
	for hit in triggers:
		var trigger_id := String(hit.id)
		var def: Dictionary = hit.def
		var trigger_type := String(def.get("type", ""))
		if trigger_type == "ENTER_TILE":
			if not _local_precheck_trigger(trigger_id, def, 0, false):
				continue
			var queued: Dictionary = _build_commit_envelope(trigger_id, def)
			if queued.is_empty():
				continue
			_trigger_queue.queue_enter_tile(queued)
		elif IMMEDIATE_TRIGGER_TYPES.has(trigger_type):
			if not _local_precheck_trigger(trigger_id, def, 0, false):
				continue
			await _send_immediate_commit(trigger_id, def)

	if _trigger_queue.should_flush():
		var response: Dictionary = await _trigger_queue.flush_pending(_sync_client)
		await _handle_sync_response(response)


func _send_immediate_commit(trigger_id: String, def: Dictionary) -> void:
	if _sync_in_flight:
		return
	var envelope: Dictionary = _build_commit_envelope(trigger_id, def)
	if envelope.is_empty():
		return
	_sync_in_flight = true
	var response: Dictionary = await _trigger_queue.send_immediate(_sync_client, envelope)
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

	var envelope := {
		"id": "%s-%d" % [run_id, _client_seq],
		"runId": run_id,
		"clientId": _sync_client.client_id,
		"clientSeq": _client_seq,
		"createdAt": _iso_now(),
		"contentVersion": _content_version,
		"triggerType": trigger_type,
		"trigger": trigger_payload,
	}
	envelope["commandType"] = "TRIGGER"
	envelope["command"] = {
		"type": "TRIGGER",
		"triggerType": trigger_type,
		"trigger": trigger_payload,
	}
	return envelope


func _handle_sync_response(response: Dictionary) -> void:
	if not bool(response.get("http_ok", false)):
		_prose_panel.append_line("Sync unavailable. Local traversal continues in safe mode.")
		_enqueue_telemetry(
			"sync_response",
			"error",
			"sync_unavailable",
			{
				"status": int(response.get("status", 0)),
				"error": String(response.get("error", "")),
			}
		)
		return

	var body: Dictionary = response.get("body", {})
	if body.is_empty():
		return

	var canonical: Dictionary = body.get("canonicalState", {})
	if typeof(canonical) == TYPE_DICTIONARY and not canonical.is_empty():
		_apply_canonical_state(canonical)

	if bool(body.get("reconcileRequired", false)):
		_trigger_queue.clear_pending()
		_enqueue_telemetry(
			"sync_reconcile_required",
			"warn",
			"reconcile_required",
			{
				"runId": run_id,
				"clientSeq": _client_seq,
				"rejected": body.get("rejected", []),
			}
		)
		await _reconcile_from_pull()

	if _last_savepoint_seq > _last_checkpoint_written_seq and _last_savepoint_seq <= _client_seq:
		_write_local_checkpoint()
	var accepted_entries: Array = body.get("accepted", [])
	var rejected_entries: Array = body.get("rejected", [])

	_enqueue_telemetry(
		"sync_response",
		"info",
		"sync_response_ok",
		{
			"status": int(response.get("status", 0)),
			"canonicalSeq": int(canonical.get("seq", _client_seq)),
			"acceptedCount": accepted_entries.size(),
			"rejectedCount": rejected_entries.size(),
			"reconcileRequired": bool(body.get("reconcileRequired", false)),
		}
	)
	await _flush_telemetry_if_needed()


func _reconcile_from_pull() -> void:
	var pull_response: Dictionary = await _sync_client.pull(run_id, 0)
	if not bool(pull_response.get("http_ok", false)):
		_prose_panel.append_line("Reconcile pull failed; staying in local safe mode.")
		return
	var body: Dictionary = pull_response.get("body", {})
	if not bool(body.get("ok", false)):
		_prose_panel.append_line("Reconcile pull returned no canonical state.")
		return
	var canonical: Dictionary = body.get("canonicalState", {})
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
	_queue_story_refresh()


func _local_precheck_trigger(
	trigger_id: String,
	def: Dictionary,
	max_distance: int,
	require_los: bool = true
) -> bool:
	var trigger_tile := Vector2i(int(def.get("x", 0)), int(def.get("y", 0)))
	var player_tile := _get_player_tile()
	var dist: int = abs(player_tile.x - trigger_tile.x) + abs(player_tile.y - trigger_tile.y)
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
		var dist: int = abs(player_tile.x - tile.x) + abs(player_tile.y - tile.y)
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
	if _player_sprite_anchor != null:
		_player_sprite_anchor.position = _player.position


func _get_player_tile() -> Vector2i:
	return Vector2i(
		int(floor((_player.position.x - 2.0) / float(TILE_SIZE))),
		int(floor((_player.position.y - 2.0) / float(TILE_SIZE)))
	)


func _update_scene_for_map() -> void:
	var started_us := Time.get_ticks_usec()
	if not _last_perf_map_id.is_empty() and _last_perf_map_id != _current_map_id:
		_perf_map_transitions += 1
	_last_perf_map_id = _current_map_id

	var color := Color(0.07, 0.10, 0.13, 1.0)
	if _current_map_id == "map_village_square":
		color = Color(0.10, 0.14, 0.18, 1.0)
	if _current_map_id == "map_training_glade":
		color = Color(0.08, 0.17, 0.11, 1.0)
	if _current_map_id == "map_ruined_outlook":
		color = Color(0.17, 0.13, 0.12, 1.0)
	_map_background.color = color

	var map_entry: Dictionary = _manifest.get("maps", {}).get(_current_map_id, {})
	if _map_renderer != null:
		_map_renderer.render_map(
			_current_map_id,
			int(map_entry.get("width", 1)),
			int(map_entry.get("height", 1)),
			_trigger_tiles_for_map(_current_map_id),
		)

	_npc_guide.visible = _current_map_id == "map_village_square"
	_npc_guide.position = Vector2(10 * TILE_SIZE + 2, 8 * TILE_SIZE + 2)
	if _guide_sprite_anchor != null:
		_guide_sprite_anchor.position = _npc_guide.position
		_guide_sprite_anchor.visible = _npc_guide.visible
	_record_perf_sample(_perf_render_samples_ms, _duration_ms(started_us))


func _render_story() -> void:
	var fallback: Dictionary = _fallback_story_payload()
	var fallback_suggestions: Array = fallback.get("suggestions", []) as Array
	_prose_panel.set_story(
		String(fallback.get("title", "Arrival")),
		String(fallback.get("body", "The run continues.")),
		fallback_suggestions
	)


func _queue_story_refresh() -> void:
	if _story_client == null:
		return
	var context_key := _story_context_key()
	if context_key == _last_story_context_key:
		return
	_pending_story_context_key = context_key
	if _story_request_in_flight:
		return
	_story_request_in_flight = true
	_refresh_story_for_context(context_key)


func _refresh_story_for_context(context_key: String) -> void:
	var fallback: Dictionary = _fallback_story_payload()
	var request_payload: Dictionary = {
		"runId": run_id,
		"mapId": _current_map_id,
		"clientSeq": _client_seq,
		"questFlags": _quest_flags.duplicate(true),
	}
	var prompt := _build_story_prompt(fallback)
	var mode := String(fallback.get("mode", "exploration"))
	var story_result: Dictionary = await _story_client.request_story(prompt, mode, request_payload)

	_story_request_in_flight = false
	if context_key != _pending_story_context_key:
		_queue_story_refresh()
		return

	_last_story_context_key = context_key
	var narrative := String(story_result.get("narrative", "")).strip_edges()
	if narrative.is_empty():
		narrative = String(fallback.get("body", "The story presses onward."))
	var suggestions: Array = story_result.get("suggestions", fallback.get("suggestions", [])) as Array
	_prose_panel.set_story(
		String(fallback.get("title", "Story")),
		narrative,
		suggestions
	)


func _story_context_key() -> String:
	return "%s|%d|%d|%d" % [
		_current_map_id,
		int(bool(_quest_flags.get("slice_intro_seen", false))),
		int(bool(_quest_flags.get("quest_tutorial_started", false))),
		int(bool(_quest_flags.get("quest_tutorial_encounter_resolved", false))),
	]


func _fallback_story_payload() -> Dictionary:
	if bool(_quest_flags.get("quest_tutorial_encounter_resolved", false)):
		return {
			"title": "Trial Cleared",
			"body": "You crossed the encounter gate and returned with a story etched into the run.",
			"mode": "scene-transition",
			"suggestions": [
				{"t": "report back to the guide", "w": 1.0},
				{"t": "check quest log", "w": 0.9},
				{"t": "save progress", "w": 0.85},
			],
		}
	if bool(_quest_flags.get("quest_tutorial_started", false)):
		return {
			"title": "Guide's Challenge",
			"body": "Find the training gate and step through. Return once the trial resolves.",
			"mode": "exploration",
			"suggestions": [
				{"t": "head to training gate", "w": 1.0},
				{"t": "scan the glade", "w": 0.9},
				{"t": "return to square", "w": 0.8},
			],
		}
	if bool(_quest_flags.get("slice_intro_seen", false)):
		return {
			"title": "A Voice in the Square",
			"body": "The guide watches from the center tile. Press E near them to begin.",
			"mode": "dialogue",
			"suggestions": [
				{"t": "approach the guide", "w": 1.0},
				{"t": "ask about the trial", "w": 0.9},
				{"t": "prepare to move out", "w": 0.85},
			],
		}
	return {
		"title": "Arrival",
		"body": "Walk across the square. Trigger commits are sparse and server-validated.",
		"mode": "exploration",
		"suggestions": [
			{"t": "walk the square", "w": 1.0},
			{"t": "inspect nearby tiles", "w": 0.9},
			{"t": "locate the guide", "w": 0.85},
		],
	}


func _build_story_prompt(fallback: Dictionary) -> String:
	var lines: Array[String] = []
	lines.append("Write 2-3 concise, in-world sentences for the player.")
	lines.append("Avoid markdown, role disclaimers, or system framing.")
	lines.append("mapId=%s runId=%s seq=%d" % [_current_map_id, run_id, _client_seq])
	lines.append("storyState=%s" % String(fallback.get("title", "Arrival")))
	lines.append("fallbackHint=%s" % String(fallback.get("body", "")))
	lines.append("questFlags=%s" % JSON.stringify(_quest_flags))
	return "\n".join(lines)


func _trigger_tiles_for_map(map_id: String) -> Array:
	var tiles: Array = []
	var map_entry: Dictionary = _manifest.get("maps", {}).get(map_id, {})
	var trigger_ids: Array = map_entry.get("triggers", [])
	for trigger_id in trigger_ids:
		var def: Dictionary = _manifest.get("triggers", {}).get(String(trigger_id), {})
		tiles.append({
			"x": int(def.get("x", -1)),
			"y": int(def.get("y", -1)),
			"type": String(def.get("type", "")),
		})
	return tiles


func _apply_sprite_fallback_visibility() -> void:
	if _player_sprite != null and _player_sprite.texture != null:
		_player.color = Color(1.0, 1.0, 1.0, 0.0)
	if _guide_sprite != null and _guide_sprite.texture != null:
		_npc_guide.color = Color(1.0, 1.0, 1.0, 0.0)


func _load_runtime_sprite_assets() -> void:
	_assign_sprite_texture(_player_sprite, PLAYER_SPRITE_PATH)
	_assign_sprite_texture(_guide_sprite, GUIDE_SPRITE_PATH)


func _assign_sprite_texture(sprite: Sprite2D, asset_path: String) -> void:
	if sprite == null:
		return
	var absolute_path := ProjectSettings.globalize_path(asset_path)
	if not FileAccess.file_exists(absolute_path):
		return
	var image := Image.new()
	if image.load(absolute_path) != OK:
		return
	var texture := ImageTexture.create_from_image(image)
	if texture != null:
		sprite.texture = texture


func _duration_ms(started_us: int) -> float:
	return float(Time.get_ticks_usec() - started_us) / 1000.0


func _record_perf_sample(samples: Array, value_ms: float) -> void:
	samples.append(value_ms)
	if samples.size() > PERF_SAMPLE_LIMIT:
		samples.remove_at(0)


func _average_ms(samples: Array) -> float:
	if samples.is_empty():
		return 0.0
	var total := 0.0
	for value in samples:
		total += float(value)
	return total / float(samples.size())


func _percentile_ms(samples: Array, percentile: float) -> float:
	if samples.is_empty():
		return 0.0
	var sorted: Array = samples.duplicate()
	sorted.sort()
	var index := int(floor((sorted.size() - 1) * percentile))
	index = maxi(index, 0)
	index = mini(index, sorted.size() - 1)
	return float(sorted[index])


func get_perf_snapshot() -> Dictionary:
	return {
		"mapId": _current_map_id,
		"mapTransitions": _perf_map_transitions,
		"moveSamples": _perf_move_samples_ms.size(),
		"renderSamples": _perf_render_samples_ms.size(),
		"moveAvgMs": _average_ms(_perf_move_samples_ms),
		"moveP95Ms": _percentile_ms(_perf_move_samples_ms, 0.95),
		"renderAvgMs": _average_ms(_perf_render_samples_ms),
		"renderP95Ms": _percentile_ms(_perf_render_samples_ms, 0.95),
	}


func run_perf_baseline(iterations: int = 180) -> Dictionary:
	var original_map_id := _current_map_id
	var original_tile := _get_player_tile()
	var maps := [
		"map_village_square",
		"map_training_glade",
		"map_ruined_outlook",
	]

	for i in range(maxi(iterations, 1)):
		var map_id := String(maps[i % maps.size()])
		var map_entry: Dictionary = _manifest.get("maps", {}).get(map_id, {})
		if map_entry.is_empty():
			continue
		var width := int(map_entry.get("width", 1))
		var height := int(map_entry.get("height", 1))
		var tile := Vector2i(
			int((i * 3) % maxi(width, 1)),
			int((i * 5 + 2) % maxi(height, 1))
		)
		var started_us := Time.get_ticks_usec()
		_current_map_id = map_id
		_set_player_tile(tile)
		_update_scene_for_map()
		_record_perf_sample(_perf_move_samples_ms, _duration_ms(started_us))
		await get_tree().process_frame

	_current_map_id = original_map_id
	_set_player_tile(original_tile)
	_update_scene_for_map()

	var snapshot: Dictionary = get_perf_snapshot()
	snapshot["baselineIterations"] = maxi(iterations, 1)
	return snapshot


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
	_last_checkpoint_written_seq = _last_savepoint_seq


func _load_checkpoint_and_pull() -> void:
	if FileAccess.file_exists(LOCAL_SAVE_PATH):
		var file := FileAccess.open(LOCAL_SAVE_PATH, FileAccess.READ)
		if file:
			var raw := file.get_as_text()
			file.close()
			var parsed: Variant = JSON.parse_string(raw)
			if typeof(parsed) == TYPE_DICTIONARY:
				run_id = String(parsed.get("run_id", run_id))
	await _reconcile_from_pull()


func _load_player_profile() -> Dictionary:
	if not FileAccess.file_exists(PLAYER_PROFILE_PATH):
		return { "characters_created": 0, "last_creation_mode": "basic" }
	var file := FileAccess.open(PLAYER_PROFILE_PATH, FileAccess.READ)
	if file == null:
		return { "characters_created": 0, "last_creation_mode": "basic" }
	var raw := file.get_as_text()
	file.close()

	var parsed: Variant = JSON.parse_string(raw)
	if typeof(parsed) == TYPE_DICTIONARY:
		return parsed
	return { "characters_created": 0, "last_creation_mode": "basic" }


func _save_player_profile(profile: Dictionary) -> void:
	var file := FileAccess.open(PLAYER_PROFILE_PATH, FileAccess.WRITE)
	if file == null:
		push_warning("world_controller: could not write player profile")
		return
	file.store_string(JSON.stringify(profile, "\t"))
	file.close()


func _on_sync_rejected(_payload: Dictionary) -> void:
	_prose_panel.append_line("Command rejected by authority; reconciling...")
	_enqueue_telemetry(
		"sync_rejected_signal",
		"warn",
		"sync_rejected_signal",
		{
			"runId": run_id,
			"clientSeq": _client_seq,
		}
	)


func _apply_runtime_config(config: Dictionary) -> void:
	if _sync_client == null:
		return
	var api_base_url := String(config.get("apiBaseUrl", "")).strip_edges()
	var configured_build := String(config.get("buildId", _telemetry_build_id)).strip_edges()
	if not configured_build.is_empty():
		_telemetry_build_id = configured_build
	if not api_base_url.is_empty():
		_sync_client.api_base_url = api_base_url

	var command_path := _normalize_api_path(
		String(config.get("syncCommandPath", _sync_client.sync_command_path))
	)
	var pull_path := _normalize_api_path(
		String(config.get("syncPullPath", _sync_client.sync_pull_path))
	)
	if not command_path.is_empty():
		_sync_client.sync_command_path = command_path
	if not pull_path.is_empty():
		_sync_client.sync_pull_path = pull_path

	if _story_client != null:
		if not api_base_url.is_empty():
			_story_client.api_base_url = api_base_url
		var story_start_path := _normalize_api_path(
			String(config.get("storyStartPath", _story_client.story_start_path))
		)
		var story_poll_path := _normalize_api_path(
			String(config.get("storyPollPath", _story_client.story_poll_path))
		)
		if not story_start_path.is_empty():
			_story_client.story_start_path = story_start_path
		if not story_poll_path.is_empty():
			_story_client.story_poll_path = story_poll_path

	if _telemetry_reporter != null:
		if not api_base_url.is_empty():
			_telemetry_reporter.api_base_url = api_base_url
		var telemetry_path := _normalize_api_path(
			String(config.get("telemetryPath", _telemetry_reporter.telemetry_path))
		)
		if not telemetry_path.is_empty():
			_telemetry_reporter.telemetry_path = telemetry_path


func _enqueue_telemetry(
	event_type: String,
	level: String = "info",
	message: String = "",
	data: Dictionary = {}
) -> void:
	if _telemetry_reporter == null:
		return
	_telemetry_reporter.enqueue_event(event_type, level, message, data)


func _flush_telemetry_if_needed() -> void:
	if _telemetry_reporter == null:
		return
	if not _telemetry_reporter.has_pending():
		return
	var tags := {
		"runId": run_id,
		"mapId": _current_map_id,
		"clientId": _sync_client.client_id,
	}
	await _telemetry_reporter.flush(_telemetry_session_id, _telemetry_build_id, tags)


func _normalize_api_path(path_value: String) -> String:
	var trimmed := path_value.strip_edges()
	if trimmed.is_empty():
		return ""
	var without_api_prefix := trimmed
	if without_api_prefix.begins_with("/api/"):
		without_api_prefix = "/" + without_api_prefix.substr(5)
	if not without_api_prefix.begins_with("/"):
		without_api_prefix = "/" + without_api_prefix
	return without_api_prefix


func _load_manifest() -> Dictionary:
	var file := FileAccess.open("res://data/world_manifest.json", FileAccess.READ)
	if file == null:
		return {}
	var text := file.get_as_text()
	file.close()
	var parsed: Variant = JSON.parse_string(text)
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
