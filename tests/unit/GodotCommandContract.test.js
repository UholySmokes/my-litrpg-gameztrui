import { describe, expect, it } from "@jest/globals";
import fs from "fs";
import path from "path";

function readGodotAsset(relativePath) {
	const absolutePath = path.resolve(process.cwd(), relativePath);
	return fs.readFileSync(absolutePath, "utf8");
}

describe("godot command + config contract", () => {
	it("loads generated runtime config via ConfigLoader.gd", () => {
		const source = readGodotAsset("godot/scripts/config_loader.gd");
		expect(source).toContain("class_name ConfigLoader");
		expect(source).toContain('const CONFIG_PATH := "res://data/config.json"');
		expect(source).toContain("func load_runtime_config(config_path: String = CONFIG_PATH) -> Dictionary:");
		expect(source).toContain('"buildId": "godot-dev"');
		expect(source).toContain('"syncCommandPath": "/sync/command"');
		expect(source).toContain('"syncPullPath": "/sync/pull"');
		expect(source).toContain('"telemetryPath": "/telemetry"');
		expect(source).toContain('"storyStartPath": "/story/start"');
		expect(source).toContain('"storyPollPath": "/story/poll"');
	});

	it("wires ConfigLoader node and applies runtime config in world_controller", () => {
		const scene = readGodotAsset("godot/scenes/Main.tscn");
		const world = readGodotAsset("godot/scripts/world_controller.gd");

		expect(scene).toContain('path="res://scripts/config_loader.gd"');
		expect(scene).toContain('path="res://scripts/telemetry_reporter.gd"');
		expect(scene).toContain('[node name="ConfigLoader" type="Node" parent="."]');
		expect(scene).toContain('[node name="TelemetryReporter" type="Node" parent="."]');
		expect(world).toContain("@onready var _config_loader: ConfigLoader = %ConfigLoader");
		expect(world).toContain("@onready var _telemetry_reporter = %TelemetryReporter");
		expect(world).toContain("_runtime_config = _config_loader.load_runtime_config()");
		expect(world).toContain("_apply_runtime_config(_runtime_config)");
		expect(world).toContain("_sync_client.api_base_url = api_base_url");
		expect(world).toContain("_telemetry_reporter.api_base_url = api_base_url");
		expect(world).toContain("String(config.get(\"telemetryPath\", _telemetry_reporter.telemetry_path))");
	});

	it("sends immediate actions through command path and keeps reconcile hook", () => {
		const queue = readGodotAsset("godot/scripts/trigger_queue.gd");
		const sync = readGodotAsset("godot/scripts/sync_client.gd");
		const world = readGodotAsset("godot/scripts/world_controller.gd");

		expect(queue).toContain("return await sync_client.command(commit_envelope)");
		expect(sync).toContain("@export var sync_command_path: String = \"/sync/command\"");
		expect(sync).toContain("@export var sync_pull_path: String = \"/sync/pull\"");
		expect(sync).toContain("return await _authorized_json_request(sync_command_path, HTTPClient.METHOD_POST, envelope)");
		expect(sync).toContain("if bool(response.body.get(\"reconcileRequired\", false)):");
		expect(sync).toContain("sync_rejected.emit(response.body)");
		expect(world).toContain('envelope["commandType"] = "TRIGGER"');
		expect(world).toContain('envelope["command"] = {');
	});

	it("keeps generated Godot config paths relative to apiBaseUrl", () => {
		const configJson = JSON.parse(readGodotAsset("godot/data/config.json"));
		expect(configJson.apiBaseUrl).toBeTruthy();
		expect(configJson.buildId).toBeTruthy();
		expect(configJson.syncCommandPath).toBe("/sync/command");
		expect(configJson.syncPullPath).toBe("/sync/pull");
		expect(configJson.telemetryPath).toBe("/telemetry");
		expect(configJson.narrateEndpoint).toBe("/narrate");
		expect(configJson.storyStartPath).toBe("/story/start");
		expect(configJson.storyPollPath).toBe("/story/poll");
	});

	it("defines telemetry reporter payload contract for /api/telemetry", () => {
		const telemetry = readGodotAsset("godot/scripts/telemetry_reporter.gd");
		expect(telemetry).toContain("class_name TelemetryReporter");
		expect(telemetry).toContain('@export var telemetry_path: String = "/telemetry"');
		expect(telemetry).toContain("@export var retry_base_backoff_sec: float = 0.5");
		expect(telemetry).toContain("@export var retry_max_backoff_sec: float = 8.0");
		expect(telemetry).toContain("non_retriable_statuses");
		expect(telemetry).toContain("func enqueue_event(");
		expect(telemetry).toContain("func flush(session_id: String, build_id: String, extra_tags: Dictionary = {}) -> Dictionary:");
		expect(telemetry).toContain("retry_backoff_active");
		expect(telemetry).toContain("non_retriable_telemetry_response");
		expect(telemetry).toContain('"source": source_tag');
		expect(telemetry).toContain('"sessionId": session_id.strip_edges()');
		expect(telemetry).toContain('"build": build_id.strip_edges()');
		expect(telemetry).toContain('"clientTime": _iso_now()');
		expect(telemetry).toContain('"events": events');
	});

	it("wires StoryClient wrappers and fallback prose rendering into world flow", () => {
		const scene = readGodotAsset("godot/scenes/Main.tscn");
		const world = readGodotAsset("godot/scripts/world_controller.gd");
		const story = readGodotAsset("godot/scripts/story_client.gd");
		const prose = readGodotAsset("godot/scripts/prose_panel.gd");
		const mapRenderer = readGodotAsset("godot/scripts/pixel_map_renderer.gd");
		const manifest = JSON.parse(readGodotAsset("godot/data/world_manifest.json"));
		const perfRunner = readGodotAsset("scripts/run-godot-perf-probe.mjs");

		expect(scene).toContain('path="res://scripts/story_client.gd"');
		expect(scene).toContain('[node name="StoryClient" type="Node" parent="."]');
		expect(scene).toContain('path="res://scripts/pixel_map_renderer.gd"');
		expect(scene).toContain('[node name="MapRenderer" type="Node2D" parent="."]');
		expect(scene).toContain('[node name="SpriteHooks" type="Node2D" parent="."]');
		expect(scene).toContain('[node name="PlayerSpriteAnchor" type="Node2D" parent="SpriteHooks"]');
		expect(scene).toContain('[node name="PlayerSprite" type="Sprite2D" parent="SpriteHooks/PlayerSpriteAnchor"]');
		expect(scene).toContain('[node name="GuideSpriteAnchor" type="Node2D" parent="SpriteHooks"]');
		expect(scene).toContain('[node name="GuideSprite" type="Sprite2D" parent="SpriteHooks/GuideSpriteAnchor"]');
		expect(world).toContain("@onready var _story_client = %StoryClient");
		expect(world).toContain("@onready var _map_renderer = %MapRenderer");
		expect(world).toContain("@onready var _player_sprite_anchor: Node2D = %PlayerSpriteAnchor");
		expect(world).toContain("@onready var _guide_sprite_anchor: Node2D = %GuideSpriteAnchor");
		expect(world).toContain("@onready var _player_sprite: Sprite2D = %PlayerSprite");
		expect(world).toContain("@onready var _guide_sprite: Sprite2D = %GuideSprite");
		expect(world).toContain('const PLAYER_SPRITE_PATH := "res://assets/characters/traveler_idle_down.png"');
		expect(world).toContain('const GUIDE_SPRITE_PATH := "res://assets/characters/guide_idle_down.png"');
		expect(world).toContain("func _assign_sprite_texture(sprite: Sprite2D, asset_path: String) -> void:");
		expect(world).toContain("_story_client.auth_client_path = _auth_client.get_path()");
		expect(world).toContain("_queue_story_refresh()");
		expect(world).toContain('String(config.get("storyStartPath", _story_client.story_start_path))');
		expect(world).toContain('String(config.get("storyPollPath", _story_client.story_poll_path))');
		expect(world).toContain("_map_renderer.render_map(");
		expect(world).toContain("_guide_sprite_anchor.visible = _npc_guide.visible");
		expect(world).toContain("func _trigger_tiles_for_map(map_id: String) -> Array:");
		expect(world).toContain("func get_perf_snapshot() -> Dictionary:");
		expect(world).toContain("func run_perf_baseline(iterations: int = 180) -> Dictionary:");

		expect(story).toContain("class_name StoryClient");
		expect(story).toContain('@export var story_start_path: String = "/story/start"');
		expect(story).toContain('@export var story_poll_path: String = "/story/poll"');
		expect(story).toContain("func start(payload: Dictionary) -> Dictionary:");
		expect(story).toContain("func poll(thread_id: String, run_id: String, mode: String = \"\") -> Dictionary:");
		expect(story).toContain("func request_story(prompt: String, mode: String = \"exploration\", extra_payload: Dictionary = {}) -> Dictionary:");
		expect(story).toContain("return _fallback_result(normalized_mode, \"story_poll_timeout\")");
		expect(mapRenderer).toContain("class_name PixelMapRenderer");
		expect(mapRenderer).toContain("func render_map(map_id: String, width: int, height: int, trigger_tiles: Array = []) -> void:");
		expect(mapRenderer).toContain("func _marker_color_for_trigger(trigger_type: String) -> Color:");
		expect(mapRenderer).toContain('"map_ruined_outlook"');
		expect(mapRenderer).toContain("const TILE_ATLAS_PATHS := {");
		expect(mapRenderer).toContain('res://assets/tilesets/village_square_atlas.png');
		expect(mapRenderer).toContain("draw_texture_rect_region(");

		expect(perfRunner).toContain("res://scripts/headless_perf_probe.gd");
		expect(perfRunner).toContain("godot_map_traversal_perf_baseline_");

		expect(Object.keys(manifest.maps || {}).length).toBeGreaterThanOrEqual(3);
		expect(manifest.maps?.map_ruined_outlook).toBeTruthy();
		expect(manifest.triggers?.zone_exit_to_ruins).toBeTruthy();
		expect(manifest.triggers?.zone_exit_ruins_to_glade).toBeTruthy();
		expect(manifest.triggers?.zone_exit_ruins_to_square).toBeTruthy();

		expect(fs.existsSync(path.resolve(process.cwd(), "godot/assets/characters/traveler_idle_down.png"))).toBe(
			true,
		);
		expect(fs.existsSync(path.resolve(process.cwd(), "godot/assets/tilesets/village_square_atlas.png"))).toBe(
			true,
		);
		expect(fs.existsSync(path.resolve(process.cwd(), "godot/assets/ui/prose_panel_frame.png"))).toBe(
			true,
		);
		
		expect(prose).toContain("Suggested actions:");
		expect(prose).toContain("func _format_suggestions(suggestions: Array) -> String:");
	});
});
