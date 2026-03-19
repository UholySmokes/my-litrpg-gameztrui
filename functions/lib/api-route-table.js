const { json } = require("./http");

function normalizeMethod(value) {
	return String(value || "GET").toUpperCase();
}

function normalizePath(url) {
	const raw = typeof url === "string" ? url : "";
	const withoutQuery = raw.split("?")[0] || "";
	return withoutQuery.replace(/\/+/g, "/");
}

function toMethodSet(methods) {
	if (!methods || methods === "*" || methods === "ANY") return null;
	const list = Array.isArray(methods) ? methods : [methods];
	return new Set(list.map((method) => normalizeMethod(method)).filter(Boolean));
}

function getHandlersModule() {
	return require("./handlers");
}

function getSyncModule() {
	return require("./sync");
}

function getTelemetryModule() {
	return require("./telemetry");
}

function getBulkGenerationModule() {
	return require("./bulk-generation-handlers");
}

function getSavesModule() {
	return require("./saves");
}

function createRoute({ name, methods, match, handle }) {
	const methodSet = toMethodSet(methods);
	return {
		name,
		match(path, method) {
			if (methodSet && !methodSet.has(normalizeMethod(method))) return null;
			return typeof match === "function" ? match(path, method) : null;
		},
		handle,
	};
}

function exactRoute({ name, methods, path, handle }) {
	return createRoute({
		name,
		methods,
		match(candidatePath) {
			return candidatePath === path ? {} : null;
		},
		handle,
	});
}

function regexRoute({ name, methods, pattern, handle }) {
	return createRoute({
		name,
		methods,
		match(candidatePath) {
			const result = candidatePath.match(pattern);
			if (!result) return null;
			return { match: result };
		},
		handle,
	});
}

