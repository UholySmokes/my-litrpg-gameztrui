const crypto = require("crypto");
const { isRecord } = require("./shared");

function canonicalize(value) {
	if (value === null || typeof value === "string" || typeof value === "boolean") {
		return value;
	}

	if (typeof value === "number") {
		if (!Number.isFinite(value)) {
			throw new Error("Non-finite numeric value in canonical serializer.");
		}
		return value;
	}

	if (Array.isArray(value)) {
		return value.map((entry) => canonicalize(entry));
	}

	if (!isRecord(value)) {
		return value;
	}

	const keys = Object.keys(value).sort();
	const output = {};
	for (const key of keys) {
		output[key] = canonicalize(value[key]);
	}
	return output;
}

function stableJsonStringify(value) {
	return JSON.stringify(canonicalize(value));
}

function sha256Hex(value) {
	return crypto.createHash("sha256").update(String(value), "utf8").digest("hex");
}

function hashCanonicalState(state) {
	return sha256Hex(stableJsonStringify(state));
}

function deriveRngSeed(runSeed, seq, subsystemTag) {
	const payload = `${String(runSeed)}:${String(seq)}:${String(subsystemTag)}`;
	const digest = crypto.createHash("sha256").update(payload, "utf8").digest();
	const seed = digest.readUInt32BE(0);
	return seed === 0 ? 1 : seed;
}

function createDeterministicRng({ runSeed, seq, subsystemTag }) {
	let seed = deriveRngSeed(runSeed, seq, subsystemTag);
	return () => {
		seed = (1664525 * seed + 1013904223) >>> 0;
		return seed / 0x100000000;
	};
}

module.exports = {
	canonicalize,
	stableJsonStringify,
	sha256Hex,
	hashCanonicalState,
	deriveRngSeed,
	createDeterministicRng,
};
