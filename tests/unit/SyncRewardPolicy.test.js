import { describe, expect, it } from "@jest/globals";
import { createRequire } from "module";

const require = createRequire(import.meta.url);
const rewardPolicy = require("../../functions/lib/sync-core/reward-policy.js");

describe("sync reward policy", () => {
	it("coalesces duplicated inventory entries during normalization", () => {
		expect(
			rewardPolicy.normalizeProgressionState({
				level: 1,
				xp: 12,
				gold: 3,
				inventory: [
					{ id: "field_bandage", quantity: 1 },
					{ id: "field_bandage", quantity: 2 },
					{ id: "", quantity: 10 },
				],
			}),
		).toEqual({
			level: 1,
			xp: 12,
			gold: 3,
			inventory: [{ id: "field_bandage", quantity: 3 }],
		});
	});

	it("applies encounter rewards and tutorial quest flags", () => {
		const nextState = {
			entityStates: {},
			questFlags: {},
			tick: 4,
		};

		const result = rewardPolicy.applyEncounterProgressionMutation({
			nextState,
			commit: { clientSeq: 5 },
			triggerDef: { id: "encounter_gate_training" },
			resolvedTargetId: "encounter_gate_training_01",
			roll: 88,
		});

		expect(result.outcome).toBe("victory");
		expect(nextState.entityStates.progression).toEqual({
			level: 1,
			xp: 40,
			gold: 12,
			inventory: [{ id: "training_emblem", quantity: 1 }],
		});
		expect(nextState.questFlags.quest_tutorial_combat_resolved).toBe(true);
		expect(nextState.entityStates.combat.encounterId).toBe("encounter_gate_training_01");
	});
});
