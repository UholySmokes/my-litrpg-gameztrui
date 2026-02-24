extends Node
class_name FirebaseAuthClient

signal auth_state_changed(signed_in: bool, safe_mode: bool)

@export var api_key: String = ""
@export var clock_skew_seconds: int = 60

var id_token: String = ""
var refresh_token: String = ""
var local_id: String = ""
var expires_at_unix: int = 0
var safe_mode_active: bool = true


func sign_in_anonymously() -> bool:
	if api_key.is_empty():
		_set_safe_mode(true)
		return false

	var url := "https://identitytoolkit.googleapis.com/v1/accounts:signUp?key=%s" % api_key
	var body := JSON.stringify({
		"returnSecureToken": true,
	})
	var response := await _request_json(
		url,
		HTTPClient.METHOD_POST,
		PackedStringArray(["Content-Type: application/json"]),
		body
	)
	if not response.ok:
		_set_safe_mode(true)
		return false

	if not _apply_signin_payload(response.body):
		_set_safe_mode(true)
		return false

	_set_safe_mode(false)
	return true


func refresh_id_token() -> bool:
	if api_key.is_empty() or refresh_token.is_empty():
		_set_safe_mode(true)
		return false

	var url := "https://securetoken.googleapis.com/v1/token?key=%s" % api_key
	var encoded_refresh := refresh_token.uri_encode()
	var form_body := "grant_type=refresh_token&refresh_token=%s" % encoded_refresh
	var response := await _request_json(
		url,
		HTTPClient.METHOD_POST,
		PackedStringArray(["Content-Type: application/x-www-form-urlencoded"]),
		form_body
	)
	if not response.ok:
		_set_safe_mode(true)
		return false

	if not _apply_refresh_payload(response.body):
		_set_safe_mode(true)
		return false

	_set_safe_mode(false)
	return true


func ensure_session() -> bool:
	var now_unix := int(Time.get_unix_time_from_system())
	if id_token.is_empty():
		return await sign_in_anonymously()
	if now_unix + clock_skew_seconds >= expires_at_unix:
		return await refresh_id_token()
	return true


func get_id_token() -> String:
	var ok := await ensure_session()
	return id_token if ok else ""


func get_auth_header() -> String:
	if id_token.is_empty():
		return ""
	return "Bearer %s" % id_token


func _apply_signin_payload(payload: Dictionary) -> bool:
	var token := str(payload.get("idToken", ""))
	var refresh := str(payload.get("refreshToken", ""))
	var uid := str(payload.get("localId", ""))
	var expires := int(str(payload.get("expiresIn", "3600")))
	if token.is_empty() or refresh.is_empty() or uid.is_empty():
		return false
	id_token = token
	refresh_token = refresh
	local_id = uid
	expires_at_unix = int(Time.get_unix_time_from_system()) + max(expires, 1)
	return true


func _apply_refresh_payload(payload: Dictionary) -> bool:
	var token := str(payload.get("id_token", ""))
	var refresh := str(payload.get("refresh_token", ""))
	var uid := str(payload.get("user_id", local_id))
	var expires := int(str(payload.get("expires_in", "3600")))
	if token.is_empty() or refresh.is_empty() or uid.is_empty():
		return false
	id_token = token
	refresh_token = refresh
	local_id = uid
	expires_at_unix = int(Time.get_unix_time_from_system()) + max(expires, 1)
	return true


func _set_safe_mode(value: bool) -> void:
	if safe_mode_active == value:
		return
	safe_mode_active = value
	auth_state_changed.emit(not id_token.is_empty() and not safe_mode_active, safe_mode_active)


func _request_json(
	url: String,
	method: int,
	headers: PackedStringArray,
	body: String = ""
) -> Dictionary:
	var request := HTTPRequest.new()
	add_child(request)
	var err := request.request(url, headers, method, body)
	if err != OK:
		request.queue_free()
		return {
			"ok": false,
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
		"ok": response_code >= 200 and response_code < 300,
		"status": response_code,
		"body": parsed_body,
		"raw": raw_body,
	}
