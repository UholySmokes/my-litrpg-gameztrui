import { describe, expect, it } from "@jest/globals";
import { createRequire } from "module";

const require = createRequire(import.meta.url);
const deterministic = require("../../functions/lib/sync-core/deterministic.js");

describe("sync deterministic utilities", () => {
	it("canonicalizes object keys before stringifying", () => {
		expect(
			deterministic.stableJsonStringify({
				b: 2,
				a: { z: 3, y: 4 },
			}),
		).toBe('{"a":{"y":4,"z":3},"b":2}');
	});

	it("produces repeatable RNG sequences for the same seed inputs", () => {
		const rngA = deterministic.createDeterministicRng({
			runSeed: "seed-a",
			seq: 3,
			subsystemTag: "encounter",
		});
		const rngB = deterministic.createDeterministicRng({
			runSeed: "seed-a",
			seq: 3,
			subsystemTag: "encounter",
		});

		expect([rngA(), rngA(), rngA()]).toEqual([rngB(), rngB(), rngB()]);
	});
});
