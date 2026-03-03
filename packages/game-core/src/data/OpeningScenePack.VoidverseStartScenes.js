export const VOIDVERSE_START_SCENE_PACK = {
  meta: {
    packId: "voidverse_start_scenes_v1",
    version: "1.0.0",
    notes:
      "Deterministic starter scenes. Feed scene.text + chosen outcomeText into your NarratorAgent as the seed. Effects are engine-intents.",
  },
  scenes: [
    {
      id: "start_fog_clan_ashes",
      title: "Fate in the Fog",
      tags: ["xianxia", "combat", "mystic", "tutorial"],
      text: "Cold moss. Hot blood. The world returns in fragments.\n\nYou wake in a forest drowned in white fog, your lungs tasting iron and burnt incense. Torn silk clings to your arms-once a clan robe, now a ragged confession. Somewhere behind the fog, something large drags itself over wet stone, breathing like a furnace that learned hate.\n\nMemory snaps: the night raid, masked cultivators, your elders buying you seconds with their lives. You remember a phrase your mother forced into your mouth-like swallowing a key.\n\nA shape rolls through the mist. A fire-demon, skin cracked with ember-light, eyes like coals that recognize you. Not hungry. Vindictive.\n\nThen a second presence-subtle as snowfall-presses against your senses. Someone is watching. Waiting to see whether you run, fight, or pray.\n\nThe demon leans close enough that heat peels the fog away. \"Little heir,\" it rumbles, \"show me what survived.\"",
      choices: [
        {
          label: "Run. Live now, revenge later.",
          next: "hub_temple_refuge",
          outcomeText:
            "You bolt through the fog, throwing raw Qi behind you like sand in a wolf's eyes. The demon clips your shoulder-pain like molten wire-but you reach stone steps leading to an old temple bell.",
          effects: {
            healthDelta: -1,
            addQuest: "quest_temple_heal_and_oath",
            setFlag: ["met_firedemon", "fled_first_trial"],
          },
          aiHints: [
            "temple refuge",
            "injury described",
            "fog imagery",
            "oath/revenge hook",
          ],
        },
        {
          label: "Fight. If you die, at least be inconvenient.",
          next: "tutorial_combat_firedemon",
          outcomeText:
            "You focus your breath, push Qi into your fist, and strike. The air cracks. The demon reels-surprised that you can touch it at all-and you feel a technique forming in your bones like a new joint.",
          effects: {
            unlockSkill: "skill_qi_strike",
            addQuest: "quest_first_core_cultivation",
            setFlag: ["met_firedemon", "earned_first_technique"],
          },
          aiHints: [
            "first skill unlock",
            "combat tutorial tone",
            "body-as-system metaphor",
          ],
        },
        {
          label: "Speak the hidden phrase your mother burned into you.",
          next: "hub_master_appears",
          outcomeText:
            "You whisper the words. The fog tightens into a ring of pale light. The demon hits an invisible wall and snarls-stuck, contained. Footsteps approach: an old master in striped robes, expression flat as a judge.",
          effects: {
            unlockSkill: "skill_ward_phrase",
            addQuest: "quest_find_clan_relics",
            setFlag: ["met_master", "ward_phrase_used"],
          },
          aiHints: [
            "mentor introduction",
            "ward mechanics",
            "artifact hunt setup",
          ],
        },
      ],
    },
    {
      id: "start_inn_raid_midnight",
      title: "Midnight Raid at the Inn",
      tags: ["fantasy", "action", "choice-heavy", "tutorial"],
      text: "You're dreaming of a warm meal and a world that doesn't try to murder you for existing.\n\nReality disagrees.\n\nA crash downstairs-wood splintering, glass singing its last note. Shouts. Bare feet slapping wet boards. The innkeeper's voice becomes a strangled prayer.\n\nYour starter gear is beside the bed: a too-light practice blade, a half-empty pouch, and the kind of optimism that usually gets people buried.\n\nThrough the door crack you see a bandit's silhouette. He's not sneaking; he's auditing. Like the building owes him money.\n\nOutside, the village dogs stop barking all at once.\n\nThis is either your first heroic moment... or a very educational death.\n\nChoose fast.",
      choices: [
        {
          label: "Kick the door open and attack.",
          next: "tutorial_combat_bandits",
          outcomeText:
            "You lunge before fear can finish its sentence. Steel meets panic. One bandit stumbles back, and you snag a crude dagger as he drops it-souvenir of your poor life choices.",
          effects: {
            healthDelta: -1,
            addItem: "item_crude_dagger",
            addQuest: "quest_track_bandit_cell",
            setFlag: ["bandit_attack_survived"],
          },
          aiHints: ["combat tutorial", "loot hook", "bandit arc"],
        },
        {
          label: "Hide under the bed like a professional coward.",
          next: "investigation_after_raid",
          outcomeText:
            "You fold into the shadows and hold your breath until your lungs file a complaint. Boots pass. Voices argue. You notice a dropped token etched with a guild mark-someone's funding this.",
          effects: {
            addClue: "clue_bandit_guild_token",
            addQuest: "quest_investigate_funder",
            setFlag: ["hid_during_raid"],
          },
          aiHints: [
            "mystery angle",
            "faction/economy tie-in",
            "quiet tension",
          ],
        },
        {
          label: "Escape out the back, keep your skin.",
          next: "hub_road_night",
          outcomeText:
            "You slip out into the cold and run until your lungs burn. You live-congrats. The village will remember this forever (and not in a cute way).",
          effects: {
            reputationDelta: -1,
            addQuest: "quest_return_and_make_amends",
            setFlag: ["fled_village_raid"],
          },
          aiHints: ["moral consequence", "reputation system", "return hook"],
        },
        {
          label: "Cast a simple light spell to expose them.",
          next: "bandit_leader_spotted",
          outcomeText:
            "You whisper the words and the room floods with harsh light. Bandits hiss and flinch. You see the leader clearly-scarred jaw, signet ring. A detail you can sell... or avenge.",
          effects: {
            unlockSkill: "skill_lightflare",
            addClue: "clue_bandit_leader_signet",
            addQuest: "quest_identify_signet_ring",
            setFlag: ["used_lightflare"],
          },
          aiHints: ["spell tutorial", "info economy", "future leverage"],
        },
      ],
    },
    {
      id: "start_arena_apprentice_trial",
      title: "Apprentice Trial: Sand and Sweat",
      tags: ["lightnovel", "tutorial", "combat", "skills"],
      text: "The arena sand sticks to your boots like it wants to join your bloodline.\n\nA bell rings. Heat presses down. Your opponent kneels across from you, breathing hard, waiting for your move like he's been paid by the minute.\n\nAbove, your mentor watches with the calm of someone who's seen hundreds of students fail in extremely creative ways.\n\nA translucent menu flickers at the edge of your vision:\n- Stamina: Low\n- Focus: Unstable\n- Technique Slots: 1/1 (Empty)\n\nThe crowd wants drama. Your mentor wants proof. Your opponent wants you unconscious.\n\nPick a style-your build starts here.",
      choices: [
        {
          label: "Guard and absorb. Learn to not die first.",
          next: "arena_result_guard",
          outcomeText:
            "You raise your guard, shifting weight and breath until the enemy's strikes slide off your stance. You don't look cool, but you remain alive-an underrated flex.",
          effects: {
            unlockSkill: "skill_standfast",
            addQuest: "quest_unlock_second_technique_slot",
            setFlag: ["arena_guard_choice"],
          },
          aiHints: [
            "defensive build",
            "stance mechanics",
            "mentor approval (grudging)",
          ],
        },
        {
          label: "Fast combo. Win before your stamina notices.",
          next: "arena_result_combo",
          outcomeText:
            "You explode forward with a short series of cuts-messy, effective, terrifying. The opponent collapses into the sand, blinking like his life just got patched.",
          effects: {
            unlockSkill: "skill_quick_combo",
            addQuest: "quest_find_weapon_oil_recipe",
            setFlag: ["arena_combo_choice"],
          },
          aiHints: ["aggressive build", "stamina cost", "crafting hook"],
        },
        {
          label: "Feint and punish. Make them regret thinking.",
          next: "arena_result_feint",
          outcomeText:
            "You fake a strike, bait the guard, and land one clean hit. The crowd gasps. Your mentor finally nods-like it physically hurts.",
          effects: {
            unlockSkill: "skill_feint_counter",
            addQuest: "quest_duelist_reputation",
            reputationDelta: 1,
            setFlag: ["arena_feint_choice"],
          },
          aiHints: ["precision build", "crit narrative", "social progression"],
        },
      ],
    },
    {
      id: "start_white_mist_runes",
      title: "White Mist, Old Runes",
      tags: ["mystery", "magic-research", "puzzle", "atmosphere"],
      text: "A shrine appears where your map insists there is only empty hillside.\n\nWhite mist pools at its feet, and runes flicker on the stone like someone left the universe on \"idle.\" The air tastes faintly metallic-like a storm is arguing with reality.\n\nA whisper threads into your thoughts—warm, patient, almost amused: Not all doors open outward.\n\nYour UI glitches for half a second. That's usually a bad sign. Or a good sign with a higher mortality rate.\n\nThe runes aren't decorative. They're instructions—compressed rules, a spell written like math.\n\nYou can feel a threshold here: step wrong and the shrine will either gift you knowledge... or file you under \"lesson.\"",
      choices: [
        {
          label: "Study the runes carefully (research-first).",
          next: "rune_analysis_success",
          outcomeText:
            "You trace patterns, count strokes, compare symmetry. The runes respond like a lock recognizing its key. A fragment of ritual logic snaps into place. Something old and kind steadies your hand—not giving you raw power, just a safe spark of it.",
          effects: {
            unlockSkill: "skill_voidspark",
            addClue: "clue_rune_operator_set",
            addQuest: "quest_combine_rune_operators",
            statDelta: { focus: 1 },
            setFlag: ["runes_studied", "voidspark_awakened"],
          },
          aiHints: [
            "magic as physics",
            "operators/constraints",
            "research journal vibe",
          ],
        },
        {
          label: "Ignore nuance and step through (YOLO metaphysics).",
          next: "mist_teleport",
          outcomeText:
            "You walk in. The mist closes like a mouth. The world flips-then reboots. You land somewhere else with a new pressure behind your eyes: power, but uncalibrated.",
          effects: {
            statDelta: { will: 1 },
            addQuest: "quest_stabilize_unbound_power",
            setFlag: ["teleported_by_shrine"],
          },
          aiHints: ["teleport hook", "unstable buff", "future side effects"],
        },
        {
          label: "Back away. Survive now, obsess later.",
          next: "followup_the_mist_calls",
          outcomeText:
            "You leave. Nothing attacks you. Which somehow feels worse. The whisper follows you anyway, faint and persistent-like a notification you can't swipe away.",
          effects: {
            addQuest: "quest_the_mist_calls",
            setFlag: ["avoided_shrine"],
          },
          aiHints: [
            "delayed quest",
            "psychological hook",
            "nonlinear consequence",
          ],
        },
      ],
    },
    {
      id: "start_guildhall_arrival",
      title: "Guildhall: Contracts and Bad Decisions",
      tags: ["hub", "lightnovel", "humor-dry", "quests"],
      text: "The guildhall smells like ink, ale, and the kind of ambition that ends in a missing limb.\n\nA board of contracts dominates the room: rat infestations, escort jobs, \"mysterious noises\" (which is just poverty with marketing).\n\nThe barkeep squints at you like he's grading your survivability. The guildmaster-a scarred wall of a person-doesn't even look up from the ledger.\n\nA poster near the door reads:\nMONSTER HUNTING - REWARD GUARANTEED*\n\n(*Guarantee not legally binding in the event of monster.)\n\nThis is the safe part of the adventure. It will not last.",
      choices: [
        {
          label: "Read the board (pick a clean tutorial job).",
          next: "hub_contract_selection",
          outcomeText:
            "You scan the contracts and pick the least lethal one. The ink is fresh, the pay is low, and the odds of being eaten are... tolerable.",
          effects: {
            addQuest: "quest_cellar_rats",
            setFlag: ["guild_joined_via_board"],
          },
          aiHints: [
            "tutorial quest routing",
            "economy introduction",
            "low-stakes start",
          ],
        },
        {
          label: "Talk to the guildmaster (earn scrutiny).",
          next: "guildmaster_initiation",
          outcomeText:
            "The guildmaster finally looks up. One long stare. Then: \"You want a contract, you prove you can read one.\" Somehow this is still kinder than most people.",
          effects: {
            addQuest: "quest_guild_initiation",
            reputationDelta: 1,
            setFlag: ["guildmaster_met"],
          },
          aiHints: [
            "mentor-but-not-really",
            "skill check tone",
            "social progression",
          ],
        },
        {
          label: "Observe the room (find a thread to pull).",
          next: "guildhall_suspicious_contact",
          outcomeText:
            "You watch. A quiet figure in the corner avoids eye contact like it's a trap. A courier drops a sealed note onto the guildmaster's desk and leaves too fast. Something is wrong-and probably profitable.",
          effects: {
            addClue: "clue_sealed_note_symbol",
            addQuest: "quest_trace_courier_network",
            setFlag: ["noticed_courier"],
          },
          aiHints: [
            "faction intrigue",
            "network economy",
            "spy vibe",
          ],
        },
      ],
    },
    {
      id: "start_workshop_missing_catalyst",
      title: "Workshop: The Missing Catalyst",
      tags: ["crafting", "alchemy", "systems", "economy"],
      text: "Your workshop is small, ugly, and honest-like the people who can't afford lies.\n\nA half-finished reagent coil sits on your bench. The plan was simple: stabilize a basic enchantment loop, sell it, eat something that isn't sadness.\n\nBut the catalyst vial is empty.\n\nYou remember filling it.\n\nThe ledger says you never bought a replacement. The shelf says someone borrowed it. The lock says it was opened without damage.\n\nEither you're losing time, losing your mind, or someone is quietly siphoning your future.\n\nYou can:\n- audit materials (slow, safe)\n- interrogate neighbors (social risk)\n- push a substitute reagent (high volatility)\n\nYour stomach votes \"hurry.\" Reality votes \"pay attention.\"",
      choices: [
        {
          label: "Audit inventory and logs (prove what happened).",
          next: "workshop_audit_findings",
          outcomeText:
            "You reconcile ledger entries with physical stock. A discrepancy emerges: a single unit of catalyst marked as 'returned' in handwriting that is not yours.",
          effects: {
            addClue: "clue_forged_return_entry",
            addQuest: "quest_find_who_forged_ledgers",
            setFlag: ["workshop_audit_done"],
          },
          aiHints: [
            "economy as gameplay",
            "paper trail",
            "detective crafting",
          ],
        },
        {
          label: "Confront the nearest neighbor-crafter (social play).",
          next: "workshop_neighbor_confrontation",
          outcomeText:
            "You knock. Too polite. Their eyes flick toward your shelf before they answer. People don't do that unless guilt lives there rent-free.",
          effects: {
            reputationDelta: -1,
            addQuest: "quest_neighbor_pressure_or_trade",
            setFlag: ["confronted_neighbor"],
          },
          aiHints: ["social consequence", "trade leverage", "branchable diplomacy"],
        },
        {
          label: "Use a substitute reagent and run the coil anyway.",
          next: "workshop_unstable_enchant",
          outcomeText:
            "You improvise. The coil hums... then screams. The enchantment takes, but the resonance is unstable. Congratulations: you made progress. Also, a problem.",
          effects: {
            unlockRecipe: "recipe_unstable_resonance_coil",
            addQuest: "quest_stabilize_resonance",
            setFlag: ["unstable_enchant_created"],
            healthDelta: -1,
          },
          aiHints: [
            "research failure space",
            "risk/reward",
            "system consequences",
          ],
        },
      ],
    },
    {
      id: "start_market_salt_steel_crash",
      title: "Market Day: Salt and Steel",
      tags: ["economy", "factions", "choice-heavy", "hub"],
      text: "The market is loud, bright, and one bad rumor away from violence.\n\nA salt caravan arrived late. A steel shipment didn't arrive at all. Prices jump like frightened animals. Two factions circle the same stall: traders with clean hands and mercs with clean blades.\n\nA vendor hisses at you: \"If you know something, say it. If you don't, buy something and stop breathing on my profits.\"\n\nThis is the part where 'world simulation' stops being a feature and starts being your problem.\n\nYou can stabilize things, exploit the chaos, or trace the missing goods.\n\nPick your sin.",
      choices: [
        {
          label: "Calm the crowd (prevent a riot).",
          next: "market_riot_averted",
          outcomeText:
            "You talk fast and stand where people can see you. You redirect anger into negotiations. Nobody thanks you, but fewer people bleed.",
          effects: {
            reputationDelta: 1,
            addQuest: "quest_mediation_rewards",
            setFlag: ["market_riot_prevented"],
          },
          aiHints: ["social systems", "faction relations", "noncombat heroism"],
        },
        {
          label: "Buy low, sell high (become the problem).",
          next: "market_profit_play",
          outcomeText:
            "You make quick trades while others panic. Your pouch gets heavier. Your conscience gets lighter. Balance achieved.",
          effects: {
            currencyDelta: 25,
            reputationDelta: -1,
            addQuest: "quest_supplier_contacts",
            setFlag: ["market_profiteer"],
          },
          aiHints: ["economy loop", "morality tag", "future consequences"],
        },
        {
          label: "Investigate the missing steel shipment.",
          next: "market_trace_missing_shipment",
          outcomeText:
            "You follow paperwork and overheard names to a dead-end alley with fresh wagon tracks. Someone diverted the shipment deliberately.",
          effects: {
            addClue: "clue_wagon_tracks_tar_residue",
            addQuest: "quest_find_diverted_steel",
            setFlag: ["shipment_investigation_started"],
          },
          aiHints: ["logistics gameplay", "world state", "trail-based questing"],
        },
      ],
    },
    {
      id: "start_library_broken_laws",
      title: "The Library of Broken Laws",
      tags: ["magic-research", "weird", "systems", "high-hook"],
      text: "The door shouldn't exist.\n\nIt's wedged between two normal buildings, like reality tried to patch a hole and did it badly. The sign reads:\nLIBRARY - QUIETLY ENFORCED\n\nInside, shelves curve in ways Euclid would sue for. Scrolls hum. Books twitch when you look away.\n\nA clerk made of ink stains greets you without moving its mouth:\n\"Welcome. Choose a Law to study. Try not to break it until you understand it.\"\n\nYour UI offers a new panel:\n- Law Slot: Empty\n- Research Capacity: 0/1\n\nThis is either the best day of your life or the start of a very expensive obituary.",
      choices: [
        {
          label: "Study 'Conservation' (power must come from somewhere).",
          next: "library_law_conservation",
          outcomeText:
            "You learn the first rule: nothing is free, including miracles. Your magic gains stability-at the cost of needing real inputs.",
          effects: {
            unlockLaw: "law_conservation",
            addQuest: "quest_find_power_inputs",
            setFlag: ["law_slot_unlocked"],
          },
          aiHints: ["magic as physics", "crafting inputs", "system clarity"],
        },
        {
          label: "Study 'Sympathy' (like affects like).",
          next: "library_law_sympathy",
          outcomeText:
            "You grasp correspondence: hair, names, symbols-connections become levers. Powerful, intimate, ethically horrifying. Great combo.",
          effects: {
            unlockLaw: "law_sympathy",
            addQuest: "quest_collect_sympathetic_links",
            setFlag: ["law_slot_unlocked"],
          },
          aiHints: [
            "ritual mechanics",
            "social consequences",
            "inventory hooks",
          ],
        },
        {
          label: "Study 'Null' (the art of stopping things).",
          next: "library_law_null",
          outcomeText:
            "You learn how to make effects fail. The air feels colder. The clerk seems... pleased. That's concerning.",
          effects: {
            unlockLaw: "law_null",
            addQuest: "quest_field_test_null_zone",
            setFlag: ["law_slot_unlocked"],
          },
          aiHints: ["anti-magic", "control gameplay", "ominous tone"],
        },
      ],
    },
  ],
};

export const VOIDVERSE_START_SCENES = VOIDVERSE_START_SCENE_PACK.scenes;
