extends Node
class_name StoryClient

const FirebaseAuthClient := preload("res://scripts/firebase_auth_client.gd")

@export var api_base_url: String = "http://127.0.0.1:5001/my-litrpg-gameztrui-3416-da75c/us-central1/api"
@export var auth_client_path: NodePath
@export var story_start_path: String = "/story/start"
@export var story_poll_path: String = "/story/poll"
@export var poll_interval_seconds: float = 1.5
@export var max_polls: int = 40

const DEFAULT_SUGGESTIONS := [
	{"t": "look around", "w": 1.0},
	{"t": "check inventory", "w": 0.9},
	{"t": "continue", "w": 0.85},
]

const FALLBACK_BY_MODE := {
	"exploration": {
		"narrative": "The path quiets for a breath, but your next step still matters.",
		"suggestions": DEFAULT_SUGGESTIONS,
	},
	"combat": {
		"narrative": "Steel and breath hold for a heartbeat. Pick your next strike with intent.",
		"suggestions": [
			{"t": "attack enemy", "w": 1.0},
			{"t": "use skill", "w": 0.95},
			{"t": "defend", "w": 0.85},
		],
	},
	"dialogue": {
		"narrative": "The room waits on your words. Choose what you reveal next.",
		"suggestions": [
			{"t": "ask a question", "w": 1.0},
			{"t": "negotiate", "w": 0.9},
			{"t": "leave politely", "w": 0.8},
		],
	},
	"scene-transition": {
		"narrative": "The scene turns, carrying your story into the next moment.",
		"suggestions": [
			{"t": "look around", "w": 1.0},
			{"t": "check quests", "w": 0.9},
			{"t": "talk to locals", "w": 0.85},
		],
	},
	"system-event": {
		"narrative": "The world state shifts in the background. You remain in control.",
		"suggestions": DEFAULT_SUGGESTIONS,
	},
}


func start(payload: Dictionary) -> Dictionary:
	return await _authorized_json_request(story_start_path, HTTPClient.METHOD_POST, payload)


func poll(thread_id: String, run_id: String, mode: String = "") -> Dictionary:
	if thread_id.strip_edges().is_empty() or run_id.strip_edges().is_empty():
		return {
			"http_ok": false,
			"status": 400,
			"body": {
				"ok": false,
				"errorCode": "MISSING_PARAMS",
			},
		}

	var endpoint := "%s?threadId=%s&runId=%s" % [
		story_poll_path,
		thread_id.uri_encode(),
		run_id.uri_encode(),
	]
	var normalized_mode := _normalize_mode(mode)
	if not normalized_mode.is_empty():
		endpoint += "&mode=%s" % normalized_mode.uri_encode()
	return await _authorized_json_request(endpoint, HTTPClient.METHOD_GET, null)


func request_story(prompt: String, mode: String = "exploration", extra_payload: Dictionary = {}) -> Dictionary:
	var normalized_mode := _normalize_mode(mode)
	var payload: Dictionary = {
		"prompt": prompt,
		"mode": normalized_mode,
	}
	for key in extra_payload.keys():
		payload[key] = extra_payload[key]

	var start_response: Dictionary = await start(payload)
	if not bool(start_response.get("http_ok", false)):
		return _fallback_result(normalized_mode, "story_start_http")

	var start_body: Dictionary = start_response.get("body", {})
	if start_body.is_empty():
		return _fallback_result(normalized_mode, "story_start_empty")
	if bool(start_body.get("ok", true)) == false:
		return _fallback_result(normalized_mode, "story_start_rejected")

	if _is_terminal_status(start_body):
		if _is_failed_status(start_body):
			return _fallback_result(normalized_mode, "story_start_failed")
		return _normalize_story_result(start_body, normalized_mode, "remote")

	var thread_id := String(start_body.get("threadId", ""))
	var run_id := String(start_body.get("runId", ""))
	if thread_id.is_empty() or run_id.is_empty():
		return _fallback_result(normalized_mode, "story_start_missing_ids")

	for _poll_idx in range(max_polls):
		await get_tree().create_timer(poll_interval_seconds).timeout
		var poll_response: Dictionary = await poll(thread_id, run_id, normalized_mode)
		if not bool(poll_response.get("http_ok", false)):
			continue
		var poll_body: Dictionary = poll_response.get("body", {})
		if poll_body.is_empty():
			continue
		if not _is_terminal_status(poll_body):
			continue
		if _is_failed_status(poll_body):
			return _fallback_result(normalized_mode, "story_poll_failed")
		return _normalize_story_result(poll_body, normalized_mode, "remote")

	return _fallback_result(normalized_mode, "story_poll_timeout")


