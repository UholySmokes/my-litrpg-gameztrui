import fs from "node:fs";
import fsp from "node:fs/promises";
import path from "node:path";
import { pathToFileURL } from "node:url";

const ROOT = process.cwd();
const OUTPUT_PATH = path.join(ROOT, "tools", "ability_catalog.json");

const TEXT_FILE_EXTENSIONS = new Set([
  ".js",
  ".jsx",
  ".ts",
  ".tsx",
  ".mjs",
  ".cjs",
  ".json",
  ".yml",
  ".yaml",
  ".txt",
  ".log",
  ".xml",
]);

const SKIP_DIR_NAMES = new Set([
  ".git",
  "node_modules",
  "coverage",
  "build",
  "tmp",
  "dist",
  "out",
  ".next",
  ".turbo",
  ".cache",
  "godot",
]);

const ALLOW_DOT_DIRS = new Set([".playwright-cli"]);

function normalizeKey(value) {
  if (typeof value !== "string") return "";
  return value
    .trim()
    .toLowerCase()
    .replace(/\s+/g, " ")
    .replace(/[^a-z0-9 _\-:()/]/g, "")
    .trim();
}

function titleFromId(id) {
  if (typeof id !== "string" || !id.trim()) return null;
  const cleaned = id
    .trim()
    .replace(/^doc_/, "")
    .replace(/[_\-]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
  if (!cleaned) return null;
  return cleaned
    .split(" ")
    .map((part) => (part ? part[0].toUpperCase() + part.slice(1) : part))
    .join(" ");
}

function safeJsonParse(text, filePathForErrors) {
  try {
    return JSON.parse(text);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    throw new Error(`Failed to parse JSON: ${filePathForErrors} (${message})`);
  }
}

function isSkippableDirName(dirName) {
  if (SKIP_DIR_NAMES.has(dirName)) return true;
  if (dirName.startsWith("firebase-export-")) return true;
  if (dirName.startsWith(".")) return !ALLOW_DOT_DIRS.has(dirName);
  return false;
}

async function walkFiles(startPath, results) {
  let entries;
  try {
    entries = await fsp.readdir(startPath, { withFileTypes: true });
  } catch {
    return;
  }

  for (const entry of entries) {
    const fullPath = path.join(startPath, entry.name);

    if (entry.isDirectory()) {
      if (isSkippableDirName(entry.name)) continue;
      await walkFiles(fullPath, results);
      continue;
    }

    if (!entry.isFile()) continue;

    const ext = path.extname(entry.name).toLowerCase();
    if (ext === ".md") continue; // user requested: do not use .md files as sources
    if (!TEXT_FILE_EXTENSIONS.has(ext)) continue;

    results.push(fullPath);
  }
}

function coerceKind(kind) {
  if (!kind) return "unknown";
  const k = String(kind).trim().toLowerCase();
  if (["skill", "ability", "spell", "talent", "profession_skill"].includes(k)) return k;
  return "unknown";
}

function mergePreferredString(a, b) {
  const aOk = typeof a === "string" && a.trim().length > 0;
  const bOk = typeof b === "string" && b.trim().length > 0;
  if (aOk) return a;
  if (bOk) return b;
  return aOk ? a : b;
}

function mergePreferredValue(a, b) {
  if (a === undefined || a === null) return b;
  return a;
}

function appendUnique(targetArray, item) {
  if (!item) return;
  if (!Array.isArray(targetArray)) return;
  if (targetArray.some((existing) => JSON.stringify(existing) === JSON.stringify(item))) return;
  targetArray.push(item);
}

function toPosixPath(relativePath) {
  if (typeof relativePath !== "string") return relativePath;
  return relativePath.replaceAll("\\", "/");
}

function createCatalog() {
  /** @type {Map<string, any>} */
  const byKey = new Map();

  function upsert(raw, source) {
    const id = typeof raw?.id === "string" ? raw.id : null;
    const name = typeof raw?.name === "string" ? raw.name : null;
    const phrase = typeof raw?.phrase === "string" ? raw.phrase : null;

    const key = normalizeKey(id || name || phrase);
    if (!key) return;

    const existing = byKey.get(key) || {
      key,
      id: id || null,
      name: name || phrase || titleFromId(id) || null,
      kind: coerceKind(raw?.kind),
      type: raw?.type ?? null,
      description: raw?.description ?? null,
      details: raw?.details ?? null,
      ownerType: raw?.ownerType ?? null,
      ownerId: raw?.ownerId ?? null,
      sources: [],
      mentions: [],
    };

    existing.id = mergePreferredString(existing.id, id);
    existing.name = mergePreferredString(existing.name, name || phrase || titleFromId(id));
    existing.kind = existing.kind === "unknown" ? coerceKind(raw?.kind) : existing.kind;
    existing.type = mergePreferredValue(existing.type, raw?.type);
    existing.description = mergePreferredString(existing.description, raw?.description);
    existing.ownerType = mergePreferredString(existing.ownerType, raw?.ownerType);
    existing.ownerId = mergePreferredString(existing.ownerId, raw?.ownerId);
    
    if (raw?.details && typeof raw.details === "object") {
      existing.details = existing.details ? { ...existing.details, ...raw.details } : raw.details;
    } else if (!existing.details && raw?.details) {
      existing.details = raw.details;
    }

    if (source) appendUnique(existing.sources, source);

    if (raw?.mention) {
      appendUnique(existing.mentions, raw.mention);
    }

    byKey.set(key, existing);
  }

  return { byKey, upsert };
}

async function loadStructuredSkills(catalog) {
  const skillsDir = path.join(ROOT, "packages", "game-core", "src", "data", "skills");
  let files;
  try {
    files = await fsp.readdir(skillsDir);
  } catch {
    return;
  }

  const jsonFiles = files.filter((name) => name.toLowerCase().endsWith(".json"));
  for (const fileName of jsonFiles) {
    const filePath = path.join(skillsDir, fileName);
    const text = await fsp.readFile(filePath, "utf-8");
    const parsed = safeJsonParse(text, filePath);
    if (!Array.isArray(parsed)) continue;

    for (const skill of parsed) {
      if (!skill || typeof skill !== "object") continue;
      const kind = "skill";
      catalog.upsert(
        {
          ...skill,
          kind,
          ownerType: skill.ownerType || (skill.class && skill.class !== "universal" ? "class" : "universal"),
          ownerId: skill.ownerId || skill.class || null,
          details: skill,
        },
        { type: "structured", origin: "skill_pack", path: toPosixPath(path.relative(ROOT, filePath)) },
      );
    }
  }
}

async function loadTalentRegistry(catalog) {
  const filePath = path.join(ROOT, "packages", "game-core", "src", "data", "talent.registry.json");
  if (!fs.existsSync(filePath)) return;
  const text = await fsp.readFile(filePath, "utf-8");
  const parsed = safeJsonParse(text, filePath);
  const talents = Array.isArray(parsed?.talents) ? parsed.talents : [];
  for (const talent of talents) {
    if (!talent || typeof talent !== "object") continue;
    catalog.upsert(
      {
        id: talent.id,
        name: titleFromId(talent.id) || talent.phrase || talent.id,
        kind: "talent",
        description: talent.description || null,
        details: talent,
      },
      { type: "structured", origin: "talent_registry", path: toPosixPath(path.relative(ROOT, filePath)) },
    );
  }
}

async function loadClassAbilities(catalog) {
  const filePath = path.join(
    ROOT,
    "packages",
    "game-core",
    "src",
    "systems",
    "class",
    "ClassAbilityRegistry.js",
  );
  if (!fs.existsSync(filePath)) return;

  const mod = await import(pathToFileURL(filePath));
  const ids = typeof mod.getAllClassAbilityIds === "function" ? mod.getAllClassAbilityIds() : [];
  for (const id of ids) {
    const ability = typeof mod.getClassAbilityById === "function" ? mod.getClassAbilityById(id) : null;
    if (!ability || typeof ability !== "object") continue;
    const owner = typeof mod.getAbilityOwner === "function" ? mod.getAbilityOwner(id) : null;
    catalog.upsert(
      {
        ...ability,
        kind: "ability",
        ownerType: owner?.ownerType || "class",
        ownerId: owner?.ownerId || null,
        details: ability,
      },
      { type: "structured", origin: "class_ability_registry", path: toPosixPath(path.relative(ROOT, filePath)) },
    );
  }
}

async function loadRaceAbilities(catalog) {
  const filePath = path.join(
    ROOT,
    "packages",
    "game-core",
    "src",
    "systems",
    "race",
    "RaceAbilityRegistry.js",
  );
  if (!fs.existsSync(filePath)) return;

  const mod = await import(pathToFileURL(filePath));
  const ids = typeof mod.getAllRaceAbilityIds === "function" ? mod.getAllRaceAbilityIds() : [];
  for (const id of ids) {
    const ability = typeof mod.getRaceAbilityById === "function" ? mod.getRaceAbilityById(id) : null;
    if (!ability || typeof ability !== "object") continue;
    catalog.upsert(
      {
        ...ability,
        kind: "ability",
        ownerType: "race",
        ownerId: null,
        details: ability,
      },
      { type: "structured", origin: "race_ability_registry", path: toPosixPath(path.relative(ROOT, filePath)) },
    );
  }
}

async function loadProfessionSkillMentions(catalog) {
  const filePath = path.join(
    ROOT,
    "packages",
    "game-core",
    "src",
    "systems",
    "profession",
    "ProfessionRegistry.js",
  );
  if (!fs.existsSync(filePath)) return;
  const mod = await import(pathToFileURL(filePath));
  const professions = mod.PROFESSIONS && typeof mod.PROFESSIONS === "object" ? mod.PROFESSIONS : {};
  for (const profession of Object.values(professions)) {
    const tierUnlocks =
      profession?.tierUnlocks && typeof profession.tierUnlocks === "object" ? profession.tierUnlocks : {};
    for (const [tierKey, unlock] of Object.entries(tierUnlocks)) {
      const skillIds = Array.isArray(unlock?.skills) ? unlock.skills : [];
      for (const skillId of skillIds) {
        if (typeof skillId !== "string" || !skillId.trim()) continue;
        catalog.upsert(
          {
            id: skillId,
            name: titleFromId(skillId),
            kind: "profession_skill",
            description: null,
            details: {
              professionId: profession?.id || null,
              professionName: profession?.name || null,
              tierUnlock: Number.isFinite(Number(tierKey)) ? Number(tierKey) : tierKey,
            },
          },
          {
            type: "structured",
            origin: "profession_registry",
            path: toPosixPath(path.relative(ROOT, filePath)),
          },
        );
      }
    }
  }
}

function parseCommaList(text) {
  return text
    .split(",")
    .map((item) => item.replace(/\.{3,}$/g, "").trim())
    .map((item) => item.replace(/^\"|\"$/g, "").replace(/^'|'$/g, "").trim())
    .filter((item) => item.length >= 2 && item.length <= 80);
}

function extractQuotedList(text) {
  const out = [];
  const doubleQuoted = /\"([^\"]+)\"/g;
  const singleQuoted = /'([^']+)'/g;
  for (const match of text.matchAll(doubleQuoted)) {
    out.push(match[1]);
  }
  for (const match of text.matchAll(singleQuoted)) {
    out.push(match[1]);
  }
  return out
    .map((item) => item.trim())
    .filter((item) => item.length >= 2 && item.length <= 80);
}

async function mineMentions(catalog, filePaths) {
  // Intentionally avoid mining from code files; it produces a lot of false positives
  // (e.g. variable names, snippets, and generated JSON containing the words "Skill List" / "Talents").
  const MENTION_EXTENSIONS = new Set([".json", ".yml", ".yaml", ".txt", ".log", ".xml"]);

  // Anchor these to line starts to reduce accidental matches in prose/code.
  const skillListRegex = /(?:^|\r?\n)\s*Skill List\s*[:]\s*([^\r\n]+)/gim;
  const skillsArrayRegex = /(?:^|\r?\n)\s*skills\s*[:=]\s*\[([^\]]+)\]/gim;
  const talentsInlineRegex = /(?:^|\r?\n)\s*Talents\s*[:]\s*([^\r\n]+)/gim;

  for (const filePath of filePaths) {
    const ext = path.extname(filePath).toLowerCase();
    if (!MENTION_EXTENSIONS.has(ext)) continue;

    const stat = await fsp.stat(filePath);
    // Avoid reading extremely large files fully; read a prefix which is enough for common lists.
    const maxBytes = 2_000_000;
    let text;
    if (stat.size > maxBytes) {
      const fd = await fsp.open(filePath, "r");
      const buffer = Buffer.alloc(maxBytes);
      await fd.read(buffer, 0, maxBytes, 0);
      await fd.close();
      text = buffer.toString("utf-8");
    } else {
      text = await fsp.readFile(filePath, "utf-8");
    }

    const relPath = path.relative(ROOT, filePath).replaceAll("\\\\", "/");

    const relPathPosix = toPosixPath(relPath);

    for (const match of text.matchAll(skillListRegex)) {
      const listText = match[1] || "";
      const names = parseCommaList(listText);
      for (const name of names) {
        catalog.upsert(
          {
            id: null,
            name,
            kind: "unknown",
            description: null,
            mention: { type: "Skill List", path: relPathPosix, snippet: listText.trim().slice(0, 240) },
          },
          { type: "mention", origin: "skill_list", path: relPathPosix },
        );
      }
    }

    for (const match of text.matchAll(skillsArrayRegex)) {
      const arrayText = match[1] || "";
      const ids = extractQuotedList(arrayText);
      for (const id of ids) {
        catalog.upsert(
          {
            id,
            name: titleFromId(id),
            kind: "unknown",
            description: null,
            mention: { type: "skills[]", path: relPathPosix, snippet: arrayText.trim().slice(0, 240) },
          },
          { type: "mention", origin: "skills_array", path: relPathPosix },
        );
      }
    }

    for (const match of text.matchAll(talentsInlineRegex)) {
      const line = (match[1] || "").trim();
      // Often this is not a list; keep it as a mention only if it looks like a list.
      if (!line.includes(",")) continue;
      const names = parseCommaList(line);
      for (const name of names) {
        catalog.upsert(
          {
            id: null,
            name,
            // Mention-only: treat as unknown to avoid polluting structured talent lists.
            kind: "unknown",
            description: null,
            mention: { type: "Talents", path: relPathPosix, snippet: line.slice(0, 240) },
          },
          { type: "mention", origin: "talents_line", path: relPathPosix },
        );
      }
    }
  }
}

