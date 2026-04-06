/**
 * Bulk-applies rich flavor text to all profession recipes.
 * Replaces generic "X crafted through Y." descriptions with
 * dark-fantasy, consequence-driven prose matching the archetype voice.
 *
 * Usage: node scripts/apply-recipe-flavor.mjs
 */
import { readFileSync, writeFileSync } from "fs";

const FILE =
  "packages/game-core/src/data/generated/professions/profession-recipes.json";

// ---------------------------------------------------------------------------
// FLAVOR BANK — keyed by profession, then by item-type keyword, then by tier.
// Structure: professionFlavor[profession][itemType][tier]
// Falls back through: specific id → itemType+tier → profession+tier → profession generic
// ---------------------------------------------------------------------------

const TIER_MOOD = {
  1: "apprentice", // crude, humble, first-step
  3: "journeyman", // reliable, proven, functional
  5: "adept",      // arcane-touched, rare materials, respected
  6: "adept",      // same tier mood as 5
  7: "master",     // fearsome, exquisite, whispered-about
  9: "mythic",     // divine, world-shaking, legend-tier
};

// Per-profession flavor templates.
// Each entry: { [itemTypeKeyword]: { [tier]: "description" } }
// "default" key used when no itemType matches.
const FLAVOR = {
  // =========================================================================
  // ALCHEMY
  // =========================================================================
  alchemy: {
    _named: {
      minor_healing_potion:
        "A humble draught of crushed herbs and spring water. It mends shallow wounds—nothing more, nothing less.",
      minor_mana_potion:
        "Spirit-flower petals dissolved in still water. The faint shimmer restores a wisp of spent mana.",
      healing_potion:
        "Medicinal herbs distilled into a potent restorative. Soldiers trade coin for these before the march.",
      antidote:
        "Charcoal and bitter herb pressed into a tar-black liquid. It burns the poison out before it can settle.",
      mind_focus_elixir:
        "Arcane dust suspended in spirit-flower extract sharpens thought to a razor's edge. The clarity fades, but the spells cast under its influence do not.",
      aurora_flux:
        "Void essence braided with ancient root and prismatic powder. The drinker's veins glow briefly as body and mana knit themselves whole under elemental fury.",
    },
    potion: {
      1: "A cloudy vial of herb-water that soothes minor aches. Every alchemist starts here.",
      3: "A reliable restorative brewed from medicinal-grade herbs. Field medics swear by it.",
      5: "Spirit-flower essence stabilized with arcane dust. The liquid hums faintly when uncorked.",
      7: "Ancient roots surrendered their essence reluctantly for this brew. Drink carefully—the body remembers.",
      9: "Void-touched elixir distilled under conditions most alchemists consider suicidal. Heals what lesser draughts cannot.",
    },
    elixir: {
      1: "A thin, bitter liquid that barely qualifies as alchemy. Functional, if unremarkable.",
      3: "Properly steeped medicinal herbs yield this dependable elixir. Worth more than its ingredients.",
      5: "Arcane resonance hums through every drop. The drinker feels the effect before it touches their lips.",
      7: "Brewed from ancient roots and spirit essence, this elixir tastes like old forests and quiet power.",
      9: "The void bleeds into the glass. Primordial and rare essences merge into something that rewrites the drinker's limits.",
    },
    tonic: {
      1: "A crude tonic that tastes like wet grass. It works, barely.",
      3: "Medicinal herbs steeped long enough to matter. A journeyman alchemist's bread and butter.",
      5: "Spirit-flower and arcane dust produce a tonic that sharpens senses and steadies hands.",
      7: "Ancient root tonic brewed to a formula only master alchemists dare attempt. Side effects vary.",
      9: "Void-essence tonic that pulses with primordial energy. The last tonic many alchemists ever need to make.",
    },
    catalyst: {
      1: "Ground herbs pressed into a reactive paste. It accelerates simpler reactions.",
      3: "Medicinal compounds refined into a stable catalyst. Reliable as a heartbeat.",
      5: "Arcane-infused catalyst that makes lesser reagents behave as though they were rare. Dangerous in careless hands.",
      7: "Spirit essence bound into catalyst form. Other compounds bend around it like water around a stone.",
      9: "Primordial forces compressed into a catalyst that treats natural law as a suggestion. Handle with reverence.",
    },
    default: {
      1: "A basic alchemical preparation. Simple ingredients, honest results.",
      3: "A journeyman brew refined beyond the basics. Steady and dependable.",
      5: "Arcane dust lends this preparation an unearthly potency few can replicate.",
      7: "Master-grade alchemy drawn from ancient roots and spirit essence. Not for the faint-hearted.",
      9: "Void-touched alchemy that borders on the divine. The primordial essence remembers what it was before the world had rules.",
    },
  },

  // =========================================================================
  // BLACKSMITHING
  // =========================================================================
  blacksmithing: {
    _named: {
      iron_ingot:
        "Raw ore beaten into a serviceable bar. The foundation of every smith's first lesson.",
      iron_dagger:
        "A short blade of hammered iron. Cheap, sharp enough, and easy to hide.",
      iron_chainmail:
        "Interlocking iron rings woven by patient hands. Stops a blade; slows its wearer.",
      steel_ingot:
        "Iron and coal married under terrible heat. The resulting steel holds an edge worth respecting.",
      steel_sword:
        "A proper weapon of folded steel and leather grip. Soldiers kill for less.",
      mythril_ingot:
        "Mythril ore refined with spirit essence. The bar weighs less than it should and hums when struck.",
      mythril_blade:
        "Five mythril ingots and enchanted leather produce a blade that cuts reality a little thinner than iron ever could.",
      soulforged_helmet:
        "Adamantine plate shaped around a soul gem. The wearer hears a faint whisper that might be protection—or might be something older.",
    },
    blade: {
      1: "Hammered iron sharpened on a whetstone. A beginner's weapon, but a weapon nonetheless.",
      3: "Steel tempered in coal-fire. The edge holds through punishment that would shatter lesser metal.",
      5: "Mythril-forged and arcane-dusted, this blade seems to anticipate where it's swung.",
      7: "Adamantine and spirit essence fused under a master's hammer. The metal remembers violence and answers it.",
      9: "Divine metal folded with primordial essence. Legends rarely mention how many smiths died perfecting the technique.",
    },
    shield: {
      1: "A flat iron slab with a leather strap. It stops what it can.",
      3: "Steel-braced and properly weighted. A journeyman shield that earns trust through use.",
      5: "Mythril alloy reinforced with arcane dust. Blows land softer than physics should allow.",
      7: "Adamantine-core shield infused with spirit essence. Arrows have been known to apologize mid-flight.",
      9: "Divine metal bonded with primordial force. The shield doesn't block attacks—it denies them permission.",
    },
    armor: {
      1: "Crude iron plates riveted over leather. Protection measured in bruises avoided.",
      3: "Steel plate fitted by a competent hand. Not elegant, but your organs stay inside.",
      5: "Mythril links woven with arcane binding. Light as resolve, hard as consequence.",
      7: "Adamantine plate kissed by spirit essence. Master smiths consider it their signature—or their tombstone.",
      9: "Divine metal armor that reshapes itself around the wearer's intent. The primordial essence inside has opinions.",
    },
    tool: {
      1: "A simple iron implement. It won't impress anyone, but it does the job.",
      3: "Steel-grade toolwork with a comfortable grip. Built to outlast its owner.",
      5: "Mythril-tipped and arcane-balanced. Work done with this tool feels less like labor.",
      7: "Adamantine precision shaped by spirit essence. The tool almost seems to know what you need next.",
      9: "Divine metal wrought into something that treats craftsmanship as a form of prayer. Primordial essence hums in the handle.",
    },
    default: {
      1: "Iron shaped by heat and stubbornness. A smith's first honest work.",
      3: "Steel-grade work with clean lines. Reliable under pressure.",
      5: "Mythril and arcane dust produce something the market prices with nervous respect.",
      7: "Adamantine forged alongside spirit essence. The result unsettles lesser craftsmen.",
      9: "Divine metal and primordial will bent into form. The smith who made this will never make anything ordinary again.",
    },
  },

  // =========================================================================
  // BREWING
  // =========================================================================
  brewing: {
    ale: {
      1: "Thin grain-ale that tastes like ambition and water. A brewer's first attempt.",
      3: "Fruit-fermented ale with enough body to warm a cold night's watch.",
      5: "Spirit-flower and arcane dust produce an ale that changes color as you drink it.",
      7: "Void essence steeped in aged barrels. The flavor profile exists in more dimensions than expected.",
      9: "Divine nectar brewed with primordial patience. One sip rearranges the drinker's understanding of thirst.",
    },
    wine: {
      1: "Grain pressed and fermented with more hope than skill. Barely qualifies as wine.",
      3: "Fruit-wine with a clean finish. Popular at taverns that care about repeat customers.",
      5: "Arcane-touched vintage that sparkles with trapped starlight. Sommeliers weep.",
      7: "Void-essence wine aged beyond mortal patience. Each glass tastes like a memory you haven't made yet.",
      9: "Primordial vintage distilled from divine nectar. Drinking it is closer to communion than consumption.",
    },
    tonic: {
      1: "Grain-based tonic with a medicinal aftertaste. Cheap and necessary.",
      3: "Fruit-fermented tonic refined for potency. Keeps explorers on their feet.",
      5: "Arcane resonance laced through every drop. The body absorbs it before the tongue can object.",
      7: "Void-steeped tonic that recalibrates the drinker's stamina. Side effects include unsettling clarity.",
      9: "Primordial tonic that treats exhaustion as a negotiable condition. Divine nectar demands respect.",
    },
    elixir: {
      1: "A grain-based elixir barely distinguishable from flavored water. Progress starts somewhere.",
      3: "Fruit-derived elixir with a steadying warmth. Adventurers carry these like ritual.",
      5: "Arcane-laced elixir brewed from spirit-flower. The effect lingers longer than expected.",
      7: "Void essence and spirit-infused elixir that tastes like standing in a thunderstorm. For the better.",
      9: "Divine nectar and primordial essence merge into an elixir that rewrites fatigue at the cellular level.",
    },
    default: {
      1: "A simple grain brew. Functional, forgettable, fundamental.",
      3: "Fruit-fermented and respectably potent. A journeyman brewer's quiet pride.",
      5: "Arcane dust elevates this brew beyond ordinary fermentation.",
      7: "Void essence and spirit merge into something taverns can't serve without a license.",
      9: "Divine nectar distilled with primordial intent. The brew transcends its ingredients.",
    },
  },

  // =========================================================================
  // BUTCHERY
  // =========================================================================
  butchery: {
    cured_meat: {
      1: "Salt-rubbed meat hung to dry. Simple preservation for a simple road.",
      3: "Prime cuts cured with care and time. Keeps longer, tastes better, costs more.",
      5: "Exotic meat treated with arcane salt. The preservation borders on unnatural.",
      7: "Dragon steak cured with spirit essence. The meat resists spoilage like it resists everything else.",
      9: "Divine flesh preserved through primordial technique. It tastes like a covenant.",
    },
    jerky: {
      1: "Thin-sliced meat dried over smoke. Trail food that demands nothing and delivers enough.",
      3: "Prime jerky with a peppered bite. Reliable fuel for long marches.",
      5: "Arcane-smoked exotic jerky that sustains beyond what nutrition explains.",
      7: "Dragon-strip jerky infused with spirit essence. Chewing it feels like an argument you're winning.",
      9: "Divine flesh jerky touched by primordial fire. Each strip holds more sustenance than a full meal of lesser meat.",
    },
    sausage: {
      1: "Rough-ground meat stuffed into casing. Don't ask questions; eat it.",
      3: "Prime meat sausage seasoned with intent. The casing holds better things now.",
      5: "Exotic meat sausage laced with arcane spice. Hunger remembers this and behaves.",
      7: "Dragon-meat sausage bound with spirit essence. The filling has an opinion about being eaten.",
      9: "Divine flesh sausage packed with primordial seasoning. Every bite is an event.",
    },
    ration: {
      1: "Compressed meat and grain pressed into a block. It sustains; it does not inspire.",
      3: "Prime rations packed for extended campaigns. Reliable as gravity.",
      5: "Arcane-preserved exotic rations that stay fresh longer than trust.",
      7: "Dragon-meat rations wrapped in spirit essence. They weigh less than they should and last longer than they have any right to.",
      9: "Divine-flesh rations infused with primordial staying power. An army could march on these until the world ended.",
    },
    default: {
      1: "Roughly processed meat for basic consumption. It counts as food.",
      3: "Prime cuts handled with professional skill. Worth the premium.",
      5: "Exotic meat processed with arcane technique. The results unsettle conventional butchers.",
      7: "Dragon-sourced provisions treated with spirit essence. Not many butchers survive the sourcing.",
      9: "Divine flesh rendered by primordial method. The butcher's art taken to its furthest consequence.",
    },
  },

  // =========================================================================
  // CONSTRUCTION
  // =========================================================================
  construction: {
    wall: {
      1: "Timber stacked and nailed. It keeps weather out and little else.",
      3: "Stone-block wall with mortar joints. Siege engineers treat these with respect.",
      5: "Reinforced brick fused with arcane dust. The wall shifts subtly to distribute force.",
      7: "Enchanted masonry bonded with spirit essence. Battering rams break before this does.",
      9: "Void-structure wall threaded with primordial will. It exists more firmly than the ground beneath it.",
    },
    gate: {
      1: "A timber gate held by iron hinges. It swings open and closed—the rest is up to you.",
      3: "Stone-framed gate with reinforced crossbar. Keeps honest threats honest.",
      5: "Arcane-warded gate of reinforced brick. Unauthorized entry triggers consequences.",
      7: "Enchanted masonry gate sealed with spirit essence. Opening it requires permission, not force.",
      9: "Void-structure gateway infused with primordial authority. Only passage granted by intent can cross its threshold.",
    },
    tower: {
      1: "A timber watchtower. It gives you height and a better view of approaching problems.",
      3: "Stone-block tower built for permanence. Archers love the sightlines.",
      5: "Reinforced brick tower humming with arcane ward-lines. Threats are spotted before they're visible.",
      7: "Enchanted masonry spire saturated with spirit essence. The tower sees what sentries miss.",
      9: "Void-structure tower anchored in primordial geometry. Distance becomes negotiable from its apex.",
    },
    workshop: {
      1: "A timber shed with a workbench. Ambition required; space provided.",
      3: "Stone-block workshop with ventilation and tool racks. Craft improves when the workspace doesn't fight you.",
      5: "Arcane-reinforced workshop where materials behave more predictably than they should.",
      7: "Enchanted masonry workshop flooded with spirit-tuned air. Projects finish faster inside these walls.",
      9: "Void-structure workshop stabilized by primordial forces. The laws of materials bend gently to accommodate the crafter's will.",
    },
    default: {
      1: "Timber construction assembled with basic tools. Functional shelter or support.",
      3: "Stone-block structure raised with journeyman precision. Built to endure.",
      5: "Arcane-reinforced construction that hums faintly in the walls.",
      7: "Enchanted masonry shaped by spirit essence. The structure remembers why it was built.",
      9: "Void-structure raised with primordial intent. It occupies space with an authority ordinary buildings lack.",
    },
  },

  // =========================================================================
  // COOKING
  // =========================================================================
  cooking: {
    _named: {
      simple_meal:
        "Meat and vegetables over an open flame. It fills the belly and quiets the road's complaints.",
      bread:
        "Flour and water shaped by heat into something that turns strangers into guests.",
      hearty_stew:
        "Prime meat, vegetables, and spices simmered until comfort becomes inevitable. Soldiers call it morale in a bowl.",
    },
    meal: {
      1: "Rough-cut meat charred over flame. Nourishment without pretense.",
      3: "Prime cuts prepared with care. A meal worth coming home to.",
      5: "Arcane-spiced fare that satisfies hungers the body didn't know it had.",
      7: "Rare herbs and spirit essence folded into a meal that restores more than strength.",
      9: "Divine-flesh cuisine prepared with primordial technique. Eating it is an experience that redefines sustenance.",
    },
    stew: {
      1: "Meat boiled until tenderness surrenders. Simple, hot, honest.",
      3: "Prime ingredients slow-cooked into a stew that makes cold camps bearable.",
      5: "Arcane-seasoned stew that warms from the inside and lingers long after the bowl is empty.",
      7: "Spirit-touched stew brewed from rare herbs. The aroma alone has restorative properties.",
      9: "Divine flesh simmered in primordial broth. Each spoonful fills something deeper than the stomach.",
    },
    skewer: {
      1: "Chunks of meat impaled on a stick and held over fire. Tradition at its simplest.",
      3: "Prime meat skewered and flame-kissed. Quick to prepare, satisfying to eat.",
      5: "Arcane-marinated skewers that crackle with residual heat long after leaving the fire.",
      7: "Rare herb–basted skewers infused with spirit essence. The char carries flavor into the soul.",
      9: "Divine-flesh skewers glazed with primordial reduction. Every bite echoes.",
    },
    dessert: {
      1: "Sweet scraps shaped into something that passes for celebration. Morale counts.",
      3: "Prime ingredients assembled into a dessert worth rationing. A treat between battles.",
      5: "Arcane-sweetened confection that lingers on the tongue and sharpens the senses.",
      7: "Spirit-essence dessert made from rare herbs. Sweetness with consequences.",
      9: "Divine confection touched by primordial sugar. The taste outlives the meal by hours.",
    },
    default: {
      1: "Simple fare prepared with basic skill. It keeps you moving.",
      3: "Competently cooked provisions. Nothing wasted, nothing wanting.",
      5: "Arcane enhancement turns ordinary cooking into something memorable.",
      7: "Rare ingredients and spirit essence transform food into restoration.",
      9: "Divine cuisine prepared with primordial intent. Eating becomes ritual.",
    },
  },

  // =========================================================================
  // DYEING
  // =========================================================================
  dyeing: {
    dye: {
      1: "Crude pigment mixed from common sources. The color holds until the first hard rain.",
      3: "Metallic pigment ground and set with fixative. Colors that survive what the wearer survives.",
      5: "Prismatic pigment fused with arcane dust. The dye shifts hue depending on the light—and the viewer's intent.",
      7: "Illusion dust bound with spirit essence into a dye that remembers every color it has ever been.",
      9: "Divine radiance distilled into pigment. The color applied is less a choice and more a statement of cosmic preference.",
    },
    pattern: {
      1: "A simple repeating motif stitched or stamped with basic dye. Recognizable, if unremarkable.",
      3: "Metallic-pigment pattern with clean geometry. Signals competence before the wearer speaks.",
      5: "Prismatic pattern woven with arcane precision. It catches the eye and refuses to let go.",
      7: "Illusion-dust pattern layered with spirit essence. The motif appears to move when observed closely.",
      9: "Divine-radiance pattern sealed with primordial authority. The design tells a story that changes for every observer.",
    },
    glamour: {
      1: "A thin veneer of dye that adds a hint of color. Cosmetic, not transformative.",
      3: "Metallic-pigment glamour that lends armor and cloth a polished authority.",
      5: "Prismatic glamour enhanced with arcane shimmer. The wearer looks more expensive than they are.",
      7: "Illusion-dust glamour fused with spirit essence. Onlookers remember the impression, not the details.",
      9: "Divine-radiance glamour infused with primordial presence. The wearer commands attention without speaking.",
    },
    finish: {
      1: "A basic topcoat of dye that protects against scuffing. Modest in purpose.",
      3: "Metallic-pigment finish with a durable sheen. Weatherproof and presentable.",
      5: "Prismatic finish bonded with arcane dust. The surface repels grime and hostile scrutiny.",
      7: "Illusion-dust finish sealed by spirit essence. The coating adapts to conditions others can't predict.",
      9: "Divine-radiance finish over primordial sealant. The surface exists in a state of curated perfection.",
    },
    default: {
      1: "Basic dye-work applied with apprentice technique. Color over function.",
      3: "Metallic pigment processed into a reliable cosmetic application.",
      5: "Prismatic and arcane-laced dye-work that elevates appearance beyond the ordinary.",
      7: "Illusion dust and spirit essence merge into visual expression that borders on art.",
      9: "Divine radiance harnessed for cosmetic mastery. The result transcends aesthetics.",
    },
  },

  // =========================================================================
  // ENCHANTING
  // =========================================================================
  enchanting: {
    _named: {
      mindshield_charm:
        "Silver ring inscribed with wisdom-essence and arcane ink. The wearer's thoughts become difficult to read and harder to manipulate.",
      stormbrand_enchant:
        "Mythril blade wired with lightning core and soulthread. The enchantment doesn't just add damage—it makes the weapon angry.",
    },
    rune: {
      1: "Arcane ink pressed into a simple shape. The rune holds barely enough power to matter.",
      3: "Elemental shard ground into rune-form. The inscription flickers with contained force.",
      5: "Soul gem carved into a rune that pulses with arcane awareness. It knows when it's needed.",
      7: "Void essence channeled into a master-grade rune. The inscription seems to watch back.",
      9: "Primordial rune etched with divine intent. Reality treats the marked surface differently.",
    },
    sigil: {
      1: "A faint arcane-ink sigil that warns more than it protects. A starting point.",
      3: "Elemental-shard sigil with sharp lines of contained power. Respectable ward-work.",
      5: "Soul-gem sigil pulsing with arcane authority. Hostile magic hesitates at its border.",
      7: "Void-essence sigil drawn with spirit precision. The mark burns cold in the presence of danger.",
      9: "Primordial sigil of divine geometry. The pattern existed before the surface it's drawn on.",
    },
    ward: {
      1: "A basic arcane-ink ward scratched into a surface. It discourages; it does not prevent.",
      3: "Elemental-shard ward with layered defensive geometry. Adequate protection for moderate threats.",
      5: "Soul-gem ward fused with arcane dust. Attacks that reach it lose their conviction.",
      7: "Void-essence ward reinforced by spirit binding. Breaching it costs more than most aggressors can afford.",
      9: "Primordial ward sealed with divine authority. What it protects stays protected until the ward decides otherwise.",
    },
    charm: {
      1: "Arcane-ink charm with a single-purpose enchantment. Modest, but it works.",
      3: "Elemental-shard charm that hums quietly against the skin. Steady, reliable enhancement.",
      5: "Soul-gem charm radiating arcane warmth. The enchantment adjusts subtly to its bearer.",
      7: "Void-essence charm fused with spirit resonance. The charm seems to anticipate what the wearer will face.",
      9: "Primordial charm of divine craftsmanship. The enchantment woven into it predates the jeweler's intent.",
    },
    default: {
      1: "A basic enchantment inscribed with arcane ink. The magic is faint but present.",
      3: "Elemental shards channel steady power into this enchantment. Functional and dependable.",
      5: "Soul-gem and arcane-dust enchantment that carries real weight in the field.",
      7: "Void-essence enchantment bound with spirit precision. Master-tier work that commands respect.",
      9: "Primordial enchantment of divine origin. The magic inside has its own agenda.",
    },
  },

  // =========================================================================
  // ENGINEERING
  // =========================================================================
  engineering: {
    bomb: {
      1: "Scrap casing packed with volatile powder. Throw it and hope your arm is faster than the fuse.",
      3: "Alloy-shell bomb with a measured blast radius. Predictable destruction is still destruction.",
      5: "Arcane-core bomb that detonates on intent rather than impact. The explosion has opinions.",
      7: "Spirit-charged bomb machined from rare alloy. The blast discriminates between friend and target.",
      9: "Primordial explosive of divine engineering. Detonation rewrites the local geometry.",
    },
    turret: {
      1: "A scrap-metal turret that tracks movement with mechanical delay. Better than nothing.",
      3: "Alloy turret with reliable tracking servos. It watches the perimeter so you don't have to.",
      5: "Arcane-powered turret that acquires targets before they know they're hostile.",
      7: "Spirit-infused rare-alloy turret. It fires with prejudice and reloads with patience.",
      9: "Primordial turret of divine engineering. It defends a position with the certainty of a natural law.",
    },
    gadget: {
      1: "A handheld thing made of scrap and optimism. Surprisingly useful.",
      3: "Alloy gadget with moving parts that actually move the way intended.",
      5: "Arcane-powered gadget that stretches the boundary between tool and companion.",
      7: "Spirit-essence gadget machined from rare alloy. It does what you need before you know you need it.",
      9: "Divine-metal gadget infused with primordial logic. The definition of 'tool' bends to accommodate it.",
    },
    automaton: {
      1: "A crude articulated figure of scrap metal. It follows basic instructions, mostly.",
      3: "Alloy automaton with reliable servo-joints. Obedient and durable.",
      5: "Arcane-core automaton that anticipates commands. Something behind its eyes isn't quite mechanical.",
      7: "Spirit-infused automaton built from rare alloy. It pauses sometimes, as if thinking.",
      9: "Divine-metal automaton animated by primordial force. The line between construct and creature blurs.",
    },
    default: {
      1: "Scrap-built engineering. Simple, rough, operational.",
      3: "Quality-alloy engineering with journeyman precision.",
      5: "Arcane-enhanced engineering that outperforms its material cost.",
      7: "Rare-alloy engineering infused with spirit essence. Master-tier function.",
      9: "Divine engineering with primordial complexity. The result exceeds the sum of its parts by orders of magnitude.",
    },
  },

  // =========================================================================
  // FARMING
  // =========================================================================
  farming: {
    grain_sack: {
      1: "A burlap sack of common grain. The foundation of bread, beer, and survival.",
      3: "Enriched grain harvested from tended fields. Fuller kernels, better yield.",
      5: "Arcane-nurtured grain that stores longer than nature allows. Millers notice the difference.",
      7: "Spirit-fed grain from rare cultivar. The sack weighs more than it should—each kernel is dense with vitality.",
      9: "Primordial grain of divine agriculture. Ground into flour, it bakes bread that sustains beyond nutrition.",
    },
    fertilizer: {
      1: "Composted scraps worked into usable amendment. The soil needs what the soil needs.",
      3: "Enriched compost with mineral balance. Crops respond measurably.",
      5: "Arcane-treated fertilizer that makes the ground receptive to things beyond ordinary agriculture.",
      7: "Spirit-essence fertilizer that whispers to the roots. Growth becomes collaborative.",
      9: "Primordial fertilizer of divine composition. The ground accepts it like a sacrament.",
    },
    seedling: {
      1: "A fragile sprout nursed from common seed. Every orchard starts here.",
      3: "A sturdy seedling raised from enriched stock. Roots already reaching.",
      5: "An arcane-quickened seedling that grows visibly between dawn and dusk.",
      7: "A spirit-touched rare seedling. The stem hums with unrealized potential.",
      9: "A primordial seedling of divine genesis. It grows toward something beyond sunlight.",
    },
    harvest_feast: {
      1: "A humble spread of common field produce. Enough to share, enough to be grateful.",
      3: "A generous feast from enriched harvests. The table groans, and morale follows.",
      5: "An arcane-augmented feast that satisfies hungers the body forgot it had.",
      7: "A spirit-blessed feast of rare produce. Guests leave stronger than they arrived.",
      9: "A primordial feast of divine harvest. Eating together becomes a covenant.",
    },
    default: {
      1: "Basic agricultural work. Seed meets soil; patience does the rest.",
      3: "Improved farming technique with enriched materials.",
      5: "Arcane-enhanced agriculture producing yields beyond natural expectation.",
      7: "Spirit-touched farming that borders on communion with the land.",
      9: "Divine agriculture shaped by primordial force. The harvest exceeds mortal planning.",
    },
  },

  // =========================================================================
  // FIRST AID
  // =========================================================================
  first_aid: {
    bandage: {
      1: "Cloth strips wound tight. A bandage slows what would otherwise worsen.",
      3: "Treated cloth with herbal compress. Stops bleeding and buys time for proper care.",
      5: "Arcane-threaded bandage that tightens and loosens in response to the wound's need.",
      7: "Spirit-infused dressing that accelerates clotting and soothes inflamed tissue.",
      9: "Primordial bandage woven from divine thread. The wound forgets it was made.",
    },
    salve: {
      1: "Herb paste spread over scrapes and burns. Relief, not remedy.",
      3: "Medicinal salve compounded for deeper wounds. The pain retreats faster.",
      5: "Arcane-laced salve that seeps into damaged tissue and coaxes it back together.",
      7: "Spirit-touched salve brewed from rare herbs. Application feels like forgiveness.",
      9: "Primordial salve of divine composition. It does not heal—it undoes the injury.",
    },
    kit: {
      1: "A pouch of basic supplies: bandages, salve, hope. It keeps the wounded moving.",
      3: "A well-stocked field kit with suturing tools and herbal compress. Professional-grade triage.",
      5: "An arcane-enhanced kit with self-sterilizing instruments. The supplies anticipate the wound.",
      7: "A spirit-infused medical kit of rare components. Opening it feels like summoning a clinic.",
      9: "A primordial kit of divine medical completeness. It contains what the patient needs before the medic diagnoses.",
    },
    antidote: {
      1: "Charcoal and bitter herb pressed into a crude anti-toxin. Burns going down; poisons burn worse.",
      3: "A reliable antidote brewed from targeted medicinal compounds. Neutralizes common venoms.",
      5: "An arcane antidote that identifies and isolates the toxin before neutralizing it.",
      7: "A spirit-purified antidote that flushes poison from blood and memory alike.",
      9: "A primordial antidote of divine pharmacology. It treats venoms that haven't been invented yet.",
    },
    default: {
      1: "Basic first-aid supplies assembled from common materials.",
      3: "Competent field medicine with reliable medicinal components.",
      5: "Arcane-aided first aid that heals faster than the patient expects.",
      7: "Spirit-enhanced medical treatment from rare materials.",
      9: "Divine first aid with primordial efficacy. The injury becomes a temporary condition.",
    },
  },

  // =========================================================================
  // FISHING
  // =========================================================================
  fishing: {
    fish_fillet: {
      1: "Common fish cleaned and filleted. Simple protein, no pretension.",
      3: "Quality fillet from deeper waters. Clean cuts, firm flesh, honest value.",
      5: "Arcane-preserved fillet from ley-touched waters. The flesh stays fresh unnaturally long.",
      7: "Spirit-caught rare fillet. The meat carries a vitality that cooking doesn't diminish.",
      9: "Primordial fillet of divine aquatic origin. Each bite restores something deeper than hunger.",
    },
    oil: {
      1: "Rendered fish oil for lamps and leather. The smell is the price of utility.",
      3: "Clarified oil pressed from quality catch. Burns cleaner, preserves better.",
      5: "Arcane-distilled oil that glows faintly and repels moisture at a molecular level.",
      7: "Spirit-refined rare oil that lubricates machinery and accelerates healing in equal measure.",
      9: "Primordial oil extracted from divine-depth catch. It fuels things that conventional energy cannot.",
    },
    bait: {
      1: "Common worms and grubs. The fish don't need luxury.",
      3: "Prepared bait with scent enhancement. Draws attention from deeper water.",
      5: "Arcane-treated bait that remains fresh and irresistible regardless of conditions.",
      7: "Spirit-infused bait from rare ingredients. Fish compete for the privilege.",
      9: "Primordial bait touched by divine appeal. The entire body of water takes interest.",
    },
    talisman: {
      1: "A trinket carved from fishbone. Anglers say it brings luck; skeptics catch less.",
      3: "A polished-scale talisman strung on good cord. The fish seem to respect it.",
      5: "An arcane-etched talisman that hums near water. Currents shift to reveal what hides beneath.",
      7: "A spirit-bone talisman from a rare catch. Wearing it changes the angler's relationship with the water.",
      9: "A primordial talisman of divine oceanic origin. The water tells the wearer its secrets willingly.",
    },
    default: {
      1: "Basic fishing supplies for shallow-water work.",
      3: "Journeyman tackle built for serious angling.",
      5: "Arcane-enhanced fishing gear that changes the odds.",
      7: "Spirit-touched fishing equipment crafted from rare materials.",
      9: "Divine fishing apparatus with primordial draw. The water cooperates.",
    },
  },

  // =========================================================================
  // HERBALISM
  // =========================================================================
  herbalism: {
    herb_bundle: {
      1: "Dried herbs tied for storage. The basics of any herbalist's inventory.",
      3: "Sorted and graded medicinal bundle. Organized for efficient dispensing.",
      5: "Arcane-preserved herb bundle that stays fresh far longer than nature intends.",
      7: "Rare-herb bundle sealed with spirit essence. Opening it releases fragrance that has physical effect.",
      9: "Primordial herb bundle wrapped in divine preservation. The contents predate the herbalist's lifetime.",
    },
    tonic: {
      1: "A thin herbal tonic brewed from common roots. Bitter, but the body stops complaining.",
      3: "Medicinal tonic steeped from potent herbs. Reliable restoration for the road.",
      5: "Arcane-infused herbal tonic that courses through the system with purpose.",
      7: "Spirit-distilled tonic from rare botanicals. Drinking it is like remembering health.",
      9: "Primordial tonic of divine herbal extraction. The body doesn't heal—it reverts to its ideal state.",
    },
    salve: {
      1: "Mashed herbs pressed into a paste. Applied to wounds with hope and a steady hand.",
      3: "Medicinal salve compounded for deeper tissue repair. The pain retreats faster.",
      5: "Arcane-fortified salve that works on wounds conventional herbs cannot reach.",
      7: "Rare-herb salve saturated with spirit essence. The compress knows where it hurts.",
      9: "Primordial salve of divine botanical origin. It doesn't treat symptoms—it removes causes.",
    },
    draught: {
      1: "A watery draught of common plant extract. Mild, but it quiets what ails you.",
      3: "A concentrated herbal draught with reliable medicinal punch.",
      5: "Arcane-distilled draught that the body absorbs with alarming efficiency.",
      7: "Spirit-purified draught from rare botanical stock. Each sip is worth a lesser potion.",
      9: "Primordial draught pressed from divine growth. The liquid teaches the body what health means.",
    },
    default: {
      1: "Common herbs gathered and prepared for basic use.",
      3: "Medicinal-grade herbalism with careful preparation.",
      5: "Arcane-touched herbalism producing results beyond ordinary botany.",
      7: "Rare herbs processed with spirit-level care.",
      9: "Divine herbalism drawn from primordial growth. Nature's pharmacy at its deepest.",
    },
  },

  // =========================================================================
  // INSCRIPTION
  // =========================================================================
  inscription: {
    _named: {
      scroll_of_light:
        "Parchment and light-ink shaped into a spell that can be spoken three times before the words fade. Darkness, briefly, becomes optional.",
      basic_glyph:
        "A stone tablet etched with arcane ink. The glyph emits a faint ward that makes the bearer marginally less killable.",
    },
    glyph: {
      1: "Arcane-ink glyph scratched onto a surface. Its protection is a polite suggestion.",
      3: "Elemental-Script glyph with geometric precision. The ward holds against moderate threats.",
      5: "Soul-ink glyph pulsing with trapped power. Proximity triggers its defensive aura.",
      7: "Spirit-essence glyph drawn on rare medium. The inscription guards with autonomous intent.",
      9: "Primordial glyph of divine geometry. The symbols predate mortal alphabets.",
    },
    scroll: {
      1: "Ink on parchment carrying a single minor spell. Read it, speak it, forget it.",
      3: "Elemental Script ink on quality vellum. The words carry enough weight to matter.",
      5: "Soul-ink scroll that resists smudging and demands respect from the spells inscribed within.",
      7: "Spirit-bound scripture on rare vellum. The scroll reads itself aloud if held by someone worthy.",
      9: "Primordial text inscribed with divine purpose. The words existed before the language was invented.",
    },
    rune: {
      1: "Arcane-ink rune carved into a tablet. A faint pulse signals that the binding took.",
      3: "Elemental-Script rune with layered symbolism. The inscription carries force.",
      5: "Soul-ink rune that resonates with arcane frequency. Its meaning shifts depending on who reads it.",
      7: "Spirit-essence rune inscribed on rare stone. The symbol enforces its meaning on the surrounding space.",
      9: "Primordial rune etched with divine authority. The mark remakes the rules in its immediate vicinity.",
    },
    contract: {
      1: "Ink-bound terms on simple parchment. Breaking it brings social consequences, not magical ones.",
      3: "An Elemental-Script contract with binding clauses. The ink knows when the terms are violated.",
      5: "A soul-ink contract that enforces its terms with arcane consequence. Read the fine print.",
      7: "A spirit-bound contract on rare vellum. The agreement has teeth that outlast the signatories.",
      9: "A primordial contract of divine inscription. The terms predate the parties and the penalties are cosmic.",
    },
    default: {
      1: "Basic inscription work in arcane ink. The craft begins with controlled strokes.",
      3: "Elemental-Script inscription with dependable clarity.",
      5: "Soul-ink inscription carrying arcane resonance beyond the ordinary.",
      7: "Spirit-bound inscription on rare medium. Master-level mark-making.",
      9: "Primordial inscription of divine origin. The written form carries the weight of creation.",
    },
  },

  // =========================================================================
  // JEWELCRAFTING
  // =========================================================================
  jewelcrafting: {
    ring: {
      1: "A thin band of polished stone. It fits the finger and flatters nobody.",
      3: "A cut-gem ring with clean settings. Respectable on any hand.",
      5: "Arcane-set ring with a prismatic gem that responds to the wearer's mood.",
      7: "Spirit-essence ring wrought from rare gemstone. The stone whispers when danger nears.",
      9: "Primordial ring of divine crystallography. The gem inside predates the mountain it was found in.",
    },
    amulet: {
      1: "Polished stone on a cord. A token of craft, not power.",
      3: "Cut-gem amulet with reliable enchantment anchor points.",
      5: "Arcane-cut amulet that rests warm against the chest and steadies the pulse.",
      7: "Spirit-infused rare-gem amulet. It hangs heavier when the wearer needs to pay attention.",
      9: "Primordial amulet of divine gemwork. The pendant seems to occupy its own gravitational field.",
    },
    gem: {
      1: "A rough-cut stone polished to modest luster. It reflects light without commanding it.",
      3: "A properly faceted gem that catches light and holds it prisoner.",
      5: "Arcane-treated gem with internal refraction that seems to contain a second sky.",
      7: "Spirit-cut rare gem that pulses with inner luminescence. It has opinions about its setting.",
      9: "Primordial gem of divine clarity. Looking into it shows the viewer something uncomfortably personal.",
    },
    circlet: {
      1: "Polished stone set into a simple headband. Ceremonial at best.",
      3: "Cut-gem circlet with balanced weight distribution. It stays put during combat.",
      5: "Arcane-gem circlet that sharpens thought and narrows focus.",
      7: "Rare-gem circlet infused with spirit essence. The wearer's mind becomes difficult to reach without invitation.",
      9: "Primordial circlet of divine crystalline structure. Thought itself bends around its facets.",
    },
    default: {
      1: "Rough gemwork polished to serviceability. A jeweler's first honest attempt.",
      3: "Cut-gem craftsmanship with precise faceting.",
      5: "Arcane-touched jewelwork that outshines its material value.",
      7: "Spirit-infused rare-gem work. Master-tier elegance with consequence.",
      9: "Divine gemcraft shaped by primordial precision. The result transcends ornament.",
    },
  },

  // =========================================================================
  // LOGGING
  // =========================================================================
  logging: {
    _named: {
      logging_basic_plank:
        "A rough-cut plank of common timber. Straight enough to build with, cheap enough to waste.",
      logging_basic_bundle:
        "An armful of common logs bound with cord. Fuel, material, or ballast—the wood doesn't care.",
    },
    plank: {
      1: "Common timber split and planed. Building material at its most honest.",
      3: "Hardwood plank milled with journeyman precision. Straight, strong, dependable.",
      5: "Ironwood plank infused with arcane sealant. The grain refuses rot and resents fire.",
      7: "Spiritwood plank saturated with essence. It feels warm and alive under the hand.",
      9: "Primordial plank cut from divine-growth timber. The wood remembers being part of something vast.",
    },
    log: {
      1: "A section of common timber. Weight, density, utility.",
      3: "Hardwood log with dense grain. Suitable for structural work.",
      5: "Ironwood log with arcane preservation. It won't burn without permission.",
      7: "Spiritwood log that hums when dragged. The tree didn't die—it transferred.",
      9: "Primordial log from divine timber. The bark still grows.",
    },
    beam: {
      1: "A rough-hewn timber beam. It holds weight, which is the whole job.",
      3: "Hardwood beam squared and treated. Load-bearing confidence.",
      5: "Ironwood beam reinforced with arcane grain. Structures built with these resist what they shouldn't.",
      7: "Spiritwood beam infused with essence. The beam adjusts its support in response to stress.",
      9: "Primordial beam of divine timber. It bears weight as a philosophical stance.",
    },
    bundle: {
      1: "Tied logs of common wood. Portable fuel or building stock.",
      3: "Sorted hardwood bundle graded for purpose. Material with intention.",
      5: "Ironwood bundle sealed with arcane preservation. The wood stays pristine indefinitely.",
      7: "Spiritwood bundle bound with essence-cord. The bundle whispers in a language of rings and roots.",
      9: "Primordial bundle of divine timber. The wood inside remembers the forest as it was before axes existed.",
    },
    default: {
      1: "Common timber processed for utility. The forest gave; the logger took.",
      3: "Hardwood lumber prepared with professional care.",
      5: "Ironwood treated with arcane technique. The wood outlasts its context.",
      7: "Spiritwood shaped by master loggers and spirit essence.",
      9: "Divine timber from primordial growth. The wood is older than the land's memory.",
    },
  },

  // =========================================================================
  // MINING
  // =========================================================================
  mining: {
    _named: {
      mining_basic_ore:
        "Common rock cracked to reveal the metal inside. Every mine starts with a vein like this.",
    },
    ore: {
      1: "Rough ore chipped from a shallow seam. The metal is there—patience extracts it.",
      3: "Quality ore from a reliable vein. Smelters accept this without argument.",
      5: "Deep-vein ore laced with arcane trace minerals. The rock hums when struck.",
      7: "Spirit-seam ore that resists extraction. What it yields is worth the fight.",
      9: "Primordial ore from divine geological strata. The metal inside remembers being molten.",
    },
    ingot: {
      1: "Smelted common ore cooled into bar form. Raw material, ready for purpose.",
      3: "Refined ore cast into a clean ingot. Reliable stock for any forge.",
      5: "Arcane-flux ingot with unusual tensile properties. Smiths handle it with quiet respect.",
      7: "Spirit-refined rare-metal ingot that weighs differently than it should.",
      9: "Primordial ingot cast from divine ore. The metal acts as though it has preferences.",
    },
    gem: {
      1: "A rough crystal chipped from common rock. It catches light; value requires polish.",
      3: "A clean mineral gem extracted from deeper stone. Worth cutting.",
      5: "An arcane-rich gem formation glowing faintly in its matrix. Extraction requires care.",
      7: "A spirit-veined rare gemstone that resists removal from its host rock. The mine objects.",
      9: "A primordial gem of divine geological origin. It existed before the mountain formed around it.",
    },
    dust: {
      1: "Rock powder sifted from common excavation. Useful as reagent base.",
      3: "Mineral dust with consistent particle grade. Clean enough for alchemical use.",
      5: "Arcane-rich dust that glows faintly in the pan. Enchanters pay premium for this.",
      7: "Spirit-touched rare-mineral dust. Each grain carries a residual charge.",
      9: "Primordial dust from divine strata. The particles remember the pressure that made them.",
    },
    default: {
      1: "Common stone broken for what's inside. Mining is patience with a pickaxe.",
      3: "Quality mineral extraction with dependable yields.",
      5: "Arcane-laced mining producing materials beyond ordinary geology.",
      7: "Spirit-seam mining from rare deposits. Master-tier extraction.",
      9: "Divine minerals drawn from primordial depths. The earth surrenders reluctantly.",
    },
  },

  // =========================================================================
  // PORTAL CREATION
  // =========================================================================
  portal_creation: {
    portal_rune: {
      1: "A crude spatial rune scratched into stone. The rift it opens flickers and complains.",
      3: "An elemental-shard rune with stable spatial resonance. Portals lock onto it reliably.",
      5: "An arcane portal rune that broadcasts its position across ley-lines. Finding it is the easy part.",
      7: "A spirit-essence portal rune carved from rare crystal. It persists through dimensional interference.",
      9: "A primordial portal rune of divine fixation. It defines 'here' with absolute authority.",
    },
    waypoint_seal: {
      1: "A simple wax seal marking a spatial coordinate. It holds position, barely.",
      3: "An elemental-shard waypoint seal with reliable lock. Short-range transit made dependable.",
      5: "An arcane waypoint seal that bends distance. The other side is closer than it looks.",
      7: "A spirit-sealed waypoint connecting distant locations. The passage remembers who travels it.",
      9: "A primordial waypoint seal of divine architecture. Distance, time, and possibility negotiate at its threshold.",
    },
    anchor_stone: {
      1: "A heavy stone with a carved spatial marker. It stays put while everything else moves.",
      3: "An elemental-shard anchor stone with stable resonance. Portals reference it without drift.",
      5: "An arcane anchor stone that hums with ley-line awareness. Spatial calculations simplify around it.",
      7: "A spirit-essence anchor stone that resists dimensional turbulence. Fixed in ways solid rock cannot match.",
      9: "A primordial anchor stone of divine permanence. It exists as the spatial origin point for everything nearby.",
    },
    gate_sigil: {
      1: "A scratched sigil that opens a narrow spatial slit. Step through before it changes its mind.",
      3: "An elemental-shard gate sigil with clean aperture. Reliable short-range transit.",
      5: "An arcane gate sigil that opens portals with precise destination control.",
      7: "A spirit-charged gate sigil that opens passages most travelers cannot perceive.",
      9: "A primordial gate sigil of divine resonance. Doors that don't exist yet open when it's activated.",
    },
    default: {
      1: "Basic spatial craft from common materials. A portal-maker's first attempt at folding distance.",
      3: "Elemental-shard portal work with reliable spatial anchoring.",
      5: "Arcane portal creation that treats distance as a suggestion.",
      7: "Spirit-infused spatial mastery from rare materials.",
      9: "Divine portal craft shaped by primordial geometry. Space rearranges itself in cooperation.",
    },
  },

  // =========================================================================
  // REPAIR
  // =========================================================================
  repair: {
    repair_kit: {
      1: "Scrap material and binding wire packed into a rough kit. It holds until something better comes along.",
      3: "Alloy patches and bonding compound in an organized case. The repair outlasts the original where it overlaps.",
      5: "An arcane repair kit that diagnoses damage before the crafter does. The tools guide the hands.",
      7: "A spirit-infused rare-alloy repair kit. The materials choose their own placement for optimal restoration.",
      9: "A primordial repair kit of divine completeness. It doesn't fix items—it convinces them they were never broken.",
    },
    polish: {
      1: "Rough abrasive and elbow grease. The surface improves, grudgingly.",
      3: "Quality polish compound that restores luster and protects against future wear.",
      5: "Arcane polish that bonds at the molecular level. The surface becomes stronger than virgin metal.",
      7: "Spirit-charged polish from rare compounds. The treated surface gains properties the original lacked.",
      9: "Primordial polish of divine metallurgy. The metal forgets every scratch it ever received.",
    },
    reinforcement: {
      1: "Extra strapping and bracing applied to weak points. Functional support at minimum cost.",
      3: "Quality reinforcement plates and bindings. The item regains—and exceeds—its original durability.",
      5: "Arcane-grade reinforcement that integrates with the item's structure. Stronger than a fresh forge.",
      7: "Spirit-fitted rare-alloy reinforcement that merges with the item's original purpose.",
      9: "Primordial reinforcement of divine-grade material. The item evolves past its original design limits.",
    },
    restoration: {
      1: "Basic cleaning and realignment. Restores enough function to keep going.",
      3: "Full restoration with quality materials. The item regains its factory condition.",
      5: "Arcane restoration that reverses wear at a level deeper than surface damage.",
      7: "Spirit-infused restoration from rare materials. The item remembers being well-made and returns to that state.",
      9: "Primordial restoration of divine thoroughness. The item's history of use is erased and its potential rewritten.",
    },
    default: {
      1: "Basic repair work from common materials. It buys time.",
      3: "Competent repair with quality components. Reliable results.",
      5: "Arcane-enhanced repair that improves on the original condition.",
      7: "Spirit-infused master-tier repair from rare materials.",
      9: "Divine restoration with primordial precision. Damage becomes a distant memory.",
    },
  },

  // =========================================================================
  // SKINNING
  // =========================================================================
  skinning: {
    leather: {
      1: "Common hide tanned to basic serviceability. Stiff, but workable.",
      3: "Quality leather tanned from superior stock. Supple and durable.",
      5: "Arcane-cured exotic leather that moves like a second skin.",
      7: "Spirit-steeped rare leather with self-mending properties. Damage heals if you wait.",
      9: "Primordial leather of divine origin. It wears the crafter's intentions like a garment of its own.",
    },
    hide_armor: {
      1: "Stiff hide pieced into rough body covering. Protection measured in bruises prevented.",
      3: "Quality hide armor shaped and hardened. Affordable defense that doesn't embarrass.",
      5: "Arcane-treated exotic hide armor that flexes with the wearer and hardens on impact.",
      7: "Rare-beast hide armor sealed with spirit essence. The armor remembers how the creature survived.",
      9: "Primordial hide armor of divine creature origin. Wearing it changes the wearer's relationship with damage.",
    },
    trophy: {
      1: "A cleaned fang, claw, or bone. Proof of a kill; memory of a hunt.",
      3: "A mounted trophy from quality game. It commands respect on the wall.",
      5: "An arcane-preserved exotic trophy that radiates faint menace. Visitors notice it first.",
      7: "A spirit-sealed rare-creature trophy. It frightens things that should know better.",
      9: "A primordial trophy of divine creature origin. The creature's power lingers in its remains.",
    },
    pelt: {
      1: "Fur and skin dried in sun. It insulates and little else.",
      3: "A trophy-grade pelt cleaned and preserved. Warm, presentable, valuable.",
      5: "An arcane-cured exotic pelt that regulates temperature regardless of climate.",
      7: "A spirit-preserved rare pelt. The fur moves as though something still lives in it.",
      9: "A primordial pelt of divine creature origin. Wrapping in it changes the wearer's relationship with the cold.",
    },
    default: {
      1: "Common creatures yield common material. The skinning is the skill.",
      3: "Quality stock processed with professional technique.",
      5: "Exotic specimens treated with arcane preservation.",
      7: "Rare creatures skinned with spirit-level care.",
      9: "Divine specimens processed with primordial reverence. The material transcends its origin.",
    },
  },

  // =========================================================================
  // TAILORING
  // =========================================================================
  tailoring: {
    robe: {
      1: "Rough cloth stitched into a garment. It fits, and modesty is preserved.",
      3: "Quality-linen robe with reinforced seams. Comfortable and road-worthy.",
      5: "Arcane-woven silk robe that shimmers with residual enchantment. Mages wear these like armor.",
      7: "Spirit-silk robe threaded with essence. The fabric responds to the wearer's magical output.",
      9: "Primordial robe of divine textile. The garment exists in a state of constant, subtle evolution.",
    },
    cloak: {
      1: "Rough-cut cloth shaped into a cloak. It keeps rain off and questions away.",
      3: "Quality-linen cloak with a weighted hem. Moves with purpose, dries with speed.",
      5: "Arcane-silk cloak that adjusts its drape to ambient magical conditions.",
      7: "Spirit-silk cloak woven with essence threads. The fabric darkens in danger and lightens in safety.",
      9: "Primordial cloak of divine weave. Observers forget the wearer's face before they finish looking.",
    },
    bag: {
      1: "Rough cloth stitched into a carry-all. It holds more than it should and complains about none of it.",
      3: "Quality-linen bag with reinforced seams and organized compartments. A traveler's reliable companion.",
      5: "Arcane-silk bag that adjusts its interior to fit the contents. Spatial efficiency as textile craft.",
      7: "Spirit-silk bag woven with essence thread. The interior is larger than the exterior admits.",
      9: "Primordial bag of divine weave. It contains what its owner needs before they know they need it.",
    },
    gloves: {
      1: "Cloth gloves that protect against splinters and little else.",
      3: "Quality-linen gloves with reinforced fingertips. Grip and comfort.",
      5: "Arcane-silk gloves that enhance tactile precision beyond human limits.",
      7: "Spirit-silk gloves woven with essence. The wearer's hands remember skills before the mind recalls them.",
      9: "Primordial gloves of divine weave. What the hands touch, the hands understand—completely and permanently.",
    },
    default: {
      1: "Common cloth worked into a basic garment. Functional textile craft.",
      3: "Quality linen tailored with journeyman skill.",
      5: "Arcane-silk tailoring that elevates cloth into something competitive with metal.",
      7: "Spirit-silk garments woven with master-tier intention.",
      9: "Divine textile shaped by primordial weave. The fabric has ambitions of its own.",
    },
  },
};

