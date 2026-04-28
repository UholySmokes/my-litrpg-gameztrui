import { mkdir, readFile, rm, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(__dirname, "..");
const contentRoot = path.join(
  repoRoot,
  "packages",
  "game-core",
  "src",
  "data",
  "generated",
  "character-creation",
);
const outputRoot = path.join(repoRoot, "src", "assets", "creation");

const PACK_VERSION = "2026-04-26";
const RACE_SIZE = 512;
const CLASS_SIZE = 320;
const ORIGIN_WIDTH = 768;
const ORIGIN_HEIGHT = 432;

const TOKEN_COLORS = {
  voidBlack: "#05060d",
  abyssBlue: "#081827",
  deepNavy: "#102640",
  soulCyan: "#42f4ff",
  tealMist: "#89f7d1",
  relicGold: "#d7b66c",
  parchment: "#ead7b0",
  ember: "#f08a4b",
  danger: "#d65f7a",
  violet: "#a88bff",
};

const RACE_ARCHETYPES = [
  ["dragon", "dragon"],
  ["demon", "demon"],
  ["shadow", "shadow"],
  ["celestial", "celestial"],
  ["spirit", "spirit"],
  ["elf", "elf"],
  ["beast", "beast"],
  ["cyber", "cyber"],
  ["neo", "cyber"],
  ["ancient", "ancient"],
  ["blood", "bloodline"],
  ["human", "human"],
];

const CLASS_ARCHETYPES = [
  ["warrior", "blade"],
  ["berserker", "axe"],
  ["guardian", "shield"],
  ["paladin", "sunShield"],
  ["rogue", "dagger"],
  ["assassin", "dagger"],
  ["ranger", "bow"],
  ["mage", "crystal"],
  ["wizard", "crystal"],
  ["cleric", "chalice"],
  ["monk", "fist"],
  ["necromancer", "skull"],
  ["summoner", "portal"],
  ["artificer", "gear"],
  ["alchemist", "flask"],
  ["bard", "lyre"],
];

const BIOME_PALETTES = {
  city: ["#1b2c40", "#42f4ff", "#d7b66c"],
  ruins: ["#2f3142", "#a88bff", "#89f7d1"],
  wilds: ["#163923", "#89f7d1", "#d7b66c"],
  skydocks: ["#113655", "#78d9ff", "#f0c775"],
  sea: ["#10304f", "#42f4ff", "#f08a4b"],
  coast: ["#10304f", "#42f4ff", "#f08a4b"],
  desert: ["#46351d", "#f0c775", "#f08a4b"],
  tundra: ["#1f3444", "#b8edff", "#d7b66c"],
  mountain: ["#2b3042", "#d7b66c", "#89f7d1"],
  neutral: ["#171d2d", "#42f4ff", "#d7b66c"],
};

const CHAMBER_ASSETS = [
  {
    id: "name-sigil",
    name: "Name the Sigil",
    kind: "ritual-ui",
    prompt:
      "Void-Verse character creation name sigil, circular brass rune frame, cyan soul glow, transparent SVG, no text.",
    colors: [TOKEN_COLORS.soulCyan, TOKEN_COLORS.relicGold, TOKEN_COLORS.violet],
  },
  {
    id: "temper-vessel",
    name: "Temper the Vessel",
    kind: "ritual-ui",
    prompt:
      "Void-Verse character creation vessel emblem, forged body silhouette inside oath ring, ember and cyan accents, transparent SVG, no text.",
    colors: [TOKEN_COLORS.ember, TOKEN_COLORS.soulCyan, TOKEN_COLORS.relicGold],
  },
  {
    id: "soul-crucible",
    name: "Soul Crucible",
    kind: "ritual-ui",
    prompt:
      "Void-Verse soul crucible UI asset, layered altar bowl with rising shards, cyan flame, brass trim, transparent SVG, no text.",
    colors: [TOKEN_COLORS.soulCyan, TOKEN_COLORS.ember, TOKEN_COLORS.relicGold],
  },
  {
    id: "oath-mirror",
    name: "Oath Mirror",
    kind: "ritual-ui",
    prompt:
      "Void-Verse oath mirror UI asset, dark obsidian mirror, cyan reflection, gold rune clasp, transparent SVG, no text.",
    colors: [TOKEN_COLORS.violet, TOKEN_COLORS.soulCyan, TOKEN_COLORS.relicGold],
  },
  {
    id: "first-page-seal",
    name: "Seal the First Page",
    kind: "ritual-ui",
    prompt:
      "Void-Verse first page seal UI asset, parchment page with cosmic wax seal, cyan ink and gold frame, transparent SVG, no text.",
    colors: [TOKEN_COLORS.parchment, TOKEN_COLORS.soulCyan, TOKEN_COLORS.relicGold],
  },
  {
    id: "creation-ritual-frame",
    name: "Creation Ritual Frame",
    kind: "ritual-ui",
    prompt:
      "Void-Verse reusable ritual card frame, brass corner trim, dark stone surface, cyan runes, transparent SVG, no text.",
    colors: [TOKEN_COLORS.deepNavy, TOKEN_COLORS.soulCyan, TOKEN_COLORS.relicGold],
  },
];

function escapeXml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

function slugify(value) {
  return String(value || "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function hashString(value) {
  let hash = 2166136261;
  for (const char of String(value)) {
    hash ^= char.charCodeAt(0);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

function hsl(seed, saturation = 64, lightness = 48) {
  return `hsl(${seed % 360} ${saturation}% ${lightness}%)`;
}

function topStats(entry = {}, keys = ["statBonuses", "modifiers", "baseStats", "attributeBonuses"]) {
  const source = keys
    .map((key) => entry[key])
    .find((value) => value && typeof value === "object" && !Array.isArray(value));

  return Object.entries(source || {})
    .filter(([, value]) => Number(value) > 0)
    .sort((left, right) => Number(right[1]) - Number(left[1]))
    .slice(0, 3)
    .map(([key, value]) => ({ key, value: Number(value) }));
}

function initials(name) {
  return String(name || "?")
    .split(/\s+|-/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() || "")
    .join("");
}

function describeRaceArchetype(entry) {
  const text = `${entry.id || ""} ${entry.name || ""} ${entry.description || ""}`.toLowerCase();
  return RACE_ARCHETYPES.find(([needle]) => text.includes(needle))?.[1] || "human";
}

function describeClassArchetype(entry) {
  const text = [
    entry.id,
    entry.name,
    entry.description,
    entry.resource,
    entry.resourceSystem,
    entry.archetype,
    ...(Array.isArray(entry.coreMechanics) ? entry.coreMechanics : []),
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();
  return CLASS_ARCHETYPES.find(([needle]) => text.includes(needle))?.[1] || "sigil";
}

function biomePalette(biome) {
  const key = String(biome || "neutral").toLowerCase();
  return (
    Object.entries(BIOME_PALETTES).find(([needle]) => key.includes(needle))?.[1] ||
    BIOME_PALETTES.neutral
  );
}

function svgShell({ width, height, title, description, defs, body }) {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" role="img" aria-labelledby="title desc">
  <title id="title">${escapeXml(title)}</title>
  <desc id="desc">${escapeXml(description)}</desc>
  <defs>
${defs}
  </defs>
${body}
</svg>
`;
}

function raceGlyph(type, colors) {
  const [primary, accent, trim] = colors;
  const common = `
  <path d="M256 128c54 0 98 45 98 101 0 23-8 45-21 62 47 29 76 75 76 127v18H103v-18c0-52 29-98 76-127-13-17-21-39-21-62 0-56 44-101 98-101Z" fill="url(#figure)" stroke="${trim}" stroke-width="5"/>
  <path d="M187 292c21 28 44 42 69 42s48-14 69-42" fill="none" stroke="${accent}" stroke-width="7" stroke-linecap="round" opacity=".88"/>
  <circle cx="222" cy="229" r="8" fill="${accent}"/>
  <circle cx="290" cy="229" r="8" fill="${accent}"/>`;

  const extras = {
    dragon: `
  <path d="M156 178 94 118l81 25M356 178l62-60-81 25" fill="${primary}" stroke="${trim}" stroke-width="5" stroke-linejoin="round"/>
  <path d="M207 122 230 64l26 62 26-62 23 58" fill="none" stroke="${accent}" stroke-width="10" stroke-linecap="round" stroke-linejoin="round"/>`,
    demon: `
  <path d="M186 145c-39-36-50-70-34-103 43 20 66 54 69 102M326 145c39-36 50-70 34-103-43 20-66 54-69 102" fill="${primary}" stroke="${trim}" stroke-width="5"/>
  <path d="M199 260h114" stroke="${accent}" stroke-width="7" stroke-linecap="round"/>`,
    shadow: `
  <path d="M146 159c64-61 156-61 220 0-34-16-59-14-75 6-20-12-50-12-70 0-16-20-41-22-75-6Z" fill="${TOKEN_COLORS.voidBlack}" stroke="${accent}" stroke-width="5"/>
  <path d="M156 386c62 38 129 38 200 0" fill="none" stroke="${accent}" stroke-width="5" stroke-dasharray="12 16" opacity=".55"/>`,
    celestial: `
  <circle cx="256" cy="116" r="48" fill="none" stroke="${accent}" stroke-width="7"/>
  <path d="M256 52v34M256 146v34M188 116h34M290 116h34" stroke="${accent}" stroke-width="7" stroke-linecap="round"/>
  <path d="M164 356c52 31 132 31 184 0" fill="none" stroke="${trim}" stroke-width="7"/>`,
    spirit: `
  <path d="M158 347c26-25 50-30 72-15 19 13 32 13 51 0 22-15 46-10 72 15" fill="none" stroke="${accent}" stroke-width="8" stroke-linecap="round"/>
  <path d="M136 159c29-57 69-85 120-85s91 28 120 85" fill="none" stroke="${trim}" stroke-width="6" stroke-dasharray="10 15"/>`,
    elf: `
  <path d="M164 209 86 176l78 84M348 209l78-33-78 84" fill="${primary}" stroke="${trim}" stroke-width="5" stroke-linejoin="round"/>
  <path d="M205 149c36-37 66-37 102 0" fill="none" stroke="${accent}" stroke-width="7" stroke-linecap="round"/>`,
    beast: `
  <path d="M165 153 123 96l70 28M347 153l42-57-70 28" fill="${primary}" stroke="${trim}" stroke-width="5" stroke-linejoin="round"/>
  <path d="M221 273c21 14 49 14 70 0" fill="none" stroke="${accent}" stroke-width="7" stroke-linecap="round"/>`,
    cyber: `
  <path d="M167 203h178M185 168h142M174 246h164" stroke="${accent}" stroke-width="6" stroke-linecap="round" opacity=".68"/>
  <path d="M346 196h54v66h-54zM112 196h54v66h-54z" fill="${TOKEN_COLORS.deepNavy}" stroke="${accent}" stroke-width="5"/>`,
    ancient: `
  <path d="M166 117h180l-30 53H196Z" fill="${primary}" stroke="${trim}" stroke-width="5"/>
  <path d="M201 96h110M185 383h142" stroke="${accent}" stroke-width="7" stroke-linecap="round"/>`,
    bloodline: `
  <path d="M256 70c45 53 67 92 67 119 0 37-30 67-67 67s-67-30-67-67c0-27 22-66 67-119Z" fill="${TOKEN_COLORS.danger}" opacity=".42" stroke="${accent}" stroke-width="5"/>
  <path d="M207 354c29 17 69 17 98 0" stroke="${accent}" stroke-width="7" stroke-linecap="round"/>`,
    human: `
  <path d="M196 158c33-35 87-35 120 0" fill="none" stroke="${trim}" stroke-width="8" stroke-linecap="round"/>
  <path d="M181 369h150" stroke="${accent}" stroke-width="7" stroke-linecap="round"/>`,
  };

  return `${extras[type] || extras.human}
${common}`;
}

function classGlyph(type, colors) {
  const [primary, accent, trim] = colors;
  const glyphs = {
    blade: `<path d="M174 254 264 70l44 44-92 182-61 39Z" fill="${primary}" stroke="${trim}" stroke-width="7" stroke-linejoin="round"/><path d="M250 128 306 184" stroke="${accent}" stroke-width="8" stroke-linecap="round"/><path d="M136 286l53 53" stroke="${trim}" stroke-width="16" stroke-linecap="round"/>`,
    axe: `<path d="M185 122c59-41 111-35 157 18-13 44-48 72-104 84l-31-31Z" fill="${primary}" stroke="${trim}" stroke-width="7"/><path d="M105 291 281 115" stroke="${accent}" stroke-width="18" stroke-linecap="round"/><path d="M88 307l45 45" stroke="${trim}" stroke-width="12" stroke-linecap="round"/>`,
    shield: `<path d="M160 88h160v90c0 71-33 121-80 154-47-33-80-83-80-154Z" fill="${primary}" stroke="${trim}" stroke-width="8"/><path d="M240 111v187M184 177h112" stroke="${accent}" stroke-width="10" stroke-linecap="round"/>`,
    sunShield: `<circle cx="240" cy="172" r="86" fill="${primary}" stroke="${trim}" stroke-width="8"/><path d="M240 52v34M240 258v34M120 172h34M326 172h34M155 87l24 24M301 233l24 24M325 87l-24 24M179 233l-24 24" stroke="${accent}" stroke-width="8" stroke-linecap="round"/><path d="M194 162l34 34 62-69" fill="none" stroke="${TOKEN_COLORS.voidBlack}" stroke-width="12" stroke-linecap="round" stroke-linejoin="round"/>`,
    dagger: `<path d="M226 72h36l18 151-36 48-36-48Z" fill="${primary}" stroke="${trim}" stroke-width="7"/><path d="M179 268h130M214 302h60" stroke="${accent}" stroke-width="11" stroke-linecap="round"/><path d="M245 95v121" stroke="${accent}" stroke-width="6" stroke-linecap="round"/>`,
    bow: `<path d="M172 71c83 68 83 190 0 258" fill="none" stroke="${trim}" stroke-width="14" stroke-linecap="round"/><path d="M172 71v258" stroke="${accent}" stroke-width="4"/><path d="M131 200h177M279 172l29 28-29 28" fill="none" stroke="${primary}" stroke-width="10" stroke-linecap="round" stroke-linejoin="round"/>`,
    crystal: `<path d="M240 54 319 166 240 335 161 166Z" fill="${primary}" stroke="${trim}" stroke-width="8"/><path d="M240 54v281M161 166h158M198 111l84 110" stroke="${accent}" stroke-width="6" opacity=".78"/>`,
    chalice: `<path d="M163 78h154v72c0 43-33 78-77 78s-77-35-77-78Z" fill="${primary}" stroke="${trim}" stroke-width="8"/><path d="M240 228v62M190 290h100M202 326h76" stroke="${accent}" stroke-width="11" stroke-linecap="round"/><path d="M208 137h64M240 105v64" stroke="${accent}" stroke-width="9" stroke-linecap="round"/>`,
    fist: `<path d="M151 159c0-23 18-41 40-41 8 0 16 2 22 7 7-19 26-32 48-32 27 0 49 22 49 49v122c0 45-36 82-82 82-43 0-77-34-77-77Z" fill="${primary}" stroke="${trim}" stroke-width="8"/><path d="M202 123v92M252 96v119M301 143v82" stroke="${accent}" stroke-width="8" stroke-linecap="round"/>`,
    skull: `<path d="M156 174c0-55 38-98 84-98s84 43 84 98c0 36-16 67-41 84v59h-86v-59c-25-17-41-48-41-84Z" fill="${primary}" stroke="${trim}" stroke-width="8"/><circle cx="207" cy="185" r="20" fill="${TOKEN_COLORS.voidBlack}"/><circle cx="273" cy="185" r="20" fill="${TOKEN_COLORS.voidBlack}"/><path d="M222 254h36M210 286h60" stroke="${accent}" stroke-width="8" stroke-linecap="round"/>`,
    portal: `<circle cx="240" cy="194" r="102" fill="none" stroke="${trim}" stroke-width="12"/><circle cx="240" cy="194" r="65" fill="none" stroke="${accent}" stroke-width="8" stroke-dasharray="18 12"/><path d="M240 91c43 50 43 156 0 206-43-50-43-156 0-206Z" fill="${primary}" opacity=".7"/>`,
    gear: `<path d="M240 82v39M240 267v39M147 174h39M294 174h39M174 108l28 28M278 240l28 28M306 108l-28 28M202 240l-28 28" stroke="${trim}" stroke-width="13" stroke-linecap="round"/><circle cx="240" cy="194" r="74" fill="${primary}" stroke="${trim}" stroke-width="8"/><circle cx="240" cy="194" r="27" fill="${TOKEN_COLORS.voidBlack}" stroke="${accent}" stroke-width="7"/>`,
    flask: `<path d="M216 71h48v93l66 116c16 28-4 62-36 62H186c-32 0-52-34-36-62l66-116Z" fill="${primary}" stroke="${trim}" stroke-width="8"/><path d="M186 272c31-23 74-23 108 0" stroke="${accent}" stroke-width="9" stroke-linecap="round"/><path d="M205 71h70" stroke="${trim}" stroke-width="13" stroke-linecap="round"/>`,
    lyre: `<path d="M178 86c-35 75-24 163 62 232 86-69 97-157 62-232" fill="none" stroke="${trim}" stroke-width="11" stroke-linecap="round"/><path d="M198 127h84M210 127v154M240 127v178M270 127v154" stroke="${accent}" stroke-width="6" stroke-linecap="round"/><path d="M175 318h130" stroke="${primary}" stroke-width="13" stroke-linecap="round"/>`,
    sigil: `<circle cx="240" cy="194" r="96" fill="${primary}" stroke="${trim}" stroke-width="8"/><path d="M240 92 294 288 141 167h198L186 288Z" fill="none" stroke="${accent}" stroke-width="8" stroke-linejoin="round"/>`,
  };

  return glyphs[type] || glyphs.sigil;
}

function originScene(entry, colors) {
  const [base, accent, trim] = colors;
  const biome = String(entry.favoredBiome || "neutral").toLowerCase();
  const sky = `<rect width="${ORIGIN_WIDTH}" height="${ORIGIN_HEIGHT}" rx="34" fill="url(#bg)"/><rect x="24" y="24" width="720" height="384" rx="28" fill="none" stroke="${trim}" stroke-width="5" opacity=".8"/><path d="M64 336c98-42 177-37 264 0 117-58 230-43 376 0v72H64Z" fill="${base}" opacity=".85"/><path d="M69 340c92-31 184-29 276 6 111-45 221-39 331 0" fill="none" stroke="${accent}" stroke-width="6" opacity=".7"/>`;
  if (biome.includes("city")) {
    return `${sky}<path d="M96 318V190h52v128M174 318V126h78v192M278 318V168h66v150M374 318V104h94v214M496 318V160h82v158M604 318V210h52v108" fill="${TOKEN_COLORS.abyssBlue}" stroke="${trim}" stroke-width="4"/><path d="M190 151h44M390 132h58M512 186h46" stroke="${accent}" stroke-width="4" opacity=".8"/>`;
  }
  if (biome.includes("ruin")) {
    return `${sky}<path d="M134 318h86V154h-86Zm224 0h86V118h-86Zm210 0h72V180h-72Z" fill="${TOKEN_COLORS.abyssBlue}" stroke="${trim}" stroke-width="5"/><path d="M109 154h136M333 118h137M540 180h128" stroke="${accent}" stroke-width="7"/><path d="M152 226h46M382 204h37M591 241h32" stroke="${accent}" stroke-width="4" opacity=".65"/>`;
  }
  if (biome.includes("wild")) {
    return `${sky}<path d="M146 329V213M284 329V172M442 329V195M598 329V229" stroke="${trim}" stroke-width="15" stroke-linecap="round"/><circle cx="146" cy="188" r="62" fill="${base}" stroke="${accent}" stroke-width="5"/><circle cx="284" cy="143" r="76" fill="${base}" stroke="${accent}" stroke-width="5"/><circle cx="442" cy="169" r="64" fill="${base}" stroke="${accent}" stroke-width="5"/><circle cx="598" cy="211" r="52" fill="${base}" stroke="${accent}" stroke-width="5"/>`;
  }
  if (biome.includes("sky")) {
    return `${sky}<path d="M102 269h180l38-40h150l44 40h150v45H102Z" fill="${TOKEN_COLORS.abyssBlue}" stroke="${trim}" stroke-width="5"/><path d="M184 251l38-76h311l50 76" fill="none" stroke="${accent}" stroke-width="8" stroke-linecap="round"/><path d="M244 176v110M355 176v110M466 176v110" stroke="${trim}" stroke-width="6"/>`;
  }
  if (biome.includes("sea") || biome.includes("coast")) {
    return `${sky}<path d="M64 280c72-25 120-25 192 0s120 25 192 0 120-25 192 0 120 25 192 0" fill="none" stroke="${accent}" stroke-width="10" stroke-linecap="round"/><path d="M132 330c71-22 127-22 198 0s127 22 198 0 127-22 198 0" fill="none" stroke="${trim}" stroke-width="7" opacity=".86"/><path d="M374 108v141M374 108l104 68H374" fill="${base}" stroke="${trim}" stroke-width="6" stroke-linejoin="round"/>`;
  }
  if (biome.includes("desert")) {
    return `${sky}<path d="M74 336c90-67 185-67 285 0 98-68 203-68 319 0" fill="${base}" stroke="${trim}" stroke-width="5"/><circle cx="612" cy="113" r="48" fill="${trim}" opacity=".83"/><path d="M208 282h112M474 260h132" stroke="${accent}" stroke-width="7" stroke-linecap="round"/>`;
  }
  if (biome.includes("tundra")) {
    return `${sky}<path d="M101 336 232 137l93 199M296 336 459 106l190 230" fill="${TOKEN_COLORS.abyssBlue}" stroke="${trim}" stroke-width="5"/><path d="M232 137 194 195h75Zm227-31-50 71h108Z" fill="${accent}" opacity=".8"/><path d="M122 360h524" stroke="${accent}" stroke-width="8" stroke-linecap="round"/>`;
  }
  return `${sky}<circle cx="384" cy="193" r="91" fill="none" stroke="${accent}" stroke-width="10"/><path d="M384 88v210M279 193h210M310 119l148 148M458 119 310 267" stroke="${trim}" stroke-width="6" stroke-linecap="round" opacity=".72"/>`;
}

function buildRaceAsset(entry) {
  const seed = hashString(entry.id);
  const primary = hsl(seed, 58, 42);
  const accent = hsl(seed + 124, 84, 65);
  const trim = seed % 2 ? TOKEN_COLORS.relicGold : TOKEN_COLORS.soulCyan;
  const type = describeRaceArchetype(entry);
  const stats = topStats(entry);
  const statText = stats.map((stat) => `${stat.key}+${stat.value}`).join(" ");
  const title = `${entry.name} race portrait asset`;
  const description = `${entry.description || entry.name} Top stats: ${statText || "balanced"}.`;

  return svgShell({
    width: RACE_SIZE,
    height: RACE_SIZE,
    title,
    description,
    defs: `    <radialGradient id="bg" cx="50%" cy="36%" r="66%">
      <stop offset="0%" stop-color="${accent}" stop-opacity=".34"/>
      <stop offset="54%" stop-color="${primary}" stop-opacity=".24"/>
      <stop offset="100%" stop-color="${TOKEN_COLORS.voidBlack}"/>
    </radialGradient>
    <linearGradient id="figure" x1="0" x2="1" y1="0" y2="1">
      <stop offset="0%" stop-color="${primary}"/>
      <stop offset="100%" stop-color="${TOKEN_COLORS.abyssBlue}"/>
    </linearGradient>
    <filter id="glow" x="-30%" y="-30%" width="160%" height="160%">
      <feGaussianBlur stdDeviation="8" result="blur"/>
      <feMerge>
        <feMergeNode in="blur"/>
        <feMergeNode in="SourceGraphic"/>
      </feMerge>
    </filter>`,
    body: `  <rect width="${RACE_SIZE}" height="${RACE_SIZE}" rx="48" fill="url(#bg)"/>
  <path d="M48 424V108c0-33 27-60 60-60h296c33 0 60 27 60 60v316" fill="none" stroke="${trim}" stroke-width="7" opacity=".82"/>
  <circle cx="256" cy="256" r="178" fill="none" stroke="${accent}" stroke-width="5" stroke-dasharray="14 18" opacity=".45" filter="url(#glow)"/>
${raceGlyph(type, [primary, accent, trim])}
  <rect x="94" y="426" width="324" height="45" rx="22" fill="${TOKEN_COLORS.voidBlack}" stroke="${trim}" stroke-width="4" opacity=".88"/>
  <text x="256" y="456" fill="${trim}" font-family="Manrope, Arial, sans-serif" font-size="25" font-weight="800" text-anchor="middle" letter-spacing="2">${escapeXml(initials(entry.name))}</text>`,
  });
}

function buildClassAsset(entry) {
  const seed = hashString(entry.id);
  const primary = hsl(seed + 44, 66, 44);
  const accent = entry.resourceSystem === "mana" ? TOKEN_COLORS.soulCyan : hsl(seed + 188, 82, 64);
  const trim = entry.tier && entry.tier > 1 ? TOKEN_COLORS.ember : TOKEN_COLORS.relicGold;
  const type = describeClassArchetype(entry);
  const stats = topStats(entry, ["baseStats"]);
  const statText = stats.map((stat) => `${stat.key}+${stat.value}`).join(" ");
  const title = `${entry.name} class icon asset`;
  const description = `${entry.description || entry.name} Resource: ${entry.resourceSystem || "none"}. Top stats: ${statText || "balanced"}.`;

  return svgShell({
    width: CLASS_SIZE,
    height: CLASS_SIZE,
    title,
    description,
    defs: `    <radialGradient id="bg" cx="50%" cy="42%" r="64%">
      <stop offset="0%" stop-color="${accent}" stop-opacity=".28"/>
      <stop offset="58%" stop-color="${primary}" stop-opacity=".20"/>
      <stop offset="100%" stop-color="${TOKEN_COLORS.voidBlack}"/>
    </radialGradient>
    <filter id="glow" x="-40%" y="-40%" width="180%" height="180%">
      <feGaussianBlur stdDeviation="5" result="blur"/>
      <feMerge>
        <feMergeNode in="blur"/>
        <feMergeNode in="SourceGraphic"/>
      </feMerge>
    </filter>`,
    body: `  <rect width="${CLASS_SIZE}" height="${CLASS_SIZE}" rx="44" fill="url(#bg)"/>
  <path d="M48 58h224l24 24v156l-48 48H72l-48-48V82Z" fill="none" stroke="${trim}" stroke-width="6" opacity=".82"/>
  <circle cx="240" cy="194" r="118" fill="none" stroke="${accent}" stroke-width="4" stroke-dasharray="10 13" opacity=".45" filter="url(#glow)"/>
  <g transform="translate(-80 -34)">
${classGlyph(type, [primary, accent, trim])}
  </g>
  <rect x="74" y="260" width="172" height="31" rx="15" fill="${TOKEN_COLORS.voidBlack}" stroke="${trim}" stroke-width="3" opacity=".9"/>
  <text x="160" y="282" fill="${trim}" font-family="Manrope, Arial, sans-serif" font-size="18" font-weight="800" text-anchor="middle" letter-spacing="1.5">${escapeXml(initials(entry.name))}</text>`,
  });
}

function buildOriginAsset(entry) {
  const colors = biomePalette(entry.favoredBiome);
  const title = `${entry.name} origin card asset`;
  const tags = Array.isArray(entry.favoredQuestTags) ? entry.favoredQuestTags.slice(0, 3).join(", ") : "";
  const description = `${entry.description || entry.name} Biome: ${entry.favoredBiome || "neutral"}. ${tags ? `Tags: ${tags}.` : ""}`;

  return svgShell({
    width: ORIGIN_WIDTH,
    height: ORIGIN_HEIGHT,
    title,
    description,
    defs: `    <linearGradient id="bg" x1="0" x2="1" y1="0" y2="1">
      <stop offset="0%" stop-color="${TOKEN_COLORS.voidBlack}"/>
      <stop offset="45%" stop-color="${colors[0]}"/>
      <stop offset="100%" stop-color="${TOKEN_COLORS.abyssBlue}"/>
    </linearGradient>
    <filter id="glow" x="-30%" y="-30%" width="160%" height="160%">
      <feGaussianBlur stdDeviation="7" result="blur"/>
      <feMerge>
        <feMergeNode in="blur"/>
        <feMergeNode in="SourceGraphic"/>
      </feMerge>
    </filter>`,
    body: `${originScene(entry, colors)}
  <circle cx="666" cy="86" r="39" fill="${TOKEN_COLORS.voidBlack}" stroke="${colors[1]}" stroke-width="5" opacity=".88" filter="url(#glow)"/>
  <text x="666" y="97" fill="${colors[2]}" font-family="Manrope, Arial, sans-serif" font-size="26" font-weight="800" text-anchor="middle" letter-spacing="2">${escapeXml(initials(entry.name))}</text>
  <rect x="52" y="52" width="330" height="44" rx="22" fill="${TOKEN_COLORS.voidBlack}" stroke="${colors[2]}" stroke-width="3" opacity=".78"/>
  <text x="217" y="82" fill="${colors[2]}" font-family="Manrope, Arial, sans-serif" font-size="19" font-weight="800" text-anchor="middle" letter-spacing="1.5">${escapeXml(String(entry.favoredBiome || "origin").toUpperCase())}</text>`,
  });
}

function buildChamberAsset(entry) {
  const [primary, accent, trim] = entry.colors;
  return svgShell({
    width: 512,
    height: 512,
    title: `${entry.name} UI asset`,
    description: entry.prompt,
    defs: `    <radialGradient id="bg" cx="50%" cy="44%" r="62%">
      <stop offset="0%" stop-color="${accent}" stop-opacity=".27"/>
      <stop offset="60%" stop-color="${primary}" stop-opacity=".20"/>
      <stop offset="100%" stop-color="${TOKEN_COLORS.voidBlack}" stop-opacity=".05"/>
    </radialGradient>
    <filter id="glow" x="-40%" y="-40%" width="180%" height="180%">
      <feGaussianBlur stdDeviation="8" result="blur"/>
      <feMerge>
        <feMergeNode in="blur"/>
        <feMergeNode in="SourceGraphic"/>
      </feMerge>
    </filter>`,
    body: `  <rect width="512" height="512" rx="58" fill="url(#bg)" opacity=".96"/>
  <path d="M88 98h336l34 34v248l-44 44H98l-44-44V132Z" fill="${TOKEN_COLORS.voidBlack}" fill-opacity=".32" stroke="${trim}" stroke-width="7"/>
  <circle cx="256" cy="256" r="137" fill="none" stroke="${accent}" stroke-width="8" stroke-dasharray="18 16" filter="url(#glow)"/>
  <path d="M256 112 303 209 410 224 333 299 351 406 256 356 161 406 179 299 102 224 209 209Z" fill="${primary}" fill-opacity=".42" stroke="${trim}" stroke-width="7" stroke-linejoin="round"/>
  <path d="M256 162v188M162 256h188M190 190l132 132M322 190 190 322" stroke="${accent}" stroke-width="8" stroke-linecap="round" opacity=".78"/>
  <rect x="172" y="430" width="168" height="35" rx="17" fill="${TOKEN_COLORS.voidBlack}" stroke="${trim}" stroke-width="3" opacity=".88"/>
  <text x="256" y="454" fill="${trim}" font-family="Manrope, Arial, sans-serif" font-size="19" font-weight="800" text-anchor="middle" letter-spacing="2">${escapeXml(initials(entry.name))}</text>`,
  });
}

async function readJson(name) {
  const raw = await readFile(path.join(contentRoot, name), "utf8");
  return JSON.parse(raw);
}

async function writeAsset(relativePath, contents) {
  const absolutePath = path.join(outputRoot, relativePath);
  await mkdir(path.dirname(absolutePath), { recursive: true });
  await writeFile(absolutePath, contents, "utf8");
  return relativePath.replaceAll(path.sep, "/");
}

function canvaPromptFor(kind, entry) {
  if (kind === "race") {
    return [
      `Void-Verse character creation portrait for ${entry.name}.`,
      entry.description || "",
      "Ritual dark fantasy LitRPG style, centered bust silhouette, cyan soul glow, brass frame, transparent or dark vignette background, no baked UI text.",
    ]
      .filter(Boolean)
      .join(" ");
  }
  if (kind === "class") {
    return [
      `Void-Verse class icon for ${entry.name}.`,
      entry.description || "",
      `Resource system: ${entry.resourceSystem || "none"}.`,
      "Readable game UI glyph, brass trim, cyan accent glow, transparent SVG-safe composition, no baked UI text.",
    ]
      .filter(Boolean)
      .join(" ");
  }
  if (kind === "origin") {
    return [
      `Void-Verse origin scene card for ${entry.name}.`,
      entry.description || "",
      `Biome: ${entry.favoredBiome || "neutral"}.`,
      "Wide atmospheric RPG card background, oath-starting-point mood, dark ritual UI palette, no baked UI text.",
    ]
      .filter(Boolean)
      .join(" ");
  }
  return entry.prompt || `Void-Verse character creation UI asset for ${entry.name}.`;
}

function makeManifestEntry({ kind, entry, file, width, height }) {
  return {
    id: entry.id,
    name: entry.name,
    kind,
    file,
    width,
    height,
    format: "svg",
    prompt: canvaPromptFor(kind, entry),
    alt: `${entry.name} ${kind} asset for Void-Verse character creation`,
  };
}

function toIdentifier(value) {
  const identifier = String(value || "asset")
    .replace(/[^a-zA-Z0-9_$]+/g, "_")
    .replace(/^([0-9])/, "_$1");
  return identifier || "asset";
}

function buildIndexModule(manifest) {
  const assetEntries = manifest.entries.map((entry, index) => ({
    ...entry,
    importName: toIdentifier(`asset_${index}_${entry.kind}_${entry.id}`),
  }));

  const imports = assetEntries
    .map((entry) => `import ${entry.importName} from "./${entry.file}?url";`)
    .join("\n");
  const urls = assetEntries
    .map((entry) => `  ${JSON.stringify(entry.file)}: ${entry.importName},`)
    .join("\n");
  const entries = assetEntries
    .map(({ importName, ...entry }) => `  { ...${JSON.stringify(entry)}, url: ${importName} },`)
    .join("\n");

  return `// Auto-generated by scripts/generate-character-creation-assets.mjs.
// Do not edit by hand.
${imports}

export const characterCreationAssetUrls = {
${urls}
};

export const characterCreationAssets = [
${entries}
];

export const characterCreationAssetCounts = ${JSON.stringify(manifest.counts, null, 2)};

export function getCharacterCreationAsset(kind, id) {
  return characterCreationAssets.find((entry) => entry.kind === kind && entry.id === id) || null;
}

export function getCharacterCreationAssetsByKind(kind) {
  return characterCreationAssets.filter((entry) => entry.kind === kind);
}
`;
}

async function main() {
  const [races, classes, origins] = await Promise.all([
    readJson("races.json"),
    readJson("classes.json"),
    readJson("origins.json"),
  ]);

  await rm(outputRoot, { recursive: true, force: true });
  await mkdir(outputRoot, { recursive: true });

  const entries = [];

  for (const race of races) {
    const file = await writeAsset(`races/${slugify(race.id || race.name)}.svg`, buildRaceAsset(race));
    entries.push(makeManifestEntry({ kind: "race", entry: race, file, width: RACE_SIZE, height: RACE_SIZE }));
  }

  for (const cls of classes) {
    const file = await writeAsset(`classes/${slugify(cls.id || cls.name)}.svg`, buildClassAsset(cls));
    entries.push(makeManifestEntry({ kind: "class", entry: cls, file, width: CLASS_SIZE, height: CLASS_SIZE }));
  }

  for (const origin of origins) {
    const file = await writeAsset(`origins/${slugify(origin.id || origin.name)}.svg`, buildOriginAsset(origin));
    entries.push(
      makeManifestEntry({
        kind: "origin",
        entry: origin,
        file,
        width: ORIGIN_WIDTH,
        height: ORIGIN_HEIGHT,
      }),
    );
  }

  for (const chamber of CHAMBER_ASSETS) {
    const file = await writeAsset(`ui/${slugify(chamber.id)}.svg`, buildChamberAsset(chamber));
    entries.push(makeManifestEntry({ kind: "ritual-ui", entry: chamber, file, width: 512, height: 512 }));
  }

  const manifest = {
    generatedAt: new Date().toISOString(),
    version: PACK_VERSION,
    source: "packages/game-core/src/data/generated/character-creation",
    outputRoot: "src/assets/creation",
    counts: {
      races: races.length,
      classes: classes.length,
      origins: origins.length,
      ritualUi: CHAMBER_ASSETS.length,
      total: entries.length,
    },
    entries,
  };

  const canvaManifest = {
    generatedAt: manifest.generatedAt,
    title: "Void-Verse Character Creation Bulk Asset Pack",
    importMode: "bulk-assets",
    canvaNotes: [
      "Use SVG files directly for editable vector import where Canva supports it.",
      "If Canva rasterizes an asset, export a PNG copy from the SVG at 2x for the same file id.",
      "Prompts are included for regenerating higher fidelity Canva-native or AI assets.",
      "Baked text is intentionally minimal; runtime UI should render labels from game data.",
    ],
    batches: [
      {
        id: "races",
        title: "Race Portraits",
        targetFolder: "Void-Verse / Character Creation / Races",
        entries: entries.filter((entry) => entry.kind === "race"),
      },
      {
        id: "classes",
        title: "Class Icons",
        targetFolder: "Void-Verse / Character Creation / Classes",
        entries: entries.filter((entry) => entry.kind === "class"),
      },
      {
        id: "origins",
        title: "Origin Scene Cards",
        targetFolder: "Void-Verse / Character Creation / Origins",
        entries: entries.filter((entry) => entry.kind === "origin"),
      },
      {
        id: "ritual-ui",
        title: "Ritual UI Pieces",
        targetFolder: "Void-Verse / Character Creation / Ritual UI",
        entries: entries.filter((entry) => entry.kind === "ritual-ui"),
      },
    ],
  };

  await writeAsset("manifest.json", `${JSON.stringify(manifest, null, 2)}\n`);
  await writeAsset("canva-import-manifest.json", `${JSON.stringify(canvaManifest, null, 2)}\n`);
  await writeAsset("index.js", buildIndexModule(manifest));
  await writeAsset(
    "NOTICE.txt",
    [
      "Void-Verse character creation asset pack",
      "",
      "Generated locally from repo-owned character creation data.",
      "These SVG files are procedural placeholders intended for web UI integration, Canva import, and art-direction handoff.",
      "Replace or polish individual files with final licensed production art before commercial release.",
      "",
      `Generated: ${manifest.generatedAt}`,
    ].join("\n"),
  );
  await writeAsset(
    "README.md",
    [
      "# Character Creation Assets",
      "",
      "Generated files for the Void-Verse character creation flow.",
      "",
      "## Contents",
      "",
      `- Races: ${races.length}`,
      `- Classes: ${classes.length}`,
      `- Origins: ${origins.length}`,
      `- Ritual UI pieces: ${CHAMBER_ASSETS.length}`,
      "",
      "## Regenerate",
      "",
      "```bash",
      "npm run generate:creation-assets",
      "```",
      "",
      "## Canva",
      "",
      "Use `canva-import-manifest.json` for folder batches, prompts, and import targets. The Canva MCP namespace was not available in this Codex session, so this pack is prepared for import rather than uploaded automatically.",
    ].join("\n"),
  );

  console.log(JSON.stringify(manifest.counts, null, 2));
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
