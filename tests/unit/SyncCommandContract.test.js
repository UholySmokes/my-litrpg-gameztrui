import { describe, expect, it } from "@jest/globals";
import { createRequire } from "module";

const require = createRequire(import.meta.url);
const contract = require("../../functions/lib/sync-command-contract.js");

describe("sync command contract", () => {
	it("keeps trigger verbs as the legacy sync verb surface", () => {
		expect(contract.SYNC_COMMAND_VERBS_V1).toEqual(contract.TRIGGER_COMMAND_VERBS_V1);
		expect(contract.SYNC_COMMAND_VERBS_V1).toContain("ENTER_TILE");
	});

	it("normalizes character command types and verbs", () => {
		expect(contract.normalizeSyncCommandType("character")).toBe("CHARACTER");
		expect(contract.normalizeSyncCommandVerb("create", "CHARACTER")).toBe("CREATE");
		expect(contract.getSupportedCommandVerbs("CHARACTER")).toEqual(
			contract.CHARACTER_COMMAND_VERBS_V1,
		);
	});
});