func _normalize_story_result(body: Dictionary, mode: String, source: String) -> Dictionary:
	var narrative := String(body.get("narrative", "")).strip_edges()
	if narrative.is_empty():
		return _fallback_result(mode, "story_response_missing_narrative")

	return {
		"ok": true,
		"source": source,
		"mode": mode,
		"status": String(body.get("status", "completed")),
		"narrative": narrative,
		"mood": String(body.get("mood", "neutral")),
		"suggestions": _normalize_suggestions(body.get("suggestions", DEFAULT_SUGGESTIONS)),
		"threadId": String(body.get("threadId", "")),
		"runId": String(body.get("runId", "")),
	}


func _fallback_result(mode: String, reason: String) -> Dictionary:
	var template: Dictionary = _fallback_template_for_mode(mode)
	return {
		"ok": true,
		"source": "fallback",
		"fallbackReason": reason,
		"mode": mode,
		"status": "completed",
		"narrative": String(template.get("narrative", "The story presses onward.")),
		"mood": "neutral",
		"suggestions": _normalize_suggestions(template.get("suggestions", DEFAULT_SUGGESTIONS)),
	}


func _fallback_template_for_mode(mode: String) -> Dictionary:
	var normalized_mode := _normalize_mode(mode)
	if FALLBACK_BY_MODE.has(normalized_mode):
		return FALLBACK_BY_MODE[normalized_mode]
	return FALLBACK_BY_MODE["exploration"]


func _normalize_mode(mode: String) -> String:
	var normalized := mode.strip_edges().to_lower()
	if normalized == "combat":
		return "combat"
	if normalized == "dialogue":
		return "dialogue"
	if normalized == "system-event":
		return "system-event"
	if normalized == "scene-transition":
		return "scene-transition"
	return "exploration"


func _normalize_suggestions(raw: Variant) -> Array:
	var normalized: Array = []
	if raw is Array:
		for entry in raw:
			if entry is Dictionary:
				var suggestion_text := String(entry.get("t", entry.get("label", ""))).strip_edges()
				if suggestion_text.is_empty():
					continue
				normalized.append({
					"t": suggestion_text,
					"w": float(entry.get("w", entry.get("weight", 1.0))),
				})
			else:
				var text_value := String(entry).strip_edges()
				if text_value.is_empty():
					continue
				normalized.append({
					"t": text_value,
					"w": 1.0,
				})

	if normalized.is_empty():
		normalized = DEFAULT_SUGGESTIONS.duplicate(true)

	var top_three: Array = []
	for item in normalized:
		if top_three.size() >= 3:
			break
		top_three.append(item)
	return top_three


func _is_terminal_status(body: Dictionary) -> bool:
	var status := String(body.get("status", "")).strip_edges().to_lower()
	return bool(body.get("done", false)) or status == "completed" or status == "failed" or status == "incomplete"


func _is_failed_status(body: Dictionary) -> bool:
	if bool(body.get("ok", true)) == false:
		return true
	var status := String(body.get("status", "")).strip_edges().to_lower()
	return status == "failed"


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
			var retry_token := String(auth_client.id_token)
			if not retry_token.is_empty():
				retry_headers.append("Authorization: Bearer %s" % retry_token)
			response = await _request_json(_build_url(endpoint), method, retry_headers, payload)
	return response


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