async function main() {
  const catalog = createCatalog();

  await loadStructuredSkills(catalog);
  await loadTalentRegistry(catalog);
  await loadClassAbilities(catalog);
  await loadRaceAbilities(catalog);
  await loadProfessionSkillMentions(catalog);

  const scanRoots = [
    path.join(ROOT, "packages", "game-core"),
    path.join(ROOT, "src"),
    path.join(ROOT, "functions"),
    path.join(ROOT, "api"),
    path.join(ROOT, "public"),
    path.join(ROOT, "scripts"),
    path.join(ROOT, "tools"),
    path.join(ROOT, "tests"),
    path.join(ROOT, "docs"),
    path.join(ROOT, "narrator_adk"),
    path.join(ROOT, "user_agent"),
    path.join(ROOT, ".playwright-cli"),
  ].filter((p) => fs.existsSync(p));

  /** @type {string[]} */
  const filePaths = [];
  for (const scanRoot of scanRoots) {
    await walkFiles(scanRoot, filePaths);
  }

  // Also scan top-level text/json files.
  const rootEntries = await fsp.readdir(ROOT, { withFileTypes: true });
  for (const entry of rootEntries) {
    if (!entry.isFile()) continue;
    const ext = path.extname(entry.name).toLowerCase();
    if (ext === ".md") continue;
    if (!TEXT_FILE_EXTENSIONS.has(ext)) continue;
    filePaths.push(path.join(ROOT, entry.name));
  }

  // Never mine mentions from the generated output itself (prevents recursive/junk entries).
  const excludedAbs = new Set([
    path.resolve(OUTPUT_PATH),
    path.resolve(path.join(ROOT, "tools", "buildAbilityCatalog.mjs")),
  ]);
  const filteredFilePaths = filePaths.filter((p) => !excludedAbs.has(path.resolve(p)));

  await mineMentions(catalog, filteredFilePaths);

  const abilities = Array.from(catalog.byKey.values()).sort((a, b) => {
    const kindA = String(a.kind || "");
    const kindB = String(b.kind || "");
    if (kindA !== kindB) return kindA.localeCompare(kindB);
    return String(a.name || a.id || "").localeCompare(String(b.name || b.id || ""));
  });

  const byKind = abilities.reduce((acc, entry) => {
    const kind = entry.kind || "unknown";
    acc[kind] = (acc[kind] || 0) + 1;
    return acc;
  }, /** @type {Record<string, number>} */ ({}));

  const notes = ["This catalog excludes .md files as sources by design."];
  if ((byKind.unknown || 0) > 0) {
    notes.push("Entries marked as kind=unknown may be mention-only (no structured definition found).");
  }

  const output = {
    meta: {
      generatedAt: new Date().toISOString(),
      root: path.basename(ROOT),
      counts: {
        total: abilities.length,
        byKind,
      },
      notes,
    },
    abilities,
  };

  await fsp.mkdir(path.dirname(OUTPUT_PATH), { recursive: true });
  await fsp.writeFile(OUTPUT_PATH, JSON.stringify(output, null, 2) + "\n", "utf-8");
  console.log(`Wrote ${abilities.length} entries to ${path.relative(ROOT, OUTPUT_PATH)}`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
