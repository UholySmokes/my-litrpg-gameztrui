import crypto from "node:crypto";
import fs from "node:fs/promises";
import path from "node:path";
import process from "node:process";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const syncCore = require("../functions/lib/sync-core.js");

const BASELINE_PATH = path.resolve(
	process.cwd(),
	"docs",
	"contracts",
	"m10_rollback_parity_baseline_v1.json",
);

function makeCommit({
	id,
	runId,
	clientSeq,
	contentVersion,
	triggerType,
	triggerId,
	mapId,
	x,
	y,
	targetId,
}) {
	return {
		id,
		runId,
		clientId: "rollback-drill-client",
		clientSeq,
		createdAt: "2026-02-24T00:00:00.000Z",
		contentVersion,
		triggerType,
		trigger: {
			triggerId,
			mapId,
			x,
			y,
			targetId,
		},
	};
}

function buildCommitStream(runId, contentVersion) {
	return [
		makeCommit({
			id: "rb1",
			runId,
			clientSeq: 1,
			contentVersion,
			triggerType: "ENTER_TILE",
			triggerId: "tile_intro_square",
			mapId: "map_village_square",
			x: 6,
			y: 8,
		}),
		makeCommit({
			id: "rb2",
			runId,
			clientSeq: 2,
			contentVersion,
			triggerType: "INTERACT",
			triggerId: "npc_guide_interact",
			mapId: "map_village_square",
			x: 10,
			y: 8,
			targetId: "npc_guide",
		}),
		makeCommit({
			id: "rb3",
			runId,
			clientSeq: 3,
			contentVersion,
			triggerType: "ENCOUNTER_GATE",
			triggerId: "encounter_gate_training",
			mapId: "map_village_square",
			x: 18,
			y: 8,
			targetId: "encounter_gate_training_01",
		}),
		makeCommit({
			id: "rb4",
			runId,
			clientSeq: 4,
			contentVersion,
			triggerType: "ZONE_EXIT",
			triggerId: "zone_exit_back_to_square",
			mapId: "map_training_glade",
			x: 0,
			y: 2,
		}),
		makeCommit({
			id: "rb5",
			runId,
			clientSeq: 5,
			contentVersion,
			triggerType: "SAVEPOINT",
			triggerId: "savepoint_square_crystal",
			mapId: "map_village_square",
			x: 4,
			y: 4,
			targetId: "save_crystal_square_01",
		}),
	];
}

function stableDigest(value) {
	const stable = JSON.stringify(value);
	return crypto.createHash("sha256").update(stable, "utf8").digest("hex");
}

function computeSignature() {
	const manifest = syncCore.getWorldManifest();
	const runId = "run-rollback-parity-v1";
	const commits = buildCommitStream(runId, manifest.contentVersion);
	const replay = syncCore.replayCommitLog({ manifest, runId, commits });
	const timeline = replay.timeline.map((entry) => ({
		accepted: Boolean(entry.accepted),
		errorCode: entry.errorCode || "",
		seq: Number.isInteger(entry.seq) ? entry.seq : null,
		tick: Number.isInteger(entry.tick) ? entry.tick : null,
		stateHash: typeof entry.stateHash === "string" ? entry.stateHash : "",
	}));
	return {
		contentVersion: manifest.contentVersion,
		commitCount: commits.length,
		seq: replay.state.seq,
		tick: replay.state.tick,
		stateHash: replay.state.stateHash,
		timelineHash: stableDigest(timeline),
	};
}

function compareSignature(actual, expected) {
	const keys = ["contentVersion", "commitCount", "seq", "tick", "stateHash", "timelineHash"];
	const mismatches = [];
	for (const key of keys) {
		if (actual[key] !== expected[key]) {
			mismatches.push({
				key,
				expected: expected[key],
				actual: actual[key],
			});
		}
	}
	return mismatches;
}

function buildReport({ runDate, mode, actual, baseline, mismatches }) {
	const status = mismatches.length === 0 ? "PASS" : "FAIL";
	const mismatchLines =
		mismatches.length === 0
			? "- none"
			: mismatches
					.map(
						(item) =>
							`- \`${item.key}\`: expected \`${item.expected}\`, actual \`${item.actual}\``,
					)
					.join("\n");
	return `# M10 Rollback Parity Check (${runDate})

Status: ${status}  
Mode: ${mode}  
Generated: ${new Date().toISOString()}

## Actual Signature

\`\`\`json
${JSON.stringify(actual, null, 2)}
\`\`\`

## Baseline Signature

\`\`\`json
${JSON.stringify(baseline, null, 2)}
\`\`\`

## Mismatches

${mismatchLines}
`;
}

async function writeReport(reportText) {
	const runDate = new Date().toISOString().slice(0, 10);
	const reportName = `m10_rollback_parity_check_${runDate}.md`;
	const reportPath = path.resolve(process.cwd(), "docs", "reports", reportName);
	await fs.mkdir(path.dirname(reportPath), { recursive: true });
	await fs.writeFile(reportPath, reportText, "utf8");
	return reportPath;
}

async function readBaseline() {
	const raw = await fs.readFile(BASELINE_PATH, "utf8");
	return JSON.parse(raw);
}

async function updateBaseline(signature) {
	await fs.mkdir(path.dirname(BASELINE_PATH), { recursive: true });
	const payload = {
		version: "m10_rollback_parity_baseline_v1",
		updatedAt: new Date().toISOString(),
		signature,
	};
	await fs.writeFile(BASELINE_PATH, `${JSON.stringify(payload, null, 2)}\n`, "utf8");
	return payload;
}

async function main() {
	const updateMode = process.argv.includes("--update-baseline");
	const signature = computeSignature();

	if (updateMode) {
		const baseline = await updateBaseline(signature);
		const reportPath = await writeReport(
			buildReport({
				runDate: new Date().toISOString().slice(0, 10),
				mode: "update-baseline",
				actual: signature,
				baseline: baseline.signature,
				mismatches: [],
			}),
		);
		console.log(
			`[rollback-parity] BASELINE_UPDATED path=${path.relative(
				process.cwd(),
				BASELINE_PATH,
			)} report=${path.relative(process.cwd(), reportPath)}`,
		);
		return;
	}

	const baselinePayload = await readBaseline();
	const baseline = baselinePayload?.signature || {};
	const mismatches = compareSignature(signature, baseline);
	const reportPath = await writeReport(
		buildReport({
			runDate: new Date().toISOString().slice(0, 10),
			mode: "check",
			actual: signature,
			baseline,
			mismatches,
		}),
	);
	console.log(
		`[rollback-parity] ${
			mismatches.length === 0 ? "PASS" : "FAIL"
		} mismatches=${mismatches.length} baseline=${path.relative(
			process.cwd(),
			BASELINE_PATH,
		)} report=${path.relative(process.cwd(), reportPath)}`,
	);
	if (mismatches.length > 0) {
		process.exitCode = 1;
	}
}

main().catch((error) => {
	console.error(error);
	process.exitCode = 1;
});
