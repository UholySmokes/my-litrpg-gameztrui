function getRequiredEnv(name) {
	const value = process.env[name];
	return typeof value === "string" && value.trim() ? value.trim() : "";
}

function normalizeEndpoint(endpoint) {
	return endpoint.replace(/\/+$/g, "");
}

function getApiVersion() {
	return getRequiredEnv("FOUNDRY_API_VERSION") || "2025-05-01";
}

function getTimeoutMs(name, fallbackMs) {
	const raw = getRequiredEnv(name);
	const parsed = Number.parseInt(raw, 10);
	return Number.isFinite(parsed) && parsed > 0 ? parsed : fallbackMs;
}

function getRetryDelayMs(attempt) {
	return Math.min(2000, 300 * (attempt + 1));
}

async function fetchJson(url, { method, apiKey, body, retries, timeoutMs }) {
	const maxRetries = Number.isFinite(retries) ? retries : 2;
	const requestTimeoutMs =
		Number.isFinite(timeoutMs) && timeoutMs > 0
			? timeoutMs
			: getTimeoutMs("FOUNDRY_HTTP_TIMEOUT_MS", 30000);
	if (!apiKey) {
		const error = new Error(
			"Missing Foundry authentication. Configure FOUNDRY_API_KEY.",
		);
		error.status = 500;
		error.code = "MISSING_FOUNDRY_AUTH";
		throw error;
	}

	let attempt = 0;
	while (true) {
		const controller = new AbortController();
		const timeoutId = setTimeout(() => controller.abort(), requestTimeoutMs);
		let response;
		try {
			response = await fetch(url, {
				method,
				headers: {
					"Content-Type": "application/json",
					"api-key": apiKey,
				},
				body: body ? JSON.stringify(body) : undefined,
				signal: controller.signal,
			});
		} catch (err) {
			const isTimeout = err?.name === "AbortError";
			if (attempt < maxRetries) {
				await new Promise((r) => setTimeout(r, getRetryDelayMs(attempt)));
				attempt += 1;
				continue;
			}
			const error = isTimeout
				? Object.assign(new Error(`Foundry request timed out after ${requestTimeoutMs}ms.`), {
					status: 504,
					code: "FOUNDRY_REQUEST_TIMEOUT",
				})
				: err;
			throw error;
		} finally {
			clearTimeout(timeoutId);
		}

		const text = await response.text().catch(() => "");
		let json = null;
		try {
			json = text ? JSON.parse(text) : null;
		} catch {
			json = null;
		}

		if (!response.ok) {
			const detail = json || text || response.statusText;
			const error = new Error(`Foundry request failed (${response.status})`);
			error.status = response.status;
			error.detail = detail;

			if (
				[429, 500, 502, 503, 504].includes(response.status) &&
				attempt < maxRetries
			) {
				await new Promise((r) => setTimeout(r, getRetryDelayMs(attempt)));
				attempt += 1;
				continue;
			}
			throw error;
		}

		return json;
	}
}

function extractAssistantText(messagesResponse) {
	const data = Array.isArray(messagesResponse?.data)
		? messagesResponse.data
		: Array.isArray(messagesResponse?.messages)
			? messagesResponse.messages
			: [];

	for (const message of data) {
		if (message?.role !== "assistant") continue;
		const content = message?.content;

		if (typeof content === "string" && content.trim()) return content.trim();

		if (Array.isArray(content)) {
			const parts = [];
			for (const item of content) {
				const textValue = item?.text?.value;
				if (typeof textValue === "string" && textValue.trim())
					parts.push(textValue.trim());
				const directText = item?.text;
				if (typeof directText === "string" && directText.trim())
					parts.push(directText.trim());
			}
			if (parts.length) return parts.join("\n");
		}

		const nestedText = message?.content?.text?.value;
		if (typeof nestedText === "string" && nestedText.trim())
			return nestedText.trim();
	}
	return "";
}