const API_ROUTES = [
	exactRoute({
		name: "saves-reset-legacy",
		methods: "*",
		path: "/api/saves/reset-legacy",
		handle: (req, res) => getSavesModule().handleResetLegacyRequest(req, res),
	}),
	regexRoute({
		name: "saves",
		methods: "*",
		pattern: /^\/api\/saves(?:\/([^/]+))?$/,
		handle: (req, res, context = {}) => {
			const encodedSaveId = context?.match?.[1] || "";
			let saveId = "";
			if (encodedSaveId) {
				try {
					saveId = decodeURIComponent(encodedSaveId);
				} catch {
					return json(res, 400, {
						ok: false,
						errorCode: "INVALID_SAVE_ID",
						message: "Malformed save id path segment.",
					});
				}
			}
			return getSavesModule().handleSavesRequest(req, res, { saveId });
		},
	}),
	exactRoute({
		name: "health",
		methods: "GET",
		path: "/api/health",
		handle: (req, res) => getHandlersModule().health(req, res),
	}),
	exactRoute({
		name: "agents",
		methods: "GET",
		path: "/api/agents",
		handle: (req, res) => getHandlersModule().agents(req, res),
	}),
	exactRoute({
		name: "agents-run",
		methods: "POST",
		path: "/api/agents/run",
		handle: (req, res) => getHandlersModule().runAgent(req, res),
	}),
	exactRoute({
		name: "narrate",
		methods: "POST",
		path: "/api/narrate",
		handle: (req, res) => getHandlersModule().narrate(req, res),
	}),
	exactRoute({
		name: "narrate-start",
		methods: "POST",
		path: "/api/narrate-start",
		handle: (req, res) => getHandlersModule().narrateStart(req, res),
	}),
	exactRoute({
		name: "narrate-poll",
		methods: "GET",
		path: "/api/narrate-poll",
		handle: (req, res) => getHandlersModule().narratePoll(req, res),
	}),
	exactRoute({
		name: "story-event",
		methods: "POST",
		path: "/api/story/event",
		handle: (req, res) => getHandlersModule().narrate(req, res),
	}),
	exactRoute({
		name: "story-start",
		methods: "POST",
		path: "/api/story/start",
		handle: (req, res) => getHandlersModule().narrateStart(req, res),
	}),
	exactRoute({
		name: "story-poll",
		methods: "GET",
		path: "/api/story/poll",
		handle: (req, res) => getHandlersModule().narratePoll(req, res),
	}),
	exactRoute({
		name: "telemetry",
		methods: "POST",
		path: "/api/telemetry",
		handle: (req, res) => getTelemetryModule().telemetryIngest(req, res),
	}),
	exactRoute({
		name: "sync-commit",
		methods: "POST",
		path: "/api/sync/commit",
		handle: (req, res) => getSyncModule().commit(req, res),
	}),
	exactRoute({
		name: "sync-commit-batch",
		methods: "POST",
		path: "/api/sync/commit-batch",
		handle: (req, res) => getSyncModule().commitBatch(req, res),
	}),
	exactRoute({
		name: "sync-command",
		methods: "POST",
		path: "/api/sync/command",
		handle: (req, res) => getSyncModule().command(req, res),
	}),
	exactRoute({
		name: "sync-pull",
		methods: "GET",
		path: "/api/sync/pull",
		handle: (req, res) => getSyncModule().pull(req, res),
	}),
	exactRoute({
		name: "sync-replay",
		methods: "GET",
		path: "/api/sync/replay",
		handle: (req, res) => getSyncModule().replay(req, res),
	}),
	exactRoute({
		name: "sync-action",
		methods: "POST",
		path: "/api/sync/action",
		handle: (req, res) => {
			res.set("Deprecation", "true");
			res.set("Sunset", "Wed, 01 Jul 2026 00:00:00 GMT");
			res.set("Link", '</api/sync/commit>; rel="successor-version"');
			return getSyncModule().action(req, res);
		},
	}),
	exactRoute({
		name: "bulk-gen-run-start",
		methods: "POST",
		path: "/api/bulk-gen/run/start",
		handle: (req, res) => getBulkGenerationModule().startRun(req, res),
	}),
	exactRoute({
		name: "bulk-gen-run-tick",
		methods: "POST",
		path: "/api/bulk-gen/run/tick",
		handle: (req, res) => getBulkGenerationModule().tickRun(req, res),
	}),
	exactRoute({
		name: "bulk-gen-run-status",
		methods: "GET",
		path: "/api/bulk-gen/run/status",
		handle: (req, res) => getBulkGenerationModule().getRunStatus(req, res),
	}),
	exactRoute({
		name: "bulk-gen-run-pause",
		methods: "POST",
		path: "/api/bulk-gen/run/pause",
		handle: (req, res) => getBulkGenerationModule().pauseRun(req, res),
	}),
	exactRoute({
		name: "bulk-gen-run-resume",
		methods: "POST",
		path: "/api/bulk-gen/run/resume",
		handle: (req, res) => getBulkGenerationModule().resumeRun(req, res),
	}),
	exactRoute({
		name: "bulk-gen-style",
		methods: "POST",
		path: "/api/bulk-gen/style",
		handle: (req, res) => getBulkGenerationModule().upsertStyle(req, res),
	}),
	exactRoute({
		name: "bulk-gen-budget-alert",
		methods: "POST",
		path: "/api/bulk-gen/budget-alert",
		handle: (req, res) => getBulkGenerationModule().budgetAlert(req, res),
	}),
];

function findApiRoute(path, method) {
	for (const route of API_ROUTES) {
		const match = route.match(path, method);
		if (match) {
			return { route, match };
		}
	}
	return null;
}

async function dispatchApiRoute({ req, res, path, method }) {
	const found = findApiRoute(path, method);
	if (!found) return false;
	await found.route.handle(req, res, found.match);
	return true;
}

module.exports = {
	API_ROUTES,
	dispatchApiRoute,
	findApiRoute,
	normalizePath,
};
