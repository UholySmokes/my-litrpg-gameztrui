import fs from "node:fs/promises";
import path from "node:path";

const ROOT = process.cwd();

const readJson = async (relPath) => {
  const filePath = path.join(ROOT, relPath);
  const raw = await fs.readFile(filePath, "utf8");
  return JSON.parse(raw);
};

const uniq = (arr) => Array.from(new Set(arr));

const normalizeStr = (v) => String(v ?? "").trim();

const looksMagic = (entry) => {
  if (!entry || typeof entry !== "object") return false;
  if (entry.isMagic === true) return true;
  if (normalizeStr(entry.element)) return true;
  if (normalizeStr(entry.essence)) return true;
  if (normalizeStr(entry.costType).toLowerCase() === "mana") return true;
  const tmpl = entry.template && typeof entry.template === "object" ? entry.template : null;
  if (tmpl) {
    const fn = normalizeStr(tmpl.function).toLowerCase();
    if (["spell", "magic"].includes(fn)) return true;
    const elements = Array.isArray(tmpl.elements) ? tmpl.elements : [];
    if (elements.some((e) => normalizeStr(e))) return true;
  }
  const tags = Array.isArray(entry.tags) ? entry.tags.map((t) => normalizeStr(t).toLowerCase()) : [];
  if (tags.includes("spell") || tags.includes("magic")) return true;
  if (tags.some((t) => t.startsWith("essence_"))) return true;
  const desc = normalizeStr(entry.description).toLowerCase();
  if (desc.includes("spell") || desc.includes("mana") || desc.includes("essence")) return true;
  return false;
};

const KNOWN_ESSENCES = new Set([
  "fire",
  "water",
  "earth",
  "air",
  "lightning",
  "shadow",
  "light",
  "life",
  "creation",
  "destruction",
  "space",
  "time",
]);

// Combat reaction set is narrower; we treat anything outside these as “review”.
const COMMON_COMBAT_ELEMENTS = new Set([
  "fire",
  "ice",
  "lightning",
  "nature",
  "water",
  "holy",
  "dark",
]);

const collectElements = (entry) => {
  const out = [];
  const element = normalizeStr(entry?.damage?.element || entry?.element);
  if (element) out.push(element);
  const tmplEls = Array.isArray(entry?.template?.elements) ? entry.template.elements : [];
  tmplEls.forEach((e) => {
    const v = normalizeStr(e);
    if (v) out.push(v);
  });
  return out;
};

const toMdList = (items) => (items.length ? items.map((x) => `- ${x}`).join("\n") : "- (none)");

