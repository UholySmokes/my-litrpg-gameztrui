const { json } = require("./http");
const savesStore = require("./saves-store");
const syncStore = require("./sync-store");
const saveCutover = require("../../shared/save-cutover.cjs");

const { SAVE_RESET_EPOCH } = saveCutover;

function normalizeVersion(value) {
	return Math.max(0, Number(value) || 0);
}

async function getProgressResetStatus({ ownerId }) {
	const migrationVersion = normalizeVersion(
		await syncStore.getMigrationVersion({ ownerId }),
	);
	return {
		migrationVersion,
		requiredMigrationVersion: SAVE_RESET_EPOCH,
		needsReset: migrationVersion < SAVE_RESET_EPOCH,
	};
}

function respondProgressResetRequired(res, status) {
	json(res, 409, {
		ok: false,
		errorCode: "PROGRESS_RESET_REQUIRED",
		message:
			"Legacy progress must be reset before cloud saves or sync can continue.",
		migrationVersion: status.migrationVersion,
		requiredMigrationVersion: status.requiredMigrationVersion,
	});
}

async function enforceProgressReset(res, { ownerId }) {
	const status = await getProgressResetStatus({ ownerId });
	if (!status.needsReset) {
		return {
			ok: true,
			...status,
		};
	}
	respondProgressResetRequired(res, status);
	return {
		ok: false,
		...status,
	};
}

async function resetLegacyProgress({ ownerId, displayName = "" }) {
	const saveResult = await savesStore.purgeUserProgress({ ownerId });
	const syncResult = await syncStore.purgeUserProgress({ ownerId });
	await syncStore.markMigrationVersion({
		ownerId,
		version: SAVE_RESET_EPOCH,
		displayName,
	});
	return {
		migrationVersion: SAVE_RESET_EPOCH,
		saveResult,
		syncResult,
	};
}

module.exports = {
	SAVE_RESET_EPOCH,
	enforceProgressReset,
	getProgressResetStatus,
	resetLegacyProgress,
	respondProgressResetRequired,
};
