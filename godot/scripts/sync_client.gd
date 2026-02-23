extends Node
class_name SyncClient

signal safe_mode_changed(active: bool)
signal sync_rejected(payload: Dictionary)

@export var api_base_url: String = "http://127.0.0.1:5001/my-litrpg-gameztrui-3416-da75c/us-central1/api"
@export var auth_client_path: NodePath
@export var client_id: String = "godot-client"

var safe_mode_active: bool = true


func commit(envelope: Dictionary) -> Dictionary:
	return await _authorized_json_request("/sync/commit", HTTPClient.METHOD_POST, envelope)


func command(envelope: Dictionary) -> Dictionary:
	return await _authorized_json_request("/sync/command", HTTPClient.METHOD_POST, envelope)


func commit_batch(commits: Array) -> Dictionary:
	return await _authorized_json_request("/sync/commit-batch", HTTPClient.METHOD_POST, {
		"commits": commits,
	})


func pull(run_id: String, after_seq: int = 0) -> Dictionary:
	var endpoint := "/sync/pull?runId=%s&afterSeq=%d" % [run_id.uri_encode(), after_seq]
	return await _authorized_json_request(endpoint, HTTPClient.METHOD_GET, null)


func _authorized_json_request(endpoint: String, method: int, payload: Variant) -> Dictionary:
	var auth_client := _auth_client()
	var token := ""
	if auth_client:
		token = await auth_client.get_id_token()

	var headers := PackedStringArray(["Content-Type: application/json"])
	if not token.is_empty():
		headers.append("Authorization: Bearer %s" % token)

	var response := await _request_json(_build_url(endpoint), method, headers, payload)
	if response.status == 401 and auth_client:
		var refreshed := await auth_client.refresh_id_token()
		if refreshed:
			var retry_headers := PackedStringArray(["Content-Type: application/json"])
			var retry_token := str(auth_client.id_token)
			if not retry_token.is_empty():
				retry_headers.append("Authorization: Bearer %s" % retry_token)
			response = await _request_json(_build_url(endpoint), method, retry_headers, payload)
	}

	_set_safe_mode(not response.http_ok)
	if response.status == 409 and typeof(response.body) == TYPE_DICTIONARY:
		if bool(response.body.get("reconcileRequired", false)):
			sync_rejected.emit(response.body)
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

	var completed := await request.request_completed
	request.queue_free()
	var response_code := int(completed[1])
	var raw_body := PackedByteArray(completed[3]).get_string_from_utf8()
	var parsed_body: Dictionary = {}
	if not raw_body.is_empty():
		var parsed := JSON.parse_string(raw_body)
		if typeof(parsed) == TYPE_DICTIONARY:
			parsed_body = parsed

	return {
		"http_ok": response_code >= 200 and response_code < 300,
		"status": response_code,
		"body": parsed_body,
		"raw": raw_body,
	}
