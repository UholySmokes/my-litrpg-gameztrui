# Complete Lore Compendium

This document gathers the currently playable lore and worldbuilding canon that exists in the repository, with the goal of separating setting truth from implementation notes and UX bugs.

Primary sources used:

- `docs/lore/VOIDVERSE_ORIGIN.md`
- `packages/game-core/src/world/WorldDataRegistry.js`
- `packages/game-core/src/world/OpeningArcRegistry.js`
- `packages/game-core/src/world/OpeningTutorialBundleRegistry.js`
- `packages/game-core/src/data/OpeningScenePack.VoidverseStartScenes.js`
- `packages/game-core/src/data/OpeningScenes.js`
- `packages/game-core/src/data/QuestCatalog.js`
- `packages/game-core/src/data/generated/character-creation/races.json`
- `packages/game-core/src/data/generated/character-creation/classes.json`
- `packages/game-core/src/data/generated/character-creation/origins.json`
- `packages/game-core/src/data/generated/professions/profession-summaries.json`
- `src/ui/modes/creationChamberManifest.js`
- `src/hook/useCharacterCreationReworked.js`

## Canon Layers

The repo currently has four lore layers that stack together:

1. **Primordial canon**: the Voidverse creation myth.
2. **Regional canon**: the current playable theater, Shardfall Meridian.
3. **Onboarding canon**: the ritualized character-creation chambers, oath logic, opening arcs, and first-scene fiction.
4. **Roster canon**: races, classes, professions, and quest hooks that describe the kinds of people and powers that exist in the setting.

These layers are compatible when read as "cosmic truth -> local region -> player entry point -> playable identity."

## Primordial Canon: The Voidverse

At the highest level, the setting begins with **the Void**, not as evil emptiness but as an aware primordial presence. The repository frames the Void as ancient, patient, and almost grandmotherly in the way it restrains itself around fragile life.

Core truths:

- The Void became aware of itself, and that self-awareness created the first rule: awareness can have structure.
- **Space** was the first dilution of pure Void-purity: a merciful distance between reality and the raw source.
- **Time** was the second gift: change that allows learning, error, and survival.
- Matter, stars, worlds, and life came later as stable patterns within that softened reality.
- **Magic is permission**, not theft. Mortals do not steal from the oldest thing; they safely negotiate with laws bigger than themselves.
- **Voidspark** is the survivable seed of raw Void-energy, filtered through space and time so a soul is not erased by contact.

This makes the cosmology unusually kind in tone even when the setting is dangerous. The Void is not described as a god demanding worship. It is a reality-source that wants fragile beings to survive long enough to hold the impossible without breaking.

## The Active Play Region: Shardfall Meridian

The current world bible names the playable region **Shardfall Meridian**, set in the era **After the Spirefall**.

Tagline:

> A neon arcology stitched to broken leylines and living myth.

Setting pillars:

- Neon sanctuaries over ancient bones.
- Leylines as infrastructure and addiction.
- Factions barter in contracts, not virtue.
- The System records, tempts, and mislabels.
- Hope survives as a practice, not a prophecy.

Three local cosmology anchors define day-to-day life in Meridian:

- **The Void**: not pure evil, but meaning-eroding absence that appears in thin places where reality wears thin.
- **Leylines**: mana routes treated like utilities, tariffs, transport rails, and political leverage.
- **The Spirefall**: the collapse of a regulating tower that desynced districts, hardened faction borders, and made system echoes feel like weather.

## Historical Timeline

The regional timeline currently resolves to the following sequence:

