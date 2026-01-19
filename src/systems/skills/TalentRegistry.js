// =================================================================
// TALENT REGISTRY - Class-based talent system
//
// ⚠️ DEPRECATION NOTICE: This file uses class-based inheritance.
// The new component-based talent system is in TalentDefinitions.js
// New code should use TALENT_COMPONENTS and related functions from TalentDefinitions.js
// TalentManager.js now uses the component system first and falls back to this file.
// =================================================================

class BaseTalent {
  constructor(id, name, description = "") {
    this.id = id;
    this.name = name;
    this.description = description;
    this.type = "base";
  }

  calculateMagnitude(playerLevel) {
    void playerLevel;
    return {
      label: "Region-Scale",
      aoeRadius: 50,
      damageCap: 1000,
      description: "Local area influence",
    };
  }

  describeMagnitude(mag) {
    return `${mag.label} - ${mag.description}`;
  }

  getSystemDescription() {
    return `PROTOCOL: ${this.name.toUpperCase()}_INITIATED`;
  }
}

class DestructionTalent extends BaseTalent {
  constructor() {
    super("destruction", "Destruction", "Obliterate all existence");
    this.type = "destruction";
  }

  calculateMagnitude(playerLevel) {
    if (playerLevel >= 500)
      return {
        label: "Planet-Scale",
        aoeRadius: 10000,
        damageCap: 1000000,
        description: "Planetary annihilation capability",
      };
    if (playerLevel >= 100)
      return {
        label: "City-Scale",
        aoeRadius: 1000,
        damageCap: 100000,
        description: "City-wide destruction",
      };
    return {
      label: "Region-Scale",
      aoeRadius: 200,
      damageCap: 20000,
      description: "Regional devastation",
    };
  }

  getSystemDescription() {
    return "PROTOCOL: PLANETARY_ANNIHILATION_SEQUENCE_INITIATED";
  }
}

class CreationTalent extends BaseTalent {
  constructor() {
    super("creation", "Creation", "Forge reality from void");
    this.type = "creation";
  }

  calculateMagnitude(playerLevel) {
    if (playerLevel >= 500)
      return {
        label: "Planet-Scale",
        aoeRadius: 15000,
        damageCap: 500000,
        description: "World-forging capability",
      };
    if (playerLevel >= 100)
      return {
        label: "City-Scale",
        aoeRadius: 1500,
        damageCap: 50000,
        description: "Metropolis creation",
      };
    return {
      label: "Region-Scale",
      aoeRadius: 300,
      damageCap: 10000,
      description: "Regional terraforming",
    };
  }

  getSystemDescription() {
    return "PROTOCOL: REALITY_FORGING_MATRIX_ACTIVATED";
  }
}

class TimeTalent extends BaseTalent {
  constructor() {
    super("time", "Time Manipulation", "Control the temporal flow");
    this.type = "time";
  }

  calculateMagnitude(playerLevel) {
    if (playerLevel >= 500)
      return {
        label: "Planet-Scale",
        aoeRadius: 20000,
        damageCap: 750000,
        description: "Global temporal manipulation",
      };
    if (playerLevel >= 100)
      return {
        label: "City-Scale",
        aoeRadius: 2000,
        damageCap: 75000,
        description: "City-wide time control",
      };
    return {
      label: "Region-Scale",
      aoeRadius: 400,
      damageCap: 15000,
      description: "Local temporal distortion",
    };
  }

  getSystemDescription() {
    return "PROTOCOL: TEMPORAL_ANOMALY_GENERATOR_ONLINE";
  }
}

class SpaceTalent extends BaseTalent {
  constructor() {
    super("space", "Space Manipulation", "Bend the fabric of reality");
    this.type = "space";
  }

  calculateMagnitude(playerLevel) {
    if (playerLevel >= 500)
      return {
        label: "Planet-Scale",
        aoeRadius: 25000,
        damageCap: 800000,
        description: "Planetary spatial manipulation",
      };
    if (playerLevel >= 100)
      return {
        label: "City-Scale",
        aoeRadius: 2500,
        damageCap: 80000,
        description: "Urban spatial warping",
      };
    return {
      label: "Region-Scale",
      aoeRadius: 500,
      damageCap: 18000,
      description: "Regional space bending",
    };
  }

  getSystemDescription() {
    return "PROTOCOL: SPATIAL_DISTORTION_FIELD_ESTABLISHED";
  }
}

class InfinityTalent extends BaseTalent {
  constructor() {
    super("infinity", "Infinite Power", "Boundless energy manipulation");
    this.type = "infinity";
  }

  calculateMagnitude(playerLevel) {
    if (playerLevel >= 500)
      return {
        label: "Planet-Scale",
        aoeRadius: 30000,
        damageCap: 2000000,
        description: "Planetary energy supremacy",
      };
    if (playerLevel >= 100)
      return {
        label: "City-Scale",
        aoeRadius: 3000,
        damageCap: 200000,
        description: "Metropolitan energy dominance",
      };
    return {
      label: "Region-Scale",
      aoeRadius: 600,
      damageCap: 25000,
      description: "Regional energy mastery",
    };
  }

