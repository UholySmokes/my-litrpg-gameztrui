import { describe, expect, it } from "@jest/globals";
import fs from "fs";
import path from "path";

function readGodotScript(relativePath) {
	const absolutePath = path.resolve(process.cwd(), relativePath);
	return fs.readFileSync(absolutePath, "utf8");
}

describe("godot auth resilience contract", () => {
	it("enforces clock skew token refresh behavior in firebase_auth_client.gd", () => {
		const source = readGodotScript("godot/scripts/firebase_auth_client.gd");
		expect(source).toContain("@export var clock_skew_seconds: int = 60");
		expect(source).toContain("if now_unix + clock_skew_seconds >= expires_at_unix:");
		expect(source).toContain("return await refresh_id_token()");
	});

	it("retries once on 401 in sync_client.gd and reuses refreshed token", () => {
		const source = readGodotScript("godot/scripts/sync_client.gd");
		expect(source).toContain("if response.status == 401 and auth_client:");
		expect(source).toMatch(
			/var refreshed(?::\s*bool)?\s*(?:=|:=)\s*await auth_client\.refresh_id_token\(\)/,
		);
		expect(source).toContain(
			"response = await _request_json(_build_url(endpoint), method, retry_headers, payload)",
		);

		const retryCalls = (source.match(/refresh_id_token\(/g) || []).length;
		expect(retryCalls).toBe(1);
	});

	it("keeps safe-mode continuity hooks for degraded auth/network states", () => {
		const syncSource = readGodotScript("godot/scripts/sync_client.gd");
		const authSource = readGodotScript("godot/scripts/firebase_auth_client.gd");

		expect(syncSource).toContain("_set_safe_mode(not response.http_ok)");
		expect(syncSource).toContain("signal safe_mode_changed(active: bool)");
		expect(authSource).toContain("signal auth_state_changed(signed_in: bool, safe_mode: bool)");
		expect(authSource).toContain("_set_safe_mode(true)");
		expect(authSource).toContain("_set_safe_mode(false)");
	});
});

