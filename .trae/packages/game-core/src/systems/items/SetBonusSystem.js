const normalizeItems = (items) =>
  Array.isArray(items) ? items.filter((item) => item && item.setAffix) : [];

const normalizeNumber = (value) => (Number.isFinite(value) ? value : 0);

export const getSetBonusBreakdown = (equipment = {}) => {
  const items = normalizeItems(Object.values(equipment));
  const sets = {};

  items.forEach((item) => {
    const setAffix = item.setAffix;
    if (!setAffix?.setName) return;
    if (!sets[setAffix.setName]) {
      sets[setAffix.setName] = { count: 0, bonuses: [] };
    }
    sets[setAffix.setName].count += 1;
    if (Array.isArray(setAffix.setBonus)) {
      sets[setAffix.setName].bonuses.push(...setAffix.setBonus);
    }
  });

  return sets;
};

export const getSetBonuses = (equipment = {}) => {
  const breakdown = getSetBonusBreakdown(equipment);
  const bonuses = {};

  Object.values(breakdown).forEach((setData) => {
    setData.bonuses.forEach((bonus) => {
      const required = normalizeNumber(bonus?.piecesRequired ?? bonus?.pieces);
      if (required <= 0 || setData.count < required) return;
      Object.entries(bonus?.bonus || {}).forEach(([key, value]) => {
        bonuses[key] = normalizeNumber(bonuses[key]) + normalizeNumber(value);
      });
    });
  });

  return bonuses;
};
