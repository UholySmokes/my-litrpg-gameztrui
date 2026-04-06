function toSafeCount(value) {
  const normalized = Number(value);
  if (!Number.isFinite(normalized) || normalized <= 0) return 0;
  return Math.floor(normalized);
}

export function getPlayerProfile(value) {
  if (!value || typeof value !== "object" || Array.isArray(value)) return {};
  if (
    value.player_profile &&
    typeof value.player_profile === "object" &&
    !Array.isArray(value.player_profile)
  ) {
    return value.player_profile;
  }
  return value;
}

export function getCharactersCreated(value) {
  return toSafeCount(getPlayerProfile(value)?.characters_created);
}

export function incrementCharactersCreated(value) {
  const profile = getPlayerProfile(value);
  return {
    ...profile,
    characters_created: getCharactersCreated(profile) + 1,
  };
}

export function isAdvancedCreationUnlocked(_value) {
  return true;
}
