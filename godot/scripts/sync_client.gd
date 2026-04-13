extends Node
class_name SyncClient

const FirebaseAuthClient := preload("res://scripts/firebase_auth_client.gd")

const LOCAL_SYNC_STATE_PATH := "user://singleplayer_sync_state.json"
const LOCAL_CHARACTER_PATH := "user://singleplayer_character.json"

signal safe_mode_changed(active: bool)
signal sync_rejected(payload: Dictionary)

@export var api_base_url: String = "http://127.0.0.1:5001/my-litrpg-gameztrui-3416-da75c/us-central1/api"
@export var auth_client_path: NodePath
@export var client_id: String = "godot-client"
@export var sync_commit_path: String = "/sync/commit"
@export var sync_command_path: String = "/sync/command"
@export var sync_commit_batch_path: String = "/sync/commit-batch"
@export var sync_pull_path: String = "/sync/pull"
@export var runtime_mode: String = "online"
@export var manifest_path: String = "res://data/world_manifest.json"

var safe_mode_active: bool = true
var _manifest_cache: Dictionary = {}


func commit(envelope: Dictionary) -> Dictionary:
	if _is_local_mode():
		return _apply_local_commits([envelope])
	return await _authorized_json_request(sync_commit_path, HTTPClient.METHOD_POST, envelope)


func command(envelope: Dictionary) -> Dictionary:
	if _is_local_mode():
		return _apply_local_commits([envelope])
	return await _authorized_json_request(sync_command_path, HTTPClient.METHOD_POST, envelope)


func send_command(
	command_name: String,
	payload: Dictionary,
	run_id: String,
	client_seq: int,
	content_version: String
) -> Dictionary:
	var normalized_name := command_name.strip_edges().to_lower()
	var command_body := {}
	match normalized_name:
		"create_character":
			command_body = {
				"type": "CHARACTER",
				"verb": "CREATE",
				"character": payload if typeof(payload) == TYPE_DICTIONARY else {},
			}
		_:
			return {
				"http_ok": false,
				"status": 0,
				"body": {
					"ok": false,
					"errorCode": "UNSUPPORTED_COMMAND_NAME",
					"message": "Unsupported command name: %s" % command_name,
				},
				"error": "unsupported_command_name",
			}

	if _is_local_mode():
		return _local_send_command(command_body, run_id, client_seq, content_version)

	var envelope := {
		"id": "%s-%d" % [run_id, client_seq],
		"runId": run_id,
		"clientId": client_id,
		"clientSeq": client_seq,
		"createdAt": _iso_now(),
		"contentVersion": content_version,
		"command": command_body,
	}
	return await command(envelope)


func commit_batch(commits: Array) -> Dictionary:
	if _is_local_mode():
		return _apply_local_commits(commits)
	return await _authorized_json_request(sync_commit_batch_path, HTTPClient.METHOD_POST, {
		"commits": commits,
	})


func pull(run_id: String, after_seq: int = 0) -> Dictionary:
	if _is_local_mode():
		return _local_pull(run_id, after_seq)
	var endpoint := "%s?runId=%s&afterSeq=%d" % [sync_pull_path, run_id.uri_encode(), after_seq]
	return await _authorized_json_request(endpoint, HTTPClient.METHOD_GET, null)


func get_local_canonical_state(run_id: String = "") -> Dictionary:
	var canonical := _load_local_state()
	if String(canonical.get("runId", "")).is_empty() and not run_id.strip_edges().is_empty():
		canonical["runId"] = run_id
	return canonical.duplicate(true)


func overwrite_local_canonical_state(state: Dictionary) -> void:
	if typeof(state) != TYPE_DICTIONARY:
		return
	var canonical := state.duplicate(true)
	_save_local_state(canonical)
	var character := Dictionary(canonical.get("character", {})).duplicate(true)
	if character.is_empty():
		var entity_states: Dictionary = Dictionary(canonical.get("entityStates", {}))
		character = Dictionary(entity_states.get("activeCharacter", {})).duplicate(true)
	if not character.is_empty():
		_save_json(LOCAL_CHARACTER_PATH, character)
	_set_safe_mode(false)


func _authorized_json_request(endpoint: String, method: int, payload: Variant) -> Dictionary:
	var auth_client: FirebaseAuthClient = _auth_client()
	var token := ""
	if auth_client:
		token = await auth_client.get_id_token()

	var headers := PackedStringArray(["Content-Type: application/json"])
	if not token.is_empty():
		headers.append("Authorization: Bearer %s" % token)

	var response: Dictionary = await _request_json(_build_url(endpoint), method, headers, payload)
	if response.status == 401 and auth_client:
		var refreshed: bool = await auth_client.refresh_id_token()
		if refreshed:
			var retry_headers := PackedStringArray(["Content-Type: application/json"])
			var retry_token := str(auth_client.id_token)
			if not retry_token.is_empty():
				retry_headers.append("Authorization: Bearer %s" % retry_token)
			response = await _request_json(_build_url(endpoint), method, retry_headers, payload)

	_set_safe_mode(not response.http_ok)
	if response.status == 409 and typeof(response.body) == TYPE_DICTIONARY:
		if bool(response.body.get("reconcileRequired", false)):
			sync_rejected.emit(response.body)
	return response


