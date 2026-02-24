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
		expect(source).toContain('"syncCommandPath": "/sync/command"');
		expect(source).toContain('"syncPullPath": "/sync/pull"');
		expect(source).toContain('"storyStartPath": "/story/start"');
		expect(source).toContain('"storyPollPath": "/story/poll"');
	});

	it("wires ConfigLoader node and applies runtime config in world_controller", () => {
		const scene = readGodotAsset("godot/scenes/Main.tscn");
		const world = readGodotAsset("godot/scripts/world_controller.gd");

		expect(scene).toContain('path="res://scripts/config_loader.gd"');
		expect(scene).toContain('[node name="ConfigLoader" type="Node" parent="."]');
		expect(world).toContain("@onready var _config_loader: ConfigLoader = %ConfigLoader");
		expect(world).toContain("_runtime_config = _config_loader.load_runtime_config()");
		expect(world).toContain("_apply_runtime_config(_runtime_config)");
		expect(world).toContain("_sync_client.api_base_url = api_base_url");
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
		expect(configJson.syncCommandPath).toBe("/sync/command");
		expect(configJson.syncPullPath).toBe("/sync/pull");
		expect(configJson.narrateEndpoint).toBe("/narrate");
		expect(configJson.storyStartPath).toBe("/story/start");
		expect(configJson.storyPollPath).toBe("/story/poll");
	});

	it("wires StoryClient wrappers and fallback prose rendering into world flow", () => {
		const scene = readGodotAsset("godot/scenes/Main.tscn");
		const world = readGodotAsset("godot/scripts/world_controller.gd");
		const story = readGodotAsset("godot/scripts/story_client.gd");
		const prose = readGodotAsset("godot/scripts/prose_panel.gd");

		expect(scene).toContain('path="res://scripts/story_client.gd"');
		expect(scene).toContain('[node name="StoryClient" type="Node" parent="."]');
		expect(world).toContain("@onready var _story_client = %StoryClient");
		expect(world).toContain("_story_client.auth_client_path = _auth_client.get_path()");
		expect(world).toContain("_queue_story_refresh()");
		expect(world).toContain('String(config.get("storyStartPath", _story_client.story_start_path))');
		expect(world).toContain('String(config.get("storyPollPath", _story_client.story_poll_path))');

		expect(story).toContain("class_name StoryClient");
		expect(story).toContain('@export var story_start_path: String = "/story/start"');
		expect(story).toContain('@export var story_poll_path: String = "/story/poll"');
		expect(story).toContain("func start(payload: Dictionary) -> Dictionary:");
		expect(story).toContain("func poll(thread_id: String, run_id: String, mode: String = \"\") -> Dictionary:");
		expect(story).toContain("func request_story(prompt: String, mode: String = \"exploration\", extra_payload: Dictionary = {}) -> Dictionary:");
		expect(story).toContain("return _fallback_result(normalized_mode, \"story_poll_timeout\")");

		expect(prose).toContain("Suggested actions:");
		expect(prose).toContain("func _format_suggestions(suggestions: Array) -> String:");
	});
});
