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

function resolveInputPath(inputArg) {
	if (inputArg) return path.resolve(process.cwd(), inputArg);
	const today = new Date().toISOString().slice(0, 10);
	return path.resolve(process.cwd(), "docs", "reports", `m13_closeout_inputs_${today}.json`);
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

function parseStatus(markdown) {
	const match = markdown.match(/^Status:\s*(PASS|FAIL)\s*$/imu);
	return match ? match[1] : "UNKNOWN";
}

function parseDecision(markdown) {
	const match = markdown.match(/^Decision:\s*([A-Z_]+)\s*$/imu);
	return match ? match[1] : "UNKNOWN";
}

async function readCloseoutMetadata(reportName) {
	const reportsDir = path.resolve(process.cwd(), "docs", "reports");
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

function buildPlaybook({ inputPath, payload, owners, closeout }) {
	const releaseId = String(payload?.releaseId || "").trim() || "ga-release-unknown";
	const launchDate = normalizeIsoDate(
		payload?.launchDate || new Date().toISOString().slice(0, 10),
		"launchDate",
	);
	const ownerRows = owners
		.map(
			(owner) =>
				`| ${owner.area} | ${owner.primary} | ${owner.secondary} | ${owner.runbook} |`,
		)
		.join("\n");
	const status =
		closeout.status === "PASS" && closeout.decision === "COMPLETE" ? "PASS" : "FAIL";
	const decision = status === "PASS" ? "OPS_READY" : "HOLD";

	return {
		status,
		decision,
		markdown: `# M13 Post-Launch Operating Playbook (${launchDate})

Status: ${status}  
Decision: ${decision}  
Generated: ${new Date().toISOString()}

## Release

- Release ID: \`${releaseId}\`
- Launch date: \`${launchDate}\`
- Input: \`${path.relative(process.cwd(), inputPath)}\`
- Linked closeout dossier: \`${closeout.reportName || "missing"}\`
- Closeout status: \`${closeout.status}\` / \`${closeout.decision}\`

## Owner Roster

| Area | Primary | Secondary | Runbook |
|------|---------|-----------|---------|
${ownerRows || "| _(none)_ | n/a | n/a | n/a |"}

## Incident Operations

- Sev-1 target acknowledgment: \`<= 5 minutes\`
- Sev-2 target acknowledgment: \`<= 15 minutes\`
- Escalation chain: Primary -> Secondary -> Release Manager
- Rollback command: \`npm run test:rollback:parity\` and follow M12 rollback drill path

## Daily Operating Cadence (First 7 Days)

1. Run rollout/checklist evidence refresh.
2. Review telemetry and sync guardrail trends.
3. Confirm on-call handoff notes and open incidents.
4. Update Phase 5 backlog priorities by observed production issues.

## Sign-off

- Tech Lead: \`<name/date>\`
- SRE: \`<name/date>\`
- PM: \`<name/date>\`
`,
	};
}

async function main() {
	const options = parseArgs(process.argv.slice(2));
	const inputPath = resolveInputPath(options.input);
	const raw = await fs.readFile(inputPath, "utf8");
	const payload = JSON.parse(raw);
	const owners = normalizeOwners(payload?.owners);

	const closeoutReport = String(payload?.closeoutReport || "").trim();
	const closeout = await readCloseoutMetadata(closeoutReport);
	const playbook = buildPlaybook({ inputPath, payload, owners, closeout });

	const launchDate = normalizeIsoDate(
		payload?.launchDate || new Date().toISOString().slice(0, 10),
		"launchDate",
	);
	const reportName = `m13_post_launch_operating_playbook_${launchDate}.md`;
	const reportPath = path.resolve(process.cwd(), "docs", "reports", reportName);
	await fs.mkdir(path.dirname(reportPath), { recursive: true });
	await fs.writeFile(reportPath, playbook.markdown, "utf8");

	console.log(
		`[m13-operating-playbook] ${playbook.status} decision=${playbook.decision} report=${path.relative(
			process.cwd(),
			reportPath,
		)}`,
	);
	if (playbook.status !== "PASS") {
		process.exitCode = 1;
	}
}

main().catch((error) => {
	console.error(error);
	process.exitCode = 1;
});