- **Year -40**: The Spire is raised as a regulator, sold as a "civilization patch."
- **Year -18**: Leyline black markets form beneath bazaar underwalks.
- **Year -12**: The skydocks are completed and become a second capital.
- **Year -8**: The Veil Archive seals its first ledger with living ink.
- **Year -3**: A coastal ward fails briefly; the Tideward Order forms as a permanent watch.
- **Year 0**: **The Spirefall**. Stormglass rains across the ruins and zones fracture.
- **Year 2**: Arcane Wardens establish quarantine boundaries and salvage rights.
- **Year 5**: The Aurum Exchange standardizes soulcoin contracts across the city.
- **Year 7**: The Ember Bloom ignites for the first time in recorded memory.
- **Year 9**: Mirage Guides publish route-glyphs readable only at dusk.
- **Year 11**: Smoke Wardens begin major vent-sealing campaigns.
- **Year 13**: Dream-wisps surge, and mnemonic dust becomes a civic commodity.

## The Wider World Beyond Meridian

The world bible also sketches a wider setting outside the immediate play region:

- **Auric Crown**: cathedral-states exporting blessings like tariffs.
- **Glassstep Expanse**: stormglass deserts where reflections lie.
- **Emberline Archipelago**: volcanic islands organized around living vents.
- **Veilward Depths**: underworld cities that burn secrets as fuel.
- **Skybound Marches**: high-altitude frontier ruled by engine law.
- **Wildroot Basin**: grove networks where diplomacy is grown instead of spoken.

These read like expansion-facing lore stubs rather than fully explored regions, but they establish the larger tone of the setting.

## Zones, Biomes, and Essence Signatures

The current active map is split into ten major zones. Each is both a physical region and a magical profile.

### 1. Stormglass Ruins

- Summary: The Spirefall's scar, full of exposed leylines and salvage law written in lightning.
- Dominant essences: lightning, earth, air.
- Notable locations:
  - Leyline Plaza
  - Stormglass Crater
  - Quarantine Barricade
  - Signal Spire

### 2. Meridian Arcology

- Summary: A neon sanctuary built atop ancient bones, where commerce is a spell and safety is a clause.
- Dominant essences: air, light, creation.
- Notable locations:
  - Neon Bazaar
  - Sunspire Temple
  - Holo-Bazaar Underwalk

### 3. Wildroot Fringe

- Summary: Grove networks and ash-fed growth where diplomacy is grown, not spoken, and monsters have titles.
- Dominant essences: life, earth, water.
- Notable locations:
  - Rootbound Camp
  - Ember Bloom Ridge
  - Mosslit Clearing
  - Seed-Oath Grove

### 4. Skyforge Skydocks

- Summary: Open-air platforms ruled by engine-law, gantries, turbines, patrol drones, and altitude pressure.
- Dominant essences: air, lightning, light.
- Notable locations:
  - Skyforge Platforms
  - Gantry Row
  - Engine Quay
  - Drydock Seven

### 5. Veilward Undercity

- Summary: Tunnels, ledger vaults, auctions of memory, and a civic economy built on secrecy.
- Dominant essences: shadow, water, earth.
- Notable locations:
  - Wet Gate
  - Veil Archive
  - Memory Auction
  - Inkwell Sluice

### 6. Crystal Ridgeworks

- Summary: Resonant forges, tuning crystals, and fracture-prone ambition high in the mountains.
- Dominant essences: earth, air, lightning.
- Notable locations:
  - Starforge Foundry
  - Crystal Ridgeline
  - Rune Sentinel Watch
  - Echoforge Steps

### 7. Tideward Coast

- Summary: Breakwaters and ward-stones holding back abyssal pressure and bureaucratic disaster in equal measure.
- Dominant essences: water, air, life.
- Notable locations:
  - Tideward Pier
  - Breaker Shrine
  - Astral Waypoint
  - Lantern Reef

### 8. Glassstep Sands

- Summary: Stormglass dunes, mirage routes, and false horizons treated almost like contracts.
- Dominant essences: air, fire, time.
- Notable locations:
  - Mirage Caravanserai
  - Oracle Sundial
  - Glassstep Dunes
  - Glassstep Cistern

### 9. Emberline Caldera

- Summary: Living vents, ash treaties, pressure doors, and the constant possibility of geological betrayal.
- Dominant essences: fire, earth, destruction.
- Notable locations:
  - Smoke Warden Redoubt
  - Ashen Caldera
  - Vent-Seal Chamber
  - Ventwarden Outpost

