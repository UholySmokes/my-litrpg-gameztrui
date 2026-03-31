import { randomChoice } from "../../utils/DeterministicRandom.js";
import { generateName, generateTitle } from "./NameGenerator.js";

const OPENINGS = [
  "When the {omen} split the dusk above {locale},",
  "On the night {faction} broke their oath in {locale},",
  "After {threat} surfaced beyond {locale},",
  "As the {omen} echoed across {locale},",
  "Before dawn reached {locale}, when {threat} stirred,",
];

const CONFLICTS = [
  "{hero} is marked as the only one who can {verb} the {artifact}",
  "{hero} must choose whether to {verb} with {faction}",
  "{hero} is forced to {verb} while hunted by {threat}",
  "{hero} learns the {artifact} answers only to a bearer who can {verb}",
  "{hero} enters a pact to {verb}, even as {faction} closes in",
];

const STAKES = [
  "or the wards around {locale} will fail.",
  "before {threat} consumes the next frontier.",
  "or every oath sworn in {locale} will unravel.",
  "before the {omen} crowns a tyrant.",
  "or the price of power will fall on their allies.",
];

const HOOK_TEMPLATES = [
  "Track the origin of {artifact} and confront {threat}.",
  "Win {faction}'s trust long enough to secure {locale}.",
  "Master a forgotten rite to {verb} before the next eclipse.",
  "Expose the betrayal inside {faction} and claim {artifact}.",
  "Turn the {omen} into an advantage before {threat} strikes.",
];

const LOCALES = [
  "Ironwake Bastion",
  "Moonroot Vale",
  "Emberglass Spire",
  "The Hollow March",
  "Starwell District",
  "Frostvein Crossing",
];

const THREATS = [
  "the Ashbound Choir",
  "a void-scarred leviathan",
  "the Pale Cartel",
  "a memory-harvest syndicate",
  "the Riftbound Tribunal",
  "a cult of mirror saints",
];

const FACTIONS = [
  "the Silver Concord",
  "the Blackreef Syndicate",
  "the Sunken Archive",
  "the Thorn Banner",
  "the Adamant Choir",
  "the Ninth Caravan",
];

const OMENS = [
  "star fracture",
  "blood-red aurora",
  "shattered hourglass",
  "midnight eclipse",
  "singing comet",
  "hollow bell",
];

const ARTIFACT_FORMS = [
  "sigil",
  "codex",
  "relic",
  "crown",
  "engine",
  "blade",
];

const VERBS = [
  "seal",
  "awaken",
  "unbind",
  "outmaneuver",
  "rewrite",
  "survive",
];

function sanitizeToken(token, fallback) {
  const normalized = String(token || "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");

  return normalized || fallback;
}

function formatTemplate(template, tokens) {
  return template.replace(/\{(\w+)\}/g, (_, key) => tokens[key] || "");
}

export function generateNarrative(options = {}) {
  const locale = options.locale || randomChoice(LOCALES);
  const threat = options.threat || randomChoice(THREATS);
  const faction = options.faction || randomChoice(FACTIONS);
  const omen = options.omen || randomChoice(OMENS);
  const verb = options.verb || randomChoice(VERBS);
  const hero = options.heroName || generateName("primal");

  const artifactBase = options.artifactBase || generateName("celestial");
  const artifactForm = options.artifactForm || randomChoice(ARTIFACT_FORMS);
  const artifact = options.artifact || `${artifactBase} ${artifactForm}`;

  const tokens = {
    locale,
    threat,
    faction,
    omen,
    verb,
    hero,
    artifact,
  };

  const summary = [
    formatTemplate(randomChoice(OPENINGS), tokens),
    formatTemplate(randomChoice(CONFLICTS), tokens),
    formatTemplate(randomChoice(STAKES), tokens),
  ].join(" ");

  const title = options.title || `${generateTitle()}: ${locale}`;
  const hook = formatTemplate(randomChoice(HOOK_TEMPLATES), tokens);

  const id = [
    "narrative",
    sanitizeToken(hero, "hero"),
    sanitizeToken(locale, "zone"),
    sanitizeToken(artifact, "artifact"),
  ].join("_");

  return {
    id,
    title,
    summary,
    hook,
    tags: [
      sanitizeToken(locale, "locale"),
      sanitizeToken(faction, "faction"),
      sanitizeToken(omen, "omen"),
    ],
  };
}
