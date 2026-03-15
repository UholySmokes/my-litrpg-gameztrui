function isRecord(value) {
	return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function toFiniteNumber(value) {
	if (typeof value === "number" && Number.isFinite(value)) return value;
	if (typeof value === "string" && value.trim()) {
		const parsed = Number(value);
		if (Number.isFinite(parsed)) return parsed;
	}
	return Number.NaN;
}

function toInteger(value) {
	const parsed = toFiniteNumber(value);
	if (!Number.isFinite(parsed)) return Number.NaN;
	if (!Number.isInteger(parsed)) return Number.NaN;
	return parsed;
}

function normalizeString(value) {
	return typeof value === "string" ? value.trim() : "";
}

function toNonNegativeInteger(value, fallback = 0) {
	const parsed = toInteger(value);
	if (!Number.isInteger(parsed) || parsed < 0) return fallback;
	return parsed;
}

function parseIsoTimestampMs(value) {
	const raw = normalizeString(value);
	if (!raw) return Number.NaN;
	const ms = Date.parse(raw);
	return Number.isFinite(ms) ? ms : Number.NaN;
}

module.exports = {
	isRecord,
	toFiniteNumber,
	toInteger,
	normalizeString,
	toNonNegativeInteger,
	parseIsoTimestampMs,
};