### 10. Mnemonic Dreamscape

- Summary: Thin places where memory, identity, and the System's labels all become unstable.
- Dominant essences: space, time, shadow.
- Notable locations:
  - Wisp Meadow
  - Mnemonic Siltbank
  - Mirrorpool Thin Place
  - Lucid Switchyard

## Factions

The setting's politics are dominated by eight major factions and three smaller groups.

### Major factions

- **Arcane Wardens**: quarantine engineers and salvage-law enforcers who monetize stability.
- **Aurum Exchange**: contract lords who standardized soulcoin and convert favors into debt.
- **Verdant Envoys**: grove diplomats negotiating with roots, spores, and ecological collapse.
- **Skyforge Sentinels**: engine-law marshals who treat altitude as sovereign territory.
- **Veil Wardens**: ledger-keepers and silence-cultists who police secrets like infrastructure.
- **Tideward Order**: coastal wardens holding back abyssal pressure and maritime catastrophe.
- **Mirage Guides**: route-scribes who sell paths that only exist at the right angle of light.
- **Smoke Wardens**: vent-sealers and ash treaty brokers keeping the caldera from redrawing the map.

### Minor factions

- **Stormglass Nomads**: caravan scavengers reading lightning like language.
- **Mnemonic Alchemists**: refiners of dream-wisp dust into commodity and disaster.
- **Skyfisher Guild**: air harvesters who catch things that should not be catchable.

## Character Origins and Oath Origins

The repository currently uses two related but different concepts:

- **Origin**: your personal background.
- **Oath origin / starting point**: the zone where your chronicle begins.

This distinction is part of the actual fiction, even if some UI flows still blur the terms.

### Background origins

- **Freehold Scrapper**: black-market salvage survivor who turns scraps into leverage.
- **Ledger Apprentice**: raised among invoices, audits, and contract violence.
- **Salvage Adept**: a ruin-reader shaped by dead towers and forgotten machinery.
- **Grove Exile**: someone from the wild margins where roots and pacts matter more than coin.
- **Deckhand Cadet**: a catwalk-and-engine upbringing built on timing and grit.
- **Archive Runner**: undercity courier, thief, and witness who outran secrets.
- **Tidebound Votary**: harbor and shrine initiate trained to hear omens under pressure.
- **Sandstep Scout**: caravan runner who learned to navigate mirages and false horizons.
- **Ashmarked Prospector**: caldera laborer hardened by ash, blood, and scarcity.
- **Dreamwake Survivor**: someone who returned from a place that edits memory.

### Starting points currently defined in character creation

All ten zones have character-creation summaries as possible starting points:

- Meridian Arcology
- Leyfall Ruins
- Wildroot Fringe
- Skyforge Skydocks
- Veilward Undercity
- Tideward Coast
- Crystal Ridgeworks
- Glassstep Sands
- Emberline Caldera
- Mnemonic Dreamscape

### Pilot oath arcs currently implemented

The current opening-arc registry actively supports three oath-origin pilot arcs:

- **Meridian Contract Pressure**
- **Tideward Omen Pressure**
- **Skyforge Redline Pressure**

Each of these pairs the player's sealed oath with:

- a named signature NPC,
- a first pressure,
- a landmark cluster,
- a favored action vocabulary,
- and a first quest that turns the starting point into a concrete obligation.

## Character Creation as Lore

The onboarding fiction is not just UX skin. It is part of the setting's presentation of identity and rebirth.

The five current chambers are:

- **Binding Hall**: name and governing system.
- **Lineage Vault**: race and bloodline.
- **Doctrine Forge**: class, role, profession.
- **Soul Crucible**: attributes, skills, perks, alignment.
- **Oath Mirror**: starting point, opening command, and final chronicle seal.

This means the game frames player creation as a ritual of authorship, not a menu tree.

## Opening Scene Canon

There are two parallel opening-scene layers in the repo:

- biome and quest-aware legacy openings,
- a deterministic starter scene pack with explicit player choices and seeded consequences.

