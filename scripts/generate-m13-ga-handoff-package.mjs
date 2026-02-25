import fs from "node:fs/promises";
import path from "node:path";
import process from "node:process";

function parseArgs(argv) {
	const options = {
		releaseId: "",
	};
	for (let i = 0; i < argv.length; i += 1) {
		const arg = String(argv[i] || "").trim();
		const next = String(argv[i + 1] || "").trim();
		if (arg === "--release-id") {
			options.releaseId = next;
			i += 1;
		}
	}
	return options;
}

function parseStatus(markdown) {
	const match = markdown.match(/^Status:\s*(PASS|FAIL)\s*$/imu);
	return match ? match[1] : "UNKNOWN";
}

function parseDecision(markdown) {
	const match = markdown.match(/^Decision:\s*([A-Z_]+)\s*$/imu);
	return match ? match[1] : "UNKNOWN";
}

async function listReportFiles(reportsDir) {
	try {
		return await fs.readdir(reportsDir);
	} catch {
		return [];
	}
}

function pickLatestFile(files, prefixes) {
	const candidates = files
		.filter((name) => name.endsWith(".md"))
		.filter((name) => prefixes.some((prefix) => name.startsWith(prefix)))
		.sort((a, b) => a.localeCompare(b));
	return candidates.length > 0 ? candidates[candidates.length - 1] : "";
}

async function readReportMetadata(reportsDir, fileName) {
	if (!fileName) {
		return {
			fileName: "",
			status: "MISSING",
			decision: "MISSING",
		};
	}
	const filePath = path.resolve(reportsDir, fileName);
	const raw = await fs.readFile(filePath, "utf8");
	return {
		fileName,
		status: parseStatus(raw),
		decision: parseDecision(raw),
	};
}

function buildPackage({
	reportDate,
	releaseId,
	stagingSignoff,
	canaryMemo,
	rolloutChecklist,
	liveRollback,
	fullEnablementAudit,
}) {
	const required = [stagingSignoff, canaryMemo, rolloutChecklist, fullEnablementAudit];
	const hasMissing = required.some((artifact) => artifact.status === "MISSING");
	const hasFail = required.some((artifact) => artifact.status === "FAIL");
	const decision =
		!hasMissing &&
		!hasFail &&
		rolloutChecklist.decision === "ADVANCE" &&
		fullEnablementAudit.decision === "FULLY_ENABLED"
			? "READY_FOR_GA"
			: "HOLD";
	const status = decision === "READY_FOR_GA" ? "PASS" : "FAIL";

	return `# M13 GA Handoff Package (${reportDate})

Status: ${status}  
Decision: ${decision}  
Generated: ${new Date().toISOString()}

## Release Metadata

- Release ID: \`${releaseId || `ga-${reportDate}`}\`
- Planning gate: \`M13 - Full Rollout and Post-Launch Handoff\`

## Required Inputs

| Artifact | File | Status | Decision |
|----------|------|--------|----------|
| M10 Staging Sign-off | \`${stagingSignoff.fileName || "missing"}\` | ${stagingSignoff.status} | ${stagingSignoff.decision} |
| M11 Canary Decision Memo | \`${canaryMemo.fileName || "missing"}\` | ${canaryMemo.status} | ${canaryMemo.decision} |
| M12 Rollout Gate Checklist | \`${rolloutChecklist.fileName || "missing"}\` | ${rolloutChecklist.status} | ${rolloutChecklist.decision} |
| M12 Live Rollback Verification | \`${liveRollback.fileName || "missing"}\` | ${liveRollback.status} | ${liveRollback.decision} |
| M13 Full Enablement Audit | \`${fullEnablementAudit.fileName || "missing"}\` | ${fullEnablementAudit.status} | ${fullEnablementAudit.decision} |

## Handoff Checklist

- [ ] Publish GA deployment timestamp and release tag.
- [ ] Link production dashboards and on-call rotation for post-launch week.
- [ ] Record Phase 5 backlog triage outcomes.
- [ ] Confirm runbook ownership for Sync, Story, Telemetry, and Rollback paths.

## Decision Notes

${
	decision === "READY_FOR_GA"
		? "- Required stage artifacts are present and healthy. Proceed to GA launch handoff."
		: "- One or more required artifacts are missing or failed. Resolve before GA handoff."
}
`;
}

async function main() {
	const options = parseArgs(process.argv.slice(2));
	const reportDate = new Date().toISOString().slice(0, 10);
	const reportsDir = path.resolve(process.cwd(), "docs", "reports");
	const files = await listReportFiles(reportsDir);

	const stagingSignoffFile = pickLatestFile(files, ["m10_staging_signoff_packet_"]);
	const canaryMemoFile = pickLatestFile(files, ["m11_canary_decision_memo_"]);
	const rolloutChecklistFile = pickLatestFile(files, ["m12_rollout_gate_checklist_"]);
	const liveRollbackFile = pickLatestFile(files, ["m12_live_rollback_verification_"]);
	const fullEnablementAuditFile = pickLatestFile(files, ["m13_full_enablement_audit_"]);

	const stagingSignoff = await readReportMetadata(reportsDir, stagingSignoffFile);
	const canaryMemo = await readReportMetadata(reportsDir, canaryMemoFile);
	const rolloutChecklist = await readReportMetadata(reportsDir, rolloutChecklistFile);
	const liveRollback = await readReportMetadata(reportsDir, liveRollbackFile);
	const fullEnablementAudit = await readReportMetadata(reportsDir, fullEnablementAuditFile);

	const handoffName = `m13_ga_handoff_package_${reportDate}.md`;
	const handoffPath = path.resolve(reportsDir, handoffName);
	await fs.mkdir(path.dirname(handoffPath), { recursive: true });
	await fs.writeFile(
		handoffPath,
		buildPackage({
			reportDate,
			releaseId: options.releaseId,
			stagingSignoff,
			canaryMemo,
			rolloutChecklist,
			liveRollback,
			fullEnablementAudit,
		}),
		"utf8",
	);

	const handoffRaw = await fs.readFile(handoffPath, "utf8");
	const status = parseStatus(handoffRaw);
	const decision = parseDecision(handoffRaw);
	console.log(
		`[m13-ga-handoff] ${status} decision=${decision} report=${path.relative(
			process.cwd(),
			handoffPath,
		)}`,
	);
	if (status !== "PASS") {
		process.exitCode = 1;
	}
}

main().catch((error) => {
	console.error(error);
	process.exitCode = 1;
});
