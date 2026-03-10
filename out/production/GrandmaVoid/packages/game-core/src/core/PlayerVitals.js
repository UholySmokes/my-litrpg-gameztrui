import { getEffectiveAttributes } from "./titleLogic.js";
import { calculateMaxHp, calculateMaxMana } from "../utils/AttributeMath.js";
import { isPlainObject, toNumber, clamp } from "../utils/shared.js";

export const updatePlayerVitals = (player, config, attributesOverride) => {
  const effectiveAttributes = getEffectiveAttributes(
    player,
    config,
    attributesOverride,
  );
  const nextHpMax = calculateMaxHp(effectiveAttributes);
  const nextManaMax = calculateMaxMana(effectiveAttributes);

  const rawHp = player?.hp;
  const hp = isPlainObject(rawHp)
      ? rawHp
      : { current: toNumber(rawHp, nextHpMax), max: nextHpMax };
  const rawMana = player?.mana;
  const mana = isPlainObject(rawMana)
      ? rawMana
      : { current: toNumber(rawMana, nextManaMax), max: nextManaMax };

  return {
    ...player,
    hp: {
      ...hp,
      max: nextHpMax,
      current: clamp(toNumber(hp.current, nextHpMax), 0, nextHpMax),
    },
    mana: {
      ...mana,
      max: nextManaMax,
      current: clamp(toNumber(mana.current, nextManaMax), 0, nextManaMax),
    },
  };
};
