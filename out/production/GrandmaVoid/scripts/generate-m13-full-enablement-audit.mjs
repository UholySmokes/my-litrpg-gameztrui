import fs from "node:fs/promises";
import path from "node:path";
import process from "node:process";

function normalizeString(value) {
	return String(value || "").trim();
}

function normalizeMode(value, fallback = "off") {
	const normalized = normalizeString(value).toLowerCase();
	if (["off", "monitor", "enforce"].includes(normalized)) {
		return normalized;
	}
	return fallback;
}

function parsePercentage(value) {
	const raw = normalizeString(value);
	if (!raw) return null;
	const parsed = Number(raw);
	if (!Number.isFinite(parsed)) return null;
	return Math.max(0, Math.min(100, Math.floor(parsed)));
}

function evaluateEnablement() {
	const rolloutStage =
		normalizeString(process.env.RUNTIME_ROLLOUT_STAGE || process.env.ROLLOUT_STAGE) ||
		"unknown";
	const canaryMode = normalizeMode(process.env.INTERNAL_CANARY_MODE, "off");
	const limitedMode = normalizeMode(process.env.LIMITED_ROLLOUT_MODE, "off");
	const limitedPercentage = parsePercentage(
		process.env.LIMITED_ROLLOUT_PERCENTAGE || process.env.ROLLOUT_PERCENTAGE,
	);

	const reasons = [];
	const stageLower = rolloutStage.toLowerCase();
	if (["m11_canary", "m12_limited", "m12_percentage"].includes(stageLower)) {
		reasons.push(`Rollout stage is still "${rolloutStage}" (pre-GA stage).`);
	}

	if (canaryMode === "enforce") {
		reasons.push("INTERNAL_CANARY_MODE is enforce; canary gate is still active.");
	}

	if (limitedMode === "enforce") {
		if (limitedPercentage !== 100) {
			reasons.push(
				`LIMITED_ROLLOUT_MODE is enforce with percentage ${limitedPercentage ?? "unset"}; expected 100 for full enablement.`,
			);
		}
	}

	if (limitedMode === "monitor") {
		reasons.push("LIMITED_ROLLOUT_MODE is monitor; full enablement should run with mode off.");
	}

	return {
		rolloutStage,
		canaryMode,
		limitedMode,
		limitedPercentage,
		status: reasons.length === 0 ? "PASS" : "FAIL",
		decision: reasons.length === 0 ? "FULLY_ENABLED" : "HOLD",
		reasons,
	};
}

function buildAuditReport(reportDate, evaluation) {
	return `# M13 Full Enablement Audit (${reportDate})

Status: ${evaluation.status}  
Decision: ${evaluation.decision}  
Generated: ${new Date().toISOString()}

## Environment Snapshot

- RUNTIME_ROLLOUT_STAGE / ROLLOUT_STAGE: \`${evaluation.rolloutStage}\`
- INTERNAL_CANARY_MODE: \`${evaluation.canaryMode}\`
- LIMITED_ROLLOUT_MODE: \`${evaluation.limitedMode}\`
- LIMITED_ROLLOUT_PERCENTAGE / ROLLOUT_PERCENTAGE: \`${evaluation.limitedPercentage ?? "unset"}\`

## Validation Rules

- Internal canary enforce mode must be disabled for GA.
- Limited rollout mode must be off, or enforce with 100%.
- Stage label must not remain on M11/M12 stages.

## Decision Notes

${
	evaluation.reasons.length === 0
		? "- Runtime configuration is compatible with 100% enablement."
		: evaluation.reasons.map((reason) => `- ${reason}`).join("\n")
}
`;
}

async function main() {
	const reportDate = new Date().toISOString().slice(0, 10);
	const evaluation = evaluateEnablement();
	const reportsDir = path.resolve(process.cwd(), "docs", "reports");
	const reportName = `m13_full_enablement_audit_${reportDate}.md`;
	const reportPath = path.resolve(reportsDir, reportName);
	await fs.mkdir(reportsDir, { recursive: true });
	await fs.writeFile(reportPath, buildAuditReport(reportDate, evaluation), "utf8");

	console.log(
		`[m13-full-enablement] ${evaluation.status} decision=${evaluation.decision} report=${path.relative(
			process.cwd(),
			reportPath,
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