func _local_send_command(
	command_body: Dictionary,
	run_id: String,
	client_seq: int,
	_content_version: String
) -> Dictionary:
	var character := Dictionary(command_body.get("character", {})).duplicate(true)
	var state := _default_local_state(run_id)
	var map_id := String(character.get("mapId", state.get("mapId", "")))
	var player_pos: Dictionary = character.get("playerPos", state.get("playerPos", {}))
	state["runId"] = run_id
	state["seq"] = client_seq
	state["mapId"] = map_id
	state["playerPos"] = {
		"x": int(player_pos.get("x", 0)),
		"y": int(player_pos.get("y", 0)),
	}
	state["character"] = character
	state["questFlags"] = Dictionary(state.get("questFlags", {})).duplicate(true)
	state["entityStates"] = {
		"activeCharacter": character.duplicate(true),
		"characterRoster": [character.duplicate(true)],
		"playerProfile": {
			"charactersCreated": 1,
			"advancedCreationUnlocked": true,
			"lastCreationMode": String(character.get("mode", "basic")),
		},
		"lastSavepoint": {
			"seq": client_seq,
			"mapId": map_id,
			"playerPos": state["playerPos"],
		},
	}
	_save_local_state(state)
	_save_json(LOCAL_CHARACTER_PATH, character)
	_set_safe_mode(false)
	return _local_response({
		"ok": true,
		"accepted": [{
			"id": "%s-%d" % [run_id, client_seq],
			"accepted": true,
			"local": true,
		}],
		"canonicalState": state,
	})


func _apply_local_commits(commits: Array) -> Dictionary:
	var canonical := _load_local_state()
	var accepted: Array = []
	var quest_flags: Dictionary = Dictionary(canonical.get("questFlags", {})).duplicate(true)
	var entity_states: Dictionary = Dictionary(canonical.get("entityStates", {})).duplicate(true)
	var map_id := String(canonical.get("mapId", ""))
	var player_pos: Dictionary = Dictionary(canonical.get("playerPos", {})).duplicate(true)
	var highest_seq := int(canonical.get("seq", 0))

	for raw_commit in commits:
		if typeof(raw_commit) != TYPE_DICTIONARY:
			continue
		var envelope: Dictionary = raw_commit
		var command: Dictionary = Dictionary(envelope.get("command", {}))
		var trigger: Dictionary = Dictionary(command.get("trigger", envelope.get("trigger", {})))
		var trigger_id := String(trigger.get("triggerId", ""))
		var trigger_def := _get_manifest_trigger(trigger_id)
		if trigger_def.is_empty():
			trigger_def = {
				"type": String(command.get("triggerType", envelope.get("triggerType", ""))),
				"transition": {},
				"setQuestFlags": {},
			}
		var trigger_type := String(trigger_def.get("type", command.get("triggerType", envelope.get("triggerType", ""))))
		highest_seq = maxi(highest_seq, int(envelope.get("clientSeq", highest_seq)))

		if trigger_def.has("setQuestFlags"):
			var updates: Dictionary = trigger_def.get("setQuestFlags", {})
			for key in updates.keys():
				quest_flags[key] = updates[key]

		if trigger_type == "ZONE_EXIT" or trigger_type == "ENCOUNTER_GATE":
			var transition: Dictionary = trigger_def.get("transition", {})
			if not transition.is_empty():
				map_id = String(transition.get("mapId", map_id))
				player_pos = {
					"x": int(transition.get("x", player_pos.get("x", 0))),
					"y": int(transition.get("y", player_pos.get("y", 0))),
				}
		elif trigger_type == "SAVEPOINT":
			entity_states["lastSavepoint"] = {
				"seq": highest_seq,
				"mapId": map_id,
				"playerPos": player_pos.duplicate(true),
			}

		accepted.append({
			"id": String(envelope.get("id", "")),
			"accepted": true,
			"triggerType": trigger_type,
			"local": true,
		})

	canonical["seq"] = highest_seq
	canonical["questFlags"] = quest_flags
	canonical["entityStates"] = entity_states
	canonical["mapId"] = map_id
	canonical["playerPos"] = player_pos
	_save_local_state(canonical)
	_set_safe_mode(false)
	return _local_response({
		"ok": true,
		"accepted": accepted,
		"rejected": [],
		"canonicalState": canonical,
	})


