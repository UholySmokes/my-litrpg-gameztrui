import fs from "node:fs";

const path = "packages/game-core/src/data/archetypes/frameworks.json";
const data = JSON.parse(fs.readFileSync(path, "utf8"));

const updates = {
  fate_selection_engine: {
    summary:
      "A destiny-routing Framework that turns pivotal decisions into visible fate clauses, rejected futures, and escalating narrative debt.",
    description:
      "Fate Selection Engine is a Framework that maps major choices into a visible lattice of lawful but competing futures. It belongs in the Framework category because it organizes destiny routing, clause selection, and consequence management rather than granting direct sovereign control over reality. The bearer encounters pivotal fulcrums where several fate clauses become readable, each offering a bounded path with short-term gains and long-tail costs. Its progression bias favors planning, moral commitment, and strategic acceptance of consequence instead of raw force. The main tradeoff is fate debt, because every chosen route strengthens one branch while leaving rejected futures to curdle into regret, contradiction, or hostile echoes. In the world, Fate Selection Engine should feel both sacred and terrifying because it makes destiny appear less fixed and more legible than most cultures can tolerate. It should also create social and theological instability, since prophets, rulers, and oathkeepers all become nervous when one person can see structured alternatives they were never meant to access. It remains lore-safe because it does not author new fate from nothing, but instead exposes lawful routes already latent in the world and forces the bearer to live with whichever one they select.",
    coreLoop: [
      "Reach a narrative fulcrum where several lawful fate clauses become visible instead of remaining hidden behind ordinary consequence.",
      "Choose one clause, accept its immediate leverage, and reject the alternatives that now harden into lost futures and debt.",
      "Manage the long-tail consequences of that chosen route before regret, contradiction, or hostile echoes destabilize the next fulcrum."
    ],
    progression: [
      "Early growth reveals only a few clear fate clauses at major decisions and teaches the bearer how costly clean choice really is.",
      "Mid progression expands clause clarity, allows limited interaction with lost futures, and improves the bearer's ability to recognize converging destiny pressure.",
      "Late progression makes the bearer frightening in political and narrative space, but only because every chosen path leaves behind ghosts they still must answer for."
    ],
    narrativeHooks: [
      "People may mistake your foresight for prophecy when the harsher truth is that you are living with visible alternatives no one else can bear to see.",
      "Rejected futures can manifest as regret, hauntings, or rival possibilities that resent not being chosen.",
      "The Framework constantly asks whether better outcomes are worth the private graveyard of futures they leave behind."
    ],
    possibleUses: [
      "In gameplay, Fate Selection Engine can support branching clause choices, route-based boons, and visible consequence structures around major decisions. It gives choice systems a concrete mechanical identity instead of leaving them purely narrative. That makes long arcs feel more intentional. It also creates strong reasons to replay or re-route key events.",
      "In narrative and quests, it enables prophecy conflicts, paradox knots, and rival fate-bearer stories where different lawful choices produce incompatible worlds. Characters can choose mercy, tyranny, sacrifice, or escape and still spend later chapters paying for the futures they denied. That gives the Framework emotional reach. It is strongest when every good option costs something real.",
      "In implementation, it maps to branch metadata, clause selection state, fate-debt counters, and lost-future encounter hooks. Those hooks can feed quest branching, narrator recap, and future memory systems cleanly. They also provide a strong spine for long-form consequence tracking. That makes the Framework highly reusable.",
      "Its limitation-aware use comes from making every clause selection an act of commitment rather than optimization. The player should gain structure, not certainty. That preserves tension. The best version feels lawful, haunting, and expensive."
    ],
    limits: [
      "The Engine reveals lawful alternatives at major fulcrums, not every trivial choice or every hidden branch in the world.",
      "Seeing several routes does not guarantee the bearer has the strength, allies, or legitimacy to survive the chosen path well.",
      "Rejected futures do not disappear cleanly and can return as debt, contradiction, or hostile narrative pressure."
    ],
    costs: [
      "Every chosen clause leaves behind lost futures that can haunt judgment, relationships, and later decision space.",
      "The bearer risks paralysis or obsession if they start treating visible possibility as a reason to keep second-guessing lived reality.",
      "Rulers, prophets, and institutions may target the bearer once destiny routing stops looking like inspiration and starts looking like unlawful leverage."
    ],
    worldCompatibility: [
      "Fate Selection Engine remains beneath Void, Grandmother Void, and the highest laws because it routes lawful possibilities instead of inventing new destiny.",
      "It is compatible with branching quests, prophecy, oath conflict, and narrative consequence systems because it structures choice and debt.",
      "Its strongest value depends on fulcrum moments, clause commitment, and fate debt, which keeps the Framework strategic rather than omnipotent."
    ],
    questHooks: [
      "Choose between two fate clauses that both save something precious and spend the next arc surviving what the rejected future sends back at you.",
      "Resolve a paradox knot where earlier clause choices now collide badly enough to threaten a whole region's causality.",
      "Track a rival fate-bearer whose chosen route keeps making your own best futures impossible."
    ],
    tags: ["choice", "destiny", "law", "fate-routing"],
    rarity: "mythic",
    stability: "volatile",
    selectionWeight: 2,
    statModifiers: { intelligence: 3, wisdom: 2 }
  },
  undead_legion_evolution: {
    summary:
      "A legion-management Framework that treats undead forces as a roster of evolving units, doctrines, and promotions rather than disposable summons.",
    description:
      "Undead Legion Evolution is a Framework that treats undead as organized units with ranks, traits, promotion paths, and doctrine-based growth. It belongs in the Framework category because it structures army development, roster management, and battlefield recycling rather than granting one overwhelming necromantic command in isolation. The bearer grows stronger by building a disciplined undead war machine instead of only raising more bodies. Its progression bias favors formation design, attrition logic, and strategic promotion of elite units rather than lone-hero dominance. The main tradeoff is upkeep, because a legion of the dead creates command strain, supply burdens of a different kind, and escalating hostility from cultures that view necromancy as civilizational warfare. In the world, Undead Legion Evolution should feel chillingly administrative because the horror is not just death, but the efficiency with which death becomes roster depth. It should also create pressure from holy orders, grave states, and necropolis factions that all have strong opinions about who is allowed to organize the dead at scale. It remains lore-safe because the Framework still depends on corpses, command capacity, battlefield loss, and doctrine management rather than infinite free armies from nothing.",
    coreLoop: [
      "Raise, recover, or repurpose undead units and assign them roles within a managed legion structure instead of treating them as disposable noise.",
      "Improve the roster through battle results, promotions, doctrines, and specialized unit evolution paths.",
      "Balance growth against command strain, anti-necromancy response, and the logistical reality of maintaining a hated army."
    ],
    progression: [
      "Early growth unlocks rank-and-file coordination, simple role assignment, and better retention of useful undead between battles.",
      "Mid progression expands into elite promotions, doctrine trees, and battlefield recycling that turns loss into structured adaptation.",
      "Late progression turns the legion into a strategic terror, but only if the bearer can keep control of both numbers and political consequences."
    ],
    narrativeHooks: [
      "The Framework makes death feel bureaucratic in the worst possible way, because every corpse can become a form, rank, or promotion candidate.",
      "Holy and funerary cultures will treat the bearer as a walking atrocity long before they measure how effective the legion actually is.",
      "It naturally creates stories about whether command over the dead is military necessity, sacrilege, or the first step toward no longer valuing the living properly."
    ],
    possibleUses: [
      "In gameplay, Undead Legion Evolution can support roster systems, unit promotion trees, doctrine bonuses, and battlefield recycling loops. It gives necromancy a management identity instead of reducing it to summon spam. That makes strategy deeper. It also creates strong distinctions between disposable units and elite undead.",
      "In narrative and quests, it enables tomb wars, purge campaigns, grave politics, and moral conflict around whose dead are being used and why. Characters can be forced into ugly necessity or slide into efficient desecration one promotion at a time. That gives the Framework real social weight. It works best when the army is both useful and unforgivable.",
      "In implementation, it maps cleanly to unit rosters, promotion state, doctrine flags, and command-capacity systems. Those hooks can feed combat, overworld conflict, and narrator summaries without inventing separate logic for every undead subtype. They also support factional response well. That makes the Framework tractable at scale.",
      "Its limitation-aware use comes from requiring management, corpses, and political tolerance the bearer rarely has in abundance. The player should feel strong and besieged at the same time. That preserves tradeoff. The best version feels strategic, grim, and costly."
    ],
    limits: [
      "Legion growth depends on available dead, command capacity, and sustained doctrine, so the bearer cannot conjure endless quality units from nothing.",
      "Elite undead require significant battlefield history, resources, or rare corpses, making promotion a strategic investment rather than a free upgrade.",
      "The Framework performs poorly under sanctified suppression, corpse denial, or internal command collapse."
    ],
    costs: [
      "Managing the dead at scale creates immense hostility from holy orders, grieving families, and any polity that sees burial as sacred law.",
      "Command strain rises with every added unit and can turn a disciplined legion into a catastrophic uncontrolled swarm if neglected.",
      "The bearer risks becoming emotionally numb as bodies turn into roster slots, efficiencies, and doctrinal inputs."
    ],
    worldCompatibility: [
      "Undead Legion Evolution remains beneath Void, Grandmother Void, and higher law because it organizes necromantic logistics instead of superseding the law of death itself.",
      "It is compatible with strategy combat, necromancy, warfront systems, and faction hostility because it structures managed undead growth.",
      "Its strongest value depends on command, corpses, and doctrine, which keeps the Framework terrifying without becoming infinite army creation."
    ],
    questHooks: [
      "Reclaim a battlefield before holy purifiers erase the dead you need to keep your legion from collapsing.",
      "Promote one fallen hero into an elite undead commander and live with what that choice means to everyone who loved them alive.",
      "Hold together a crumbling necropolis doctrine long enough to stop your own evolved legion from turning on you."
    ],
    tags: ["undead", "army", "evolution", "legion"],
    rarity: "legendary",
    stability: "volatile",
    selectionWeight: 2,
    statModifiers: { intelligence: 3, wisdom: 1, vitality: 1 }
  },
  reality_edit_interface: {
    summary:
      "A bounded-edit Framework that lets the bearer alter small environmental or object parameters and weaponize the cascading consequences.",
    description:
      "Reality Edit Interface is a Framework that provides a limited interface for editing small details of the immediate environment or object state. It belongs in the Framework category because it organizes bounded parameter edits, cost accounting, and local causality leverage rather than granting broad authorship over reality. The bearer does not rewrite worlds or laws wholesale, but tweaks manageable values such as friction, brittleness, angle, seal integrity, or other narrow parameters at decisive moments. Its progression bias favors setup, systems thinking, and precise exploitation of consequences rather than direct overwhelming force. The main tradeoff is causality cost, because every edit creates debt, backlash, or correction pressure proportional to how hard the change pushes against local reality. In the world, Reality Edit Interface should feel uncanny and scholarly rather than godlike, because its strength comes from knowing what tiny adjustment will cause the biggest cascade. It should also attract enforcers, philosophers, and panic in equal measure, since people do not enjoy learning that disaster may begin with one edited decimal. It remains lore-safe because the Framework edits bounded parameters inside existing lawful substrate and can still be resisted by scale, anchor strength, and higher-order correction.",
    coreLoop: [
      "Identify a bounded parameter in a nearby object, field, or process that can be edited without collapsing the whole local system.",
      "Pay the causality cost to adjust that value and immediately exploit the resulting cascade before reality corrects too much.",
      "Manage correction pressure and debt so elegant small edits remain a weapon instead of becoming self-inflicted disaster."
    ],
    progression: [
      "Early growth allows simple physical parameter edits such as friction, brittleness, tension, or minor seal disruption in close range.",
      "Mid progression expands into more abstract but still bounded values, better causality budgeting, and cleaner chained edits.",
      "Late progression makes the bearer terrifyingly precise, but only because one lawful nudge in the right place can now decide entire battles."
    ],
    narrativeHooks: [
      "The Framework makes tiny details feel lethal, because the bearer is always looking for the one variable everyone else forgot mattered.",
      "Enemies may fear you less as a sorcerer than as a person who can notice exactly which screw, word, or seam holds their whole plan together.",
      "It naturally creates paranoia around objects and spaces that used to feel stable."
    ],
    possibleUses: [
      "In gameplay, Reality Edit Interface can support small parameter edits, environmental manipulation, trap breaks, and setup-heavy cascade play. It gives intelligence-driven players a way to win through precision rather than raw damage. That makes encounters feel more systemic. It also creates strong cause-and-effect storytelling in combat.",
      "In narrative and quests, it enables impossible escapes, sabotage arcs, architectural rescues, and scenes where one tiny edit decides whether a city stands or falls. Characters can save lives through subtle correction or create horror by treating the world as an editable spreadsheet. That duality is powerful. It keeps the Framework morally sharp.",
      "In implementation, it maps to bounded property targets, edit costs, local correction pressure, and parameter-tagged objects or zones. Those hooks can sit on top of environment, puzzle, and combat systems without requiring global simulation of all reality. They also give the narrator exact language for edited consequences. That makes the feature practical.",
      "Its limitation-aware use comes from keeping edits local, specific, and expensive relative to scale. The player should feel brilliant, not omnipotent. That preserves category clarity. The best version feels surgical and dangerous."
    ],
    limits: [
      "The Interface can only edit bounded local parameters and cannot casually rewrite world laws, identities, or whole regions into new states.",
      "Large or sacred structures generate heavier correction pressure, making broad edits prohibitively expensive or outright refused.",
      "The Framework depends on the bearer recognizing the right variable in time, so ignorance or chaos can still make them helpless."
    ],
    costs: [
      "Every edit creates causality debt that reality, enforcers, or local correction phenomena may later collect painfully.",
      "Overusing the Framework tempts the bearer to overtrust cleverness and underestimate how badly one wrong decimal can cascade.",
      "Observers who understand what happened often react with fear, because the power looks minor until the consequences are not."
    ],
    worldCompatibility: [
      "Reality Edit Interface remains beneath Void, Grandmother Void, and deeper law because it edits bounded parameters instead of authoring reality wholesale.",
      "It is compatible with puzzle, sabotage, engineering, and precision-combat play because it structures local causality leverage.",
      "Its strongest value depends on bounded scope, correction pressure, and parameter literacy, which keeps the Framework sharp without becoming reality sovereignty."
    ],
    questHooks: [
      "Prevent a fortress collapse by identifying the one legal parameter edit that stabilizes the structure without triggering worse correction elsewhere.",
      "Break a god-warded artifact by editing the one mundane property its maker forgot to sanctify.",
      "Choose whether to cause a tiny lawful flaw in a tyrant's machine knowing the cascade will save thousands and kill innocents too."
    ],
    tags: ["reality-bending", "meta", "causality", "precision"],
    rarity: "mythic",
    stability: "volatile",
    selectionWeight: 1,
    statModifiers: { intelligence: 3, wisdom: 2 }
  },
  dungeon_core_mastery: {
    summary:
      "A territory-bound Framework that fuses the bearer with dungeon-core administration, growth, and defensive ecosystem management.",
    description:
      "Dungeon Core Mastery is a Framework that binds the bearer to a dungeon core or a dungeon's governing substrate and turns territory into progression infrastructure. It belongs in the Framework category because it organizes room growth, trap logic, spawn design, and resource absorption rather than granting universal free authority everywhere. The bearer grows stronger by developing a living dungeon and mastering the ecosystem that forms around it. Its progression bias favors defense, planning, ecosystem shaping, and territorial escalation over wandering heroics. The main tradeoff is immobility, because power tied to a dungeon is strongest at home and becomes less decisive the farther the bearer is forced from their governed space. In the world, Dungeon Core Mastery should feel both strategic and monstrous because the bearer stops looking like a mere adventurer and starts looking like a regional threat or resource state. It should also create unusual identity tension, since becoming the mind of a dungeon changes what it means to think about visitors, intruders, and sacrifice. It remains lore-safe because the Framework still depends on mana flow, territory integrity, intruder interaction, and lawful dungeon growth rather than spontaneous private world creation.",
    coreLoop: [
      "Feed a bound dungeon core with mana, intruder pressure, and territorial development so the site can keep growing rather than stagnating.",
      "Design rooms, traps, spawns, and trial logic that turn the dungeon into both a defense network and a progression engine.",
      "Balance growth against exposure, core vulnerability, and the political consequences of becoming a living dungeon power."
    ],
    progression: [
      "Early growth unlocks basic room shaping, low-tier spawn management, and better conversion of intruder pressure into dungeon development.",
      "Mid progression expands into boss design, multi-floor logistics, and specialized dungeon ecologies with clear strategic identity.",
      "Late progression makes the bearer a regional force, but only because their dungeon now functions as economy, fortress, and threat all at once."
    ],
    narrativeHooks: [
      "The Framework blurs the line between protector and predator, because every intruder is both a threat and a resource.",
      "People may stop seeing you as a person and start seeing you as the will of the dungeon itself.",
      "It naturally creates uneasy questions about whether a well-run death maze can ever really count as benevolent."
    ],
    possibleUses: [
      "In gameplay, Dungeon Core Mastery can support room building, trap networks, boss creation, territory progression, and intruder-powered growth. It gives base and defense play a strong progression-fantasy identity. That makes territory matter mechanically. It also creates a nice complement to delver-style content.",
      "In narrative and quests, it enables siege arcs, dungeon diplomacy, anti-raid politics, and stories about what kind of place the bearer chooses to build around their own hunger for growth. Characters can turn a dungeon into refuge, weapon, experiment, or sacrificial machine. That gives the Framework wide moral range. It works best when territory choices visibly affect surrounding lives.",
      "In implementation, it maps to dungeon-state growth, room templates, spawn pools, trap budgets, and territory-based progression systems. Those hooks connect cleanly to encounter design, economy, and faction response. They also give the narrator concrete structural changes to describe over time. That makes the Framework highly practical.",
      "Its limitation-aware use comes from making dungeon power strongest at home and riskier at scale. The player should feel immense inside their domain and exposed when dragged away from it. That preserves the Framework identity. The best version feels territorial, strategic, and hungry."
    ],
    limits: [
      "Dungeon Core Mastery is heavily territory-bound and loses much of its edge when the bearer operates far from the governed dungeon.",
      "Core integrity, mana flow, and intruder pressure all cap growth, making neglect or siege a real existential threat.",
      "The Framework cannot freely create value without territorial substrate; it needs a lawful dungeon body to think and grow through."
    ],
    costs: [
      "The core becomes a strategic weak point whose loss can cripple both the dungeon and the bearer's identity.",
      "Every expansion invites stronger raids, political attention, and moral scrutiny from anyone living near the dungeon's hunger.",
      "The bearer risks changing psychologically as dungeon logic starts prioritizing ecosystem function over ordinary human comfort."
    ],
    worldCompatibility: [
      "Dungeon Core Mastery remains beneath Void, Grandmother Void, and deeper law because it governs lawful dungeon growth rather than private reality creation.",
      "It is compatible with territory systems, defense play, dungeon ecology, and frontier politics because it structures home-bound progression power.",
      "Its strongest value depends on core integrity, mana flow, and territorial control, which keeps the Framework immense but bounded."
    ],
    questHooks: [
      "Defend the core during a raid that knows killing you is less efficient than breaking the dungeon that makes you powerful.",
      "Choose whether to evolve your dungeon into a humane trial ground or a true death labyrinth because both routes will define you forever.",
      "Absorb a rival floor into your own ecology and decide whether conquest is worth inheriting everything wrong with how they built it."
    ],
    tags: ["dungeon", "territory", "core", "ecosystem"],
    rarity: "mythic",
    stability: "volatile",
    selectionWeight: 2,
    statModifiers: { intelligence: 3, vitality: 1, wisdom: 1 }
  }
};

for (const entry of data) {
  const update = updates[entry.id];
  if (!update) continue;
  Object.assign(entry, update);
}

fs.writeFileSync(path, `${JSON.stringify(data, null, 2)}\n`, "utf8");
