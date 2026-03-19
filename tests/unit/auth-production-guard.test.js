const { describe, it, expect, beforeEach, afterEach } = require("@jest/globals");

describe("auth production guard", () => {
	const PROD_ID = "my-litrpg-gameztrui-3416-da75c";
	let savedEnv;

	beforeEach(() => {
		savedEnv = { ...process.env };
		delete process.env.DEV_AUTH_ENABLED;
		delete process.env.FUNCTIONS_EMULATOR;
		delete process.env.GOOGLE_CLOUD_PROJECT;
		delete process.env.GCLOUD_PROJECT;
		// Force fresh module load each test
		jest.resetModules();
	});

	afterEach(() => {
		process.env = savedEnv;
	});

	function loadAuth() {
		return require("../../functions/lib/auth");
	}

	describe("isProductionEnvironment", () => {
		it("returns true when GOOGLE_CLOUD_PROJECT matches production ID", () => {
			process.env.GOOGLE_CLOUD_PROJECT = PROD_ID;
			const { isProductionEnvironment } = loadAuth();
			expect(isProductionEnvironment()).toBe(true);
		});

		it("returns true when GCLOUD_PROJECT matches production ID", () => {
			process.env.GCLOUD_PROJECT = PROD_ID;
			const { isProductionEnvironment } = loadAuth();
			expect(isProductionEnvironment()).toBe(true);
		});

		it("returns false when no project ID is set", () => {
			const { isProductionEnvironment } = loadAuth();
			expect(isProductionEnvironment()).toBe(false);
		});

		it("returns false for non-production project IDs", () => {
			process.env.GOOGLE_CLOUD_PROJECT = "some-dev-project";
			const { isProductionEnvironment } = loadAuth();
			expect(isProductionEnvironment()).toBe(false);
		});
	});

	describe("isDevAuthEnabled - production guard", () => {
		it("returns false in production even when DEV_AUTH_ENABLED=true", () => {
			process.env.GOOGLE_CLOUD_PROJECT = PROD_ID;
			process.env.DEV_AUTH_ENABLED = "true";
			const { isDevAuthEnabled } = loadAuth();
			expect(isDevAuthEnabled()).toBe(false);
		});

		it("returns false in production even when FUNCTIONS_EMULATOR=true", () => {
			process.env.GOOGLE_CLOUD_PROJECT = PROD_ID;
			process.env.FUNCTIONS_EMULATOR = "true";
			const { isDevAuthEnabled } = loadAuth();
			expect(isDevAuthEnabled()).toBe(false);
		});

		it("returns true in dev when DEV_AUTH_ENABLED=true and not production", () => {
			process.env.DEV_AUTH_ENABLED = "true";
			const { isDevAuthEnabled } = loadAuth();
			expect(isDevAuthEnabled()).toBe(true);
		});

		it("returns true when FUNCTIONS_EMULATOR=true and not production", () => {
			process.env.FUNCTIONS_EMULATOR = "true";
			const { isDevAuthEnabled } = loadAuth();
			expect(isDevAuthEnabled()).toBe(true);
		});

		it("returns false when nothing is set and not production", () => {
			const { isDevAuthEnabled } = loadAuth();
			expect(isDevAuthEnabled()).toBe(false);
		});
	});
});
