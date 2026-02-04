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
    description: "A parasitic persistence framework that treats death not as an end, but as a data point. It records the exact cause of every fatal outcome, converting the trauma and tactical data into 'Echo Credits' and 'Trauma Signatures' that fund and inform your next revival.",
    coreLoop: [
      "Experience a fatal event, generating a 'Death Echo' and accumulating Echo Credits.",
      "In the Archive vestibule, analyze the Trauma Signature to understand the attack that killed you.",
      "Spend Echo Credits to purchase 'Counter-Grafts'—temporary immunities or resistances tailored to the cause of death.",
      "Activate a Revival Clause ('Retry', 'Rewind', 'Anchor') to re-engage the world."
    ],
    progression: [
      "Upgrade Revival Clauses: 'Retry' becomes 'Temporal Rewind', allowing a 10-second rollback before death.",
      "Unlock 'Echo Imprinting' to permanently etch a diluted version of a powerful Counter-Graft into your soul.",
      "Achieve 'Archive Sovereignty', allowing you to weaponize death echoes, projecting fatal memories onto enemies."
    ],
    narrativeHooks: [
      "You retain phantom sensations of past deaths, causing momentary glitches in your perception.",
      "Entities that exist outside of linear time (gods, demons, ancient mages) perceive your multiple timelines and may react with hostility or curiosity.",
      "You might encounter 'Echoes' of your past selves, spectral remnants of failed attempts."
    ],
    questHooks: [
      "Hunt and kill a 'Chronovore' that is feeding on your discarded timelines.",
      "A powerful NPC is trapped in a fatal loop; enter their loop, die in their place, and use the generated Echo to craft a solution.",
      "Find and stabilize a corrupted Archive Node that is causing you to revive with fragmented memories or incorrect Counter-Grafts."
    ],
    tags: ["survival", "retry", "memory", "temporal", "data"],
  },
  {
    id: "fate_selection_engine",
    name: "Fate Selection Engine",
    category: "Framework",
    summary: "Choice-driven destiny rewrites with escalating stakes.",
    description: "A metaphysical engine that maps destiny into a decision lattice. At pivotal moments, it presents three mutually exclusive 'Fate Clauses'—each a potential future. Choosing one grants immediate, tangible power and begins subtly rewriting reality to align with that path, while the rejected futures become 'Lost Fates'.",
    coreLoop: [
      "Reach a 'Narrative Fulcrum' (e.g., a major boss fight, a critical choice).",
      "The Engine presents three Fate Clauses, like 'The Tyrant's Peace,' 'The Martyr's Victory,' or 'The Trickster's Escape.'",
      "Select one Clause, instantly gaining a related buff or ability, and locking in its long-term narrative trajectory.",
      "Witness the immediate and long-term consequences as the world warps around your choice."
    ],
    progression: [
      "Accumulate enough aligned choices to trigger a 'Destiny Cascade,' a permanent, regional law change (e.g., 'Kindness is rewarded with fortune').",
      "Learn to harness 'Lost Fates,' calling upon the ghosts of rejected futures for a powerful, one-time ability at the cost of accruing 'Fate Debt.'",
      "Achieve 'Nexus Consciousness,' allowing you to glimpse the three choices an enemy will have, and act to force their hand."
    ],
    narrativeHooks: [
      "Prophets and seers either revere you as a messiah of choice or despise you as a perversion of determinism.",
      "You may encounter 'Echoes of Regret'—manifestations of the paths you didn't choose, who may help or hinder you.",
      "Your body and equipment slowly transform to reflect your dominant fate choices."
    ],
    questHooks: [
      "A rival 'Fate-Bearer' has chosen a conflicting destiny; you must either force them to abandon their path or erase them from the timeline.",
      "Resolve a 'Paradox Knot' where two of your chosen fates create a contradictory reality.",
      "Hunt for a 'Seed of Choice' to unlock a fourth, hidden Fate Clause option at the next Fulcrum."
    ],
    tags: ["choice", "destiny", "law", "narrative-control", "meta"],
  },
  {
    id: "dragon_blood_authority",
    name: "Dragon Blood Authority",
    category: "Authority",
    summary: "Primeval supremacy with flight, breath, and dominance laws.",
    description: "An ancient, dormant authority that awakens your draconic lineage. This is not merely power, but a mandate to rule. It grants an oppressive, 'rule-level' presence over lesser beings, mastery over a chosen draconic element, and the potential to achieve the terrifying form of a true dragon.",
    coreLoop: [
      "Exert your 'Draconic Pressure' aura to terrify or subjugate creatures, with effectiveness based on your Blood Purity.",
      "Hunt powerful elemental or magical beasts and 'Devour' their hearts to increase your Blood Purity.",
      "Channel your chosen element (Fire, Frost, Storm, Earth) into a devastating 'Breath Weapon'.",
      "Hoard treasure and relics in a Lair to amplify your power and regeneration."
    ],
    progression: [
      "Unlock progressive stages of your 'Draconic Form': from simple scales and claws, to wings, and finally the full, cataclysmic Dragon Body.",
      "Your Breath Weapon evolves, gaining secondary effects (e.g., 'Solar Fire' melts armor, 'Rimefrost' freezes souls).",
      "Establish 'Territorial Dominion,' where your Draconic Pressure becomes a physical law within your lair's domain, weakening intruders."
    ],
    narrativeHooks: [
      "Ancient dragons see you as either a bold usurper or a cherished descendant.",
      "Dragon-slaying cults and knights with ancestral vows hunt you relentlessly.",
      "Your human emotions and reasoning begin to conflict with the primal instincts of your bloodline: greed, pride, and wrath."
    ],
    questHooks: [
      "Claim and defend a Lair worthy of your bloodline (e.g., a volcano, a frozen peak).",
      "Challenge a rival dragon in a formal 'Duel of Supremacy' to absorb their authority.",
      "Recover a 'Clutchstone' of your lineage to unlock forgotten memories and techniques from your ancestors."
    ],
    tags: ["bloodline", "dominance", "elemental", "transformation", "monster"],
  },
  {
    id: "technology_sovereign",
    name: "Technology Sovereign",
    category: "System",
    summary: "Modern tech blueprints turn into battlefield supremacy.",
    description: "A sovereign system that grants the user an intuitive genius for fabrication and optimization. It allows for the scanning of any object or energy source to generate a 'Blueprint,' which can then be iterated upon to create technology far beyond the world's current level. You are not a craftsman; you are an industrial revolution.",
    coreLoop: [
      "Use your 'Analysis Visor' to scan materials, magic, and creatures, generating Blueprints.",
      "Establish a mobile, extra-dimensional 'Fabrication Bay' to craft items from stored materials.",
      "Iterate on existing blueprints, adding 'Augments' (e.g., 'Arcane Infusion,' 'Self-Repair Nanites') to create superior versions.",
      "Deploy autonomous 'Scavenger Drones' to harvest materials automatically."
    ],
    progression: [
      "Advance through 'Tech Tiers,' from basic clockwork and steam power to plasma, grav-tech, and esoteric energy weapons.",
      "Unlock 'Mass Production,' allowing you to outfit entire armies or settlements with your technology.",
      "Develop a 'Personal Integrated Battlesuit,' a modular suit of power armor that serves as your ultimate weapon and tool."
    ],
    narrativeHooks: [
      "Artisan guilds and the god of the forge declare you a heretic for devaluing true craftsmanship.",
      "Kingdoms go to war to either secure your services or eliminate the strategic threat you represent.",
      "Your advanced medical technology can cure 'incurable' plagues, making you a messiah to some and disrupting the plans of death-cults."
    ],
    questHooks: [
      "Find a 'First-Age' power source to unlock the highest Tech Tiers.",
      "Defend your Fabrication Bay from a rival faction attempting a corporate espionage/sabotage mission.",
      "Build a device that can solve a massive environmental or magical catastrophe."
    ],
    tags: ["crafting", "industry", "innovation", "scifi", "builder"],
  },
  {
    id: "constellation_mandate",
    name: "Constellation Mandate",
    category: "Authority",
    summary: "Celestial laws descend through star-aligned oaths.",
    description: "A pact-bound authority that ties your soul to the silent, cosmic gods—the Constellations. By aligning with them, you can draw down their 'Law Fragments' and wield celestial power that is alien to the terrestrial world. Your power waxes and wanes with the movements of the stars themselves.",
    coreLoop: [
      "Perform a 'Stargazing Ritual' to align with a new Constellation, accepting its Mandate (a passive buff and a restriction).",
      "Draw 'Starlight' into your body, a resource that regenerates faster at night and under an open sky.",
      "Invoke 'Aspects' of your aligned Constellations (e.g., 'The Guardian's Shield,' 'The Hunter's Arrow') as powerful, temporary abilities.",
      "Complete a 'Stellar Trial'—a personal challenge from your patron Constellation—to deepen your bond."
    ],
    progression: [
      "Unlock the ability to align with multiple Constellations, combining their laws into 'Syzygies'—rare and powerful combo effects.",
      "Gain a 'Star-Chart Soul,' allowing you to navigate via the stars and even teleport between 'ley-lines' of celestial power.",
      "Achieve 'Ascendant Alignment,' allowing you to manifest a temporary, ethereal form made of pure starlight."
    ],
    narrativeHooks: [
      "Astrologers and prophets can read your destiny in the night sky, making it impossible to hide your power.",
      "Abyssal creatures and beings of shadow are naturally hostile to your celestial light.",
      "Your personality may shift slightly to reflect the nature of your dominant patron Constellation (e.g., stoic like the Guardian, aggressive like the Warrior)."
    ],
    questHooks: [
      "Defend a celestial observatory from an eclipse monster that devours starlight.",
      "Travel to a 'fallen star' impact site to commune directly with a Constellation's raw power.",
      "Re-chart a 'lost' Constellation by finding its scattered Law Fragments across the world."
    ],
    tags: ["celestial", "oath", "law", "astral", "magic"],
  },
  {
    id: "divinity_pathway",
    name: "Divinity Pathway",
    category: "Path",
    summary: "Structured ascension with rites, domains, and divine authority.",
    description: "A formal path to godhood, structured around divine domains, sacred rites, and ascending tiers of authority. This pathway turns faith, deeds, and dominion into a quantifiable measure of divinity, allowing a mortal to climb the ladder of cosmic power and become a true deity.",
    coreLoop: [
      "Select a core 'Domain' (e.g., Harvest, Justice, Secrets, Storms) that defines your divine portfolio.",
      "Gather 'Acolytes' and convert 'Faith' from mortals by performing deeds aligned with your Domain.",
      "Spend Faith to perform 'Sacred Rites,' unlocking minor boons and progressing towards the next Divine Tier.",
      "Complete a 'Trial of Ascension'—a major test of your worthiness—to rise to a new Tier of Divinity (e.g., Demigod, Lesser God, True God)."
    ],
    progression: [
      "At higher Tiers, your Domain's influence becomes a passive, regional law (e.g., a God of Justice's domain naturally exposes lies).",
      "Unlock 'Divine Manifestations,' allowing you to create avatars, bestow blessings on champions, or pronounce curses.",
      "Gain the ability to establish your own 'Divine Realm'—a pocket dimension shaped by your will and Domain.",
      "Absorb or merge with other minor domains to expand your divine portfolio and power."
    ],
    narrativeHooks: [
      "Existing gods of the pantheon view you as an upstart rival, a potential ally, or a useful pawn.",
      "Your personality and physical form begin to subtly transform, reflecting the nature of your chosen Domain.",
      "You are plagued by the prayers of your followers, feeling their joy, suffering, and endless demands.",
      "Philosophers and heretics may arise to challenge the legitimacy of your newfound godhood."
    ],
    questHooks: [
      "An older, forgotten deity of a similar Domain awakens to challenge you for supremacy.",
      "A rival god attempts to 'poison' your domain by spreading a conflicting ideology among your followers.",
      "Find and reclaim a 'Lost Artifact' of your Domain to unlock a powerful, forgotten aspect of your authority.",
      "Your most devout champion is in peril, and saving them requires a direct, personal intervention that risks exposing your divine nature."
    ],
    tags: ["divine", "ritual", "ascension", "faith", "domain"],
  },
  {
    id: "weapon_law_authority",
    name: "Weapon Law Authority",
    category: "Authority",
    summary: "Master a weapon so completely you rewrite the laws of combat.",
    description: "An authority that elevates mastery of a single weapon type from mere skill into a form of localized, absolute law. Your chosen weapon ceases to be just an object; it becomes a conceptual tool that dictates the rules of engagement, reality itself bending to accommodate its supremacy.",
    coreLoop: [
      "Declare a 'Weapon Doctrine' (e.g., 'The Unbroken Spear,' 'The All-Piercing Arrow,' 'The Final Blade').",
      "Achieve 'Weapon Feats' (e.g., parrying a mountain-crushing blow, striking a target through a storm) to accumulate 'Law Fragments'.",
      "Spend Law Fragments to etch 'Edicts' onto your weapon, granting it passive, reality-defying properties (e.g., 'This blade cannot be broken,' 'This arrow never misses').",
      "Activate a 'Domain of Doctrine'—a temporary field where your weapon's law is absolute, weakening other combat styles."
    ],
    progression: [
      "Your weapon becomes a 'Relic of Law,' gaining a personality and history tied to your deeds.",
      "Unlock 'Conceptual Strikes,' which don't just damage the body but attack a target's meaning (e.g., striking their 'hope' or 'footing').",
      "Achieve 'Law Ascension,' allowing you to become the living embodiment of your doctrine, able to manifest your weapon from pure will.",
      "Your Domain of Doctrine can be made permanent in a specific location (e.g., a dojo, a fortress), making you unbeatable there."
    ],
    narrativeHooks: [
      "Legendary blacksmiths are either terrified of your weapon or desperate to study it.",
      "Old masters who have reached the pinnacle of conventional skill seek you out to understand the 'next step' you represent.",
      "The gods of war and combat are disturbed by your authority, as you enforce a law that is not their own.",
      "Your weapon may develop cravings or aversions, refusing to strike the unworthy or demanding to be tested against legendary foes."
    ],
    questHooks: [
      "Find and defeat a rival 'Law-Bearer' to absorb the key principles of their doctrine into your own.",
      "A legendary monster can only be defeated by a specific, conceptual attack that you must first formulate and master.",
      "Your weapon has been 'shattered' on a conceptual level by a powerful curse; you must reforge its 'meaning' by performing a series of impossible feats.",
      "Establish a world-renowned school for your doctrine, defending it from those who would see it destroyed."
    ],
    tags: ["combat", "doctrine", "law", "weapon", "mastery"],
  },
  {
    id: "territory_core_dominion",
    name: "Territory Core Dominion",
    category: "Authority",
    summary: "A base-building authority that transforms a location into a personal kingdom with its own laws.",
    description: "An authority that allows you to claim a 'Territory Core,' turning a physical location—be it a fortress, a forest, or a floating island—into a sovereign domain. Within this domain, your will becomes law, allowing you to alter the environment, buff allies, and hinder enemies on a fundamental level.",
    coreLoop: [
      "Plant a 'Core Seed' in a location to claim it as your Dominion.",
      "Generate 'Sovereignty' by building structures, attracting residents, or completing 'Dominion Projects'.",
      "Spend Sovereignty to enact 'Edicts'—localized laws that affect everyone within your borders (e.g., 'The Law of Accelerated Growth,' 'The Edict of Unwavering Loyalty').",
      "Defend your Core from 'Incursions' by rival powers or monsters attracted to its growing power."
    ],
    progression: [
      "Expand your Dominion's borders, absorbing more land and resources.",
      "Your Core evolves, unlocking new structure types and more powerful Edicts (e.g., from a 'Stone Core' to a 'Crystal Core').",
      "Develop a 'Dominion Symbiosis,' allowing you to draw power directly from your territory, granting you immense strength while within its borders.",
      "Project a 'Shard of Dominion,' a small, temporary zone of your authority that can be deployed on a battlefield outside your borders."
    ],
    narrativeHooks: [
      "Refugees and pioneers flock to your domain, seeing it as a haven, creating a bustling and complex society you must manage.",
      "Neighboring rulers see your expanding borders as an act of aggression, leading to diplomatic tension or outright war.",
      "The very nature of the land begins to change to reflect your personality and Edicts, becoming a paradise, a grim fortress, or a surreal wonderland.",
      "Your sense of self begins to merge with your territory; a wound to the land feels like a personal injury."
    ],
    questHooks: [
      "A legendary architect appears, offering to build a unique, 'Mythic' structure in your domain if you can provide the impossible materials.",
      "A 'Core Parasite' has infested your Dominion, secretly subverting your Edicts and sowing dissent. You must find and purge it without destroying your own territory.",
      "To upgrade your Core to the next tier, you must connect it to a ley line or other source of immense natural power, which is fiercely guarded.",
      "Negotiate a trade agreement or mutual defense pact with another powerful Dominion-holder."
    ],
    tags: ["territory", "dominion", "defense", "base-building", "law", "strategy"],
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
  {
    id: "martial_attribute_nexus",
    name: "Martial Attribute Nexus",
    category: "System",
    summary: "Full access to all martial attributes for perfect min-maxing.",
    description: "A system that unlocks every martial parameter, allowing for dynamic and precise control over combat attributes. It enables perfect optimization for any situation.",
    coreLoop: [
      "Unlock attribute dimensions through combat milestones.",
      "Reallocate attribute points freely outside of combat.",
      "Create and save attribute loadouts for different scenarios.",
    ],
    progression: [
      "Higher mastery unlocks finer control and new derivative attributes (e.g., 'Impact Stability').",
      "Unlock 'Attribute Weaving' to blend parameters for unique combat styles.",
    ],
    narrativeHooks: [
      "Old masters are baffled by your perfect form, which adapts beyond known styles.",
      "Rivals accuse you of cheating as you counter their techniques flawlessly.",
    ],
    questHooks: [
      "Defeat a master of a specific attribute to unlock its highest tier.",
      "Find a 'Nexus Crystal' to unlock a new dimension of attributes.",
    ],
    tags: ["martial", "attributes", "optimization", "min-max"],
  },
  {
    id: "critical_strike_mandate",
    name: "Critical Strike Mandate",
    category: "Authority",
    summary: "Guarantees critical hits, making damage output unfair.",
    description: "An authority that rewrites the laws of probability, fixing critical strike chances to your advantage. Damage becomes a matter of when, not if.",
    coreLoop: [
      "Land hits to charge the 'Certainty' meter.",
      "Expend Certainty to guarantee a critical strike.",
      "Chain criticals to enter a 'Shatter' state, boosting critical damage.",
    ],
    progression: [
      "Increase the cap of the Certainty meter.",
      "Unlock passive abilities that automatically trigger guaranteed criticals under specific conditions.",
    ],
    narrativeHooks: [
      "Enemies with high defense become trivial, shifting the balance of power.",
      "Beings of fate and luck see you as an anomaly that must be corrected.",
    ],
    questHooks: [
      "Shatter a legendary, 'unbreakable' artifact.",
      "Win a duel where you are only allowed to deal damage via critical hits.",
    ],
    tags: ["critical", "damage", "fate", "authority", "rng"],
  },
  {
    id: "pain_suppression_protocol",
    name: "Pain Suppression Protocol",
    category: "System",
    summary: "Removes pain and prevents stamina collapse from injury.",
    description: "A biological protocol that completely numbs pain and negates the debilitating effects of injuries, allowing for combat effectiveness even when critically wounded.",
    coreLoop: [
      "Suffer injuries to build 'Tolerance' stacks.",
      "Expend Tolerance to purge secondary effects like stuns or bleeding.",
      "Enter a 'Numb State' at high Tolerance, gaining temporary hit points.",
    ],
    progression: [
      "Passively increase resistance to status effects based on injuries sustained.",
      "Unlock 'Phantom Pain' abilities, allowing you to project suppressed pain onto enemies.",
    ],
    narrativeHooks: [
      "Allies see you as an unflinching bastion; enemies see a monster that doesn't know when it's dead.",
      "Healers are disturbed by your lack of response to grievous wounds.",
    ],
    questHooks: [
      "Withstand a famous torture technique without flinching.",
      "Protect an ally for an extended period while under continuous fire.",
    ],
    tags: ["survival", "tank", "pain-immunity", "endurance"],
  },
  {
    id: "reputation_resonance_engine",
    name: "Reputation Resonance Engine",
    category: "System",
    summary: "Reputation, whether fear or respect, becomes raw power.",
    description: "An engine that converts social standing, such as fear, infamy, respect, or honor, into tangible combat and social buffs.",
    coreLoop: [
      "Perform actions that align with a chosen reputation (e.g., 'Infamous' or 'Honorable').",
      "Gain 'Resonance' points based on how NPCs and factions perceive you.",
      "Activate 'Aura of Reputation' to manifest buffs (e.g., fear aura, inspiring presence).",
    ],
    progression: [
      "Unlock new reputation paths with unique abilities.",
      "At high tiers, your reputation can passively alter NPC behavior and open new questlines.",
    ],
    narrativeHooks: [
      "Entire towns might lock their doors as you approach, or roll out the red carpet.",
      "Your reputation precedes you, often leading to skewed initial encounters.",
    ],
    questHooks: [
      "Achieve a 'Legendary' reputation status with a major faction.",
      "Flip your reputation from dreaded to revered (or vice-versa).",
    ],
    tags: ["social", "aura", "reputation", "scaling"],
  },
  {
    id: "threat_escalation_protocol",
    name: "Threat Escalation Protocol",
    category: "System",
    summary: "Become stronger when outnumbered; an anti-gank engine.",
    description: "A combat protocol that grants stacking power for each additional enemy engaged. It is designed to turn overwhelming odds into an advantage.",
    coreLoop: [
      "Engage multiple enemies to gain 'Escalation' stacks.",
      "Each stack provides a bonus to stats like speed, damage, and defense.",
      "Unleash a 'Culling Wave' that deals damage proportional to the number of enemies.",
    ],
    progression: [
      "Increase the stat bonuses per Escalation stack.",
      "Unlock new abilities that are only usable when fighting a certain number of foes.",
    ],
    narrativeHooks: [
      "You are seen as the perfect vanguard for breaking enemy lines.",
      "Assassins and duelists find you surprisingly weak in one-on-one combat.",
    ],
    questHooks: [
      "Single-handedly hold off an army's advance at a chokepoint.",
      "Survive an ambush by a vastly superior force.",
    ],
    tags: ["scaling", "combat", "aoe", "anti-swarm"],
  },
  {
    id: "battlefield_harvester",
    name: "Battlefield Harvester",
    category: "System",
    summary: "Collect stat fragments like loot from fallen foes mid-battle.",
    description: "A system that materializes the strengths of defeated enemies into tangible fragments that can be collected for temporary, stacking boosts in the midst of combat.",
    coreLoop: [
      "Defeat enemies to spawn 'Attribute Fragments' (e.g., 'Fragment of Strength').",
      "Collect fragments to gain temporary, stacking stat boosts.",
      "Combine different fragment types to unlock powerful, short-term 'Harmonized' states.",
    ],
    progression: [
      "Increase the duration and potency of attribute fragments.",
      "Unlock the ability to permanently fuse a small percentage of harvested stats after a battle.",
    ],
    narrativeHooks: [
      "Battlefields you leave are eerily barren, devoid of residual energy.",
      "Other scavengers and necromancers see you as a rival.",
    ],
    questHooks: [
      "Collect a fragment from a hundred different enemy types.",
      "Defeat a boss and harvest a 'Primal Attribute Fragment' before it dissipates.",
    ],
    tags: ["scaling", "combat", "looting", "temporary-buffs"],
  },
  {
    id: "demonic_heritage_throne",
    name: "Demonic Heritage Throne",
    category: "Authority",
    summary: "Claim a demonic lineage, granting hellish authority and powers.",
    description: "An authority that awakens a dormant demonic bloodline, bestowing a throne of hellish power, command over lesser demons, and access to forbidden arts.",
    coreLoop: [
      "Embrace demonic temptations to unlock 'Infernal Seals'.",
      "Use 'Demonic Edicts' to command, bind, or banish supernatural entities.",
      "Consume mortal sins or chaos to fuel your demonic abilities.",
    ],
    progression: [
      "Ascend the demonic hierarchy, from a minor fiend to a Duke of Hell.",
      "Your throne gains influence over a specific domain of sin (e.g., Deceit, Wrath).",
    ],
    narrativeHooks: [
      "Angelic or holy orders actively hunt you down.",
      "Demons both challenge your authority and try to curry your favor.",
    ],
    questHooks: [
      "Usurp the throne of a rival demon lord.",
      "Corrupt a sacred site to establish a permanent gateway to your domain.",
    ],
    tags: ["demonic", "authority", "bloodline", "summoning", "corruption"],
  },
  {
    id: "absolute_regeneration",
    name: "Absolute Regeneration",
    category: "System",
    summary: "Attrition fights become unwinnable for others due to perfect healing.",
    description: "A biological system that grants rapid, complete regeneration from any wound, as long as a single cell remains. It makes you nearly impossible to kill through conventional damage.",
    coreLoop: [
      "Sustain damage to trigger regeneration, converting a portion of the injury into 'Biomass'.",
      "Expend Biomass to accelerate healing or regrow lost limbs instantly.",
      "Enter an 'Adaptive Overgrowth' state, temporarily evolving to counter the last damage type received.",
    ],
    progression: [
      "Increase the speed of regeneration and the efficiency of Biomass conversion.",
      "Learn to store and shape excess Biomass into temporary biological weapons or armor.",
    ],
    narrativeHooks: [
      "Scientists and mages wish to study you, often by dissecting you first.",
      "Enemies must resort to exotic, non-physical attacks like soul-destruction or reality erasure.",
    ],
    questHooks: [
      "Regenerate from a single drop of blood.",
      "Survive an 'annihilation' type attack that is supposed to negate regeneration.",
    ],
    tags: ["regeneration", "survival", "tank", "immortality", "adaptation"],
  },
  {
    id: "energy_conversion_matrix",
    name: "Energy Conversion Matrix",
    category: "System",
    summary: "Convert any energy type into usable fuel for your abilities.",
    description: "A matrix that can absorb any form of energy—kinetic, magical, elemental, spiritual—and convert it into a universal fuel source for your own skills and spells.",
    coreLoop: [
      "Absorb incoming energy attacks or ambient energy.",
      "Store the converted energy in a central 'Reservoir'.",
      "Expend Reservoir energy to power any of your abilities, regardless of their original cost type.",
    ],
    progression: [
      "Improve the conversion efficiency, losing less energy during the process.",
      "Unlock 'Harmonic Overloads' by absorbing a massive amount of a single energy type at once.",
    ],
    narrativeHooks: [
      "You thrive in chaotic, energy-rich environments that are lethal to others.",
      "Mages who rely on a single energy type find their attacks actively strengthening you.",
    ],
    questHooks: [
      "Absorb the full power of a collapsing star or a massive magical storm.",
      "Power an ancient, dead artifact by acting as its living battery.",
    ],
    tags: ["energy", "absorption", "conversion", "resource-management"],
  },
  {
    id: "achievement_title_system",
    name: "Achievement Title System",
    category: "System",
    summary: "Gain permanent passive buffs from completing noteworthy milestones.",
    description: "A system that awards 'Titles' for completing specific, often difficult, achievements. Each equipped Title provides a unique and permanent passive bonus.",
    coreLoop: [
      "Complete hidden or difficult objectives to unlock Achievements.",
      "Claim the associated Title from the system.",
      "Equip a limited number of Titles to activate their passive buffs.",
    ],
    progression: [
      "Increase the number of Title slots you can have active at once.",
      "Unlock 'Compound Titles' by equipping a specific set of related Titles, granting a powerful extra bonus.",
    ],
    narrativeHooks: [
      "Your Titles may appear visibly to others, altering your reputation.",
      "Certain NPCs may only interact with you if you have a specific Title equipped.",
    ],
    questHooks: [
      "Earn a Title that was previously thought to be impossible to achieve.",
      "Defeat an opponent who is empowered by their own set of Titles.",
    ],
    tags: ["achievements", "titles", "passive-buffs", "collection"],
  },
  {
    id: "instant_comprehension_grant",
    name: "Instant Comprehension Grant",
    category: "Privilege",
    summary: "Learn laws, languages, and techniques instantly, skipping decades of study.",
    description: "A privilege that allows for the instantaneous understanding of complex information, from ancient languages to the fundamental laws of reality, by merely observing or touching them.",
    coreLoop: [
      "Encounter a new concept, text, or technique.",
      "Trigger the 'Comprehension Grant' to instantly absorb and understand it.",
      "Apply the newly learned knowledge immediately.",
    ],
    progression: [
      "Reduce the 'cooldown' or 'focus' required between comprehension grants.",
      "Evolve the ability from simple understanding to 'Conceptual Assimilation', allowing you to modify the learned concept.",
    ],
    narrativeHooks: [
      "You become a polymath of impossible genius, but your rapid growth isolates you.",
      "Guardians of ancient knowledge see you as a grave threat who bypasses their sacred traditions of slow learning.",
    ],
    questHooks: [
      "Instantly master a lost martial art mid-duel to defeat its last practitioner.",
      "Decipher an entire library of alien text in seconds to avert a planetary disaster.",
    ],
    tags: ["learning", "knowledge", "comprehension", "privilege", "fast-growth"],
  },
  {
    id: "mentor_symbiosis_link",
    name: "Mentor Symbiosis Link",
    category: "System",
    summary: "Your disciples' growth feeds your own breakthroughs directly.",
    description: "A system that establishes a symbiotic link with students or disciples. A portion of their progress, insights, and breakthroughs are channeled back to you as power.",
    coreLoop: [
      "Accept disciples and provide them with resources or training.",
      "As disciples level up or have epiphanies, you receive 'Symbiotic Feedback'.",
      "Use Symbiotic Feedback to accelerate your own cultivation or unlock unique 'Mentor' abilities.",
    ],
    progression: [
      "Increase the number of disciples you can effectively link with.",
      "Improve the 'feedback ratio', gaining a larger percentage of your disciples' growth.",
    ],
    narrativeHooks: [
      "You are incentivized to find and nurture the most talented individuals.",
      "Rival masters may try to poach your disciples or sabotage their training to weaken you.",
    ],
    questHooks: [
      "Help a disciple achieve a legendary breakthrough against all odds.",
      "Establish your own sect or academy to maximize disciple intake.",
    ],
    tags: ["mentor", "disciple", "scaling", "symbiosis", "teaching"],
  },
  {
    id: "damage_reflection_field",
    name: "Damage Reflection Field",
    category: "Authority",
    summary: "Attackers kill themselves on a field that reflects a portion of all incoming damage.",
    description: "An authority that generates a persistent field around you, automatically reflecting a percentage of any damage taken back at the attacker, often with added effects.",
    coreLoop: [
      "Take damage from an enemy.",
      "A percentage of that damage is instantly reflected back.",
      "Charge a 'Retribution Meter' with reflected damage to unleash a full-power counter.",
    ],
    progression: [
      "Increase the percentage of damage reflected.",
      "Add secondary effects to the reflected damage, such as lifesteal, stun, or armor shred.",
    ],
    narrativeHooks: [
      "Enemies with high burst damage become your greatest weapon.",
      "You are a nightmare for assassins and glass cannons.",
    ],
    questHooks: [
      "Defeat an enemy using only the damage they dealt to you.",
      "Protect a target by having enemies defeat themselves against your reflection field.",
    ],
    tags: ["reflection", "damage", "tank", "counter-attack", "authority"],
  },
  {
    id: "attack_absorption_converter",
    name: "Attack Absorption Converter",
    category: "System",
    summary: "Absorb incoming attacks and convert them into personal stat boosts or energy.",
    description: "A system that allows you to absorb the kinetic and magical energy of attacks, nullifying the damage and converting it into temporary or permanent attribute increases.",
    coreLoop: [
      "Successfully 'block' or 'parry' an attack to trigger absorption.",
      "Convert the absorbed energy into stacking, temporary stat buffs.",
      "At the end of combat, a small portion of the temporary buffs can be made permanent.",
    ],
    progression: [
      "Increase the percentage of an attack's power you can absorb.",
      "Unlock the ability to absorb area-of-effect spells or even environmental hazards.",
    ],
    narrativeHooks: [
      "You grow stronger with every blow you endure, turning sieges into power-leveling sessions.",
      "Foes must use subtle tactics or non-damaging abilities to have any hope of winning.",
    ],
    questHooks: [
      "Absorb a 'world-ending' spell and survive.",
      "Reach a new power level by baiting a powerful enemy into attacking you relentlessly.",
    ],
    tags: ["absorption", "scaling", "tank", "growth", "defense"],
  },
  {
    id: "law_comprehension_codex",
    name: "Law Comprehension Codex",
    category: "Authority",
    summary: "Understand and manipulate the fundamental laws of the world like tools.",
    description: "An authority that grants you an intuitive and growing understanding of the world's underlying rules—from physics to magic. You can bend or even locally rewrite these laws.",
    coreLoop: [
      "Observe a natural or magical phenomenon to 'Trace' its underlying Law.",
      "Gain 'Law Fragments' which can be slotted to grant passive immunities or abilities.",
      "Expend massive energy to temporarily 'Overrule' a local law (e.g., 'Gravity: Off').",
    ],
    progression: [
      "Combine Law Fragments to understand and manipulate more complex, 'Conceptual' laws (e.g., Law of Death, Law of Time).",
      "Establish a 'Domain' where your understanding allows you to set the rules permanently.",
    ],
    narrativeHooks: [
      "Reality seems to glitch or warp around you during intense moments.",
      "Primordial beings and guardians of reality see you as either a potential savior or a cosmic threat.",
    ],
    questHooks: [
      "Fix a 'broken' law in a corrupted region.",
      "Win a fight by rewriting a fundamental law your opponent relies on, like the Law of Inertia.",
    ],
    tags: ["law", "reality-bending", "authority", "meta", "comprehension"],
  },
  {
    id: "status_immunity_field",
    name: "Status Immunity Field",
    category: "System",
    summary: "Poison, curses, fear, and other status effects no longer work on you.",
    description: "A biological or magical field that automatically identifies and neutralizes hostile status effects, from common poisons and stuns to high-tier curses and mental domination.",
    coreLoop: [
      "Be targeted by a status effect.",
      "The field automatically analyzes and nullifies it, granting a temporary 'Adaptive Purity' buff.",
      "Expend Adaptive Purity stacks to reflect the next status effect back at the caster.",
    ],
    progression: [
      "The field evolves from immunity to 'Assimilation', allowing you to consume status effects for energy.",
      "Develop a 'Purge Aura' that extends your immunity to nearby allies.",
    ],
    narrativeHooks: [
      "You can walk through poison swamps and cursed lands unharmed.",
      "Assassins and debuff-focused mages find their entire toolkit rendered useless against you.",
    ],
    questHooks: [
      "Enter the heart of a plague-ridden city to retrieve an artifact.",
      "Cleanse a powerful curse from a divine being by absorbing it yourself.",
    ],
    tags: ["immunity", "defense", "status-effects", "purification"],
  },
  {
    id: "reality_edit_interface",
    name: "Reality Edit Interface",
    category: "Framework",
    summary: "Make minor, localized edits to reality that can lead to major outcomes.",
    description: "A framework that provides a limited interface to 'edit' small details of the immediate environment or object properties, constrained by a strict energy and causality cost.",
    coreLoop: [
      "Identify a small, editable parameter in your vicinity (e.g., 'friction=0.1', 'sword.brittleness=0.9').",
      "Expend 'Causality Charge' to apply the edit.",
      "Witness and exploit the cascading consequences of the small change.",
    ],
    progression: [
      "Increase your maximum Causality Charge and the number of parameters you can edit simultaneously.",
      "Unlock 'Conceptual Edits', allowing you to alter abstract properties like 'hope' or 'luck' in a small area.",
    ],
    narrativeHooks: [
      "You cause a series of improbable, 'Final Destination'-style accidents for your enemies.",
      "Guardians of time and fate hunt you for creating paradoxes.",
    ],
    questHooks: [
      "Defeat a god-like entity by editing the 'divinity' property of their artifact to 'null'.",
      "Prevent a castle's collapse by editing the 'structural_integrity' of a single falling stone.",
    ],
    tags: ["reality-bending", "meta", "exploit", "causality", "subtle-power"],
  },
  {
    id: "ability_generator_engine",
    name: "Ability Generator Engine",
    category: "System",
    summary: "A power engine that continuously generates new, random abilities.",
    description: "An internal engine that constructs and bestows new abilities at a steady rate. These abilities can range from trivial to reality-breaking, but are often temporary and unpredictable. Your power is not in a fixed set of skills, but in your endless, chaotic potential and adaptability.",
    coreLoop: [
      "The Generator produces a new 'Latent Ability' on a fixed or variable timer.",
      "Complete a 'Resonance Trigger'—a specific, often strange, condition—to awaken the Latent Ability (e.g., 'Sing backwards for 10 seconds,' 'Take exactly 7 steps').",
      "Wield the new, often temporary, ability to overcome challenges.",
      "Expend or 'Shatter' an existing ability to fuel the generator, speeding up the next creation or influencing its category."
    ],
    progression: [
      "Upgrade the Generator's 'Quality Control', increasing the likelihood of higher-tier abilities.",
      "Unlock 'Harmonization Slots', allowing you to make a favorite temporary ability permanent, at the cost of slowing the generation rate.",
      "Develop 'Catalyst Injection', allowing you to feed the generator specific concepts or materials to influence the type of ability it creates (e.g., feeding it a flame dragon's heart to generate a fire ability).",
      "Achieve 'Generator Overdrive,' a temporary state where you rapidly generate dozens of low-power abilities at once."
    ],
    narrativeHooks: [
      "Your fighting style is utterly unpredictable, making you a nightmare for tacticians.",
      "You might suddenly generate a socially inconvenient ability at the worst possible moment (e.g., 'Ability to hear stones complaining').",
      "Scholars of magic are desperate to study you, believing you are a key to understanding the origin of powers.",
      "Your own sense of identity can feel fractured, as your core capabilities are always in flux."
    ],
    questHooks: [
      "A specific, legendary ability is needed to solve a crisis, and you must keep generating abilities until you get it by chance.",
      "Your generator has become 'stuck,' producing only useless or comical abilities. You must find a 'Conceptual Lubricant' to get it working again.",
      "A powerful entity wants to harness your generator for their own ends, seeing you as a living power factory.",
      "You have generated a 'Cursed' ability that you cannot get rid of. You must find a way to fulfill its strange, dark condition to finally release it."
    ],
    tags: ["rng", "ability-generation", "chaos", "adaptation", "potential"],
  },
  {
    id: "incubus_charm_system",
    name: "Incubus Charm System",
    category: "System",
    summary: "Gain power by converting emotional and social influence into raw energy.",
    description: "A symbiotic system that feeds on emotional energy—such as desire, devotion, and trust—and converts it into personal power. This is not about mind control, but about becoming the focal point of others' hearts and minds. The system rewards building relationships, inspiring loyalty, and leveraging social networks.",
    coreLoop: [
      "Identify targets with high 'Emotional Resonance'.",
      "Engage in social 'Maneuvers'—from simple conversations to grand gestures—to build 'Influence' over a target.",
      "Convert Influence into 'Essence,' the fuel for your abilities, or 'Bonds,' which create permanent links to powerful individuals.",
      "Use Essence to power charm-based abilities or directly enhance your physical and magical attributes."
    ],
    progression: [
      "Unlock 'Auras of Presence' that passively influence how others perceive you (e.g., 'Aura of Alluring Mystery,' 'Aura of Unquestionable Authority').",
      "Deepen Bonds with key individuals to unlock 'Synergy Abilities,' powerful skills that can only be used when they are near or supportive of you.",
      "Learn to create 'Contracts of Devotion,' formal pacts where an individual willingly channels their power or loyalty to you in exchange for protection or purpose.",
      "Achieve 'Heart Dominion,' allowing you to sense the emotional state of an entire population and subtly influence its morale."
    ],
    narrativeHooks: [
      "You find yourself entangled in complex political and romantic webs, whether you intend to or not.",
      "Powerful individuals may become obsessed with you, seeing you as either the love of their life or their ultimate rival.",
      "Your powers are less effective against those with no emotional attachments or those whose hearts are already completely devoted to another cause.",
      "You must constantly balance the needs and desires of your 'bonded' allies, as their conflicts can weaken your own power."
    ],
    questHooks: [
      "Win the loyalty of a key political figure to prevent a war, using only your influence.",
      "A powerful entity has 'Shackled' the heart of someone you need as an ally; you must find a way to break the shackle without destroying their will.",
      "Someone has discovered the nature of your power and is systematically turning your allies against you, forcing you to win them back or cut them loose.",
      "To reach the next tier of power, you must inspire true, unyielding hope in a city that has fallen to absolute despair."
    ],
    tags: ["social", "influence", "charm", "seduction", "diplomacy", "scaling"],
  },
  {
    id: "slime_evolution_core",
    name: "Slime Evolution Core",
    category: "System",
    summary: "Evolve from a primordial state by absorbing everything.",
    description: "You are a creature of endless potential, starting as a basic slime. Your power comes from your unique ability to absorb the traits, skills, and matter of anything you consume. Every monster defeated, every magic item eaten, every strange mineral consumed becomes a part of your ever-expanding evolutionary matrix.",
    coreLoop: [
      "'Absorb' a target creature or object, breaking it down into raw 'Genetic Essence' and 'Trait Fragments'.",
      "Use Genetic Essence to increase your core stats (e.g., mass, density, agility).",
      "Integrate Trait Fragments into your slime body to gain new skills or properties (e.g., absorb a bat to gain echolocation, absorb steel to gain a hardened shell).",
      "Manage your 'Instability'—absorbing too many conflicting traits at once can lead to dangerous mutations."
    ],
    progression: [
      "Unlock 'Apex Forms' by absorbing a powerful 'Prime' specimen of a species, allowing you to temporarily mimic its form.",
      "Develop 'Skill Synthesis,' allowing you to combine absorbed traits into new, hybrid abilities (e.g., combining 'Fire Resistance' and 'Steel Shell' to create a 'Magma-Forged Carapace').",
      "Gain the ability of 'Mitosis,' allowing you to split off smaller, specialized slime drones that can perform tasks for you.",
      "Achieve 'Perfect Mimicry,' allowing you to flawlessly replicate the appearance and abilities of any creature you have fully absorbed."
    ],
    narrativeHooks: [
      "No one takes you seriously at first, allowing you to operate unnoticed until your power becomes terrifyingly obvious.",
      "Your physical form is constantly in flux, making it difficult to form lasting relationships or be recognized by allies.",
      "You have an insatiable hunger for new traits, driving you to seek out the rarest and most dangerous creatures and artifacts.",
      "Fragments of the memories and personalities of creatures you absorb may linger, causing strange dreams or personality shifts."
    ],
    questHooks: [
      "To evolve past a certain threshold, you must find and absorb a piece of a legendary, mythical creature (e.g., a dragon's scale, a phoenix's feather).",
      "A powerful alchemist wants to capture you, believing you are the ultimate catalyst for creating a philosopher's stone.",
      "You have absorbed a 'Cursed' trait that is causing you to slowly lose control. You must find and absorb its conceptual 'antidote' before you become a mindless monster.",
      "An entire ecosystem is threatened by a magical plague; you can save it by absorbing the plague, but you risk being completely consumed by it yourself."
    ],
    tags: ["evolution", "absorption", "mimicry", "monster", "adaptation", "scaling"],
  },
];

export function getArchetypeSystemById(id) {
  return ARCHETYPE_SYSTEMS.find((system) => system.id === id) || null;
}
