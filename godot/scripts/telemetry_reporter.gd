extends Node
class_name TelemetryReporter

@export var api_base_url: String = "http://127.0.0.1:5001/my-litrpg-gameztrui-3416-da75c/us-central1/api"
@export var telemetry_path: String = "/telemetry"
@export var auth_client_path: NodePath
@export var source_tag: String = "godot"
@export var max_batch_size: int = 50

var _pending_events: Array = []


func enqueue_event(
	event_type: String,
	level: String = "info",
	message: String = "",
	data: Dictionary = {}
) -> void:
	var normalized_type := event_type.strip_edges()
	if normalized_type.is_empty():
		return
	_pending_events.append({
		"type": normalized_type,
		"level": level.strip_edges().to_lower(),
		"ts": _iso_now(),
		"message": message.strip_edges(),
		"data": data.duplicate(true),
	})


func has_pending() -> bool:
	return not _pending_events.is_empty()


func flush(session_id: String, build_id: String, extra_tags: Dictionary = {}) -> Dictionary:
	if _pending_events.is_empty():
		return {
			"http_ok": true,
			"status": 204,
			"body": {
				"ok": true,
				"accepted": 0,
				"dropped": 0,
			},
		}

	var batch_count := mini(max_batch_size, _pending_events.size())
	var batch_events: Array = _pending_events.slice(0, batch_count)
	var payload := _build_payload(batch_events, session_id, build_id, extra_tags)
	var response: Dictionary = await _authorized_json_request(
		telemetry_path,
		HTTPClient.METHOD_POST,
		payload
	)
	if bool(response.get("http_ok", false)):
		for _i in range(batch_count):
			_pending_events.remove_at(0)
	return response


func _build_payload(
	events: Array,
	session_id: String,
	build_id: String,
	extra_tags: Dictionary = {}
) -> Dictionary:
	var tags := {
		"client": source_tag,
	}
	for key in extra_tags.keys():
		tags[key] = extra_tags[key]

	return {
		"source": source_tag,
		"sessionId": session_id.strip_edges(),
		"build": build_id.strip_edges(),
		"clientTime": _iso_now(),
		"tags": tags,
		"events": events,
	}


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
		var refreshed := await auth_client.refresh_id_token()
		if refreshed:
			var retry_headers := PackedStringArray(["Content-Type: application/json"])
			var retry_token := str(auth_client.id_token)
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


func _iso_now() -> String:
	return Time.get_datetime_string_from_system(true).replace(" ", "T") + "Z"
