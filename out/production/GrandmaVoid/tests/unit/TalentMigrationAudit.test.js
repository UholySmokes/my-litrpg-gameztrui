import { describe, expect, it } from "@jest/globals";
import {
  getTalentMigrationAudit,
  getTalentMigrationLane,
  validateTalentMigrationAssignment,
} from "@voidverse/game-core/systems/skills/TalentMigrationAudit.js";
import { TalentDiagnostics } from "@voidverse/game-core/systems/skills/TalentManager.js";

describe("Talent migration audit", () => {
  it("routes absolute mana and immunity talents away from persistent modifiers", () => {
    expect(getTalentMigrationLane("mana_cost_zero")).toBe("direct_native_miracle");
    expect(getTalentMigrationLane("damage_immunity")).toBe("direct_native_miracle");

    const validation = validateTalentMigrationAssignment(
      "mana_cost_zero",
      "persistent_lattice_modifier",
    );

    expect(validation.valid).toBe(false);
    expect(validation.errors[0]).toContain("blacklisted from persistent_lattice_modifier");
  });

  it("routes contract-breaking talents into the external contract lane", () => {
    expect(getTalentMigrationLane("control_rng")).toBe("external_contract_only");
    expect(getTalentMigrationLane("remove_stat_cap")).toBe("external_contract_only");
  });

  it("keeps bounded identity talents in the persistent lattice lane", () => {
    expect(getTalentMigrationLane("arcane_focus")).toBe("persistent_lattice_modifier");
    expect(getTalentMigrationLane("stealth_mastery")).toBe("persistent_lattice_modifier");
  });

  it("exposes the migration audit through talent diagnostics", () => {
    const audit = getTalentMigrationAudit();
    const arcaneFocus = audit.find((entry) => entry.id === "arcane_focus");
    const rngControl = TalentDiagnostics.getTalentMigrationAudit().find(
      (entry) => entry.id === "control_rng",
    );

    expect(arcaneFocus?.valid).toBe(true);
    expect(arcaneFocus?.lane).toBe("persistent_lattice_modifier");
    expect(rngControl?.lane).toBe("external_contract_only");
  });
});
