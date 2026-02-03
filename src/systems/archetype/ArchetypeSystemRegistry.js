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
  {
    id: "exp_multiplier_matrix",
    name: "EXP Multiplier Matrix",
    category: "System",
    summary: "Experience gains compound into runaway growth.",
    description:
      "A growth engine that multiplies earned experience on a schedule, rewarding streaks and risky achievements.",
    coreLoop: [
      "Earn EXP through combat, crafting, or quests.",
      "Maintain streaks to raise the multiplier.",
      "Bank amplified gains into permanent stat ladders.",
    ],
    progression: [
      "Multiplier tiers unlock at milestone streaks.",
      "Overflow EXP converts into rare traits.",
    ],
    narrativeHooks: [
      "Rivals notice your impossible leveling curve.",
      "System audits trigger when growth spikes.",
    ],
    questHooks: [
      "Hold a multiplier streak through a siege.",
      "Sacrifice a streak to rescue an ally for a bonus tier.",
    ],
    tags: ["growth", "multiplier", "grind"],
  },
  {
    id: "infinite_skill_points",
    name: "Infinite Skill Points",
    category: "System",
    summary: "Skill points never run out; mastery becomes inevitable.",
    description:
      "An allocation system that continuously grants points and removes hard caps, enabling eventual mastery of every discipline.",
    coreLoop: [
      "Earn skill points through milestones.",
      "Allocate freely across disciplines.",
      "Unlock mastery nodes that bend class limits.",
    ],
    progression: [
      "Point gain accelerates with build diversity.",
      "Mastery nodes unlock cross-skill synergies.",
    ],
    narrativeHooks: [
      "Teachers fear your omnidirectional growth.",
      "Guilds attempt to lock you into a single path.",
    ],
    questHooks: [
      "Complete a multi-discipline trial in one run.",
      "Reset a tree to unlock a forbidden mastery node.",
    ],
    tags: ["skills", "mastery", "flex"],
  },
  {
    id: "loot_guarantee_protocol",
    name: "Loot Guarantee Protocol",
    category: "System",
    summary: "Every victory yields guaranteed drops and upgrade lines.",
    description:
      "A deterministic loot protocol that converts victories into predictable resources, removing RNG from progression.",
    coreLoop: [
      "Defeat enemies to trigger guaranteed drops.",
      "Convert duplicates into upgrades.",
      "Unlock higher-tier tables through milestones.",
    ],
    progression: [
      "Guarantees expand from commons to mythics.",
      "Drop chains unlock bonus sets and relics.",
    ],
    narrativeHooks: [
      "Economies bend around your reliable supply.",
      "Loot brokers attempt to monopolize your drops.",
    ],
    questHooks: [
      "Defend a caravan of guaranteed drops.",
      "Clear a dungeon without opening chests.",
    ],
    tags: ["loot", "economy", "deterministic"],
  },
  {
    id: "skill_copy_interface",
    name: "Skill Copy Interface",
    category: "System",
    summary: "Observe, copy, and slot enemy abilities instantly.",
    description:
      "A mimic interface that records techniques and installs them as temporary or permanent skills.",
    coreLoop: [
      "Observe skills in combat.",
      "Copy into limited slots.",
      "Stabilize copied skills with practice.",
    ],
    progression: [
      "Slot count expands with mastery.",
      "Copied skills evolve into superior versions.",
    ],
    narrativeHooks: [
      "Rivals fear their signatures used against them.",
      "Mentors demand secrecy around your interface.",
    ],
    questHooks: [
      "Copy a legendary technique without being noticed.",
      "Defeat a mimic to stabilize a slot permanently.",
    ],
    tags: ["copy", "skills", "mimic"],
  },
  {
    id: "skill_steal_graft",
    name: "Skill Steal Graft",
    category: "System",
    summary: "Steal powers and strip foes of their edge.",
    description:
      "A parasitic graft that permanently transfers abilities from defeated enemies to your core.",
    coreLoop: [
      "Mark targets in combat.",
      "Steal abilities on finishing blows.",
      "Integrate stolen skills into your loadout.",
    ],
    progression: [
      "Graft tiers unlock multi-steal chains.",
      "Stolen skills fuse into hybrid techniques.",
    ],
    narrativeHooks: [
      "Enemies panic as abilities vanish.",
      "Authorities hunt ability thieves aggressively.",
    ],
    questHooks: [
      "Steal from a protected champion.",
      "Survive backlash from a stolen relic skill.",
    ],
    tags: ["steal", "skills", "corruption"],
  },
  {
    id: "talent_evolution_engine",
    name: "Talent Evolution Engine",
    category: "System",
    summary: "Talents mutate into superior ranks over time.",
    description:
      "A refinement engine that evolves talents through repeated use and catalyst infusion.",
    coreLoop: [
      "Use talents to build evolution progress.",
      "Gather catalysts to trigger upgrades.",
      "Choose branching evolutions at thresholds.",
    ],
    progression: [
      "Evolution trees split into specialized laws.",
      "Catalysts become rarer and more potent.",
    ],
    narrativeHooks: [
      "Scholars and predators converge on your growth.",
      "Lineage disputes erupt over evolved talents.",
    ],
    questHooks: [
      "Secure a catalyst node under siege.",
      "Evolve a talent during a time-locked ritual.",
    ],
    tags: ["evolution", "talent", "progression"],
  },
  {
    id: "bloodline_unlock_prism",
    name: "Bloodline Unlock Prism",
    category: "Authority",
    summary: "Sealed lineage awakens into divine inheritance.",
    description:
      "A prism that fractures ancestral seals, granting bloodline abilities and authority shards.",
    coreLoop: [
      "Find bloodline seals in ancient zones.",
      "Break seals through trials.",
      "Claim inherited powers and authority shards.",
    ],
    progression: [
      "Shard tiers unlock lineage forms.",
      "Resonance increases stats and resistances.",
    ],
    narrativeHooks: [
      "Ancient clans recognize your claim.",
      "Bloodline debts and vows resurface.",
    ],
    questHooks: [
      "Recover a family relic to open a seal.",
      "Survive a lineage tribunal to stabilize a shard.",
    ],
    tags: ["bloodline", "awakening", "authority"],
  },
  {
    id: "shadow_companion_core",
    name: "Shadow Companion Core",
    category: "System",
    summary: "An autonomous shadow hunts, eats, and evolves.",
    description:
      "A companion core that spawns a shadow entity to scout, devour energy, and scale with you.",
    coreLoop: [
      "Assign shadow tasks (scout, hunt, devour).",
      "Feed it essence to grow its form.",
      "Merge powers for synergy upgrades.",
    ],
    progression: [
      "Shadow forms unlock stealth and combat variants.",
      "Shared skill trees enable combo abilities.",
    ],
    narrativeHooks: [
      "The shadow develops a personality.",
      "Factions fear its unchecked hunger.",
    ],
    questHooks: [
      "Bind a rogue shadow to stabilize growth.",
      "Complete a shadow merge ritual without interruption.",
    ],
    tags: ["companion", "shadow", "devour"],
  },
  {
    id: "undead_legion_evolution",
    name: "Undead Legion Evolution",
    category: "Framework",
    summary: "An undead army that levels like a roster.",
    description:
      "A legion framework that treats undead as units with ranks, traits, and promotions.",
    coreLoop: [
      "Raise undead and assign roles.",
      "Evolve units through battles.",
      "Promote elites into specialized tiers.",
    ],
    progression: [
      "Rank tiers unlock elite undead.",
      "Legion doctrines add systemic bonuses.",
    ],
    narrativeHooks: [
      "Necropolis factions court your legion.",
      "Holy orders mobilize against you.",
    ],
    questHooks: [
      "Reclaim a tomb to expand capacity.",
      "Defend the legion during a purge.",
    ],
    tags: ["undead", "army", "evolution"],
  },
  {
    id: "revival_bounty_exchange",
    name: "Revival Bounty Exchange",
    category: "Framework",
    summary: "Death funds power through revival bounties.",
    description:
      "A revival economy that grants credits after fatality, letting you buy survival clauses and counters.",
    coreLoop: [
      "Die and collect bounty credits.",
      "Purchase survival clauses and counters.",
      "Return stronger with tailored safeguards.",
    ],
    progression: [
      "Bounty tiers unlock advanced clauses.",
      "Fatality records grant unique traits.",
    ],
    narrativeHooks: [
      "Rumors spread of your impossible survival.",
      "Death-aligned powers take interest.",
    ],
    questHooks: [
      "Die to a specific boss to unlock a clause.",
      "Spend bounty to save an ally from death.",
    ],
    tags: ["revival", "economy", "retry"],
  },
  {
    id: "stat_purchase_contract",
    name: "Stat Purchase Contract",
    category: "System",
    summary: "Purchase raw attributes and talents with contract points.",
    description:
      "A contract-based system that converts kills, tasks, and debts into points used to buy stats and talents.",
    coreLoop: [
      "Accept contracts with escalating difficulty.",
      "Earn contract points through completion.",
      "Purchase stats, talents, or temporary boosts.",
    ],
    progression: [
      "Contract tiers unlock premium stat bundles.",
      "Debt clauses grant bonus points at higher risk.",
    ],
    narrativeHooks: [
      "Contract brokers compete for your signature.",
      "Failure triggers dangerous debt collectors.",
    ],
    questHooks: [
      "Complete a chain of debt contracts for a bonus tier.",
      "Clear a contract without using purchased stats.",
    ],
    tags: ["economy", "stats", "contracts"],
  },
  {
    id: "check_in_rewards_ledger",
    name: "Check-In Rewards Ledger",
    category: "System",
    summary: "Daily check-ins stack into absurd milestones.",
    description:
      "A ledger that grants escalating rewards for consistent check-ins; missing a day weakens the streak.",
    coreLoop: [
      "Check in daily to claim rewards.",
      "Maintain streaks for multiplier bonuses.",
      "Redeem milestone caches for rare items.",
    ],
    progression: [
      "Streak tiers unlock exclusive rewards.",
      "Milestones grant permanent passive buffs.",
    ],
    narrativeHooks: [
      "The system taunts you when you miss a day.",
      "Rivals attempt to sabotage your streak.",
    ],
    questHooks: [
      "Hold a streak through a hostile territory.",
      "Complete a milestone without using a reward.",
    ],
    tags: ["daily", "rewards", "streak"],
  },
  {
    id: "afk_growth_reactor",
    name: "AFK Growth Reactor",
    category: "System",
    summary: "Offline time converts into levels and resources.",
    description:
      "A reactor that distills time away from combat into experience, materials, and passive training.",
    coreLoop: [
      "Accrue time essence while idle.",
      "Claim stored gains on return.",
      "Invest essence into reactor upgrades.",
    ],
    progression: [
      "Reactor tiers unlock parallel training slots.",
      "Efficiency upgrades multiply idle returns.",
    ],
    narrativeHooks: [
      "Factions try to kidnap you while idle.",
      "The reactor begins forecasting danger windows.",
    ],
    questHooks: [
      "Protect the reactor during a sabotage attempt.",
      "Spend a full day idle in a cursed zone.",
    ],
    tags: ["afk", "time", "growth"],
  },
  {
    id: "domain_expansion_protocol",
    name: "Domain Expansion Protocol",
    category: "Authority",
    summary: "Project a personal domain that overwrites enemy rules.",
    description:
      "A territory law protocol that imposes buffs, debuffs, and rule shifts inside its expanding radius.",
    coreLoop: [
      "Activate a domain to set local rules.",
      "Hold the domain to accumulate law points.",
      "Expand radius by investing authority shards.",
    ],
    progression: [
      "Domain tiers unlock rule slots and triggers.",
      "Composite rules allow layered effects.",
    ],
    narrativeHooks: [
      "Your presence changes the tone of the area.",
      "Rival domain users contest your claim.",
    ],
    questHooks: [
      "Win a domain duel to steal a rule slot.",
      "Stabilize a domain fracture after overuse.",
    ],
    tags: ["domain", "law", "control"],
  },
  {
    id: "dungeon_farming_loop",
    name: "Dungeon Farming Loop",
    category: "Framework",
    summary: "Infinite spawns turn dungeons into leveling engines.",
    description:
      "A looping dungeon protocol that restarts encounters for sustained farming with escalating risk.",
    coreLoop: [
      "Clear a dungeon loop.",
      "Restart the loop with increased difficulty.",
      "Harvest compounding rewards.",
    ],
    progression: [
      "Loop depth unlocks rare drop pools.",
      "Safe reset tokens expand farming windows.",
    ],
    narrativeHooks: [
      "Dungeons recognize and adapt to you.",
      "Loop anomalies threaten to trap you inside.",
    ],
    questHooks: [
      "Survive a ten-loop streak without resting.",
      "Stabilize a loop to prevent a collapse.",
    ],
    tags: ["dungeon", "loop", "farm"],
  },
  {
    id: "class_unique_covenant",
    name: "Class Unique Covenant",
    category: "Privilege",
    summary: "Only you can wield a unique class path.",
    description:
      "A covenant that grants a one-of-one class with exclusive skills and immunity to class theft.",
    coreLoop: [
      "Pass covenant trials to claim the class.",
      "Unlock exclusive class laws.",
      "Defend the covenant from usurpers.",
    ],
    progression: [
      "Class sigils unlock exclusive passives.",
      "Covenant stages add personal class perks.",
    ],
    narrativeHooks: [
      "Class guilds pursue your covenant.",
      "Usurpers attempt to steal your class seal.",
    ],
    questHooks: [
      "Complete a solo trial without allies.",
      "Defeat a covenant challenger for a new sigil.",
    ],
    tags: ["class", "unique", "privilege"],
  },
  {
    id: "summon_dominion_seal",
    name: "Summon Dominion Seal",
    category: "Authority",
    summary: "Summoned beings become permanent subjects.",
    description:
      "A dominion seal that converts summons into permanent vassals with growth trees.",
    coreLoop: [
      "Summon creatures through trials.",
      "Seal them into your dominion.",
      "Evolve vassals with shared experience.",
    ],
    progression: [
      "Dominion slots increase with rank.",
      "Vassal evolution unlocks unique traits.",
    ],
    narrativeHooks: [
      "Summoned factions test your dominion.",
      "Vassals develop rivalries and loyalties.",
    ],
    questHooks: [
      "Seal a legendary summon without losing control.",
      "Resolve a vassal rebellion peacefully.",
    ],
    tags: ["summon", "dominion", "loyalty"],
  },
  {
    id: "beast_contract_battery",
    name: "Beast Contract Battery",
    category: "System",
    summary: "Beast contracts turn into scaling batteries.",
    description:
      "Contracts bind beasts and siphon their growth into your attributes while boosting their evolution.",
    coreLoop: [
      "Tame beasts and forge contracts.",
      "Synchronize growth through shared battles.",
      "Convert contract charge into stat gains.",
    ],
    progression: [
      "Contract tiers unlock shared abilities.",
      "Multi-link synergies grant bonus effects.",
    ],
    narrativeHooks: [
      "Beast tribes bargain for contracts.",
      "Rival tamers challenge your dominance.",
    ],
    questHooks: [
      "Form a contract with an apex beast.",
      "Stabilize a contract overload event.",
    ],
    tags: ["beast", "contract", "tamer"],
  },
  {
    id: "alchemy_compound_loop",
    name: "Alchemy Compound Loop",
    category: "System",
    summary: "Alchemy outputs compound faster than costs.",
    description:
      "A compounding loop that multiplies alchemy outputs through recursive refinement.",
    coreLoop: [
      "Brew batches of potions or pills.",
      "Reinvest outputs to amplify yields.",
      "Unlock rare formulas through compounding.",
    ],
    progression: [
      "Compounding ratios increase per tier.",
      "Catalyst chains enable mythic brews.",
    ],
    narrativeHooks: [
      "Alchemists seek your formulas.",
      "Overcompounding risks explosive failure.",
    ],
    questHooks: [
      "Acquire a catalyst to start a loop.",
      "Contain an alchemical backlash safely.",
    ],
    tags: ["alchemy", "crafting", "compound"],
  },
  {
    id: "blueprint_forge_library",
    name: "Blueprint Forge Library",
    category: "Framework",
    summary: "Blueprints accumulate into a manufacturable arsenal.",
    description:
      "A forge library that stores and upgrades blueprints, enabling mass production of gear.",
    coreLoop: [
      "Scan items to store blueprints.",
      "Forge copies and upgrade patterns.",
      "Automate fabrication through nodes.",
    ],
    progression: [
      "Library tiers unlock legendary patterns.",
      "Blueprint fusion creates hybrid gear.",
    ],
    narrativeHooks: [
      "Empires vie for your fabrication rights.",
      "Counterfeiters attempt to steal patterns.",
    ],
    questHooks: [
      "Recover a lost legendary blueprint.",
      "Defend a forge node under siege.",
    ],
    tags: ["crafting", "blueprints", "industry"],
  },
  {
    id: "genetic_editing_suite",
    name: "Genetic Editing Suite",
    category: "System",
    summary: "Rewrite your biology with modular upgrades.",
    description:
      "A gene editor that allows swapping traits, resistances, and physical limits through modular upgrades.",
    coreLoop: [
      "Collect gene samples from rare targets.",
      "Edit traits to gain new advantages.",
      "Stabilize mutations through trials.",
    ],
    progression: [
      "Gene slots increase with mastery.",
      "Edit tiers unlock new forms and resistances.",
    ],
    narrativeHooks: [
      "Researchers hunt for your samples.",
      "Unstable edits cause side effects in dialogue.",
    ],
    questHooks: [
      "Acquire a gene sample from a boss.",
      "Stabilize a mutation under pressure.",
    ],
    tags: ["genetics", "upgrade", "biology"],
  },
  {
    id: "information_vision_array",
    name: "Information Vision Array",
    category: "Privilege",
    summary: "See stats, weaknesses, and hidden routes.",
    description:
      "An analysis array that surfaces enemy data, loot vectors, and secret paths in real time.",
    coreLoop: [
      "Scan targets to reveal stats and weaknesses.",
      "Expose hidden routes and loot caches.",
      "Exploit data for combat advantages.",
    ],
    progression: [
      "Deep scans unlock predictive overlays.",
      "Information tiers reveal rare drop logic.",
    ],
    narrativeHooks: [
      "Enemies feel watched and adjust tactics.",
      "Secret factions notice your awareness.",
    ],
    questHooks: [
      "Identify a hidden weakness before a duel.",
      "Map a secret route through a sealed zone.",
    ],
    tags: ["information", "analysis", "secrets"],
  },
  {
    id: "mind_reading_exploit",
    name: "Mind-Reading Exploit",
    category: "Privilege",
    summary: "Surface thoughts into tactical advantage.",
    description:
      "A cognition exploit that reads surface intent and predicts actions during critical moments.",
    coreLoop: [
      "Focus to read intentions in combat.",
      "Predict enemy actions before they trigger.",
      "Exploit revealed motives for social leverage.",
    ],
    progression: [
      "Range and clarity improve with use.",
      "Detection resistance increases with mastery.",
    ],
    narrativeHooks: [
      "NPCs react to your unsettling insight.",
      "Telepaths attempt to block your exploit.",
    ],
    questHooks: [
      "Read a commander's intent to prevent an ambush.",
      "Survive a duel against a mind shielded foe.",
    ],
    tags: ["mind", "prediction", "social"],
  },
  {
    id: "regression_memory_cache",
    name: "Regression Memory Cache",
    category: "Framework",
    summary: "Memories from failed timelines fuel a new run.",
    description:
      "A cache that stores regression memories, providing foresight and stat refunds on restart.",
    coreLoop: [
      "Record failures and regrets in the cache.",
      "Reload with retained memory bonuses.",
      "Spend memory points to alter outcomes.",
    ],
    progression: [
      "Memory slots expand with resets.",
      "Retained bonuses grow with each regression.",
    ],
    narrativeHooks: [
      "Deja-vu ripples alter relationships.",
      "Fate watchers attempt to stop your loops.",
    ],
    questHooks: [
      "Regress to prevent a city collapse.",
      "Unlock a memory branch by repeating a trial.",
    ],
    tags: ["regression", "memory", "retry"],
  },
  {
    id: "meta_reincarnation_map",
    name: "Meta Reincarnation Map",
    category: "Framework",
    summary: "Reincarnate with a full meta map of the world.",
    description:
      "A map that preserves knowledge of locations, quests, and outcomes across reincarnations.",
    coreLoop: [
      "Unlock map nodes through exploration.",
      "Plan optimal routes with foreknowledge.",
      "Exploit outcome flags to skip failures.",
    ],
    progression: [
      "Map layers expand to factions and events.",
      "Outcome prediction improves with iterations.",
    ],
    narrativeHooks: [
      "History changes as you dodge traps early.",
      "Archivists seek your reincarnation map.",
    ],
    questHooks: [
      "Reach a hidden node before rivals.",
      "Rewrite a doomed quest route.",
    ],
    tags: ["reincarnation", "meta", "map"],
  },
  {
    id: "villain_pov_advantage",
    name: "Villain POV Advantage",
    category: "Privilege",
    summary: "Antagonist toolkit grants ruthless advantages.",
    description:
      "A privilege that unlocks intimidation, resource seizure, and plot disruption routes.",
    coreLoop: [
      "Exploit villain options in encounters.",
      "Harvest fear and respect into power.",
      "Invest infamy into dark perks.",
    ],
    progression: [
      "Infamy tiers unlock stronger methods.",
      "Villain perks reshape reputation mechanics.",
    ],
    narrativeHooks: [
      "Heroes actively target your operations.",
      "Underworld factions seek your alliance.",
    ],
    questHooks: [
      "Seize a hero resource without being discovered.",
      "Defeat a rival villain for a perk slot.",
    ],
    tags: ["villain", "infamy", "meta"],
  },
  {
    id: "danger_sense_array",
    name: "Danger Sense Array",
    category: "Privilege",
    summary: "Auto-detect lethal threats before they land.",
    description:
      "A sensor array that flags ambushes and grants evasive triggers during critical windows.",
    coreLoop: [
      "Detect lethal events in advance.",
      "Trigger auto-evade charges.",
      "Invest in sensors to widen warning windows.",
    ],
    progression: [
      "Warning windows expand with upgrades.",
      "Auto-dodge charges recharge faster.",
    ],
    narrativeHooks: [
      "Fate-seers struggle to trap you.",
      "Enemies adopt unpredictable tactics.",
    ],
    questHooks: [
      "Survive an assassination attempt without damage.",
      "Calibrate the array in a storm zone.",
    ],
    tags: ["survival", "warning", "evasion"],
  },
  {
    id: "true_damage_override",
    name: "True Damage Override",
    category: "Authority",
    summary: "Bypass defenses with absolute damage laws.",
    description:
      "An authority override that converts attacks into true damage within strict limits.",
    coreLoop: [
      "Charge override meters in combat.",
      "Apply true damage windows to key strikes.",
      "Manage backlash from overuse.",
    ],
    progression: [
      "Override tiers widen the true damage window.",
      "Backlash penalties shrink with mastery.",
    ],
    narrativeHooks: [
      "Tank elites fear your rule-breaking strikes.",
      "System auditors flag your abnormal damage.",
    ],
    questHooks: [
      "Break a boss shield using true damage.",
      "Survive a backlash event without healing.",
    ],
    tags: ["damage", "law", "override"],
  },
  {
    id: "absolute_defense_citadel",
    name: "Absolute Defense Citadel",
    category: "Authority",
    summary: "Nullify damage below a set threshold.",
    description:
      "A citadel authority that sets a minimum damage threshold and converts lesser hits into energy.",
    coreLoop: [
      "Raise the defense threshold through trials.",
      "Absorb weaker hits into energy reserves.",
      "Spend stored energy on counters or buffs.",
    ],
    progression: [
      "Threshold tiers expand your safe zone.",
      "Conversion ratios improve with mastery.",
    ],
    narrativeHooks: [
      "Enemies change tactics to pierce your citadel.",
      "Allies rely on your impregnable defense.",
    ],
    questHooks: [
      "Hold a chokepoint without losing HP.",
      "Store enough energy to unleash a counter burst.",
    ],
    tags: ["defense", "threshold", "citadel"],
  },
  {
    id: "time_dilation_training",
    name: "Time Dilation Training",
    category: "Framework",
    summary: "Train for years in minutes.",
    description:
      "A time-dilation framework that opens training pockets with accelerated time flow.",
    coreLoop: [
      "Enter a training pocket realm.",
      "Train under accelerated time.",
      "Exit with condensed growth gains.",
    ],
    progression: [
      "Dilation ratio increases per tier.",
      "Pocket stability improves with mastery.",
    ],
    narrativeHooks: [
      "Years of memories compress into minutes.",
      "Rivals fear your impossible improvement pace.",
    ],
    questHooks: [
      "Survive a decade of pocket training in one run.",
      "Stabilize a collapsing pocket realm.",
    ],
    tags: ["time", "training", "acceleration"],
  },
  {
    id: "clone_production_vault",
    name: "Clone Production Vault",
    category: "System",
    summary: "Produce multiple bodies with shared growth.",
    description:
      "A vault that crafts clones linked to your core, enabling parallel missions and shared experience.",
    coreLoop: [
      "Craft a clone with limited autonomy.",
      "Assign clones to parallel missions.",
      "Merge returns to consolidate experience.",
    ],
    progression: [
      "Clone slots expand with mastery.",
      "Synchronization upgrades reduce merge loss.",
    ],
    narrativeHooks: [
      "Clones develop quirks and divergent ideals.",
      "Enemies struggle to identify the real you.",
    ],
    questHooks: [
      "Complete simultaneous objectives with clones.",
      "Recover a lost clone before desync.",
    ],
    tags: ["clone", "parallel", "growth"],
  },
  {
    id: "soul_fragment_library",
    name: "Soul Fragment Library",
    category: "System",
    summary: "Absorb souls to gain memories and techniques.",
    description:
      "A library that stores soul fragments, unlocking skills and knowledge on demand.",
    coreLoop: [
      "Absorb soul fragments from defeated foes.",
      "Catalog fragments to unlock techniques.",
      "Equip fragments to alter your build.",
    ],
    progression: [
      "Library tiers unlock higher-rank souls.",
      "Fragment fusion enables rare techniques.",
    ],
    narrativeHooks: [
      "Fragments whisper in your mind.",
      "Soul hunters seek your library.",
    ],
    questHooks: [
      "Capture a rare fragment without shattering it.",
      "Resolve a fragment conflict to unlock a new skill.",
    ],
    tags: ["souls", "library", "skills"],
  },
  {
    id: "divine_artifact_bond",
    name: "Divine Artifact Bond",
    category: "Authority",
    summary: "A single artifact grows with you forever.",
    description:
      "A bond that fuses you with a divine artifact, scaling its power and unlocking new forms.",
    coreLoop: [
      "Bind to a divine artifact.",
      "Feed it essence and achievements.",
      "Unlock awakened forms and abilities.",
    ],
    progression: [
      "Artifact stages unlock new skill sets.",
      "Bond resonance adds passive authority.",
    ],
    narrativeHooks: [
      "The artifact judges your actions.",
      "Collectors and gods pursue your bond.",
    ],
    questHooks: [
      "Complete an artifact trial to awaken a form.",
      "Repair a fractured bond under fire.",
    ],
    tags: ["artifact", "bond", "authority"],
  },
  {
    id: "inner_world_reliquary",
    name: "Inner World Reliquary",
    category: "Framework",
    summary: "A pocket realm to store armies and resources.",
    description:
      "An inner world that expands over time, serving as a sanctuary, forge, and army vault.",
    coreLoop: [
      "Expand the inner realm with resources.",
      "Store troops, materials, and relics.",
      "Cultivate inside to gain buffs.",
    ],
    progression: [
      "Realm tiers unlock fields, forges, and workshops.",
      "Spatial upgrades increase storage capacity.",
    ],
    narrativeHooks: [
      "The inner world develops its own ecosystem.",
      "Rivals attempt to breach your sanctuary.",
    ],
    questHooks: [
      "Stabilize a realm rift before collapse.",
      "Defend the reliquary during a raid.",
    ],
    tags: ["realm", "storage", "sanctuary"],
  },
  {
    id: "worldtree_resource_farm",
    name: "World-Tree Resource Farm",
    category: "System",
    summary: "World-tree growth yields infinite materials.",
    description:
      "A world-tree system that generates mana, materials, and evolution paths with each growth cycle.",
    coreLoop: [
      "Nurture the world-tree with essence.",
      "Harvest resources from branches.",
      "Unlock evolution paths through growth.",
    ],
    progression: [
      "Branch tiers unlock new elements.",
      "Harvest cycles speed up over time.",
    ],
    narrativeHooks: [
      "The tree attracts factions seeking its fruit.",
      "Corruption threatens to wither the roots.",
    ],
    questHooks: [
      "Protect the tree during a harvest season.",
      "Cleanse a corrupted branch node.",
    ],
    tags: ["worldtree", "resources", "growth"],
  },
  {
    id: "dragon_obedience_aura",
    name: "Dragon Obedience Aura",
    category: "Authority",
    summary: "High-tier creatures submit to your aura.",
    description:
      "An aura authority that forces dragons and apex beasts into submission or alliance.",
    coreLoop: [
      "Awaken the obedience aura.",
      "Subjugate or befriend apex creatures.",
      "Convert obedience into battle assets.",
    ],
    progression: [
      "Aura rank expands creature tiers.",
      "Obedient beasts unlock unique boons.",
    ],
    narrativeHooks: [
      "Dragon clans react to your rising presence.",
      "Beast lords challenge your authority.",
    ],
    questHooks: [
      "Win a duel against a drake matriarch.",
      "Calm a rampaging dragon without killing it.",
    ],
    tags: ["dragon", "dominion", "aura"],
  },
  {
    id: "technology_accelerator",
    name: "Technology Accelerator",
    category: "System",
    summary: "Modern knowledge accelerates tech dominance.",
    description:
      "An accelerator that turns blueprints into rapid industrial gains and combat technology.",
    coreLoop: [
      "Research modern blueprints.",
      "Build prototypes and iterate quickly.",
      "Scale production through automation.",
    ],
    progression: [
      "Tech eras unlock new systems.",
      "Prototype chains reduce build costs.",
    ],
    narrativeHooks: [
      "Factions race to steal your tech.",
      "Industrial shifts destabilize regions.",
    ],
    questHooks: [
      "Secure a rare alloy for a prototype.",
      "Protect a factory during a raid.",
    ],
    tags: ["technology", "industry", "innovation"],
  },
  {
    id: "card_deck_mastery",
    name: "Card Deck Mastery",
    category: "System",
    summary: "Build decks of modular skills and summons.",
    description:
      "A deck system that lets you slot, draw, and combo cards for dynamic builds.",
    coreLoop: [
      "Acquire cards from battles and quests.",
      "Build decks with synergistic sets.",
      "Draw and combo cards in combat.",
    ],
    progression: [
      "Deck size increases with mastery.",
      "Rare cards unlock powerful combos.",
    ],
    narrativeHooks: [
      "Card guilds attempt to recruit you.",
      "Your deck shifts based on story events.",
    ],
    questHooks: [
      "Win a duel using a limited deck.",
      "Complete a set to unlock a mythic card.",
    ],
    tags: ["cards", "modular", "combo"],
  },
  {
    id: "luck_monetization_engine",
    name: "Luck Monetization Engine",
    category: "System",
    summary: "Convert luck into drops, gold, and fate events.",
    description:
      "A monetization engine that translates luck into tangible outcomes and tradeable tokens.",
    coreLoop: [
      "Accumulate luck through actions.",
      "Convert luck into tokens or drops.",
      "Spend tokens on fate events.",
    ],
    progression: [
      "Exchange tiers unlock rarer outcomes.",
      "Luck cap expands with prestige.",
    ],
    narrativeHooks: [
      "Merchants seek your luck tokens.",
      "Fate events skew narratives around you.",
    ],
    questHooks: [
      "Spend tokens to avoid a disaster event.",
      "Win a lottery without triggering suspicion.",
    ],
    tags: ["luck", "economy", "fate"],
  },
  {
    id: "quest_chain_compounding",
    name: "Quest Chain Compounding",
    category: "Framework",
    summary: "Quest chains compound rewards faster than difficulty.",
    description:
      "A chain system where each completed quest increases rewards exponentially if the chain remains unbroken.",
    coreLoop: [
      "Accept a chained sequence of quests.",
      "Complete within time to preserve the chain.",
      "Claim compounding rewards at milestones.",
    ],
    progression: [
      "Chain tiers unlock relic rewards.",
      "Failure penalties shrink with mastery.",
    ],
    narrativeHooks: [
      "NPCs begin offering chain-exclusive tasks.",
      "Failure reshapes reputation in major ways.",
    ],
    questHooks: [
      "Complete five chained quests without resting.",
      "Sacrifice a chain to save a critical NPC.",
    ],
    tags: ["quests", "compound", "rewards"],
  },
];

export function getArchetypeSystemById(id) {
  return ARCHETYPE_SYSTEMS.find((system) => system.id === id) || null;
}
