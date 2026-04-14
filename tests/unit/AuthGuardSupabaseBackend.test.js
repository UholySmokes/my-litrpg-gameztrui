import { afterEach, beforeEach, describe, expect, it, jest } from "@jest/globals";
import { createRequire } from "module";

const require = createRequire(import.meta.url);
const auth = require("../../functions/lib/auth.js");
const supabase = require("../../functions/lib/supabase.js");

const originalIsSupabaseConfigured = supabase.isSupabaseConfigured;
const originalGetSupabaseServiceClient = supabase.getSupabaseServiceClient;

beforeEach(() => {
	jest.resetAllMocks();
	auth.__resetSupabaseRuntimeForTests();
	supabase.isSupabaseConfigured = jest.fn(() => true);
});

afterEach(() => {
	auth.__resetSupabaseRuntimeForTests();
	supabase.isSupabaseConfigured = originalIsSupabaseConfigured;
	supabase.getSupabaseServiceClient = originalGetSupabaseServiceClient;
});

describe("backend supabase bearer auth", () => {
	it("accepts verified Supabase bearer tokens", async () => {
		supabase.getSupabaseServiceClient = jest.fn(() => ({
			auth: {
				getUser: jest.fn(async (token) => {
					expect(token).toBe("token-123");
					return {
						data: {
							user: {
								id: "user-1",
								email: "user-1@example.test",
								app_metadata: { provider: "google" },
								identities: [{ provider: "google" }],
							},
						},
						error: null,
					};
				}),
			},
		}));

		const user = await auth.getUserFromRequest({
			headers: {
				authorization: "Bearer token-123",
			},
		});

		expect(user).toEqual({
			id: "user-1",
			email: "user-1@example.test",
			provider: "google",
			roles: ["authenticated"],
		});
	});

	it("returns null when Supabase rejects the bearer token", async () => {
		supabase.getSupabaseServiceClient = jest.fn(() => ({
			auth: {
				getUser: jest.fn(async () => ({
					data: { user: null },
					error: new Error("invalid token"),
				})),
			},
		}));

		const user = await auth.getUserFromRequest({
			headers: {
				authorization: "Bearer invalid-token",
			},
		});

		expect(user).toBeNull();
	});

	it("returns null instead of crashing when the Supabase helper is unavailable", async () => {
		const Module = require("module");
		const originalLoad = Module._load;

		Module._load = function patchedLoad(request, parent, isMain) {
			if (request === "./supabase" && parent?.filename?.endsWith("functions\\lib\\auth.js")) {
				const error = new Error("Cannot find module './supabase'");
				error.code = "MODULE_NOT_FOUND";
				throw error;
			}
			return originalLoad.call(this, request, parent, isMain);
		};

		try {
			auth.__resetSupabaseRuntimeForTests();
			const user = await auth.getUserFromRequest({
				headers: {
					authorization: "Bearer token-123",
				},
			});

			expect(user).toBeNull();
		} finally {
			Module._load = originalLoad;
			auth.__resetSupabaseRuntimeForTests();
		}
	});
});
