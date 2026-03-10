import fs from "node:fs/promises";
import path from "node:path";
import process from "node:process";

function parseArgs(argv) {
	const options = {
		input: "",
	};
	for (let i = 0; i < argv.length; i += 1) {
		const arg = String(argv[i] || "").trim();
		if (arg === "--input") {
			options.input = String(argv[i + 1] || "").trim();
			i += 1;
		}
	}
	return options;
}

function normalizeIsoDate(value, label) {
	const raw = String(value || "").trim();
	if (!/^\d{4}-\d{2}-\d{2}$/u.test(raw)) {
		throw new Error(`Expected ${label} as YYYY-MM-DD, received "${raw || "empty"}".`);
	}
	const parsed = new Date(`${raw}T00:00:00Z`);
	if (Number.isNaN(parsed.valueOf())) {
		throw new Error(`Invalid ${label}: ${raw}`);
	}
	return raw;
}

function parseStatus(markdown) {
	const match = markdown.match(/^Status:\s*(PASS|FAIL)\s*$/imu);
	return match ? match[1] : "UNKNOWN";
}

function parseDecision(markdown) {
	const match = markdown.match(/^Decision:\s*([A-Z_]+)\s*$/imu);
	return match ? match[1] : "UNKNOWN";
}

function parseBoolean(value, fallback = false) {
	const raw = String(value || "")
		.trim()
		.toLowerCase();
	if (!raw) return fallback;
	if (["1", "true", "yes", "on"].includes(raw)) return true;
	if (["0", "false", "no", "off"].includes(raw)) return false;
	return fallback;
}

function resolveInputPath(inputArg) {
	if (inputArg) return path.resolve(process.cwd(), inputArg);
	const today = new Date().toISOString().slice(0, 10);
	return path.resolve(process.cwd(), "docs", "reports", `m13_closeout_inputs_${today}.json`);
}

async function readMarkdownReportMetadata(reportsDir, reportName) {
	if (!reportName) {
		return {
			reportName: "",
			status: "MISSING",
			decision: "MISSING",
		};
	}
	const reportPath = path.resolve(reportsDir, reportName);
	const raw = await fs.readFile(reportPath, "utf8");
	return {
		reportName,
		status: parseStatus(raw),
		decision: parseDecision(raw),
	};
}

function normalizeOwners(rawOwners) {
	if (!Array.isArray(rawOwners)) return [];
	return rawOwners.map((owner, index) => ({
		area: String(owner?.area || "").trim() || `Area-${index + 1}`,
		primary: String(owner?.primary || "").trim() || "unassigned",
		secondary: String(owner?.secondary || "").trim() || "unassigned",
		runbook: String(owner?.runbook || "").trim() || "missing",
	}));
}

function normalizeBacklog(rawBacklog) {
	if (!Array.isArray(rawBacklog)) return [];
	return rawBacklog.map((item, index) => ({
		id: String(item?.id || "").trim() || `P5-${String(index + 1).padStart(3, "0")}`,
		title: String(item?.title || "").trim() || "Untitled item",
		owner: String(item?.owner || "").trim() || "unassigned",
		priority: String(item?.priority || "").trim().toUpperCase() || "MEDIUM",
		targetWindow: String(item?.targetWindow || "").trim() || "TBD",
	}));
}

