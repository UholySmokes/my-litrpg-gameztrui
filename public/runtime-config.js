globalThis.__RUNTIME_CONFIG__ = globalThis.__RUNTIME_CONFIG__ || {};
try {
	const hostname =
		typeof window !== "undefined" && window.location
			? window.location.hostname
			: "";
	const isLocal =
		hostname === "localhost" ||
		hostname === "127.0.0.1" ||
		hostname === "0.0.0.0";
	if (!isLocal) {
		globalThis.__RUNTIME_CONFIG__.VITE_API_BASE_URL =
			"https://voidverseapisservice.azurewebsites.net";
	}
} catch {
	globalThis.__RUNTIME_CONFIG__.VITE_API_BASE_URL =
		"https://voidverseapisservice.azurewebsites.net";
}
globalThis.__RUNTIME_CONFIG__.VITE_NARRATE_TIMEOUT_MS = "240000";
// globalThis.__RUNTIME_CONFIG__.VITE_AUTH_PROVIDER = "aad";
