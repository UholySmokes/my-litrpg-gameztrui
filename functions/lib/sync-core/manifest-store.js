const fs = require("fs");
const path = require("path");
const { stableJsonStringify, sha256Hex } = require("./deterministic");
const { isRecord, normalizeString, toFiniteNumber, toInteger } = require("./shared");

const DEFAULT_MANIFEST_PATH = path.resolve(__dirname, "..", "sync-world-manifest.v1.json");

let manifestCache = null;

function getManifestPath() {
	const configured = normalizeString(process.env.SYNC_WORLD_MANIFEST_PATH);
	if (!configured) return DEFAULT_MANIFEST_PATH;
	if (path.isAbsolute(configured)) return configured;
	return path.resolve(__dirname, "..", "..", configured);
}

function normalizeTriggerDefinition(triggerId, value) {
	const def = isRecord(value) ? value : {};
	return {
		id: triggerId,
		type: normalizeString(def.type),
		mapId: normalizeString(def.mapId),
		x: toInteger(def.x),
		y: toInteger(def.y),
		targetId: normalizeString(def.targetId),
		targetKind: normalizeString(def.targetKind),
		cooldownMs: Number.isFinite(toFiniteNumber(def.cooldownMs))
			? Math.max(0, Math.floor(toFiniteNumber(def.cooldownMs)))
			: 0,
		prereqFlags: isRecord(def.prereqFlags) ? { ...def.prereqFlags } : {},
		setQuestFlags: isRecord(def.setQuestFlags) ? { ...def.setQuestFlags } : {},
		transition: isRecord(def.transition)
			? {
					mapId: normalizeString(def.transition.mapId),
					x: toInteger(def.transition.x),
					y: toInteger(def.transition.y),
			  }
			: null,
	};
}

function normalizeMapDefinition(mapId, value) {
	const map = isRecord(value) ? value : {};
	const width = toInteger(map.width);
	const height = toInteger(map.height);
	const triggers = Array.isArray(map.triggers)
		? map.triggers.map((id) => normalizeString(id)).filter(Boolean)
		: [];
	return {
		id: mapId,
		width: Number.isFinite(width) ? width : 0,
		height: Number.isFinite(height) ? height : 0,
		triggers,
	};
}

function normalizeWorldManifest(rawValue) {
	const raw = isRecord(rawValue) ? rawValue : {};
	const mapsInput = isRecord(raw.maps) ? raw.maps : {};
	const triggersInput = isRecord(raw.triggers) ? raw.triggers : {};
	const npcsInput = isRecord(raw.npcs) ? raw.npcs : {};
	const objectsInput = isRecord(raw.objects) ? raw.objects : {};

	const maps = {};
	for (const mapId of Object.keys(mapsInput)) {
		maps[mapId] = normalizeMapDefinition(mapId, mapsInput[mapId]);
	}

	const triggers = {};
	for (const triggerId of Object.keys(triggersInput)) {
		triggers[triggerId] = normalizeTriggerDefinition(triggerId, triggersInput[triggerId]);
	}

	const npcs = {};
	for (const npcId of Object.keys(npcsInput)) {
		const npc = isRecord(npcsInput[npcId]) ? npcsInput[npcId] : {};
		npcs[npcId] = {
			id: npcId,
			mapId: normalizeString(npc.mapId),
			name: normalizeString(npc.name),
		};
	}

	const objects = {};
	for (const objectId of Object.keys(objectsInput)) {
		const objectDef = isRecord(objectsInput[objectId]) ? objectsInput[objectId] : {};
		objects[objectId] = {
			id: objectId,
			mapId: normalizeString(objectDef.mapId),
		};
	}

	const worldId = normalizeString(raw.worldId) || "voidverse_slice_world_001";
	const releaseId = normalizeString(raw.releaseId) || "slice-v1";
	const start = isRecord(raw.start)
		? {
				mapId: normalizeString(raw.start.mapId),
				x: Number.isFinite(toInteger(raw.start.x)) ? toInteger(raw.start.x) : 0,
				y: Number.isFinite(toInteger(raw.start.y)) ? toInteger(raw.start.y) : 0,
		  }
		: { mapId: "", x: 0, y: 0 };

	const fallbackMapId = Object.keys(maps)[0] || "";
	if (!start.mapId) {
		start.mapId = fallbackMapId;
	}

	const normalized = {
		worldId,
		releaseId,
		start,
		maps,
		npcs,
		objects,
		triggers,
	};

	const contentVersion = sha256Hex(stableJsonStringify(normalized));
	return {
		...normalized,
		contentVersion,
		triggerIdsByMap: Object.fromEntries(
			Object.values(maps).map((map) => [map.id, new Set(map.triggers)]),
		),
		approvedNpcIds: new Set(Object.keys(npcs)),
		approvedObjectIds: new Set(Object.keys(objects)),
	};
}

function loadWorldManifestFromDisk() {
	const manifestPath = getManifestPath();
	const raw = fs.readFileSync(manifestPath, "utf8");
	return normalizeWorldManifest(JSON.parse(raw));
}

function getWorldManifest() {
	if (!manifestCache) {
		manifestCache = loadWorldManifestFromDisk();
	}
	return manifestCache;
}

function clearWorldManifestCache() {
	manifestCache = null;
}

module.exports = {
	DEFAULT_MANIFEST_PATH,
	getManifestPath,
	normalizeTriggerDefinition,
	normalizeMapDefinition,
	normalizeWorldManifest,
	loadWorldManifestFromDisk,
	getWorldManifest,
	clearWorldManifestCache,
};
