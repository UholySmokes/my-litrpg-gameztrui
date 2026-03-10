import fs from "node:fs/promises";
import path from "node:path";
import process from "node:process";

function parseArgs(argv) {
	const options = {
		input: "",
		name: "",
		date: "",
		result: "",
		mttrMinutes: "",
		notes: "",
	};
	for (let i = 0; i < argv.length; i += 1) {
		const arg = String(argv[i] || "").trim();
		const next = String(argv[i + 1] || "").trim();
		switch (arg) {
			case "--input":
				options.input = next;
				i += 1;
				break;
			case "--name":
				options.name = next;
				i += 1;
				break;
			case "--date":
				options.date = next;
				i += 1;
				break;
			case "--result":
				options.result = next;
				i += 1;
				break;
			case "--mttr":
				options.mttrMinutes = next;
				i += 1;
				break;
			case "--notes":
				options.notes = next;
				i += 1;
				break;
			default:
				break;
		}
	}
	return options;
}

function normalizeIsoDate(value, label) {
	const raw = String(value || "").trim();
	if (!/^\d{4}-\d{2}-\d{2}$/u.test(raw)) {
		throw new Error(`Expected ${label} as YYYY-MM-DD.`);
	}
	const parsed = new Date(`${raw}T00:00:00Z`);
	if (Number.isNaN(parsed.valueOf())) {
		throw new Error(`Invalid ${label}: ${raw}`);
	}
	return raw;
}

function normalizeResult(value) {
	const normalized = String(value || "")
		.trim()
		.toLowerCase();
	if (!["pass", "fail", "partial"].includes(normalized)) {
		throw new Error('Expected --result to be one of: "pass", "fail", "partial".');
	}
	return normalized;
}

function normalizeMttr(value) {
	if (!String(value || "").trim()) {
		return null;
	}
	const parsed = Number(value);
	if (!Number.isFinite(parsed) || parsed < 0) {
		throw new Error("Expected --mttr to be a non-negative number.");
	}
	return Math.round(parsed);
}

function normalizeInputPath(inputArg) {
	const raw = String(inputArg || "").trim();
	if (!raw) {
		const today = new Date().toISOString().slice(0, 10);
		return path.resolve(process.cwd(), "docs", "reports", `m11_canary_inputs_${today}.json`);
	}
	return path.resolve(process.cwd(), raw);
}

function buildDrillEntry(options) {
	return {
		name: String(options.name || "").trim(),
		date: normalizeIsoDate(options.date, "drill date"),
		result: normalizeResult(options.result),
		mttrMinutes: normalizeMttr(options.mttrMinutes),
		notes: String(options.notes || "").trim(),
	};
}

function sortDrills(drills) {
	return drills.sort((a, b) => {
		const dateDiff = String(a.date || "").localeCompare(String(b.date || ""));
		if (dateDiff !== 0) return dateDiff;
		return String(a.name || "").localeCompare(String(b.name || ""));
	});
}

async function main() {
	const options = parseArgs(process.argv.slice(2));
	if (!String(options.name || "").trim()) {
		throw new Error("Missing required --name.");
	}
	if (!String(options.date || "").trim()) {
		throw new Error("Missing required --date.");
	}
	if (!String(options.result || "").trim()) {
		throw new Error("Missing required --result.");
	}

	const inputPath = normalizeInputPath(options.input);
	const raw = await fs.readFile(inputPath, "utf8");
	const payload = JSON.parse(raw);
	if (!payload || typeof payload !== "object" || Array.isArray(payload)) {
		throw new Error("Input JSON root must be an object.");
	}

	const drillEntry = buildDrillEntry(options);
	const drills = Array.isArray(payload.onCallDrills) ? [...payload.onCallDrills] : [];
	const existingIndex = drills.findIndex(
		(entry) =>
			String(entry?.name || "").trim() === drillEntry.name &&
			String(entry?.date || "").trim() === drillEntry.date,
	);

	if (existingIndex >= 0) {
		drills[existingIndex] = drillEntry;
	} else {
		drills.push(drillEntry);
	}

	payload.onCallDrills = sortDrills(drills);
	await fs.writeFile(inputPath, `${JSON.stringify(payload, null, 2)}\n`, "utf8");

	console.log(
		`[m11-oncall-drill] UPDATED path=${path.relative(process.cwd(), inputPath)} totalDrills=${payload.onCallDrills.length} drill="${drillEntry.name}" date=${drillEntry.date} result=${drillEntry.result}`,
	);
}

main().catch((error) => {
	console.error(error);
	process.exitCode = 1;
});