async function startFoundryRun(instruction, assistantId) {
	const projectEndpoint = getRequiredEnv("FOUNDRY_PROJECT_ENDPOINT");
	const apiKey = getRequiredEnv("FOUNDRY_API_KEY");
	if (!projectEndpoint) {
		throw Object.assign(new Error("Missing FOUNDRY_PROJECT_ENDPOINT"), {
			code: "MISSING_ENV",
			status: 500,
		});
	}
	if (!assistantId) {
		throw Object.assign(new Error("Missing assistant id"), {
			code: "MISSING_ENV",
			status: 500,
		});
	}
	const endpointBase = normalizeEndpoint(projectEndpoint);
	const apiVersion = getApiVersion();

	const thread = await fetchJson(
		`${endpointBase}/threads?api-version=${apiVersion}`,
		{ method: "POST", apiKey, body: {}, retries: 2 },
	);
	const threadId = thread?.id;
	if (!threadId) {
		throw Object.assign(new Error("Failed to create thread."), {
			code: "THREAD_CREATE_FAILED",
			status: 500,
		});
	}

	await fetchJson(
		`${endpointBase}/threads/${encodeURIComponent(threadId)}/messages?api-version=${apiVersion}`,
		{
			method: "POST",
			apiKey,
			body: { role: "user", content: instruction },
			retries: 2,
		},
	);

	const run = await fetchJson(
		`${endpointBase}/threads/${encodeURIComponent(threadId)}/runs?api-version=${apiVersion}`,
		{
			method: "POST",
			apiKey,
			body: { assistant_id: assistantId },
			retries: 2,
		},
	);
	const runId = run?.id;
	if (!runId) {
		throw Object.assign(new Error("Failed to start agent run."), {
			code: "RUN_START_FAILED",
			status: 500,
		});
	}

	return { threadId, runId, status: run.status || "queued" };
}

async function pollFoundryRun(threadId, runId) {
	const projectEndpoint = getRequiredEnv("FOUNDRY_PROJECT_ENDPOINT");
	const apiKey = getRequiredEnv("FOUNDRY_API_KEY");
	const endpointBase = normalizeEndpoint(projectEndpoint);
	const apiVersion = getApiVersion();

	const run = await fetchJson(
		`${endpointBase}/threads/${encodeURIComponent(threadId)}/runs/${encodeURIComponent(runId)}?api-version=${apiVersion}`,
		{ method: "GET", apiKey, retries: 2 },
	);
	const statusRaw = run?.status || "unknown";
	const status = String(statusRaw).trim().toLowerCase();

	if (["failed", "cancelled", "expired"].includes(status)) {
		return {
			status: statusRaw,
			text: "",
			done: true,
			error: `Run ended with status: ${status}`,
		};
	}

	if (status === "requires_action") {
		return {
			status: statusRaw,
			text: "",
			done: true,
			error: "Run requires action (tool calls) not supported.",
		};
	}

	if (status === "completed" || status === "incomplete") {
		const messages = await fetchJson(
			`${endpointBase}/threads/${encodeURIComponent(threadId)}/messages?api-version=${apiVersion}`,
			{ method: "GET", apiKey, retries: 2 },
		);
		const text = extractAssistantText(messages);
		return { status: statusRaw, text, done: true };
	}

	let partialText = "";
	try {
		const messages = await fetchJson(
			`${endpointBase}/threads/${encodeURIComponent(threadId)}/messages?api-version=${apiVersion}`,
			{ method: "GET", apiKey, retries: 1 },
		);
		partialText = extractAssistantText(messages);
	} catch {
		partialText = "";
	}

	return { status: statusRaw, text: partialText, done: false };
}

async function awaitFoundryRun(threadId, runId) {
	const timeout = getTimeoutMs("NARRATE_RUN_TIMEOUT_MS", 120000);
	const startedAt = Date.now();
	let sleepMs = 500;
	while (true) {
		const result = await pollFoundryRun(threadId, runId);
		if (result.done) {
			if (result.error) {
				throw Object.assign(new Error(result.error), {
					code: "RUN_FAILED",
					status: 500,
				});
			}
			return { status: result.status, text: result.text };
		}

		if (Date.now() - startedAt > timeout) {
			throw Object.assign(new Error("Agent run timeout."), {
				code: "RUN_TIMEOUT",
				status: 504,
				threadId,
				runId,
			});
		}
		await new Promise((r) => setTimeout(r, sleepMs));
		sleepMs = Math.min(1500, Math.floor(sleepMs * 1.2));
	}
}

module.exports = {
	startFoundryRun,
	pollFoundryRun,
	awaitFoundryRun,
};

