import fs from "node:fs/promises";
import path from "node:path";
import process from "node:process";

function parseArgs(argv) {
	const options = {
		releaseId: "",
		techLead: "",
		sre: "",
		pm: "",
		releaseManager: "",
	};
	for (let i = 0; i < argv.length; i += 1) {
		const arg = String(argv[i] || "").trim();
		const next = String(argv[i + 1] || "").trim();
		switch (arg) {
			case "--release-id":
				options.releaseId = next;
				i += 1;
				break;
			case "--tech-lead":
				options.techLead = next;
				i += 1;
				break;
			case "--sre":
				options.sre = next;
				i += 1;
				break;
			case "--pm":
				options.pm = next;
				i += 1;
				break;
			case "--release-manager":
				options.releaseManager = next;
				i += 1;
				break;
			default:
				break;
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

async function latestReport(prefix) {
	const reportsDir = path.resolve(process.cwd(), "docs", "reports");
	const files = await fs.readdir(reportsDir);
	const matches = files
		.filter((file) => file.startsWith(prefix) && file.endsWith(".md"))
		.sort((a, b) => a.localeCompare(b));
	return matches.length > 0 ? matches[matches.length - 1] : "";
}

async function reportMeta(reportName) {
	if (!reportName) {
		return { reportName: "", status: "MISSING", decision: "MISSING" };
	}
	const reportPath = path.resolve(process.cwd(), "docs", "reports", reportName);
	const raw = await fs.readFile(reportPath, "utf8");
	return {
		reportName,
		status: parseStatus(raw),
		decision: parseDecision(raw),
	};
}

function signerOrTbd(value) {
	const normalized = String(value || "").trim();
	return normalized || "TBD";
}

function buildRegister({ reportDate, releaseId, artifacts, signers }) {
	const artifactHealthy = artifacts.every((artifact) => artifact.status === "PASS");
	const signerMissing = Object.values(signers).some((value) => value === "TBD");
	const status = artifactHealthy && !signerMissing ? "PASS" : "FAIL";
	const decision = status === "PASS" ? "APPROVED" : "PENDING";

	const artifactRows = artifacts
		.map(
			(artifact) =>
				`| ${artifact.label} | \`${artifact.reportName || "missing"}\` | ${artifact.status} | ${artifact.decision} |`,
		)
		.join("\n");

	return `# M13 Sign-off Register (${reportDate})

Status: ${status}  
Decision: ${decision}  
Generated: ${new Date().toISOString()}

## Release

- Release ID: \`${releaseId}\`

## Artifact Readiness

| Artifact | File | Status | Decision |
|----------|------|--------|----------|
${artifactRows}

## Approvals

| Role | Signer |
|------|--------|
| Tech Lead | ${signers.techLead} |
| SRE | ${signers.sre} |
| PM | ${signers.pm} |
| Release Manager | ${signers.releaseManager} |

## Notes

${
	status === "PASS"
		? "- All required artifacts are PASS and all mandatory signers are recorded."
		: "- Missing artifact readiness and/or signer assignments. Update and regenerate."
}
`;
}

async function main() {
	const options = parseArgs(process.argv.slice(2));
	const reportDate = new Date().toISOString().slice(0, 10);
	const releaseId = options.releaseId || `ga-${reportDate}`;

	const handoff = await reportMeta(await latestReport("m13_ga_handoff_package_"));
	const closeout = await reportMeta(await latestReport("m13_phase_closeout_dossier_"));
	const playbook = await reportMeta(await latestReport("m13_post_launch_operating_playbook_"));
	const review = await reportMeta(await latestReport("m13_ga_review_notes_"));

	const artifacts = [
		{ label: "GA Handoff Package", ...handoff },
		{ label: "Phase Closeout Dossier", ...closeout },
		{ label: "Post-Launch Operating Playbook", ...playbook },
		{ label: "GA Review Notes", ...review },
	];

	const signers = {
		techLead: signerOrTbd(options.techLead),
		sre: signerOrTbd(options.sre),
		pm: signerOrTbd(options.pm),
		releaseManager: signerOrTbd(options.releaseManager),
	};

	const markdown = buildRegister({
		reportDate,
		releaseId,
		artifacts,
		signers,
	});

	const reportPath = path.resolve(
		process.cwd(),
		"docs",
		"reports",
		`m13_signoff_register_${reportDate}.md`,
	);
	await fs.mkdir(path.dirname(reportPath), { recursive: true });
	await fs.writeFile(reportPath, markdown, "utf8");

	const status = parseStatus(markdown);
	const decision = parseDecision(markdown);
	console.log(
		`[m13-signoff-register] ${status} decision=${decision} report=${path.relative(
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