function evaluate(payload, handoff) {
	const releaseId = String(payload?.releaseId || "").trim() || "ga-release-unknown";
	const launchDate = normalizeIsoDate(
		payload?.launchDate || new Date().toISOString().slice(0, 10),
		"launchDate",
	);
	const owners = normalizeOwners(payload?.owners);
	const backlog = normalizeBacklog(payload?.phase5Backlog);
	const postLaunchReviewScheduled = parseBoolean(payload?.postLaunchReviewScheduled, false);

	const reasons = [];
	if (handoff.status !== "PASS") {
		reasons.push("GA handoff package is not PASS.");
	}
	if (handoff.decision !== "READY_FOR_GA") {
		reasons.push("GA handoff decision is not READY_FOR_GA.");
	}
	if (owners.length < 4) {
		reasons.push("Owner roster must include at least 4 operating areas.");
	}
	const ownerGaps = owners.filter(
		(owner) =>
			owner.primary === "unassigned" ||
			owner.secondary === "unassigned" ||
			owner.runbook === "missing",
	);
	if (ownerGaps.length > 0) {
		reasons.push(`Found ${ownerGaps.length} owner/runbook assignment gap(s).`);
	}
	if (backlog.length === 0) {
		reasons.push("Phase 5 backlog triage list is empty.");
	}
	if (!postLaunchReviewScheduled) {
		reasons.push("Post-launch review is not scheduled.");
	}

	return {
		releaseId,
		launchDate,
		owners,
		backlog,
		postLaunchReviewScheduled,
		status: reasons.length === 0 ? "PASS" : "FAIL",
		decision: reasons.length === 0 ? "COMPLETE" : "HOLD",
		reasons,
	};
}

function buildDossierMarkdown({ inputPath, handoff, evaluation, reportDate }) {
	const ownerRows = evaluation.owners
		.map(
			(owner) =>
				`| ${owner.area} | ${owner.primary} | ${owner.secondary} | ${owner.runbook} |`,
		)
		.join("\n");
	const backlogRows = evaluation.backlog
		.map(
			(item) =>
				`| ${item.id} | ${item.title} | ${item.owner} | ${item.priority} | ${item.targetWindow} |`,
		)
		.join("\n");

	return `# M13 Phase Closeout Dossier (${reportDate})

Status: ${evaluation.status}  
Decision: ${evaluation.decision}  
Generated: ${new Date().toISOString()}

## Release Context

- Release ID: \`${evaluation.releaseId}\`
- Launch date: \`${evaluation.launchDate}\`
- Source input: \`${path.relative(process.cwd(), inputPath)}\`
- Linked GA handoff: \`${handoff.reportName || "missing"}\`
- GA handoff status: \`${handoff.status}\` / \`${handoff.decision}\`

## Operating Ownership

| Area | Primary | Secondary | Runbook |
|------|---------|-----------|---------|
${ownerRows || "| _(none)_ | n/a | n/a | n/a |"}

## Phase 5 Backlog Triage

| ID | Item | Owner | Priority | Target Window |
|----|------|-------|----------|---------------|
${backlogRows || "| _(none)_ | n/a | n/a | n/a | n/a |"}

## Operational Readiness

- Post-launch review scheduled: \`${evaluation.postLaunchReviewScheduled ? "yes" : "no"}\`

## Closeout Notes

${
	evaluation.reasons.length === 0
		? "- Phase closeout dossier is complete for M13 handoff."
		: evaluation.reasons.map((reason) => `- ${reason}`).join("\n")
}
`;
}

async function main() {
	const options = parseArgs(process.argv.slice(2));
	const inputPath = resolveInputPath(options.input);
	const raw = await fs.readFile(inputPath, "utf8");
	const payload = JSON.parse(raw);

	const reportsDir = path.resolve(process.cwd(), "docs", "reports");
	const handoffReportName = String(payload?.gaHandoffReport || "").trim();
	const handoff = await readMarkdownReportMetadata(reportsDir, handoffReportName);
	const evaluation = evaluate(payload, handoff);
	const reportDate = new Date().toISOString().slice(0, 10);
	const dossierName = `m13_phase_closeout_dossier_${reportDate}.md`;
	const dossierPath = path.resolve(reportsDir, dossierName);

	await fs.mkdir(path.dirname(dossierPath), { recursive: true });
	await fs.writeFile(
		dossierPath,
		buildDossierMarkdown({ inputPath, handoff, evaluation, reportDate }),
		"utf8",
	);

	console.log(
		`[m13-closeout-dossier] ${evaluation.status} decision=${evaluation.decision} report=${path.relative(
			process.cwd(),
			dossierPath,
		)}`,
	);
	if (evaluation.status !== "PASS") {
		process.exitCode = 1;
	}
}

main().catch((error) => {
	console.error(error);
	process.exitCode = 1;
});
