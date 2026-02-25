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

async function findLatestReport(prefix) {
	const reportsDir = path.resolve(process.cwd(), "docs", "reports");
	const files = await fs.readdir(reportsDir);
	const matches = files
		.filter((file) => file.startsWith(prefix) && file.endsWith(".md"))
		.sort((a, b) => a.localeCompare(b));
	return matches.length > 0 ? matches[matches.length - 1] : "";
}

async function loadMetadata(fileName) {
	if (!fileName) {
		return { fileName: "", status: "MISSING", decision: "MISSING" };
	}
	const reportPath = path.resolve(process.cwd(), "docs", "reports", fileName);
	const raw = await fs.readFile(reportPath, "utf8");
	return {
		fileName,
		status: parseStatus(raw),
		decision: parseDecision(raw),
	};
}

function buildReview({ reportDate, releaseId, closeout, playbook }) {
	const status =
		closeout.status === "PASS" &&
		closeout.decision === "COMPLETE" &&
		playbook.status === "PASS" &&
		playbook.decision === "OPS_READY"
			? "PASS"
			: "FAIL";
	const decision = status === "PASS" ? "GA_CONFIRMED" : "HOLD";
	return `# M13 GA Review Notes (${reportDate})

Status: ${status}  
Decision: ${decision}  
Generated: ${new Date().toISOString()}

## Release

- Release ID: \`${releaseId || `ga-${reportDate}`}\`

## Evidence Snapshot

| Artifact | File | Status | Decision |
|----------|------|--------|----------|
| Phase closeout dossier | \`${closeout.fileName || "missing"}\` | ${closeout.status} | ${closeout.decision} |
| Post-launch operating playbook | \`${playbook.fileName || "missing"}\` | ${playbook.status} | ${playbook.decision} |

## Postmortem Capture Checklist

- [ ] Incident timeline finalized (if any Sev-1/Sev-2 occurred).
- [ ] Root cause themes and corrective actions documented.
- [ ] Follow-up actions copied into Phase 5 backlog.
- [ ] Ownership and due dates assigned for each corrective action.

## Decision Notes

${
	status === "PASS"
		? "- GA review evidence is complete and aligned with M13 readiness criteria."
		: "- Missing or failing closeout/playbook artifacts block GA confirmation."
}
`;
}

function buildReviewWithExtendedInputs({
	reportDate,
	releaseId,
	closeout,
	playbook,
	handoff,
	enablement,
}) {
	const status =
		closeout.status === "PASS" &&
		closeout.decision === "COMPLETE" &&
		playbook.status === "PASS" &&
		playbook.decision === "OPS_READY" &&
		handoff.status === "PASS" &&
		handoff.decision === "READY_FOR_GA" &&
		enablement.status === "PASS" &&
		enablement.decision === "FULLY_ENABLED"
			? "PASS"
			: "FAIL";
	const decision = status === "PASS" ? "GA_CONFIRMED" : "HOLD";
	return `# M13 GA Review Notes (${reportDate})

Status: ${status}  
Decision: ${decision}  
Generated: ${new Date().toISOString()}

## Release

- Release ID: \`${releaseId || `ga-${reportDate}`}\`

## Evidence Snapshot

| Artifact | File | Status | Decision |
|----------|------|--------|----------|
| Phase closeout dossier | \`${closeout.fileName || "missing"}\` | ${closeout.status} | ${closeout.decision} |
| Post-launch operating playbook | \`${playbook.fileName || "missing"}\` | ${playbook.status} | ${playbook.decision} |
| GA handoff package | \`${handoff.fileName || "missing"}\` | ${handoff.status} | ${handoff.decision} |
| Full enablement audit | \`${enablement.fileName || "missing"}\` | ${enablement.status} | ${enablement.decision} |

## Postmortem Capture Checklist

- [ ] Incident timeline finalized (if any Sev-1/Sev-2 occurred).
- [ ] Root cause themes and corrective actions documented.
- [ ] Follow-up actions copied into Phase 5 backlog.
- [ ] Ownership and due dates assigned for each corrective action.

## Decision Notes

${
	status === "PASS"
		? "- GA review evidence is complete and aligned with M13 readiness criteria."
		: "- Missing or failing closeout/playbook/handoff/enablement artifacts block GA confirmation."
}
`;
}

async function main() {
	const options = parseArgs(process.argv.slice(2));
	const closeoutFile = await findLatestReport("m13_phase_closeout_dossier_");
	const playbookFile = await findLatestReport("m13_post_launch_operating_playbook_");
	const handoffFile = await findLatestReport("m13_ga_handoff_package_");
	const enablementFile = await findLatestReport("m13_full_enablement_audit_");
	const closeout = await loadMetadata(closeoutFile);
	const playbook = await loadMetadata(playbookFile);
	const handoff = await loadMetadata(handoffFile);
	const enablement = await loadMetadata(enablementFile);
	const reportDate = new Date().toISOString().slice(0, 10);

	const markdown = buildReviewWithExtendedInputs({
		reportDate,
		releaseId: options.releaseId,
		closeout,
		playbook,
		handoff,
		enablement,
	});
	const reportPath = path.resolve(
		process.cwd(),
		"docs",
		"reports",
		`m13_ga_review_notes_${reportDate}.md`,
	);
	await fs.mkdir(path.dirname(reportPath), { recursive: true });
	await fs.writeFile(reportPath, markdown, "utf8");

	const status = parseStatus(markdown);
	const decision = parseDecision(markdown);
	console.log(
		`[m13-ga-review] ${status} decision=${decision} report=${path.relative(process.cwd(), reportPath)}`,
	);
	if (status !== "PASS") {
		process.exitCode = 1;
	}
}

main().catch((error) => {
	console.error(error);
	process.exitCode = 1;
});
