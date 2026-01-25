/**
 * useSimulation - React hook for managing deterministic simulation
 *
 * This hook initializes the simulation bridge and provides utilities
 * for debugging, replay, and deterministic testing.
 */

import { useState, useCallback } from "react";
import {
  SimBridge,
  initializeSimulation,
  getSimulationStats,
  exportReplay,
} from "../simulation/bridge/SimulationBridge.js";

/**
 * Hook to manage simulation state
 */
export function useSimulation(enabled = false, seed = null) {
  const [stats, setStats] = useState(null);
  const [isInitialized, setIsInitialized] = useState(false);

  // Initialize simulation manually
  const initialize = useCallback(() => {
    if (!isInitialized && enabled) {
      const actualSeed = seed ?? SimBridge.now();
      initializeSimulation(actualSeed);
      setIsInitialized(true);
      console.log("[useSimulation] Initialized with seed:", actualSeed);
    }
  }, [enabled, seed, isInitialized]);

  const updateStats = () => {
    if (isInitialized) {
      setStats(getSimulationStats());
    }
  };

  const exportReplayData = () => {
    if (isInitialized) {
      return exportReplay();
    }
    return null;
  };

  const reset = () => {
    if (isInitialized) {
      SimBridge.reset();
      updateStats();
    }
  };

  return {
    isInitialized,
    stats,
    initialize,
    updateStats,
    exportReplayData,
    reset,
    simBridge: SimBridge,
  };
}

/**
 * Hook to enable simulation for development/testing
 */
export function useDevSimulation() {
  const isDev = import.meta.env.DEV;
  const [enabled, setEnabled] = useState(() => {
    return localStorage.getItem("dev_simulation_enabled") === "true";
  });
  const [seed, setSeed] = useState(() => {
    const storedSeed = localStorage.getItem("dev_simulation_seed");
    return storedSeed ? parseInt(storedSeed, 10) : null;
  });

  const toggleSimulation = (newSeed = null) => {
    const newEnabled = !enabled;
    setEnabled(newEnabled);
    localStorage.setItem("dev_simulation_enabled", newEnabled.toString());

    if (newSeed !== null) {
      setSeed(newSeed);
      localStorage.setItem("dev_simulation_seed", newSeed.toString());
    }
  };

  const simulation = useSimulation(enabled && isDev, seed);

  return {
    ...simulation,
    enabled: enabled && isDev,
    toggleSimulation,
    seed,
    setSeed: (newSeed) => {
      setSeed(newSeed);
      localStorage.setItem("dev_simulation_seed", newSeed.toString());
    },
  };
}