async function main() {
  const universalSkills = await readJson("packages/game-core/src/data/skills/universal.json");
  const professionSkills = await readJson("packages/game-core/src/data/skills/profession_skills.json");
  const classAbilities = await readJson("packages/game-core/src/data/skills/class_abilities.json");
  const raceAbilities = await readJson("packages/game-core/src/data/skills/race_abilities.json");

  const sources = [
    { label: "universal", entries: universalSkills },
    { label: "profession", entries: professionSkills },
    { label: "class_abilities", entries: classAbilities },
    { label: "race_abilities", entries: raceAbilities },
  ];

  const all = [];
  for (const src of sources) {
    const entries = Array.isArray(src.entries) ? src.entries : [];
    for (const entry of entries) {
      if (!entry || typeof entry !== "object") continue;
      all.push({ src: src.label, entry });
    }
  }

  const magic = all.filter(({ entry }) => looksMagic(entry));

  const missingDescription = magic
    .filter(({ entry }) => !normalizeStr(entry.description))
    .map(({ src, entry }) => `${src}:${entry.id}`);

  const elementStrings = uniq(magic.flatMap(({ entry }) => collectElements(entry).map((e) => e.toLowerCase())));

  const unknownEssenceLike = elementStrings.filter((e) => !KNOWN_ESSENCES.has(e) && !COMMON_COMBAT_ELEMENTS.has(e));

  const usesSpaceEssence = magic
    .filter(({ entry }) => collectElements(entry).some((e) => e.toLowerCase() === "space"))
    .map(({ src, entry }) => `${src}:${entry.id}`);

  const voidTagged = magic
    .filter(({ entry }) => {
      const tags = Array.isArray(entry.tags) ? entry.tags.map((t) => normalizeStr(t).toLowerCase()) : [];
      const tmplEls = Array.isArray(entry?.template?.elements)
        ? entry.template.elements.map((e) => normalizeStr(e).toLowerCase())
        : [];
      return tags.includes("void") || tags.includes("voidspark") || tmplEls.includes("space");
    })
    .map(({ src, entry }) => `${src}:${entry.id}`);

  // Heuristic “review candidates”:
  // - bulk-generated elemental variants in universal skills
  // - placeholder/generic profession descriptions (“Fundamental techniques…”, “Complex techniques…”, “Mastery of …”)
  const bulkUniversalVariants = magic
    .filter(({ src, entry }) =>
      src === "universal" &&
      typeof entry.id === "string" &&
      /^(universal)_(flame|frost|lightning|storm|shadow|holy|nature|water|earth|air)_/i.test(entry.id),
    )
    .map(({ entry }) => entry.id);

  const genericProfessionText = professionSkills
    .filter((s) => {
      const d = normalizeStr(s.description);
      return (
        d.startsWith("Fundamental techniques") ||
        d.startsWith("Complex techniques") ||
        d.startsWith("Mastery of")
      );
    })
    .slice(0, 80)
    .map((s) => s.id);

  const voidTaggedOverflow = voidTagged.length > 120 ? `\n- …and ${voidTagged.length - 120} more` : "";
  const usesSpaceOverflow = usesSpaceEssence.length > 120 ? `\n- …and ${usesSpaceEssence.length - 120} more` : "";
  const bulkOverflow = bulkUniversalVariants.length > 120
    ? `\n- …and ${bulkUniversalVariants.length - 120} more`
    : "";

  const report = [
    "# Voidverse Magic Audit Report",
    "",
    `**Date:** ${new Date().toISOString().slice(0, 10)}`,
    "",
    "## Summary",
    `- Total entries scanned: ${all.length}`,
    `- Magic-like entries (heuristic): ${magic.length}`,
    `- Magic entries missing descriptions: ${missingDescription.length}`,
    `- Distinct element strings observed (damage/template/element): ${elementStrings.length}`,
    "",
    "## Unknown / Review Elements",
    "Elements seen that are not in the 12-prime essence list and not in the common combat element set:",
    "",
    toMdList(unknownEssenceLike),
    "",
    "## Magic Entries Missing Descriptions",
    toMdList(missingDescription),
    "",
    "## Already Void/Space-Adjacent (Good Seeds For Voidverse)",
    "These entries already reference space/void via tags or template elements:",
    "",
    toMdList(voidTagged.slice(0, 120)) + voidTaggedOverflow,
    "",
    "## Uses \\`space\\` Essence Explicitly",
    toMdList(usesSpaceEssence.slice(0, 120)) + usesSpaceOverflow,
    "",
    "## Candidates For Rewrite/Deprecation Review (Not Auto-Deleted)",
    "### Bulk-Generated Universal Element Variants",
    "These are likely fine mechanically, but they can read repetitive in an AI-narrated LitRPG. Consider pruning or consolidating:",
    "",
    toMdList(bulkUniversalVariants.slice(0, 120)) + bulkOverflow,
    "",
    "### Generic Profession Skill Descriptions (Sample)",
    "These aren’t “bad,” but they’re placeholder-y and will feel thin in narrative output:",
    "",
    toMdList(genericProfessionText),
    "",
    "## Notes",
    "- This report is intentionally conservative: it flags items for review rather than deleting content that might be referenced by sets, quests, or saves.",
    "- Next step is to decide which bulk-variant spells to keep, and whether Voidverse should consolidate them into fewer, more archetypal techniques.",
    "",
  ].join("\n");

  await fs.mkdir(path.join(ROOT, "docs", "reports"), { recursive: true });
  const outPath = path.join(ROOT, "docs", "reports", `void_magic_audit_${new Date().toISOString().slice(0, 10)}.md`);
  await fs.writeFile(outPath, report, "utf8");

  console.log(`[void_magic_audit] wrote ${path.relative(ROOT, outPath)}`);
}

main().catch((err) => {
  console.error(err);
  process.exitCode = 1;
});
