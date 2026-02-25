import fs from "node:fs/promises";
import path from "node:path";
import process from "node:process";

function parseSummaryRows(markdown) {
	const lines = markdown.split(/\r?\n/u);
	const rows = [];
	let inSummaryTable = false;
	for (const line of lines) {
		if (line.startsWith("| Check | Status | Exit code | Duration (ms) |")) {
			inSummaryTable = true;
			continue;
		}
		if (!inSummaryTable) continue;
		if (line.startsWith("|-------")) continue;
		if (!line.startsWith("|")) break;
		const cells = line
			.split("|")
			.map((cell) => cell.trim())
			.filter(Boolean);
		if (cells.length < 4) continue;
		rows.push({
			check: cells[0],
			status: cells[1],
			exitCode: cells[2],
			durationMs: cells[3],
		});
	}
	return rows;
}

function parseStatus(markdown) {
	const match = markdown.match(/^Status:\s*(PASS|FAIL)\s*$/imu);
	return match ? match[1] : "UNKNOWN";
}

function buildPacket({ packetDate, smokeReportName, rows, probeReportName, probeStatus }) {
	const failed = rows.filter((row) => row.status !== "PASS");
	const decision = failed.length === 0 && probeStatus === "PASS" ? "ADVANCE" : "HOLD";
	const summaryRows = rows.map(
		(row) => `| ${row.check} | ${row.status} | ${row.exitCode} | ${row.durationMs} |`,
	);
	const probeRow = `| Endpoint Probe Gate | ${probeStatus} | n/a | n/a |`;
	return `# M10 Staging Sign-off Packet (${packetDate})

Status: ${decision === "ADVANCE" ? "PASS" : "FAIL"}  
Decision: ${decision}  
Generated: ${new Date().toISOString()}

## Input Artifact

- Smoke report: \`docs/reports/${smokeReportName}\`
- Endpoint probe report: \`docs/reports/${probeReportName}\`

## Check Summary

| Check | Status | Exit code | Duration (ms) |
|-------|--------|-----------|---------------|
${summaryRows.join("\n")}
${probeRow}

## Decision Notes

- Failed checks: ${failed.length}
- Endpoint probe status: ${probeStatus}
- Required follow-up: ${
		failed.length === 0 && probeStatus === "PASS"
			? "None. Proceed with staging soak window sign-off review."
			: "Resolve failed checks and/or endpoint probe blocker, re-run soak smoke, regenerate this packet."
	}

## Sign-off

- Release Manager: \`<name/date>\`
- QA Lead: \`<name/date>\`
- Backend Lead: \`<name/date>\`
- DevOps/SRE: \`<name/date>\`
`;
}

async function main() {
	const packetDate = new Date().toISOString().slice(0, 10);
	const smokeReportName = `m10_staging_soak_smoke_${packetDate}.md`;
	const smokeReportPath = path.resolve(process.cwd(), "docs", "reports", smokeReportName);
	const smokeMarkdown = await fs.readFile(smokeReportPath, "utf8");
	const probeReportName = `m10_staging_endpoint_probe_${packetDate}.md`;
	const probeReportPath = path.resolve(process.cwd(), "docs", "reports", probeReportName);
	const probeMarkdown = await fs.readFile(probeReportPath, "utf8");
	const rows = parseSummaryRows(smokeMarkdown);
	if (rows.length === 0) {
		throw new Error(
			`Could not parse summary rows from ${path.relative(process.cwd(), smokeReportPath)}.`,
		);
	}
	const probeStatus = parseStatus(probeMarkdown);
	if (probeStatus === "UNKNOWN") {
		throw new Error(
			`Could not parse status from ${path.relative(process.cwd(), probeReportPath)}.`,
		);
	}

	const packetName = `m10_staging_signoff_packet_${packetDate}.md`;
	const packetPath = path.resolve(process.cwd(), "docs", "reports", packetName);
	await fs.mkdir(path.dirname(packetPath), { recursive: true });
	await fs.writeFile(
		packetPath,
		buildPacket({
			packetDate,
			smokeReportName,
			rows,
			probeReportName,
			probeStatus,
		}),
		"utf8",
	);
	console.log(
		`[staging-signoff] GENERATED decision=${
			rows.every((row) => row.status === "PASS") && probeStatus === "PASS"
				? "ADVANCE"
				: "HOLD"
		} packet=${path.relative(process.cwd(), packetPath)}`,
	);
}

main().catch((error) => {
	console.error(error);
	process.exitCode = 1;
});