### Deterministic starter scene pack titles

- Moonlit Awakening in the Den
- Fate in the Fog
- Midnight Raid at the Inn
- Apprentice Trial: Sand and Sweat
- White Mist, Old Runes
- Guildhall: Contracts and Bad Decisions
- Workshop: The Missing Catalyst
- Market Day: Salt and Steel
- The Library of Broken Laws

These openings establish several recurring motifs:

- waking in a body that feels borrowed,
- the System appearing as advisory and slightly hostile bureaucracy,
- immediate pressure over abstract destiny,
- first choices shaping both tone and mechanics,
- and "survive first, define yourself second."

The opening scene content also reinforces **Voidspark** as a starter-level concept: not infinite power, but a survivable, aching spark of impossible origin.

## Main Quest Canon

Nine major quest lines currently define the broad crisis map of the region:

- **Echoes of the Fallen Spire**: stabilize a shattered leyline tower in the ruins.
- **Whispers in the Neon Market**: stop a soul-buying conspiracy before Meridian riots.
- **The Ember Bloom Accord**: decide the fate of an igniting world-tree bud.
- **Starforge Siege**: retake the skydocks forge before the city core is breached.
- **Ashen Caldera Descent**: seal volcanic ruptures before magma floods the wilds.
- **Veil Archive Heist**: steal a hidden ledger before the Veil Wardens reclaim it.
- **Crystal Forge Resonance**: realign a mountain forge before resonance shatters the ridge.
- **Tide Breach**: restore a failed ward and repel an abyssal coastal surge.
- **Oracle of the Sundial**: decode a desert prophecy before a mirage storm descends.

These quests collectively define the setting's pressure points:

- unstable infrastructure,
- contested magical resources,
- memory and secrecy economies,
- ecological collapse,
- and factions weaponizing "public safety."

## Side Quest Canon

Fifteen side-quest hooks flesh out daily life and regional texture:

- Ghoul Pit Cleanup
- Skyfisher Net
- Mnemonic Dust
- Storm Capacitor
- Frost Lattice
- Rune Cache
- Bloomed Spores
- Venom Exchange
- Auric Harmony
- Quake Relief
- Astral Waypoint
- Mirage Map
- Spiral Weave Trial
- Stormwater Capture
- Ashfire Taming

These show what people in the setting actually need done: clearing nests, stabilizing magic hardware, gathering volatile reagents, keeping refugees alive, interpreting route magic, and proving that strange new forms of essence work can be held without catastrophe.

## Peoples and Lineages

The current generated roster includes **55 playable races**. The list itself is useful because it shows the breadth of the world: human baselines, divine and infernal bloodlines, constructs, dream-touched peoples, elemental descendants, engineered lineages, and reality-adjacent beings all coexist.

Current race roster:

- Pure Human
- Neo-Human
- Ancient Bloodline
- Spirit Beast
- Demon Kin
- Celestial Descendant
- Shadow Walker
- Dragon Blood
- Elemental Attuned
- Mutant
- Undead Awakened
- Fae Touched
- Beast Kin
- Mechanical Construct
- Void Walker
- Phoenix Reborn
- Nature Spirit
- Crystal Being
- Chaos Born
- Divine Scion
- Stormforged
- Frostborne
- Emberkin
- Tidecaller
- Sunborn
- Duskborne
- Ironroot
- Skybound
- Bloodwoven
- Starseer
- Rune Sentinel
- Mirageborn
- Quakeborn
- Venomtail
- Auric Seraph
- Gloomshade
- Sandstrider
- Umbral Oracle
- Verdant Shaper
- Astral Nomad
- Riftborn
- Ashenblood
- Glacierkin
- Luckweaver
- Blood Frenzied
- Grim Revenant
- Sparkborn
- Whisper Fae
- Shadow Veil
- Wild Mutant
- Flux Attuned
- Ironhide
- Echo Spirit
- Chaos Touched
- Sunforged

The race descriptions point to several cultural and metaphysical truths:

