extends Node
class_name TriggerQueue

const SyncClient = preload("res://scripts/sync_client.gd")

const BATCH_WINDOW_MS := 100
const BATCH_MAX_ITEMS := 4

var _pending_enter_tile: Array = []
var _window_started_ms: int = 0


func queue_enter_tile(commit_envelope: Dictionary) -> void:
	if _pending_enter_tile.is_empty():
		_window_started_ms = Time.get_ticks_msec()
	_pending_enter_tile.append(commit_envelope)
	if _pending_enter_tile.size() >= BATCH_MAX_ITEMS:
		# Caller should await flush in the same frame.
		pass


func has_pending() -> bool:
	return not _pending_enter_tile.is_empty()


func clear_pending() -> void:
	_pending_enter_tile.clear()
	_window_started_ms = 0


func should_flush() -> bool:
	if _pending_enter_tile.is_empty():
		return false
	if _pending_enter_tile.size() >= BATCH_MAX_ITEMS:
		return true
	return Time.get_ticks_msec() - _window_started_ms >= BATCH_WINDOW_MS


func flush_pending(sync_client: SyncClient) -> Dictionary:
	if _pending_enter_tile.is_empty():
		return {"http_ok": true, "status": 204, "body": {"ok": true}}

	var commits := _pending_enter_tile.duplicate(true)
	_pending_enter_tile.clear()
	_window_started_ms = 0
	return await sync_client.commit_batch(commits)


func send_immediate(sync_client: SyncClient, commit_envelope: Dictionary) -> Dictionary:
	if has_pending():
		var flushed := await flush_pending(sync_client)
		if not flushed.http_ok:
			return flushed
	return await sync_client.command(commit_envelope)