func _local_pull(run_id: String, _after_seq: int = 0) -> Dictionary:
	var canonical := _load_local_state()
	if String(canonical.get("runId", "")).is_empty():
		canonical["runId"] = run_id
		_save_local_state(canonical)
	return _local_response({
		"ok": true,
		"canonicalState": canonical,
	})


func _local_response(body: Dictionary, status: int = 200) -> Dictionary:
	return {
		"http_ok": true,
		"status": status,
		"body": body,
		"raw": JSON.stringify(body),
	}


func _default_local_state(run_id: String = "") -> Dictionary:
	var manifest := _load_manifest()
	var start: Dictionary = manifest.get("start", {})
	return {
		"runId": run_id,
		"mapId": String(start.get("mapId", "map_village_square")),
		"playerPos": {
			"x": int(start.get("x", 3)),
			"y": int(start.get("y", 3)),
		},
		"seq": 0,
		"questFlags": {},
		"entityStates": {},
		"character": {},
	}


func _load_manifest() -> Dictionary:
	if not _manifest_cache.is_empty():
		return _manifest_cache
	var file := FileAccess.open(manifest_path, FileAccess.READ)
	if file == null:
		return {}
	var raw := file.get_as_text()
	file.close()
	var parsed: Variant = JSON.parse_string(raw)
	if typeof(parsed) == TYPE_DICTIONARY:
		_manifest_cache = parsed
	return _manifest_cache


func _get_manifest_trigger(trigger_id: String) -> Dictionary:
	var manifest := _load_manifest()
	var triggers: Dictionary = manifest.get("triggers", {})
	var value: Variant = triggers.get(trigger_id, {})
	if typeof(value) == TYPE_DICTIONARY:
		return Dictionary(value).duplicate(true)
	return {}


func _load_local_state() -> Dictionary:
	if not FileAccess.file_exists(LOCAL_SYNC_STATE_PATH):
		return _default_local_state()
	var file := FileAccess.open(LOCAL_SYNC_STATE_PATH, FileAccess.READ)
	if file == null:
		return _default_local_state()
	var raw := file.get_as_text()
	file.close()
	var parsed: Variant = JSON.parse_string(raw)
	if typeof(parsed) == TYPE_DICTIONARY:
		return parsed
	return _default_local_state()


func _save_local_state(state: Dictionary) -> void:
	_save_json(LOCAL_SYNC_STATE_PATH, state)


func _save_json(path_value: String, payload: Dictionary) -> void:
	var file := FileAccess.open(path_value, FileAccess.WRITE)
	if file == null:
		return
	file.store_string(JSON.stringify(payload, "\t"))
	file.close()


func _build_url(endpoint: String) -> String:
	var base := api_base_url.trim_suffix("/")
	var suffix := endpoint if endpoint.begins_with("/") else "/" + endpoint
	return base + suffix


func _auth_client() -> FirebaseAuthClient:
	if auth_client_path.is_empty():
		return null
	var node := get_node_or_null(auth_client_path)
	if node is FirebaseAuthClient:
		return node as FirebaseAuthClient
	return null


func _set_safe_mode(value: bool) -> void:
	if safe_mode_active == value:
		return
	safe_mode_active = value
	safe_mode_changed.emit(safe_mode_active)


func _request_json(
	url: String,
	method: int,
	headers: PackedStringArray,
	body_payload: Variant
) -> Dictionary:
	var body_text := ""
	if body_payload != null and method != HTTPClient.METHOD_GET:
		body_text = JSON.stringify(body_payload)

	var request := HTTPRequest.new()
	add_child(request)
	var err := request.request(url, headers, method, body_text)
	if err != OK:
		request.queue_free()
		return {
			"http_ok": false,
			"status": 0,
			"body": {},
			"error": "request_start_failed",
		}

	var completed: Array = await request.request_completed
	request.queue_free()
	var response_code := int(completed[1])
	var raw_body := PackedByteArray(completed[3]).get_string_from_utf8()
	var parsed_body: Dictionary = {}
	if not raw_body.is_empty():
		var parsed: Variant = JSON.parse_string(raw_body)
		if typeof(parsed) == TYPE_DICTIONARY:
			parsed_body = parsed

	return {
		"http_ok": response_code >= 200 and response_code < 300,
		"status": response_code,
		"body": parsed_body,
		"raw": raw_body,
	}


func _iso_now() -> String:
	return "%sZ" % Time.get_datetime_string_from_system(true, true)


func _is_local_mode() -> bool:
	return runtime_mode.strip_edges().to_lower() == "singleplayer_local"
