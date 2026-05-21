import {describe, expect, it} from "@jest/globals";
import {
  MAGIC_SCHOOLS,
  normalizePhysicsMagicState,
  resolvePhysicsMagicCast,
} from "../../packages/game-core/src/systems/magic/PhysicsMagicEngine.js";

describe("PhysicsMagicEngine", () => {
  describe("normalizePhysicsMagicState", () => {
    it("normalizes empty state with defaults", () => {
      const result = normalizePhysicsMagicState({});
      expect(result.reservoirs.metabolic).toBe(60);
      expect(result.reservoirs.thermal).toBe(20);
      expect(result.reservoirs.kinetic).toBe(10);
      expect(result.reservoirs.potential).toBe(10);
      expect(result.entropyDebt).toBe(0);
      expect(result.strain).toBe(0);
      expect(result.turbulence).toBe(0);
      expect(result.topologyIntegrity).toBe(1);
      expect(result.resonanceAngle).toBe(0);
    });

    it("clamps reservoir values to valid range", () => {
      const result = normalizePhysicsMagicState({
        reservoirs: {
          metabolic: 2000,
          thermal: -10,
          kinetic: 500,
          potential: 0,
        },
      });
      expect(result.reservoirs.metabolic).toBe(1000);
      expect(result.reservoirs.thermal).toBe(0);
      expect(result.reservoirs.kinetic).toBe(500);
      expect(result.reservoirs.potential).toBe(0);
    });

    it("preserves valid state values", () => {
      const input = {
        reservoirs: {
          metabolic: 100,
          thermal: 50,
          kinetic: 30,
          potential: 20,
        },
        entropyDebt: 100,
        strain: 50,
        turbulence: 0.5,
        topologyIntegrity: 0.8,
        resonanceAngle: 90,
      };
      const result = normalizePhysicsMagicState(input);
      expect(result.reservoirs.metabolic).toBe(100);
      expect(result.reservoirs.thermal).toBe(50);
      expect(result.reservoirs.kinetic).toBe(30);
      expect(result.reservoirs.potential).toBe(20);
      expect(result.entropyDebt).toBe(100);
      expect(result.strain).toBe(50);
      expect(result.turbulence).toBe(0.5);
      expect(result.topologyIntegrity).toBe(0.8);
      expect(result.resonanceAngle).toBe(90);
    });
  });

  describe("resolvePhysicsMagicCast", () => {
    it("rejects cast with insufficient energy", () => {
      const state = normalizePhysicsMagicState({
        reservoirs: {
          metabolic: 2,
          thermal: 2,
          kinetic: 2,
          potential: 2,
        },
      });
      const result = resolvePhysicsMagicCast(state, {
        school: "thermomancy",
        scale: 1,
      });
      expect(result.ok).toBe(false);
      expect(result.reason).toContain("Insufficient conserved energy");
    });

    it("accepts cast with sufficient energy", () => {
      const state = normalizePhysicsMagicState({
        reservoirs: {
          metabolic: 100,
          thermal: 50,
          kinetic: 30,
          potential: 20,
        },
      });
      const result = resolvePhysicsMagicCast(state, {
        school: "thermomancy",
        scale: 1,
      });
      expect(result.ok).toBe(true);
      expect(result.school).toBe("thermomancy");
      expect(result.requiredEnergy).toBeGreaterThan(0);
      expect(result.nextState).toBeDefined();
    });

    it("uses config values when available", () => {
      const state = normalizePhysicsMagicState({
        reservoirs: {
          metabolic: 100,
          thermal: 50,
          kinetic: 30,
          potential: 20,
        },
      });
      state.config = {
        magicBalance: {
          physicsMagic: {
            baseEnergyScale: 15,
            irreversibilityTax: 4.0,
          },
        },
      };
      const result = resolvePhysicsMagicCast(state, {
        school: "thermomancy",
        scale: 1,
        reversesEntropy: true,
      });
      expect(result.ok).toBe(true);
      // With custom config, base energy should be 15 * 1 = 15
      // With irreversibilityTax of 4.0, required energy should be higher than default
      expect(result.requiredEnergy).toBeGreaterThan(12 * 3.2);
    });

    it("falls back to defaults when config is missing", () => {
      const state = normalizePhysicsMagicState({
        reservoirs: {
          metabolic: 100,
          thermal: 50,
          kinetic: 30,
          potential: 20,
        },
        resonanceAngle: 60,
      });
      const result = resolvePhysicsMagicCast(state, {
        school: "thermomancy",
        scale: 1,
      });
      expect(result.ok).toBe(true);
      // Default baseEnergyScale is 12, scale is 1, so baseEnergy = 12
      // With resonance boost at optimal angle (60), efficiency is ~1.15
      // So requiredEnergy = 12 / 1.15 ≈ 10.43, but with taxes it's higher
      expect(result.requiredEnergy).toBeGreaterThan(10);
      expect(result.requiredEnergy).toBeLessThan(20);
    });

    it("applies entropy debt multiplier correctly", () => {
      const state = normalizePhysicsMagicState({
        reservoirs: {
          metabolic: 100,
          thermal: 50,
          kinetic: 30,
          potential: 20,
        },
      });
      const normalResult = resolvePhysicsMagicCast(state, {
        school: "thermomancy",
        scale: 1,
        reversesEntropy: false,
      });
      const reverseResult = resolvePhysicsMagicCast(state, {
        school: "thermomancy",
        scale: 1,
        reversesEntropy: true,
      });
      expect(normalResult.nextState.entropyDebt).toBeLessThan(
        reverseResult.nextState.entropyDebt,
      );
    });

    it("increases strain based on energy cost", () => {
      const state = normalizePhysicsMagicState({
        reservoirs: {
          metabolic: 100,
          thermal: 50,
          kinetic: 30,
          potential: 20,
        },
        strain: 10,
      });
      const result = resolvePhysicsMagicCast(state, {
        school: "thermomancy",
        scale: 1,
      });
      expect(result.ok).toBe(true);
      expect(result.nextState.strain).toBeGreaterThan(10);
    });

    it("applies turbulence penalty for fluidmancy", () => {
      const state = normalizePhysicsMagicState({
        reservoirs: {
          metabolic: 100,
          thermal: 50,
          kinetic: 30,
          potential: 20,
        },
        turbulence: 0.5,
        resonanceAngle: 60,
      });
      const fluidmancyResult = resolvePhysicsMagicCast(state, {
        school: "fluidmancy",
        scale: 1,
      });
      const thermomancyResult = resolvePhysicsMagicCast(state, {
        school: "thermomancy",
        scale: 1,
      });
      // Fluidmancy should have lower efficiency due to turbulence penalty
      expect(fluidmancyResult.efficiency).toBeLessThan(thermomancyResult.efficiency);
    });

    it("applies topology penalty for topomancy", () => {
      const state = normalizePhysicsMagicState({
        reservoirs: {
          metabolic: 100,
          thermal: 50,
          kinetic: 30,
          potential: 20,
        },
        topologyIntegrity: 0.3,
        resonanceAngle: 60,
      });
      const topomancyResult = resolvePhysicsMagicCast(state, {
        school: "topomancy",
        scale: 1,
      });
      const thermomancyResult = resolvePhysicsMagicCast(state, {
        school: "thermomancy",
        scale: 1,
      });
      // Topomancy should have lower efficiency due to topology penalty
      expect(topomancyResult.efficiency).toBeLessThan(thermomancyResult.efficiency);
    });

    it("calculates stability risk correctly", () => {
      const state = normalizePhysicsMagicState({
        reservoirs: {
          metabolic: 100,
          thermal: 50,
          kinetic: 30,
          potential: 20,
        },
        strain: 50,
        turbulence: 0.5,
        topologyIntegrity: 0.5,
      });
      const result = resolvePhysicsMagicCast(state, {
        school: "thermomancy",
        scale: 1,
      });
      expect(result.ok).toBe(true);
      expect(result.stabilityRisk).toBeGreaterThan(0);
      expect(result.stabilityRisk).toBeLessThanOrEqual(2);
    });

    it("distributes energy drain across reservoirs", () => {
      const state = normalizePhysicsMagicState({
        reservoirs: {
          metabolic: 100,
          thermal: 50,
          kinetic: 30,
          potential: 20,
        },
      });
      const result = resolvePhysicsMagicCast(state, {
        school: "thermomancy",
        scale: 1,
      });
      expect(result.ok).toBe(true);
      const {reservoirs} = result.nextState;
      // All reservoirs should be reduced
      expect(reservoirs.metabolic).toBeLessThan(100);
      expect(reservoirs.thermal).toBeLessThan(50);
      // Kinetic and potential may or may not be reduced depending on distribution
      expect(reservoirs.metabolic + reservoirs.thermal + reservoirs.kinetic + reservoirs.potential)
        .toBeLessThan(200);
    });

    it("uses config for reservoir distribution", () => {
      const state = normalizePhysicsMagicState({
        reservoirs: {
          metabolic: 100,
          thermal: 100,
          kinetic: 100,
          potential: 100,
        },
      });
      state.config = {
        magicBalance: {
          physicsMagic: {
            reservoirDistribution: {
              metabolic: 0.8,
              thermal: 0.1,
              kinetic: 0.05,
              potential: 0.05,
            },
          },
        },
      };
      const result = resolvePhysicsMagicCast(state, {
        school: "thermomancy",
        scale: 1,
      });
      expect(result.ok).toBe(true);
      const {reservoirs} = result.nextState;
      // With custom distribution, metabolic should take most of the energy
      const metabolicDrain = 100 - reservoirs.metabolic;
      const thermalDrain = 100 - reservoirs.thermal;
      expect(metabolicDrain).toBeGreaterThan(thermalDrain);
    });
  });

  describe("MAGIC_SCHOOLS", () => {
    it("contains all expected schools", () => {
      expect(MAGIC_SCHOOLS.thermomancy).toBeDefined();
      expect(MAGIC_SCHOOLS.topomancy).toBeDefined();
      expect(MAGIC_SCHOOLS.graviturgy).toBeDefined();
      expect(MAGIC_SCHOOLS.plasmaturgy).toBeDefined();
      expect(MAGIC_SCHOOLS.fluidmancy).toBeDefined();
      expect(MAGIC_SCHOOLS.quantum_arts).toBeDefined();
    });

    it("each school has required properties", () => {
      Object.values(MAGIC_SCHOOLS).forEach((school) => {
        expect(school.domain).toBeDefined();
        expect(school.powerSource).toBeDefined();
        expect(school.keyConstraint).toBeDefined();
      });
    });
  });
});
