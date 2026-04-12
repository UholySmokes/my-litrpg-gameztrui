import { deriveAdventureOnboardingTier } from "../../core/creationOnboarding.js";
import { isDevourerCorePlayer } from "../../systems/archetype/devourerCore.js";

export function isDevourerCoreRoomAvailable({ state, player, quests } = {}) {
  return (
    isDevourerCorePlayer(player) &&
    deriveAdventureOnboardingTier({ state, player, quests }) >= 3
  );
}