// ---------------------------------------------------------------------------
// ITEM-TYPE KEYWORD EXTRACTION
// ---------------------------------------------------------------------------
// Extracts the most specific item-type keyword from a recipe id.
// E.g. "blacksmithing_sturdy_blade" → "blade"
//      "brewing_mythic_ale" → "ale"
//      "mindshield_charm" → "charm"
function extractItemType(id, profession) {
  // Strip profession prefix  e.g. "alchemy_basic_potion" → "basic_potion"
  const stripped = id.startsWith(profession + "_")
    ? id.slice(profession.length + 1)
    : id;

  // Strip tier prefix  "basic_potion" → "potion", "enchanted_meal" → "meal"
  const tierPrefixes = [
    "basic_",
    "sturdy_",
    "enchanted_",
    "masterwork_",
    "mythic_",
  ];
  let core = stripped;
  for (const tp of tierPrefixes) {
    if (core.startsWith(tp)) {
      core = core.slice(tp.length);
      break;
    }
  }
  return core; // e.g. "potion", "blade", "ale", "cured_meat"
}

// ---------------------------------------------------------------------------
// DESCRIPTION RESOLVER
// ---------------------------------------------------------------------------
function resolveDescription(recipe, profession) {
  const profFlavor = FLAVOR[profession];
  if (!profFlavor) return null; // no flavor bank for this profession

  // 1. Check named overrides (_named[id])
  if (profFlavor._named && profFlavor._named[recipe.id]) {
    return profFlavor._named[recipe.id];
  }

  const itemType = extractItemType(recipe.id, profession);
  const tier = recipe.tier;

  // 2. Check itemType + tier
  if (profFlavor[itemType] && profFlavor[itemType][tier]) {
    return profFlavor[itemType][tier];
  }

  // 3. Check default + tier
  if (profFlavor.default && profFlavor.default[tier]) {
    return profFlavor.default[tier];
  }

  return null;
}

// ---------------------------------------------------------------------------
// MAIN
// ---------------------------------------------------------------------------
const raw = readFileSync(FILE, "utf8");
const data = JSON.parse(raw);

let replaced = 0;
let missed = 0;
const misses = [];

// Update byProfession
for (const [prof, recipes] of Object.entries(data.byProfession)) {
  for (const r of recipes) {
    const desc = resolveDescription(r, prof);
    if (desc) {
      r.description = desc;
      replaced++;
    } else {
      missed++;
      misses.push(`${prof}/${r.id} (tier ${r.tier})`);
    }
  }
}

// Update byId (mirror section)
for (const [id, r] of Object.entries(data.byId)) {
  const desc = resolveDescription(r, r.profession);
  if (desc) {
    r.description = desc;
  }
}

writeFileSync(FILE, JSON.stringify(data, null, 2) + "\n", "utf8");

console.log(`Replaced: ${replaced} | Missed: ${missed}`);
if (misses.length) {
  console.log("Misses:");
  misses.forEach((m) => console.log("  " + m));
}
