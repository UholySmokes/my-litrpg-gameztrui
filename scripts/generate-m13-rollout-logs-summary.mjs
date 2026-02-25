import fs from "node:fs/promises";
import path from "node:path";
import process from "node:process";

function parseStatus(markdown) {
	const match = markdown.match(/^Status:\s*(PASS|FAIL)\s*$/imu);
	return match ? match[1] : "UNKNOWN";
}

function parseDecision(markdown) {
	const match = markdown.match(/^Decision:\s*([A-Z_]+)\s*$/imu);
	return match ? match[1] : "UNKNOWN";
}

async function listReports() {
	const dir = path.resolve(process.cwd(), "docs", "reports");
	try {
		const files = await fs.readdir(dir);
		return files.filter((file) => file.endsWith(".md")).sort((a, b) => a.localeCompare(b));
	} catch {
		return [];
	}
}

function pickLatest(files, prefix) {
	const matches = files.filter((file) => file.startsWith(prefix));
	return matches.length > 0 ? matches[matches.length - 1] : "";
}

async function metadataFor(fileName) {
	if (!fileName) {
		return {
			fileName: "",
			status: "MISSING",
			decision: "MISSING",
		};
	}
	const filePath = path.resolve(process.cwd(), "docs", "reports", fileName);
	const raw = await fs.readFile(filePath, "utf8");
	return {
		fileName,
		status: parseStatus(raw),
		decision: parseDecision(raw),
	};
}

function buildSummary(reportDate, summary) {
	const required = [
		summary.canary,
		summary.alertTuning,
		summary.rolloutChecklist,
		summary.liveRollback,
		summary.gaReview,
	];
	const hasMissing = required.some((item) => item.status === "MISSING");
	const hasFail = required.some((item) => item.status === "FAIL");
	const status = !hasMissing && !hasFail ? "PASS" : "FAIL";
	const decision = status === "PASS" ? "OPS_ARCHIVE_READY" : "HOLD";

	return `# M13 Rollout Logs and Incident Summary (${reportDate})

Status: ${status}  
Decision: ${decision}  
Generated: ${new Date().toISOString()}

## Artifact Ledger

| Stage | Artifact | File | Status | Decision |
|-------|----------|------|--------|----------|
| M11 | Canary Decision Memo | \`${summary.canary.fileName || "missing"}\` | ${summary.canary.status} | ${summary.canary.decision} |
| M11 | Alert Tuning Report | \`${summary.alertTuning.fileName || "missing"}\` | ${summary.alertTuning.status} | ${summary.alertTuning.decision} |
| M12 | Rollout Gate Checklist | \`${summary.rolloutChecklist.fileName || "missing"}\` | ${summary.rolloutChecklist.status} | ${summary.rolloutChecklist.decision} |
| M12 | Live Rollback Verification | \`${summary.liveRollback.fileName || "missing"}\` | ${summary.liveRollback.status} | ${summary.liveRollback.decision} |
| M13 | GA Review Notes | \`${summary.gaReview.fileName || "missing"}\` | ${summary.gaReview.status} | ${summary.gaReview.decision} |

## Incident/Operations Notes

- Use M11 canary incident log as primary incident thread source.
- Use M12 rollback verification report for rollback evidence linkage.
- Use M13 GA review notes for postmortem action capture.

## Decision Notes

${
	status === "PASS"
		? "- Rollout logs and incident summary packet is complete for archive/handoff."
		: "- Missing or failing artifacts prevent rollout log closeout."
}
`;
}

async function main() {
	const files = await listReports();
	const summary = {
		canary: await metadataFor(pickLatest(files, "m11_canary_decision_memo_")),
		alertTuning: await metadataFor(pickLatest(files, "m11_alert_tuning_")),
		rolloutChecklist: await metadataFor(pickLatest(files, "m12_rollout_gate_checklist_")),
		liveRollback: await metadataFor(pickLatest(files, "m12_live_rollback_verification_")),
		gaReview: await metadataFor(pickLatest(files, "m13_ga_review_notes_")),
	};

	const reportDate = new Date().toISOString().slice(0, 10);
	const reportName = `m13_rollout_logs_summary_${reportDate}.md`;
	const reportPath = path.resolve(process.cwd(), "docs", "reports", reportName);
	const markdown = buildSummary(reportDate, summary);
	await fs.mkdir(path.dirname(reportPath), { recursive: true });
	await fs.writeFile(reportPath, markdown, "utf8");

	const status = parseStatus(markdown);
	const decision = parseDecision(markdown);
	console.log(
		`[m13-rollout-logs] ${status} decision=${decision} report=${path.relative(
			process.cwd(),
			reportPath,
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