  getSystemDescription() {
    return "PROTOCOL: INFINITE_ENERGY_CONDUIT_ESTABLISHED";
  }
}

class VoidTalent extends BaseTalent {
  constructor() {
    super("void", "Void Manipulation", "Command the primordial nothingness");
    this.type = "void";
  }

  calculateMagnitude(playerLevel) {
    if (playerLevel >= 500)
      return {
        label: "Planet-Scale",
        aoeRadius: 35000,
        damageCap: 1500000,
        description: "Planetary void consumption",
      };
    if (playerLevel >= 100)
      return {
        label: "City-Scale",
        aoeRadius: 3500,
        damageCap: 150000,
        description: "Urban void manifestation",
      };
    return {
      label: "Region-Scale",
      aoeRadius: 700,
      damageCap: 30000,
      description: "Regional void erosion",
    };
  }

  getSystemDescription() {
    return "PROTOCOL: VOID_CONSUMPTION_PROTOCOL_ACTIVATED";
  }
}

class DivineTalent extends BaseTalent {
  constructor() {
    super("divine", "Divine Authority", "Exercise godlike dominion");
    this.type = "divine";
  }

  calculateMagnitude(playerLevel) {
    if (playerLevel >= 500)
      return {
        label: "Planet-Scale",
        aoeRadius: 40000,
        damageCap: 3000000,
        description: "Planetary divine supremacy",
      };
    if (playerLevel >= 100)
      return {
        label: "City-Scale",
        aoeRadius: 4000,
        damageCap: 300000,
        description: "Metropolitan divine authority",
      };
    return {
      label: "Region-Scale",
      aoeRadius: 800,
      damageCap: 40000,
      description: "Regional divine influence",
    };
  }

  getSystemDescription() {
    return "PROTOCOL: DIVINE_AUTHORITY_MATRIX_ESTABLISHED";
  }
}

class ChaosTalent extends BaseTalent {
  constructor() {
    super("chaos", "Chaos Manipulation", "Unleash primordial disorder");
    this.type = "chaos";
  }

  calculateMagnitude(playerLevel) {
    if (playerLevel >= 500)
      return {
        label: "Planet-Scale",
        aoeRadius: 45000,
        damageCap: 2500000,
        description: "Planetary chaos incursion",
      };
    if (playerLevel >= 100)
      return {
        label: "City-Scale",
        aoeRadius: 4500,
        damageCap: 250000,
        description: "Urban chaos manifestation",
      };
    return {
      label: "Region-Scale",
      aoeRadius: 900,
      damageCap: 50000,
      description: "Regional chaos distortion",
    };
  }

  getSystemDescription() {
    return "PROTOCOL: CHAOS_INCURSION_SEQUENCE_INITIATED";
  }
}

class OrderTalent extends BaseTalent {
  constructor() {
    super("order", "Order Enforcement", "Impose absolute law upon reality");
    this.type = "order";
  }

  calculateMagnitude(playerLevel) {
    if (playerLevel >= 500)
      return {
        label: "Planet-Scale",
        aoeRadius: 50000,
        damageCap: 2500000,
        description: "Planetary order enforcement",
      };
    if (playerLevel >= 100)
      return {
        label: "City-Scale",
        aoeRadius: 5000,
        damageCap: 250000,
        description: "Metropolitan law enforcement",
      };
    return {
      label: "Region-Scale",
      aoeRadius: 1000,
      damageCap: 60000,
      description: "Regional order imposition",
    };
  }

  getSystemDescription() {
    return "PROTOCOL: ABSOLUTE_LAW_ENFORCEMENT_ACTIVATED";
  }
}

function formatTalentName(id = "unknown_talent") {
  return id
    .split(/[-_\s]+/u)
    .filter(Boolean)
    .map((segment) => segment.charAt(0).toUpperCase() + segment.slice(1))
    .join(" ");
}

export function getTalentClassById(id) {
  const talentMap = {
    destruction: DestructionTalent,
    creation: CreationTalent,
    time: TimeTalent,
    space: SpaceTalent,
    infinity: InfinityTalent,
    void: VoidTalent,
    divine: DivineTalent,
    chaos: ChaosTalent,
    order: OrderTalent,
  };

  if (talentMap[id]) {
    const TalentClass = talentMap[id];
    return new TalentClass();
  }

  const fallbackName = formatTalentName(id);
  return new BaseTalent(
    id || "custom_talent",
    fallbackName,
    `Custom talent protocol for ${fallbackName}`,
  );
}

export function getAllTalentClasses() {
  return [
    DestructionTalent,
    CreationTalent,
    TimeTalent,
    SpaceTalent,
    InfinityTalent,
    VoidTalent,
    DivineTalent,
    ChaosTalent,
    OrderTalent,
  ];
}

export function getTalentByType(type) {
  const talentClasses = getAllTalentClasses();
  return (
    talentClasses.find((TalentClass) => new TalentClass().type === type) ||
    BaseTalent
  );
}
