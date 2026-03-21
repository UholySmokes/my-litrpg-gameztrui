const crypto = require("crypto");
const { json, readJsonBody } = require("./http");
const { getUserFromRequest } = require("./auth");
const {
	listSaves,
	getSave,
	createSave,
	updateSave,
	deleteSave,
} = require("./saves-store");
const {
  computeSaveStateHash,
  extractExpectedStateHash,
} = require("./save-versioning");
const { enforceProgressReset, resetLegacyProgress } = require("./save-reset.cjs");

const MAX_SAVE_NAME_LENGTH = 80;
const MAX_SAVES_RETURNED = 50;
const GUID_REGEX = /^[0-9a-fA-F-]{36}$/;

function safeJsonParse(value) {
	if (typeof value !== "string") return value;
	try {
		return JSON.parse(value);
	} catch {
		return value;
	}
}

function normalizeSaveName(value) {
	const trimmed = typeof value === "string" ? value.trim() : "";
	const base = trimmed || "Auto Save";
	return base.slice(0, MAX_SAVE_NAME_LENGTH);
}

function isRecord(value) {
	return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function hasRequiredGameStateShape(gameState) {
	if (!isRecord(gameState)) return false;
	return isRecord(gameState.player) && isRecord(gameState.world);
}

function normalizeGameState(value) {
	if (value === null || value === undefined) return null;
	const parsed = safeJsonParse(value);
	if (!hasRequiredGameStateShape(parsed)) return null;
	try {
		return JSON.stringify(parsed);
	} catch {
		return null;
	}
}

function isGuid(value) {
	return GUID_REGEX.test(String(value || ""));
}

function buildSaveConflict(row, expectedStateHash) {
  return {
    saveId: row?.id || null,
    expectedStateHash: expectedStateHash || null,
    currentStateHash: row?.state_hash || null,
    updatedAt: row?.updated_at || null,
  };
}

async function handleResetLegacyRequest(req, res) {
	try {
		const user = await getUserFromRequest(req);
		if (!user) {
			return json(res, 401, {
				ok: false,
				errorCode: "UNAUTHENTICATED",
				message: "Sign in required.",
			});
		}

		if (String(req?.method || "GET").toUpperCase() !== "POST") {
			return json(res, 405, {
				ok: false,
				errorCode: "METHOD_NOT_ALLOWED",
				message: "Use POST to reset legacy progress.",
			});
		}

		const result = await resetLegacyProgress({
			ownerId: user.id,
			displayName: user.displayName || user.email || "Traveler",
		});

		return json(res, 200, {
			ok: true,
			migrationVersion: result.migrationVersion,
			deletedSaveCount: result.saveResult?.deletedSaveCount || 0,
			deletedRunCount: result.syncResult?.deletedRunCount || 0,
			deletedEventCount: result.syncResult?.deletedEventCount || 0,
		});
	} catch (error) {
		return json(res, 500, {
			ok: false,
			errorCode: "RESET_FAILED",
			message: String(error?.message || error || "Reset failed."),
		});
	}
}

async function handleSavesRequest(req, res, { saveId = "" } = {}) {
	try {
		const user = await getUserFromRequest(req);
		if (!user) {
			return json(res, 401, {
				ok: false,
				errorCode: "UNAUTHENTICATED",
				message: "Sign in required.",
			});
		}

		const gate = await enforceProgressReset(res, { ownerId: user.id });
		if (!gate.ok) return;

		const method = String(req?.method || "GET").toUpperCase();
		const normalizedSaveId = String(saveId || "").trim();
		const now = new Date().toISOString();

		if (method === "GET" && !normalizedSaveId) {
			const saves = await listSaves({
				userId: user.id,
				limit: MAX_SAVES_RETURNED,
			});
			return json(res, 200, {
				ok: true,
				saves: Array.isArray(saves) ? saves : [],
			});
		}

		if (method === "GET" && normalizedSaveId) {
			if (!isGuid(normalizedSaveId)) {
				return json(res, 400, {
					ok: false,
					errorCode: "INVALID_SAVE_ID",
					message: "Invalid save id.",
				});
			}

			const row = await getSave({
				userId: user.id,
				saveId: normalizedSaveId,
			});
			if (!row) {
				return json(res, 404, {
					ok: false,
					errorCode: "SAVE_NOT_FOUND",
					message: "Save not found.",
				});
			}

			return json(res, 200, {
				ok: true,
				save: {
					id: row.id,
					save_name: row.save_name,
					game_state: safeJsonParse(row.game_state),
					state_hash: row.state_hash,
					created_at: row.created_at,
					updated_at: row.updated_at,
				},
			});
		}

		if (method === "POST") {
			const body = await readJsonBody(req);
			const saveName = normalizeSaveName(body?.saveName || body?.save_name);
			const gameState = normalizeGameState(body?.gameState || body?.game_state);

			if (!gameState) {
				return json(res, 400, {
					ok: false,
					errorCode: "INVALID_GAME_STATE",
					message: "gameState must include player and world objects.",
				});
			}

			const id = crypto.randomUUID();
			const row = await createSave({
				saveId: id,
				userId: user.id,
				saveName,
				gameState,
				now,
			});

			return json(res, 200, {
				ok: true,
				save: row
					? {
							id: row.id,
							save_name: row.save_name,
              state_hash:
                row.state_hash || computeSaveStateHash(gameState),
							created_at: row.created_at,
							updated_at: row.updated_at,
					  }
					: null,
			});
		}

		if (method === "PUT" && normalizedSaveId) {
			if (!isGuid(normalizedSaveId)) {
				return json(res, 400, {
					ok: false,
					errorCode: "INVALID_SAVE_ID",
					message: "Invalid save id.",
				});
			}

			const body = await readJsonBody(req);
			const saveName = normalizeSaveName(body?.saveName || body?.save_name);
			const gameState = normalizeGameState(body?.gameState || body?.game_state);
      const expectedStateHash = extractExpectedStateHash(body);

			if (!gameState) {
				return json(res, 400, {
					ok: false,
					errorCode: "INVALID_GAME_STATE",
					message: "gameState must include player and world objects.",
				});
			}

      if (!expectedStateHash) {
        return json(res, 400, {
          ok: false,
          errorCode: "MISSING_VERSION_TOKEN",
          message: "Updates must include expectedStateHash.",
        });
      }

      const existing = await getSave({
        userId: user.id,
        saveId: normalizedSaveId,
      });
      if (!existing) {
        return json(res, 404, {
          ok: false,
          errorCode: "SAVE_NOT_FOUND",
          message: "Save not found.",
        });
      }

      if (String(existing.state_hash || "") !== expectedStateHash) {
        return json(res, 409, {
          ok: false,
          errorCode: "SAVE_CONFLICT",
          message: "Save has changed since it was loaded.",
          conflict: buildSaveConflict(existing, expectedStateHash),
        });
      }

			const row = await updateSave({
				userId: user.id,
				saveId: normalizedSaveId,
				saveName,
				gameState,
				now,
			});
			if (!row) {
				return json(res, 404, {
					ok: false,
					errorCode: "SAVE_NOT_FOUND",
					message: "Save not found.",
				});
			}

			return json(res, 200, {
				ok: true,
				save: {
					id: row.id,
					save_name: row.save_name,
          state_hash: row.state_hash || computeSaveStateHash(gameState),
					created_at: row.created_at,
					updated_at: row.updated_at,
				},
			});
		}

		if (method === "DELETE" && normalizedSaveId) {
			if (!isGuid(normalizedSaveId)) {
				return json(res, 400, {
					ok: false,
					errorCode: "INVALID_SAVE_ID",
					message: "Invalid save id.",
				});
			}

			const removed = await deleteSave({
				userId: user.id,
				saveId: normalizedSaveId,
			});

			if (!removed) {
				return json(res, 404, {
					ok: false,
					errorCode: "SAVE_NOT_FOUND",
					message: "Save not found.",
				});
			}

			return json(res, 200, {
				ok: true,
			});
		}

		return json(res, 405, {
			ok: false,
			errorCode: "METHOD_NOT_ALLOWED",
			message: "Unsupported method.",
		});
	} catch (error) {
		return json(res, 500, {
			ok: false,
			errorCode: "UNEXPECTED_ERROR",
			message: String(error?.message || error || "Unknown error"),
		});
	}
}

module.exports = {
	handleSavesRequest,
	handleResetLegacyRequest,
};
