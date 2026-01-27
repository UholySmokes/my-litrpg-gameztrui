// =================================================================
// ARCHETYPE SYSTEM REGISTRY
// LitRPG framework selection (Systems / Authorities / Privileges / Paths)
// =================================================================

export const ARCHETYPE_SYSTEMS = [
  {
    id: "revival_archive",
    name: "Revival Archive",
    category: "System",
    summary: "Death becomes data: each failure funds the next rise.",
    description:
      "A persistence framework that records fatal outcomes and converts them into resurrection credits and tactical insights.",
    coreLoop: [
      "Survive, die, and catalog causes of failure.",
      "Spend Echo Credits to revive with targeted safeguards.",
      "Unlock new revival clauses by clearing death-linked quests.",
    ],
    progression: [
      "Tiered revival clauses: retry -> rewind -> anchor.",
      "Archive entries unlock unique anti-boss counters.",
    ],
    narrativeHooks: [
      "Memory fragments bleed into narration after each revival.",
      "NPCs react to deja-vu patterns and altered fate.",
    ],
    questHooks: [
      "Recover lost archive nodes from dangerous zones.",
      "Defeat enemies using only revived-state bonuses.",
    ],
    tags: ["survival", "retry", "memory"],
  },
  {
    id: "fate_selection_engine",
    name: "Fate Selection Engine",
    category: "Framework",
    summary: "Choice-driven destiny rewrites with escalating stakes.",
    description:
      "A decision lattice that presents mutually exclusive fate routes, trading immediate power for long-term law changes.",
    coreLoop: [
      "Choose one of three fate clauses after milestones.",
      "Lock in one path, sealing rival futures.",
      "Stack fate clauses to rewrite regional rules.",
    ],
    progression: [
      "Unlock higher-tier clause pools through narrative alignment.",
      "Fate debt accrues if paths conflict.",
    ],
    narrativeHooks: [
      "System commentary reframes events around chosen fate.",
      "Prophets and seers become hostile or allied based on clauses.",
    ],
    questHooks: [
      "Resolve fate anomalies that appear after a clause choice.",
      "Defeat a rival fate-bearer to reclaim a locked clause.",
    ],
    tags: ["choice", "destiny", "law"],
  },
  {
    id: "dragon_blood_authority",
    name: "Dragon Blood Authority",
    category: "Authority",
    summary: "Primeval supremacy with flight, breath, and dominance laws.",
    description:
      "An authority matrix that awakens draconic lineage, granting rule-level presence over beasts and elemental pressure.",
    coreLoop: [
      "Gather draconic relics to unlock blood seals.",
      "Use dominance to command or intimidate high-tier creatures.",
      "Evolve breath and scale laws through conquest.",
    ],
    progression: [
      "Blood seals unlock flight, breath variations, and aura control.",
      "Authority expands with hoarded relic power.",
    ],
    narrativeHooks: [
      "Dragons and ancient factions recognize the bloodline.",
      "World reacts to the return of draconic rule.",
    ],
    questHooks: [
      "Claim a lair to stabilize authority growth.",
      "Recover a lost dragon covenant to unlock a new breath law.",
    ],
    tags: ["bloodline", "dominance", "elemental"],
  },
  {
    id: "technology_sovereign",
    name: "Technology Sovereign",
    category: "System",
    summary: "Modern tech blueprints turn into battlefield supremacy.",
    description:
      "A fabrication and optimization system that converts materials into scalable tech, multiplying tactical options.",
    coreLoop: [
      "Scan environments to generate blueprints.",
      "Craft devices that alter combat, economy, and travel.",
      "Upgrade production nodes to accelerate output.",
    ],
    progression: [
      "Blueprint trees unlock elite prototypes.",
      "Automation nodes reduce crafting cost and time.",
    ],
    narrativeHooks: [
      "Tech breakthroughs shift faction balance.",
      "NPCs revere or fear the new tech order.",
    ],
    questHooks: [
      "Secure rare alloys for prototype tiers.",
      "Defend a tech hub under siege.",
    ],
    tags: ["crafting", "industry", "innovation"],
  },
  {
    id: "constellation_mandate",
    name: "Constellation Mandate",
    category: "Authority",
    summary: "Celestial laws descend through star-aligned oaths.",
    description:
      "A pact system that binds your growth to constellations, granting rule fragments tied to cosmic cycles.",
    coreLoop: [
      "Align with constellations to gain law fragments.",
      "Complete stellar trials to deepen alignment.",
      "Invoke celestial authority in key encounters.",
    ],
    progression: [
      "Constellation ranks unlock orbital domains.",
      "Multiple constellations allow composite law effects.",
    ],
    narrativeHooks: [
      "Celestial omens rewrite narrative tone and stakes.",
      "Astral factions take interest in your mandate.",
    ],
    questHooks: [
      "Complete a constellation’s trial sequence.",
      "Protect a star shrine from void corruption.",
    ],
    tags: ["celestial", "oath", "law"],
  },
  {
    id: "divinity_pathway",
    name: "Divinity Pathway",
    category: "Path",
    summary: "Structured ascension with rites, trials, and divine tiers.",
    description:
      "A guided ascension path that grants formal rites, domain selection, and divine rank milestones.",
    coreLoop: [
      "Perform rites to unlock divine thresholds.",
      "Choose a domain to define authority focus.",
      "Complete trials to ascend to higher ranks.",
    ],
    progression: [
      "Domain resonance grants passive boons.",
      "Divine ranks unlock prestige abilities.",
    ],
    narrativeHooks: [
      "Temples and clergy respond to rising divinity.",
      "Enemies treat you as a rival deity.",
    ],
    questHooks: [
      "Restore a fallen shrine to unlock a rite.",
      "Pass a divine trial that reshapes your domain.",
    ],
    tags: ["divine", "ritual", "ascension"],
  },
  {
    id: "weapon_law_authority",
    name: "Weapon Law Authority",
    category: "Authority",
    summary: "Rewrite combat logic through a single weapon doctrine.",
    description:
      "A combat-law system that binds your growth to a weapon style, granting rule overrides to that doctrine.",
    coreLoop: [
      "Declare a weapon law (sword, spear, bow, etc.).",
      "Accumulate law points via weapon feats.",
      "Impose combat rules within your law domain.",
    ],
    progression: [
      "Law tiers unlock guaranteed crit windows.",
      "Advanced tiers allow rule denial for enemies.",
    ],
    narrativeHooks: [
      "Rival weapon disciples challenge your law claim.",
      "Legends spread about your chosen doctrine.",
    ],
    questHooks: [
      "Defeat a law-keeper to steal their doctrine.",
      "Establish a dojo to anchor your authority.",
    ],
    tags: ["combat", "doctrine", "law"],
  },
  {
    id: "territory_core_dominion",
    name: "Territory Core Dominion",
    category: "Authority",
    summary: "Base-building authority that alters rules in its zone.",
    description:
      "A domain engine that turns a claimed territory into a rule-augmented stronghold with escalating bonuses.",
    coreLoop: [
      "Claim a territory core and establish rules.",
      "Upgrade core tiers to expand influence radius.",
      "Defend the core against raids and invasions.",
    ],
    progression: [
      "Core tiers unlock regional laws and perks.",
      "Domain upgrades create unique quest chains.",
    ],
    narrativeHooks: [
      "Settlements form around your growing domain.",
      "Rival lords challenge your territory claim.",
    ],
    questHooks: [
      "Secure resources to expand the core.",
      "Survive a siege to unlock a dominion law.",
    ],
    tags: ["territory", "dominion", "defense"],
  },
  {
    id: "dungeon_admin_protocol",
    name: "Dungeon Admin Protocol",
    category: "Framework",
    summary: "Rule-setting access inside a controllable dungeon space.",
    description:
      "An administrative overlay that grants limited control over a dungeon instance, including spawn and reward logic.",
    coreLoop: [
      "Bind to a dungeon core.",
      "Set rule modifiers for monsters and rewards.",
      "Harvest resources from dungeon cycles.",
    ],
    progression: [
      "Admin privileges expand with dungeon rank.",
      "Custom encounters unlock rare reward pools.",
    ],
    narrativeHooks: [
      "Dungeon entities treat you as a sovereign.",
      "Factions seek access to your controlled space.",
    ],
    questHooks: [
      "Stabilize a dungeon breach to gain admin access.",
      "Design an elite trial for a faction alliance.",
    ],
    tags: ["dungeon", "admin", "rule-control"],
  },
  {
    id: "exchange_shop_core",
    name: "Exchange Shop Core",
    category: "System",
    summary: "Convert points into items, skills, and rare bloodlines.",
    description:
      "A transactional system that rewards objectives with points used to purchase power directly.",
    coreLoop: [
      "Complete objectives to earn exchange points.",
      "Purchase upgrades or rare items from the core.",
      "Unlock hidden inventory tiers through milestones.",
    ],
    progression: [
      "Inventory expands from common tiers to mythic.",
      "Exchange multipliers unlock with reputation.",
    ],
    narrativeHooks: [
      "System offers bargain contracts with consequences.",
      "NPC merchants react to your unusual supply chain.",
    ],
    questHooks: [
      "Complete a high-risk commission for premium stock.",
      "Settle a debt contract to unlock new tiers.",
    ],
    tags: ["economy", "trade", "rewards"],
  },
  {
    id: "gacha_reliquary",
    name: "Gacha Reliquary",
    category: "System",
    summary: "RNG relic pulls that scale into artifact-grade rewards.",
    description:
      "A luck-bound relic system that grants randomized gear and artifacts through progressive pull tiers.",
    coreLoop: [
      "Earn relic tokens through quests and battles.",
      "Pull from tiers that unlock stronger artifacts.",
      "Fuse duplicates into guaranteed upgrades.",
    ],
    progression: [
      "Pity counters unlock guaranteed relic tiers.",
      "Relic sets grant systemic bonuses.",
    ],
    narrativeHooks: [
      "Relics are tied to mythic histories and factions.",
      "Your pulls change how factions perceive you.",
    ],
    questHooks: [
      "Complete relic resonance trials for bonus pulls.",
      "Recover a lost reliquary cache to unlock a new tier.",
    ],
    tags: ["rng", "artifacts", "luck"],
  },
  {
    id: "extra_privilege",
    name: "Extra Privilege",
    category: "Privilege",
    summary: "Low-profile meta knowledge and hidden-route access.",
    description:
      "A stealth privilege that grants insight into hidden routes, but demands subtle play to avoid detection.",
    coreLoop: [
      "Reveal hidden options during narrative events.",
      "Exploit low-suspicion paths to gain rare rewards.",
      "Balance visibility to preserve privilege strength.",
    ],
    progression: [
      "Privilege levels unlock deeper hidden routes.",
      "High exposure reduces privilege effectiveness.",
    ],
    narrativeHooks: [
      "System narration hints at unseen routes.",
      "Rivals become aware if privilege exposure spikes.",
    ],
    questHooks: [
      "Complete a covert quest without detection.",
      "Erase evidence to restore privilege level.",
    ],
    tags: ["stealth", "meta", "insight"],
  },
  {
    id: "heirline_reward_protocol",
    name: "Heirline Reward Protocol",
    category: "Framework",
    summary: "Legacy growth tied to family, clan, or lineage success.",
    description:
      "A lineage framework that converts clan prosperity and heirs into sustained power scaling.",
    coreLoop: [
      "Expand a family or clan network.",
      "Earn lineage milestones through prosperity.",
      "Spend legacy points on buffs and authority.",
    ],
    progression: [
      "Heir milestones unlock unique lineage boons.",
      "Clan influence expands to regional dominion.",
    ],
    narrativeHooks: [
      "Family politics and rival houses shape your arc.",
      "Legacy decisions affect future narrative branches.",
    ],
    questHooks: [
      "Secure alliances to increase lineage prestige.",
      "Protect a key heir during a succession crisis.",
    ],
    tags: ["legacy", "family", "politics"],
  },
  {
    id: "elemental_throne",
    name: "Elemental Throne",
    category: "Authority",
    summary: "Rule-level elemental control with a chosen element.",
    description:
      "A throne authority that binds you to a chosen element, granting law-level manipulation and resistances.",
    coreLoop: [
      "Choose an element and bind it to your throne.",
      "Complete element-specific trials for authority shards.",
      "Project elemental laws to reshape encounters.",
    ],
    progression: [
      "Authority shards unlock multi-element resonance.",
      "Elemental law tiers add battlefield reshaping.",
    ],
    narrativeHooks: [
      "Elemental factions recognize your claim.",
      "Rivals attempt to fracture your element bond.",
    ],
    questHooks: [
      "Purify a corrupted elemental node.",
      "Defeat a rival element lord to claim a shard.",
    ],
    tags: ["elemental", "law", "domain"],
  },
  {
    id: "glitch_exploit_overlay",
    name: "Glitch Exploit Overlay",
    category: "Overlay",
    summary: "Speedrunner-style rule exploits with growing risk.",
    description:
      "An overlay that detects exploitable rule gaps and allows temporary bypasses at increasing risk.",
    coreLoop: [
      "Identify rule gaps during encounters.",
      "Spend exploit charges to bend mechanics.",
      "Manage instability to avoid system backlash.",
    ],
    progression: [
      "Exploit tiers unlock deeper rule access.",
      "Instability thresholds add narrative consequences.",
    ],
    narrativeHooks: [
      "System warnings appear when exploits accumulate.",
      "Authority figures investigate abnormal events.",
    ],
    questHooks: [
      "Stabilize a glitch node to regain control.",
      "Outrun enforcement agents seeking exploiters.",
    ],
    tags: ["exploit", "risk", "system"],
  },
  {
    id: "underworld_savefile",
    name: "Underworld Save File",
    category: "Framework",
    summary: "Carry past-life power into a new round.",
    description:
      "A persistence framework that stores a hidden save state, enabling power retrieval through underworld rituals.",
    coreLoop: [
      "Discover save anchors in the underworld.",
      "Unlock past-life abilities through rites.",
      "Defend anchors against underworld predators.",
    ],
    progression: [
      "Save depth tiers unlock stronger legacy powers.",
      "Anchor integrity dictates retrieval speed.",
    ],
    narrativeHooks: [
      "Underworld entities bargain for your legacy.",
      "Past-life echoes influence narrative choices.",
    ],
    questHooks: [
      "Recover a lost anchor from a corrupted crypt.",
      "Complete a ritual trial to stabilize a save shard.",
    ],
    tags: ["legacy", "underworld", "persistence"],
  },
  {
    id: "system_architect",
    name: "System Architect",
    category: "Framework",
    summary: "Build systems that patch reality like software.",
    description:
      "A meta-framework that grants system-design privileges, allowing you to construct limited subsystems.",
    coreLoop: [
      "Draft subsystem blueprints within safe constraints.",
      "Deploy modules to alter gameplay rules locally.",
      "Balance stability, cost, and narrative debt.",
    ],
    progression: [
      "Subsystem slots unlock with mastery milestones.",
      "Stability upgrades reduce systemic backlash.",
    ],
    narrativeHooks: [
      "System auditors track your modifications.",
      "NPCs experience side effects of your changes.",
    ],
    questHooks: [
      "Recover a system kernel for new module slots.",
      "Debug a failed module before it cascades.",
    ],
    tags: ["meta", "design", "system"],
  },
  {
    id: "skill_synthesis_lattice",
    name: "Skill Synthesis Lattice",
    category: "System",
    summary: "Fuse abilities into rarer, stronger variants.",
    description:
      "A synthesis lattice that merges compatible skills into higher-tier hybrids with unique effects.",
    coreLoop: [
      "Collect compatible skill pairs.",
      "Fuse skills to create hybrid abilities.",
      "Stabilize unstable hybrids through quests.",
    ],
    progression: [
      "Unlock multi-skill fusion at higher tiers.",
      "Hybrid mastery reduces fusion cost.",
    ],
    narrativeHooks: [
      "Synthesis draws attention from researchers.",
      "Hybrids manifest unpredictable side effects.",
    ],
    questHooks: [
      "Find a synthesis catalyst in a high-tier dungeon.",
      "Solve a fusion anomaly to unlock a new hybrid tree.",
    ],
    tags: ["fusion", "skills", "crafting"],
  },
  {
    id: "class_fusion_nexus",
    name: "Class Fusion Nexus",
    category: "System",
    summary: "Hybridize class trees into unique doctrines.",
    description:
      "A nexus that allows partial class merging, granting access to cross-class doctrines.",
    coreLoop: [
      "Identify compatible class doctrines.",
      "Fuse class traits to form a hybrid path.",
      "Stabilize hybrid identities through trials.",
    ],
    progression: [
      "Hybrid ranks unlock unique class passives.",
      "Fusion compatibility expands with milestones.",
    ],
    narrativeHooks: [
      "Class guilds react to your hybrid doctrine.",
      "Hybrid identity shifts narrative perception.",
    ],
    questHooks: [
      "Earn approval from rival class guilds.",
      "Defeat a hybrid challenger to claim a fusion seal.",
    ],
    tags: ["class", "hybrid", "doctrine"],
  },
  {
    id: "devourer_core",
    name: "Devourer Core",
    category: "System",
    summary: "Consume monsters and skills to convert into growth.",
    description:
      "A core system that converts defeated enemies and skills into permanent power, with risk of corruption.",
    coreLoop: [
      "Devour defeated foes to gain essence.",
      "Convert essence into stats, skills, or traits.",
      "Purge corruption by completing cleansing rites.",
    ],
    progression: [
      "Devour tiers unlock higher conversion ratios.",
      "Corruption thresholds add narrative consequences.",
    ],
    narrativeHooks: [
      "Corruption bleeds into dialogue and tone.",
      "Factions react to your devourer reputation.",
    ],
    questHooks: [
      "Acquire a cleansing relic to control corruption.",
      "Hunt a corrupted beast to unlock a new devour tier.",
    ],
    tags: ["devour", "growth", "risk"],
  },
];

export function getArchetypeSystemById(id) {
  return ARCHETYPE_SYSTEMS.find((system) => system.id === id) || null;
}
