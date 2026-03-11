const { isRecord, normalizeString, toNonNegativeInteger } = require("./shared");

const XP_PER_LEVEL = 100;
const ENCOUNTER_REWARD_TABLE = Object.freeze({
	victory: Object.freeze({
		xp: 40,
		gold: 12,
		itemId: "training_emblem",
		quantity: 1,
	}),
	setback: Object.freeze({
		xp: 20,
		gold: 4,
		itemId: "field_bandage",
		quantity: 1,
	}),
});

function createDefaultProgressionState() {
	return {
		level: 1,
		xp: 0,
		gold: 0,
		inventory: [],
	};
}

function normalizeProgressionState(input) {
	const source = isRecord(input) ? input : {};
	const level = Math.max(1, toNonNegativeInteger(source.level, 1));
	const xp = toNonNegativeInteger(source.xp, 0);
	const gold = toNonNegativeInteger(source.gold, 0);
	const inventoryMap = new Map();
	const inventoryInput = Array.isArray(source.inventory) ? source.inventory : [];
	for (const rawItem of inventoryInput) {
		if (!isRecord(rawItem)) continue;
		const itemId = normalizeString(rawItem.id);
		const quantity = toNonNegativeInteger(rawItem.quantity, 0);
		if (!itemId || quantity < 1) continue;
		inventoryMap.set(itemId, (inventoryMap.get(itemId) || 0) + quantity);
	}
	const inventory = Array.from(inventoryMap.entries())
		.sort(([a], [b]) => a.localeCompare(b))
		.map(([id, quantity]) => ({ id, quantity }));
	return {
		level,
		xp,
		gold,
		inventory,
	};
}

function withInventoryReward(inventory, { itemId, quantity }) {
	const normalizedItemId = normalizeString(itemId);
	const normalizedQty = toNonNegativeInteger(quantity, 0);
	if (!normalizedItemId || normalizedQty < 1) return inventory;
	const map = new Map(
		(Array.isArray(inventory) ? inventory : [])
			.filter((item) => isRecord(item) && normalizeString(item.id))
			.map((item) => [normalizeString(item.id), toNonNegativeInteger(item.quantity, 0)]),
	);
	map.set(normalizedItemId, (map.get(normalizedItemId) || 0) + normalizedQty);
	return Array.from(map.entries())
		.filter(([, qty]) => qty > 0)
		.sort(([a], [b]) => a.localeCompare(b))
		.map(([id, qty]) => ({ id, quantity: qty }));
}

function applyEncounterProgressionMutation({
	nextState,
	commit,
	triggerDef,
	resolvedTargetId,
	roll,
}) {
	const outcome = roll >= 50 ? "victory" : "setback";
	const reward = ENCOUNTER_REWARD_TABLE[outcome] || ENCOUNTER_REWARD_TABLE.setback;
	const progression = normalizeProgressionState(
		nextState.entityStates.progression || createDefaultProgressionState(),
	);

	progression.xp += reward.xp;
	progression.gold += reward.gold;
	progression.inventory = withInventoryReward(progression.inventory, {
		itemId: reward.itemId,
		quantity: reward.quantity,
	});

	const levelsGained = [];
	for (;;) {
		const levelThreshold = Math.max(1, progression.level) * XP_PER_LEVEL;
		if (progression.xp < levelThreshold) break;
		progression.xp -= levelThreshold;
		progression.level += 1;
		levelsGained.push(progression.level);
	}

	nextState.entityStates.progression = progression;
	nextState.entityStates.combat = {
		encounterId: resolvedTargetId || triggerDef.id,
		status: "resolved",
		outcome,
		roll,
		rewards: {
			xp: reward.xp,
			gold: reward.gold,
			itemId: reward.itemId,
			quantity: reward.quantity,
		},
		levelsGained,
		resolvedAtSeq: commit.clientSeq,
		resolvedAtTick: nextState.tick,
	};
	nextState.questFlags.quest_tutorial_combat_resolved = true;
	nextState.questFlags.quest_tutorial_combat_victory = outcome === "victory";
	nextState.questFlags.quest_tutorial_combat_setback = outcome === "setback";
	nextState.questFlags.quest_tutorial_loot_claimed = true;

	return {
		outcome,
		reward,
	};
}

module.exports = {
	XP_PER_LEVEL,
	ENCOUNTER_REWARD_TABLE,
	createDefaultProgressionState,
	normalizeProgressionState,
	withInventoryReward,
	applyEncounterProgressionMutation,
};
