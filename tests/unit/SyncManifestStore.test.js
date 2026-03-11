import { afterEach, describe, expect, it } from "@jest/globals";
import { createRequire } from "module";

const require = createRequire(import.meta.url);
const manifestStore = require("../../functions/lib/sync-core/manifest-store.js");

afterEach(() => {
	manifestStore.clearWorldManifestCache();
});

describe("sync manifest store", () => {
	it("caches the normalized manifest until explicitly cleared", () => {
		const first = manifestStore.getWorldManifest();
		const second = manifestStore.getWorldManifest();
		expect(first).toBe(second);

		manifestStore.clearWorldManifestCache();
		const third = manifestStore.getWorldManifest();
		expect(third).not.toBe(first);
		expect(third.contentVersion).toBe(first.contentVersion);
	});

	it("normalizes trigger ids by map into set lookups", () => {
		const manifest = manifestStore.normalizeWorldManifest({
			worldId: "w1",
			maps: {
				m1: { width: 10, height: 10, triggers: ["t1"] },
			},
			triggers: {
				t1: { type: "ENTER_TILE", mapId: "m1", x: 1, y: 2 },
			},
		});

		expect(manifest.triggerIdsByMap.m1.has("t1")).toBe(true);
		expect(manifest.contentVersion).toHaveLength(64);
	});
});
