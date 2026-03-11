import { afterEach, beforeEach, describe, expect, it } from "@jest/globals";
import { createRequire } from "module";

const require = createRequire(import.meta.url);
const auth = require("../../functions/lib/auth.js");

const originalDevAuthEnabled = process.env.DEV_AUTH_ENABLED;
const originalFunctionsEmulator = process.env.FUNCTIONS_EMULATOR;

function buildHeaderRequest() {
	return {
		headers: {
			"x-dev-user-id": "dev-header-user",
			"x-dev-user-email": "dev-header-user@example.test",
		},
	};
}

beforeEach(() => {
	delete process.env.DEV_AUTH_ENABLED;
	delete process.env.FUNCTIONS_EMULATOR;
});

afterEach(() => {
	if (originalDevAuthEnabled === undefined) delete process.env.DEV_AUTH_ENABLED;
	else process.env.DEV_AUTH_ENABLED = originalDevAuthEnabled;

	if (originalFunctionsEmulator === undefined) delete process.env.FUNCTIONS_EMULATOR;
	else process.env.FUNCTIONS_EMULATOR = originalFunctionsEmulator;
});

describe("backend dev auth guard", () => {
	it("rejects dev header auth by default", async () => {
		const user = await auth.getUserFromRequest(buildHeaderRequest());
		expect(user).toBeNull();
		expect(auth.isDevAuthEnabled()).toBe(false);
	});

	it("accepts dev header auth when explicitly enabled", async () => {
		process.env.DEV_AUTH_ENABLED = "true";
		const user = await auth.getUserFromRequest(buildHeaderRequest());
		expect(auth.isDevAuthEnabled()).toBe(true);
		expect(user?.id).toBe("dev-header-user");
	});

	it("accepts dev header auth in emulator mode", async () => {
		process.env.FUNCTIONS_EMULATOR = "true";
		const user = await auth.getUserFromRequest(buildHeaderRequest());
		expect(auth.isDevAuthEnabled()).toBe(true);
		expect(user?.id).toBe("dev-header-user");
	});

	it("respects explicit disable even when emulator is set", async () => {
		process.env.DEV_AUTH_ENABLED = "false";
		process.env.FUNCTIONS_EMULATOR = "true";
		const user = await auth.getUserFromRequest(buildHeaderRequest());
		expect(auth.isDevAuthEnabled()).toBe(false);
		expect(user).toBeNull();
	});
});