- bloodline matters,
- elemental affinity matters,
- death and undeath are survivable states rather than total endpoints,
- cybernetics and constructs exist beside spiritual lineages,
- and "between realms" identities are normal enough to be playable.

## Orders, Doctrines, and Classes

The current generated roster includes **30 classes**. They cover martial, divine, arcane, stealth, ranged, ritual, and hybrid traditions.

Current class roster:

- Warrior
- Rogue
- Mage
- Cleric
- Monk
- Ranger
- Berserker
- Guardian
- Shadow Assassin
- Trickster
- Archmage
- Battlemage
- Paladin
- High Priest
- Drunken Master
- Iron Fist
- Beastmaster
- Sharpshooter
- War Reaver
- Bulwark Sentinel
- Night Reaper
- Chaos Saboteur
- Astral Archon
- Spellbreaker
- Dawn Vindicator
- Oracle Hierophant
- Tempest Reveler
- Adamant Champion
- Primal Overlord
- Deadeye Commander

The class list suggests a setting where training traditions are broad and well-established, but also heavily hybridized. "Spellbreaker," "Oracle Hierophant," and "Tempest Reveler" imply that doctrine in this world is shaped by practical response to unstable magic and infrastructure, not just abstract guild lineage.

## Professions and Everyday Civilization

The profession roster matters because it shows what ordinary and extraordinary labor looks like in the setting. There are **21 professions**:

- Blacksmithing
- Alchemy
- Enchanting
- Tailoring
- Jewelcrafting
- Engineering
- Construction
- Mining
- Herbalism
- Skinning & Tracking
- Logging & Woodcutting
- Fishing
- Farming & Agriculture
- Cooking
- Brewing & Vinting
- Butchery
- Inscription & Scribing
- First Aid & Medicine
- Repair & Maintenance
- Portal Creation
- Dyeing & Customization

This is a useful signal for the setting's actual civilization level:

- it is not a pure wilderness world,
- it is not a pure cyber-city either,
- and it expects coexistence between agrarian labor, magical industry, heavy infrastructure, and trade logistics.

## Thematic Reading of the Setting

Across all the files, several themes recur over and over:

- **Power must be filtered to be survivable.**
- **Infrastructure is political.** Leylines, docks, wards, and vents are all civic and factional leverage.
- **Contracts, ledgers, and naming have metaphysical weight.**
- **Identity is unstable but recoverable.** Many openings begin with disorientation, body-shock, or memory uncertainty.
- **Hope is procedural.** The setting rarely promises prophecy; it promises the next action, the next stabilizing act, the next survival decision.
- **The System is present but not fully trustworthy.** It informs, labels, tempts, and sometimes misreads reality.

## Canon vs. Non-Canon Noise

Some things in the repo should not be mistaken for lore:

- playtest notes about the Oath mismatch or contradictory review text are UX reliability findings, not world truth;
- implementation-audit notes about missing mechanics are system commentary, not canon;
- some opening content is broader in tone than the currently anchored Shardfall Meridian region and should be read as setting-adjacent starter fiction unless explicitly bound to a local zone.

The cleanest current reading is:

- **Voidverse cosmology** is the mythic foundation.
- **Shardfall Meridian** is the current grounded region.
- **Oath arcs and opening scenes** are the ritualized player entry into that region.
- **Races, classes, professions, and quests** define the world's lived diversity and active conflict surface.

## Short Canon Summary

The repository's complete lore describes a world born from a patient primordial Void that softened itself into space and time so life could survive contact with the impossible. In the current age, the player enters **Shardfall Meridian**, a neon-and-ruin region still living in the aftermath of the **Spirefall**, where leylines function like infrastructure, contracts function like magic, memory is tradable, and every biome has its own magical ecology. The major factions are not empires of pure ideology but custodians of choke points: quarantine lines, currency, groves, skydocks, ledgers, wards, routes, and vents. Character creation is presented as a ritual of binding lineage, doctrine, soul-loadout, and oath, and the player's first steps are framed as a chronicle beginning under pressure rather than destiny alone.
