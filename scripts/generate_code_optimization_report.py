from __future__ import annotations

import datetime as dt
import html
import json
import re
from pathlib import Path

import pdfplumber
import pypdfium2 as pdfium
from pypdf import PdfReader
from reportlab.lib import colors
from reportlab.lib.pagesizes import letter
from reportlab.lib.styles import ParagraphStyle, getSampleStyleSheet
from reportlab.lib.units import inch
from reportlab.pdfgen import canvas
from reportlab.platypus import Frame, Paragraph, Spacer, Table, TableStyle


REPORT_DATE = dt.date(2026, 3, 10)
PAGE_TOTAL = 20

ROOT = Path(__file__).resolve().parents[1]
OUTPUT_DIR = ROOT / "output" / "pdf"
TMP_DIR = ROOT / "tmp" / "pdfs"
OUTPUT_PATH = OUTPUT_DIR / f"code-optimization-report-{REPORT_DATE.isoformat()}.pdf"
PREVIEW_DIR = TMP_DIR / f"code-optimization-report-{REPORT_DATE.isoformat()}"

CODE_DIRS = [
    ROOT / "src",
    ROOT / "packages" / "game-core" / "src",
    ROOT / "functions" / "lib",
]
CODE_GLOBS = ("*.js", "*.jsx", "*.ts", "*.tsx")
IGNORE_MARKERS = (
    "dataconnect-generated",
    "\\node_modules\\",
    "\\dist\\",
    "\\coverage\\",
    "\\build\\",
    "\\tmp\\",
    "\\out\\",
)


def rel(path: Path) -> str:
    return path.relative_to(ROOT).as_posix()


def read_text(path: Path) -> str:
    return path.read_text(encoding="utf-8", errors="ignore")


def is_code_file(path: Path) -> bool:
    full = str(path.resolve()).lower()
    return not any(marker.lower() in full for marker in IGNORE_MARKERS)


def count_lines(text: str) -> int:
    return text.count("\n") + (0 if text.endswith("\n") else 1)


def count_matches(text: str, pattern: str, flags: int = 0) -> int:
    return len(re.findall(pattern, text, flags))


def load_json(path: Path) -> dict:
    return json.loads(read_text(path))


def format_kb(size: int) -> str:
    return f"{size / 1024:.1f} KB"


def scan_code_files() -> list[dict[str, object]]:
    items: list[dict[str, object]] = []
    for base in CODE_DIRS:
        for pattern in CODE_GLOBS:
            for path in base.rglob(pattern):
                if not path.is_file() or not is_code_file(path):
                    continue
                text = read_text(path)
                items.append(
                    {
                        "path": path,
                        "rel": rel(path),
                        "lines": count_lines(text),
                        "text": text,
                    }
                )

    unique: dict[str, dict[str, object]] = {}
    for item in items:
        unique[item["rel"]] = item
    return list(unique.values())


def collect_metrics() -> dict[str, object]:
    files = scan_code_files()
    total_lines = sum(int(item["lines"]) for item in files)
    sorted_files = sorted(files, key=lambda item: int(item["lines"]), reverse=True)
    top10_lines = sum(int(item["lines"]) for item in sorted_files[:10])
    top25_lines = sum(int(item["lines"]) for item in sorted_files[:25])

    package_json = load_json(ROOT / "package.json")
    functions_package_json = load_json(ROOT / "functions" / "package.json")
    eslint_config = read_text(ROOT / "eslint.config.js")

    tracked_paths = {
        "src/components/GameUI.jsx": ROOT / "src" / "components" / "GameUI.jsx",
        "src/hook/useNarrative.js": ROOT / "src" / "hook" / "useNarrative.js",
        "packages/game-core/src/systems/combat/CombatSystem.js": ROOT
        / "packages"
        / "game-core"
        / "src"
        / "systems"
        / "combat"
        / "CombatSystem.js",
        "packages/game-core/src/core/gameReducer.js": ROOT
        / "packages"
        / "game-core"
        / "src"
        / "core"
        / "gameReducer.js",
        "functions/lib/sync-core.js": ROOT / "functions" / "lib" / "sync-core.js",
        "functions/lib/sync.js": ROOT / "functions" / "lib" / "sync.js",
        "packages/game-core/src/data/registries/RaceDataRegistry.js": ROOT
        / "packages"
        / "game-core"
        / "src"
        / "data"
        / "registries"
        / "RaceDataRegistry.js",
        "packages/game-core/src/systems/skills/SkillRegistry.js": ROOT
        / "packages"
        / "game-core"
        / "src"
        / "systems"
        / "skills"
        / "SkillRegistry.js",
    }

    tracked: dict[str, dict[str, object]] = {}
    for key, path in tracked_paths.items():
        text = read_text(path)
        tracked[key] = {
            "lines": count_lines(text),
            "imports": count_matches(text, r"(?m)^import\s"),
            "exports": count_matches(text, r"\bexport\s+function\b"),
            "ifs": count_matches(text, r"\bif\s*\("),
            "cases": count_matches(text, r"\bcase\s+"),
            "useState": count_matches(text, r"useState\("),
            "useEffect": count_matches(text, r"useEffect\("),
            "useMemo": count_matches(text, r"useMemo\("),
            "useCallback": count_matches(text, r"useCallback\("),
            "useRef": count_matches(text, r"useRef\("),
            "styleProps": count_matches(text, r"style=\{\{"),
        }

    src_files = list((ROOT / "src").rglob("*.js")) + list((ROOT / "src").rglob("*.jsx"))
    src_text = "\n".join(read_text(path) for path in src_files)
    dynamic_imports = count_matches(src_text, r"import\s*\(")
    lazy_imports = count_matches(src_text, r"React\.lazy\(|\blazy\(")

    dist_assets = []
    dist_dir = ROOT / "dist" / "assets"
    if dist_dir.exists():
        for asset in sorted(dist_dir.glob("*"), key=lambda item: item.stat().st_size, reverse=True):
            if asset.is_file():
                dist_assets.append({"name": asset.name, "bytes": asset.stat().st_size})

    data_json_files = []
    data_dir = ROOT / "packages" / "game-core" / "src" / "data"
    for path in sorted(data_dir.rglob("*.json"), key=lambda item: item.stat().st_size, reverse=True):
        data_json_files.append({"rel": rel(path), "bytes": path.stat().st_size})

    test_files = set()
    for suffix in ("*.js", "*.jsx", "*.ts", "*.tsx"):
        for path in (ROOT / "tests").rglob(suffix):
            test_files.add(path.resolve())

    return {
        "report_date_long": REPORT_DATE.strftime("%B %d, %Y"),
        "repo_name": ROOT.name,
        "total_code_files": len(files),
        "total_code_lines": total_lines,
        "top10_pct": round((top10_lines / total_lines) * 100, 1),
        "top25_pct": round((top25_lines / total_lines) * 100, 1),
        "sorted_files": sorted_files,
        "tracked": tracked,
        "root_script_count": len(package_json["scripts"]),
        "functions_script_count": len(functions_package_json["scripts"]),
        "test_file_count": len(test_files),
        "dynamic_imports": dynamic_imports,
        "lazy_imports": lazy_imports,
        "dist_assets": dist_assets,
        "data_json_files": data_json_files,
        "eslint_ignores_out": "'out'" in eslint_config or '"out"' in eslint_config,
    }


def build_styles() -> dict[str, ParagraphStyle]:
    sample = getSampleStyleSheet()
    return {
        "Body": ParagraphStyle(
            name="Body",
            parent=sample["BodyText"],
            fontName="Helvetica",
            fontSize=9.6,
            leading=13,
            textColor=colors.HexColor("#1D2F45"),
            spaceBefore=2,
            spaceAfter=4,
        ),
        "Section": ParagraphStyle(
            name="Section",
            parent=sample["Heading2"],
            fontName="Helvetica-Bold",
            fontSize=12,
            leading=14,
            textColor=colors.HexColor("#14324B"),
            spaceBefore=6,
            spaceAfter=6,
        ),
    }


STYLES = build_styles()


def p(text: str, style_name: str = "Body") -> Paragraph:
    return Paragraph(text, STYLES[style_name])


def bullet(text: str, level: int = 0) -> Paragraph:
    indent = 12 + (level * 14)
    style = ParagraphStyle(
        name=f"Bullet{indent}",
        parent=STYLES["Body"],
        leftIndent=indent,
        firstLineIndent=-8,
        spaceBefore=2,
        spaceAfter=2,
    )
    return Paragraph(f"- {html.escape(text, quote=False)}", style)


def make_table(rows: list[list[str]], col_widths: list[float]) -> Table:
    table = Table(rows, colWidths=col_widths, hAlign="LEFT")
    table.setStyle(
        TableStyle(
            [
                ("GRID", (0, 0), (-1, -1), 0.35, colors.HexColor("#B7C6D9")),
                ("BOX", (0, 0), (-1, -1), 0.6, colors.HexColor("#6A7E99")),
                ("FONTNAME", (0, 0), (-1, -1), "Helvetica"),
                ("FONTSIZE", (0, 0), (-1, -1), 8.5),
                ("LEADING", (0, 0), (-1, -1), 11),
                ("BACKGROUND", (0, 0), (-1, 0), colors.HexColor("#E8EEF7")),
                ("TEXTCOLOR", (0, 0), (-1, 0), colors.HexColor("#14324B")),
                ("VALIGN", (0, 0), (-1, -1), "TOP"),
                ("LEFTPADDING", (0, 0), (-1, -1), 6),
                ("RIGHTPADDING", (0, 0), (-1, -1), 6),
                ("TOPPADDING", (0, 0), (-1, -1), 5),
                ("BOTTOMPADDING", (0, 0), (-1, -1), 5),
            ]
        )
    )
    return table


def intro_metrics_table(metrics: dict[str, object]) -> Table:
    rows = [
        ["Metric", "Observed value"],
        ["Audited code files", str(metrics["total_code_files"])],
        ["Approximate code lines", f"{metrics['total_code_lines']:,}"],
        ["Top 10 hotspot share", f"{metrics['top10_pct']:.1f}%"],
        ["Top 25 hotspot share", f"{metrics['top25_pct']:.1f}%"],
        ["Root npm scripts", str(metrics["root_script_count"])],
        ["Test files", str(metrics["test_file_count"])],
        ["Dynamic imports in src", str(metrics["dynamic_imports"])],
    ]
    return make_table(rows, [2.2 * inch, 3.8 * inch])


def hotspot_table(metrics: dict[str, object], start: int, stop: int) -> Table:
    rows = [["Hotspot file", "Lines", "Why it matters"]]
    for item in metrics["sorted_files"][start:stop]:
        rel_path = html.escape(str(item["rel"]), quote=False)
        lines = str(item["lines"])
        if "CombatSystem" in rel_path:
            reason = "Combat orchestration, branching, and deterministic state writes sit together."
        elif "GameUI" in rel_path:
            reason = "UI shell coordinates auth, saves, overlays, and gameplay presentation."
        elif "useNarrative" in rel_path:
            reason = "Narrative state, AI orchestration, scene seeding, and caching are coupled."
        elif "gameReducer" in rel_path:
            reason = "Reducer owns many state transitions and quest/combat coordination points."
        elif "sync" in rel_path:
            reason = "Server sync logic carries routing, persistence, and deterministic replay concerns."
        else:
            reason = "Large file size increases cognitive load and slows isolated optimization work."
        rows.append([rel_path, lines, reason])
    return make_table(rows, [3.0 * inch, 0.8 * inch, 2.4 * inch])


def asset_table(metrics: dict[str, object], limit: int = 6) -> Table:
    rows = [["Built asset", "Size", "Interpretation"]]
    for asset in metrics["dist_assets"][:limit]:
        name = asset["name"]
        size = format_kb(int(asset["bytes"]))
        if "game-core-skills" in name:
            note = "Heavy skill payload suggests eager loading of large JSON-backed registries."
        elif "GameUI" in name:
            note = "UI orchestration remains a large lazy chunk despite manual chunking."
        elif "archetypes" in name:
            note = "Archetype data is large enough to justify demand-based loading or precomputed indexes."
        else:
            note = "Keep vendor and base app bundles stable while carving domain chunks smaller."
        rows.append([name, size, note])
    return make_table(rows, [2.6 * inch, 0.8 * inch, 2.8 * inch])


def data_table(metrics: dict[str, object], limit: int = 8) -> Table:
    rows = [["Data asset", "Size", "Optimization angle"]]
    for asset in metrics["data_json_files"][:limit]:
        name = html.escape(str(asset["rel"]), quote=False)
        size = format_kb(int(asset["bytes"]))
        if "systems.json" in name:
            note = "Split into thematic shards or compile to indexed lookup maps."
        elif "non_combat.json" in name:
            note = "Load on demand from tooling screens instead of startup-critical paths."
        elif "authorities.json" in name:
            note = "Precompute summaries used by the UI instead of shipping full raw records."
        else:
            note = "Consider generated indexes or server-side packaging by feature set."
        rows.append([name, size, note])
    return make_table(rows, [3.0 * inch, 0.8 * inch, 2.4 * inch])


def roadmap_table() -> Table:
    rows = [
        ["Wave", "Scope", "Expected effect"],
        ["0-2 weeks", "Lint scope cleanup, chunk telemetry, hotspot baselines", "Faster feedback loops and safer refactors"],
        ["2-6 weeks", "Decompose GameUI and narrative pipeline, add selectors", "Lower rerender cost and easier testability"],
        ["6-10 weeks", "Extract combat sub-engines and data compilers", "Lower branch density and improved iteration speed"],
        ["10+ weeks", "Formalize domain boundaries and generated content packs", "Sustainable scaling for new systems and content"],
    ]
    return make_table(rows, [1.1 * inch, 2.5 * inch, 2.8 * inch])


def success_table() -> Table:
    rows = [
        ["Signal", "Current observation", "Target after optimization"],
        ["Hotspot concentration", "Top 10 files hold 26.3% of code", "Bring below 20% through modular splits"],
        ["Heavy browser chunks", "Two chunks exceed 500 KB raw", "Keep gameplay-facing chunks below 300 KB raw"],
        ["Lazy entry points", "2 lazy imports in src", "Expand to mode or domain-level boundaries"],
        ["Lint scope", "Generated out/production artifacts are scanned", "Lint only source-owned directories"],
        ["Combat complexity", "3594 lines and 295 if branches in one file", "Extract rule families behind typed interfaces"],
    ]
    return make_table(rows, [1.8 * inch, 2.2 * inch, 2.4 * inch])


def make_page_specs(metrics: dict[str, object]) -> list[dict[str, object]]:
    tracked = metrics["tracked"]
    game_ui = tracked["src/components/GameUI.jsx"]
    narrative = tracked["src/hook/useNarrative.js"]
    combat = tracked["packages/game-core/src/systems/combat/CombatSystem.js"]
    reducer = tracked["packages/game-core/src/core/gameReducer.js"]
    sync_core = tracked["functions/lib/sync-core.js"]
    pages: list[dict[str, object]] = [
        {
            "title": "Possible Code Optimizations for my-litrpg-gameztrui",
            "subtitle": "Balanced runtime, maintainability, and delivery audit",
            "body": [
                Spacer(1, 0.8 * inch),
                p(
                    "<b>Prepared:</b> March 10, 2026<br/><b>Scope:</b> React/Vite frontend, "
                    "game-core systems, Firebase Functions runtime, content registries, and "
                    "tooling pipeline.<br/><b>Output:</b> A 20-page repo-specific optimization report "
                    "with prioritized recommendations."
                ),
                Spacer(1, 0.22 * inch),
                p(
                    "This report reviews the current codebase through a balanced lens. It does not "
                    "treat optimization as a synonym for micro-performance tuning. Instead, it looks "
                    "at the places where runtime cost, cognitive load, bundle weight, and engineering "
                    "friction reinforce each other and create compounding drag."
                ),
                Spacer(1, 0.18 * inch),
                p(
                    "The strongest theme in this repository is concentration. A relatively small set "
                    "of orchestration files carries a large share of business logic, data loading, and "
                    "state transition complexity. That means the highest-value improvements are likely "
                    "to come from architectural decomposition, selective loading, and clearer ownership "
                    "boundaries rather than from isolated low-level rewrites."
                ),
                Spacer(1, 0.22 * inch),
                intro_metrics_table(metrics),
                Spacer(1, 0.18 * inch),
                p(
                    "Recommendation in one sentence: optimize the repo by shrinking orchestration "
                    "surfaces, compiling or lazily loading static content, and turning high-branching "
                    "systems into smaller deterministic modules with measurable contracts."
                ),
            ],
        },
        {
            "title": "Table of Contents and Repo Snapshot",
            "subtitle": "Page map and the most important structural facts",
            "body": [
                p("<b>Contents</b>"),
                bullet("Pages 1-4: Summary, structure, and audit method."),
                bullet("Pages 5-8: Frontend orchestration, narrative flow, and bundle strategy."),
                bullet("Pages 9-12: Game-core hotspots, combat decomposition, and content data."),
                bullet("Pages 13-17: Functions, tooling, test strategy, and roadmap."),
                bullet("Pages 18-20: Appendices and closing notes."),
                Spacer(1, 0.18 * inch),
                p(
                    "The repository is not a narrow single-surface application. It combines a React "
                    "frontend under <b>src/</b>, a large shared simulation and content layer under "
                    "<b>packages/game-core/src/</b>, and operational server logic under "
                    "<b>functions/lib/</b>. That structure is healthy in intent, but several runtime "
                    "paths still cut across these boundaries in a way that causes large files and large "
                    "bundles."
                ),
                p(
                    f"The code scan covered <b>{metrics['total_code_files']}</b> source files and about "
                    f"<b>{metrics['total_code_lines']:,}</b> lines of executable code. The top ten files "
                    f"carry <b>{metrics['top10_pct']:.1f}%</b> of that footprint, which is high enough to "
                    "treat hotspot concentration as a primary design risk."
                ),
                Spacer(1, 0.18 * inch),
                bullet("Largest hotspot: CombatSystem.js at 3,594 lines, holding major combat orchestration."),
                bullet("Largest frontend hotspot: GameUI.jsx at 1,295 lines, coordinating multiple gameplay surfaces."),
                bullet("Largest narrative hotspot: useNarrative.js at 1,844 lines, mixing prompt, cache, and quest concerns."),
            ],
        },
        {
            "title": "Executive Summary",
            "subtitle": "The highest-value changes to pursue first",
            "body": [
                p(
                    "The codebase already demonstrates useful discipline in a few areas: the app and "
                    "functions projects both typecheck cleanly, Vite manual chunking is in place, and "
                    "core gameplay logic has been centralized rather than scattered across many thin "
                    "files. Those are solid foundations. The next stage of optimization should focus on "
                    "turning those centralized systems into smaller, cheaper-to-load, and easier-to-test "
                    "modules."
                ),
                Spacer(1, 0.15 * inch),
                bullet(
                    "Highest ROI: split orchestration-heavy files such as GameUI, useNarrative, "
                    "gameReducer, and CombatSystem along domain seams instead of function-by-function."
                ),
                bullet(
                    "Highest runtime leverage: reduce eager shipping of large game-core skill and "
                    "archetype payloads that currently contribute to the biggest browser chunks."
                ),
                bullet(
                    "Highest workflow leverage: narrow lint/build/test scope so generated artifacts do "
                    "not inflate feedback cycles or create noisy false work."
                ),
                bullet(
                    "Most important safeguard: add measurable baselines for chunk size, combat-step time, "
                    "and reducer/action latency before deep refactors begin."
                ),
                Spacer(1, 0.18 * inch),
                p(
                    "If the team can only fund a small optimization wave, the recommendation is to spend "
                    "it on three moves: carve GameUI into feature controllers and presentational layers, "
                    "compile static registries into demand-loaded slices, and extract combat rule families "
                    "out of CombatSystem behind explicit interfaces. Those changes will improve both "
                    "performance and maintainability without forcing a rewrite."
                ),
                Spacer(1, 0.18 * inch),
                make_table(
                    [
                        ["Priority", "Finding", "Why it is urgent"],
                        ["P1", "Monolithic orchestration files", "They slow every future change and hide localized wins."],
                        ["P1", "Large gameplay bundles", "They increase startup cost and keep too much content on the critical path."],
                        ["P2", "Registry-heavy static data", "Large JSON payloads reduce flexibility and waste memory."],
                        ["P2", "Tooling scope creep", "Generated folders are being linted, which erodes developer throughput."],
                        ["P3", "Testing is broad but not enough baseline-driven", "Optimization work needs stronger before/after signals."],
                    ],
                    [0.7 * inch, 2.1 * inch, 3.3 * inch],
                ),
            ],
        },
        {
            "title": "Audit Method and System Map",
            "subtitle": "How the findings were derived",
            "body": [
                p(
                    "This audit combined direct file inspection, simple structural metrics, and light "
                    "tooling validation. It is intentionally practical: the goal is to highlight "
                    "optimizations that matter in this repository as it exists today, not to produce an "
                    "academic complexity scorecard."
                ),
                Spacer(1, 0.14 * inch),
                bullet("Scanned source-owned JS/JSX/TS/TSX files in src, packages/game-core/src, and functions/lib."),
                bullet("Measured hotspot concentration by file line counts and local structural markers."),
                bullet("Built the web app to inspect current chunk composition under dist/assets."),
                bullet("Ran root and functions typecheck to separate optimization work from correctness debt."),
                bullet("Ran lint and observed generated-artifact scope leakage in the root workspace."),
                Spacer(1, 0.18 * inch),
                p(
                    "The system map that emerges is straightforward. The frontend shell coordinates auth, "
                    "save flows, character setup, and gameplay presentation. Game-core supplies the bulk "
                    "of deterministic logic, content registries, simulation helpers, and combat rules. "
                    "Functions add sync and content-generation responsibilities. Optimization opportunity "
                    "appears where these layers remain coupled through large orchestration surfaces."
                ),
                Spacer(1, 0.18 * inch),
                make_table(
                    [
                        ["Layer", "Current role", "Optimization lens"],
                        ["src/", "UI shell, hooks, feature modes, and client services", "Reduce rerenders, shrink lazy chunks, simplify orchestration."],
                        ["packages/game-core/src/", "Rules, registries, combat, simulation, and content", "Split rule engines, compile static data, localize ownership."],
                        ["functions/lib/", "Sync, API routing, generation, and persistence", "Separate hot path logic from adapters and storage concerns."],
                    ],
                    [1.3 * inch, 2.2 * inch, 2.5 * inch],
                ),
            ],
        },
        {
            "title": "Frontend Shell and UI Orchestration",
            "subtitle": "Why GameUI is a prime maintainability and runtime target",
            "body": [
                p(
                    f"<b>src/components/GameUI.jsx</b> is roughly <b>{game_ui['lines']}</b> lines long, "
                    f"uses <b>{game_ui['useState']}</b> local state hooks, <b>{game_ui['useEffect']}</b> effects, "
                    f"<b>{game_ui['useCallback']}</b> callbacks, and <b>{game_ui['styleProps']}</b> inline style blocks. "
                    "That combination usually signals an orchestration component that has taken on multiple roles: "
                    "session control, save management, transition control, and gameplay presentation."
                ),
                Spacer(1, 0.16 * inch),
                p(
                    "Large UI shells create two kinds of drag. First, they increase rerender probability "
                    "because many state changes terminate in the same component tree. Second, they make "
                    "safe extraction harder because domain logic and display concerns are woven together."
                ),
                Spacer(1, 0.16 * inch),
                bullet("Split GameUI into feature controllers: save/resume, transition shell, gameplay surface, and utility overlays."),
                bullet("Move inline style blocks into CSS modules or themed utility classes for smaller JSX payloads and easier memoization."),
                bullet("Introduce selector-style derivation functions so child components receive stable, pre-shaped props."),
                bullet("Consider mode-based subtrees so inactive gameplay features do not stay mounted or imported together."),
                Spacer(1, 0.16 * inch),
                p(
                    "A good target state is a thin top-level gameplay shell whose responsibilities are "
                    "coordination and suspense boundaries, not business logic ownership. That change alone "
                    "would make later performance work far cheaper."
                ),
            ],
        },
        {
            "title": "Narrative Pipeline",
            "subtitle": "The useNarrative hook is doing too many jobs at once",
            "body": [
                p(
                    f"<b>src/hook/useNarrative.js</b> is about <b>{narrative['lines']}</b> lines and combines "
                    "prompt assembly, AI calls, scene seeding, narrative cache behavior, opening-scene templates, "
                    "quest side effects, and user-facing suggestion logic. That makes it both a latency-sensitive "
                    "runtime path and a high-maintenance code surface."
                ),
                Spacer(1, 0.16 * inch),
                bullet("Extract prompt construction into pure deterministic builders with explicit input contracts."),
                bullet("Separate narrative transport from narrative state; AI call orchestration should not live inside content templates."),
                bullet("Move opening-scene templates and derived quest data into generated content packs or dedicated registries."),
                bullet("Keep cache policy in a focused adapter so invalidation rules can be tested independently."),
                Spacer(1, 0.16 * inch),
                p(
                    "This matters for both speed and correctness. Narrative systems often become optimization "
                    "blind spots because they look asynchronous by nature. In reality, a large share of their "
                    "cost is deterministic data shaping done before the network call ever starts."
                ),
                Spacer(1, 0.16 * inch),
                make_table(
                    [
                        ["Concern", "Current shape", "Better shape"],
                        ["Prompt building", "Interleaved with hook logic", "Pure builder module with typed inputs"],
                        ["Template ownership", "Large inline maps", "Generated or imported content packs"],
                        ["Cache policy", "Implicit in hook", "Dedicated cache adapter with tests"],
                        ["Side effects", "Mixed into narrative flow", "Explicit outcome pipeline"],
                    ],
                    [1.4 * inch, 2.3 * inch, 2.5 * inch],
                ),
            ],
        },
        {
            "title": "Rendering and State Efficiency",
            "subtitle": "Reduce needless work before chasing micro-optimizations",
            "body": [
                p(
                    "React performance work is most effective when the component graph is shaped well. "
                    "In the current repo, the biggest likely win is not sprinkling memoization everywhere. "
                    "It is reducing the amount of cross-cutting state that reaches large subtrees."
                ),
                Spacer(1, 0.16 * inch),
                bullet("Define explicit view models for gameplay panels so heavy formatting and derivation happen once per action, not per child render."),
                bullet("Prefer feature-local state machines for creation, save prompts, and overlays instead of many sibling booleans in one shell."),
                bullet("Use suspense and lazy boundaries at mode or feature level, not only at App.jsx entry points."),
                bullet("Reserve memoization for expensive derived data after prop-shape cleanup is in place."),
                Spacer(1, 0.16 * inch),
                p(
                    f"The current source tree only exposes <b>{metrics['lazy_imports']}</b> lazy boundaries in "
                    f"frontend source and <b>{metrics['dynamic_imports']}</b> dynamic imports overall. That is a "
                    "strong sign that the app still loads most capability behind a small number of gates. For a "
                    "feature-rich LitRPG surface, there is room to slice more intentionally."
                ),
                Spacer(1, 0.16 * inch),
                p(
                    "A practical next step is to choose one subdomain, such as save/load or character creation, "
                    "and prove that a narrower state boundary lowers rerender pressure without hurting usability. "
                    "That gives the team a reusable extraction pattern."
                ),
            ],
        },
        {
            "title": "Bundle and Loading Strategy",
            "subtitle": "Manual chunking helps, but content is still arriving too eagerly",
            "body": [
                p(
                    "The build output shows clear progress: vendor code is split, React is isolated, and "
                    "game-core skill and archetype chunks are already separated. That is good evidence that "
                    "bundle size is being managed intentionally. Even so, the largest domain chunks remain large "
                    "enough to justify deeper changes in how content is loaded."
                ),
                Spacer(1, 0.16 * inch),
                asset_table(metrics),
                Spacer(1, 0.16 * inch),
                bullet("Move large skill packs behind feature-aware imports or compile them into smaller ownership-based bundles."),
                bullet("Precompute lightweight indexes for UI selection and search screens rather than importing full raw payloads."),
                bullet("Track raw and gzip budgets in CI so chunk regressions are visible before they ship."),
                bullet("Review whether archetype and world-data consumers need full fidelity on initial gameplay load."),
                Spacer(1, 0.16 * inch),
                p(
                    "A common failure mode in content-heavy games is to keep optimizing Rollup while leaving "
                    "the content graph unchanged. Past a certain point, the better move is to reduce how much "
                    "domain data any one route or mode needs to know about up front."
                ),
            ],
        },
        {
            "title": "Game-Core Hotspot Map",
            "subtitle": "The shared simulation layer is where complexity concentrates most heavily",
            "body": [
                p(
                    "The shared game-core package contains about 46,613 lines across 114 source files, "
                    "which means it holds the majority of executable logic in the repo. That is expected for a "
                    "systems-heavy game, but the concentration profile deserves attention: large portions of combat, "
                    "skills, registries, and normalization are each dominated by single large files."
                ),
                Spacer(1, 0.16 * inch),
                hotspot_table(metrics, 8, 16),
                Spacer(1, 0.16 * inch),
                p(
                    f"<b>gameReducer.js</b> alone carries <b>{reducer['cases']}</b> switch cases and "
                    f"<b>{reducer['imports']}</b> imports. That is a classic sign that command handling, domain policy, "
                    "and side-effect orchestration are sharing a reducer surface that will keep growing as new systems land."
                ),
                Spacer(1, 0.16 * inch),
                bullet("Use reducer slices or command-handler registries so systems can evolve with narrower ownership."),
                bullet("Keep pure state transitions separate from post-action enrichment such as narrative and rewards."),
                bullet("Make data-normalization passes explicit and measurable so they do not become hidden tax on every action."),
            ],
        },
        {
            "title": "Combat Engine Optimization Plan",
            "subtitle": "CombatSystem is the strongest candidate for structural decomposition",
            "body": [
                p(
                    f"<b>CombatSystem.js</b> is about <b>{combat['lines']}</b> lines with <b>{combat['imports']}</b> imports, "
                    f"<b>{combat['exports']}</b> exported functions, and roughly <b>{combat['ifs']}</b> conditional branches. "
                    "That makes it both a runtime hotspot and a design hotspot. When a file does too much combat orchestration, "
                    "every rule change becomes a regression risk."
                ),
                Spacer(1, 0.16 * inch),
                bullet("Split combat into phases such as targeting, cost resolution, damage resolution, effect application, and end-of-turn reconciliation."),
                bullet("Replace broad shared state mutation patterns with typed combat context objects passed between phase modules."),
                bullet("Pre-resolve race, title, and equipment modifiers into a compact combat snapshot before action resolution starts."),
                bullet("Move combat log string construction out of the hot path or into append-only event formatters."),
                Spacer(1, 0.16 * inch),
                make_table(
                    [
                        ["Module family", "What moves out of CombatSystem"],
                        ["Preparation", "Target validation, lane rules, action legality, and snapshot shaping"],
                        ["Resolution", "Damage math, crit rules, bypasses, cooldown and cost changes"],
                        ["Effects", "Status application, charm, stealth, item procs, and follow-up triggers"],
                        ["Aftermath", "XP, drops, progression updates, and combat log formatting"],
                    ],
                    [1.6 * inch, 4.4 * inch],
                ),
                Spacer(1, 0.16 * inch),
                p(
                    "This is not a call for over-abstraction. The goal is to group rules by lifecycle stage "
                    "so the team can optimize and test a family of mechanics without scanning thousands of lines."
                ),
            ],
        },
        {
            "title": "Data and Content Pipeline",
            "subtitle": "Static payloads should be easier to compile, index, and ship selectively",
            "body": [
                p(
                    "The repository ships large JSON-backed content sets for skills, archetypes, authorities, "
                    "and other gameplay metadata. Static content is a strength, but raw payload size and import "
                    "shape matter. When registries import everything eagerly, they increase both bundle weight and "
                    "in-memory working set."
                ),
                Spacer(1, 0.16 * inch),
                data_table(metrics),
                Spacer(1, 0.16 * inch),
                bullet("Add a build-time content compiler that emits lightweight indexes plus feature-specific shards."),
                bullet("Separate authoring format from runtime format; rich JSON can stay for editing while compiled artifacts drive the app."),
                bullet("Cache normalized registry lookups rather than repeating linear scans through large arrays."),
                bullet("Ship only the content families a mode needs, especially for creation and tooling screens."),
                Spacer(1, 0.16 * inch),
                p(
                    "A content compiler is especially attractive here because it improves more than performance. "
                    "It also creates a single place to enforce schema quality, derived indexes, and compatibility "
                    "checks for evolving class or race systems."
                ),
            ],
        },
        {
            "title": "Determinism, Simulation, and State Normalization",
            "subtitle": "Keep deterministic behavior explicit and cheap",
            "body": [
                p(
                    "The project leans on deterministic gameplay concepts: seeded generation, replay behavior, "
                    "state normalization, and sync validation. Those are valuable capabilities, but they can become "
                    "expensive if normalization and simulation preparation happen too frequently or too late in the "
                    "request path."
                ),
                Spacer(1, 0.16 * inch),
                bullet("Measure normalization cost separately from action resolution cost so reducers do not hide structural tax."),
                bullet("Create immutable, pre-shaped snapshots for simulation bridges instead of re-deriving broad state repeatedly."),
                bullet("Treat replay and sync hash generation as first-class observability signals with baseline budgets."),
                bullet("Where possible, move deterministic derived data to write-time instead of recomputing it on each read."),
                Spacer(1, 0.16 * inch),
                p(
                    "A good heuristic is to ask whether each normalization or replay-related step is truly required "
                    "for the hot path it sits on. Deterministic correctness is essential, but it should not force "
                    "every action to pay for work that only specific modes or diagnostics need."
                ),
                Spacer(1, 0.16 * inch),
                make_table(
                    [
                        ["Concern", "Optimization move"],
                        ["State normalization", "Stage it by action type or normalize only changed slices."],
                        ["Simulation bridge setup", "Cache read-only prepared views for repeated combat loops."],
                        ["Replay hashing", "Generate checkpoints at stable boundaries instead of after every micro-step."],
                        ["Derived quest checks", "Use event-specific predicates rather than broad post-action scans."],
                    ],
                    [2.2 * inch, 3.8 * inch],
                ),
            ],
        },
        {
            "title": "Functions and Sync Architecture",
            "subtitle": "Server-side logic is smaller, but still worth simplifying",
            "body": [
                p(
                    f"The Firebase Functions surface is smaller than the frontend and game-core layers, but it "
                    f"still contains meaningful hotspots. <b>functions/lib/sync-core.js</b> is about "
                    f"<b>{sync_core['lines']}</b> lines and mixes canonicalization, hashing, manifest handling, "
                    "event normalization, and reward policy concerns. That is enough responsibility density to "
                    "justify decomposition."
                ),
                Spacer(1, 0.16 * inch),
                bullet("Split sync-core into event normalization, deterministic hashing, manifest access, and reward policy modules."),
                bullet("Keep file system and environment access in thin adapters so pure sync logic remains test-friendly."),
                bullet("Promote canonical serialization and RNG helpers into a focused deterministic utilities layer."),
                bullet("Review sync.js and bulk-generation paths for repeated parsing or storage work that can be cached per request."),
                Spacer(1, 0.16 * inch),
                p(
                    "The goal on the server side is not only throughput. It is also confidence. When sync logic "
                    "is cleanly separated from adapters, deterministic behavior is easier to replay locally and "
                    "safer to optimize."
                ),
                Spacer(1, 0.16 * inch),
                hotspot_table(metrics, 16, 22),
            ],
        },
        {
            "title": "Backend Runtime Improvements",
            "subtitle": "Small server changes can improve resilience and observability",
            "body": [
                p(
                    "Functions optimization does not need to start with scaling assumptions. In a repo like this, "
                    "the first wins usually come from cleaner hot paths, reduced incidental I/O, and better visibility "
                    "into deterministic runtime behavior."
                ),
                Spacer(1, 0.16 * inch),
                bullet("Cache manifest and reference data once per cold start with explicit invalidation hooks for local development."),
                bullet("Move crypto-heavy or serialization-heavy helpers behind measured utilities so their cost is visible in logs."),
                bullet("Use per-route latency logging around sync and generation handlers to identify whether CPU or storage dominates."),
                bullet("Standardize payload shaping between router and handler layers to reduce repeated validation work."),
                Spacer(1, 0.16 * inch),
                p(
                    "If traffic grows, these improvements also create a better foundation for concurrency decisions. "
                    "Without good decomposition, scaling tends to amplify noisy bottlenecks instead of clarifying them."
                ),
                Spacer(1, 0.16 * inch),
                make_table(
                    [
                        ["Path", "Likely cost center", "Recommended probe"],
                        ["Sync replay and hashing", "Serialization plus canonical hashing", "Measure payload size against latency"],
                        ["Bulk generation", "I/O and content shaping", "Log item counts and generation stages"],
                        ["API router", "Request normalization and dispatch", "Track route-level latency percentiles"],
                    ],
                    [1.8 * inch, 2.0 * inch, 2.2 * inch],
                ),
            ],
        },
        {
            "title": "Tooling and CI Efficiency",
            "subtitle": "Developer feedback loops can be tightened with low risk",
            "body": [
                p(
                    f"The root workspace currently defines <b>{metrics['root_script_count']}</b> npm scripts. "
                    "That reflects healthy operational maturity, but it also signals script sprawl and a need for "
                    "clear guardrails around what belongs in the hot developer loop versus release-only workflows."
                ),
                Spacer(1, 0.16 * inch),
                p(
                    "One immediately actionable issue surfaced during the audit: root lint scanned generated "
                    "artifacts under out/production because the global ignore list covers dist, build, and coverage "
                    "but does not currently ignore out. That is a small config detail with outsized impact on feedback noise."
                ),
                Spacer(1, 0.16 * inch),
                bullet("Add out and other generated product directories to global ESLint ignores, or lint only source-owned roots."),
                bullet("Separate fast local verification from release and rollout scripts so contributors know the cheapest safe loop."),
                bullet("Publish chunk-size and line-count hotspot reports as generated artifacts instead of manual detective work."),
                bullet("Consider script namespaces or task runners for related release tracks to reduce command discovery friction."),
                Spacer(1, 0.16 * inch),
                make_table(
                    [
                        ["Loop type", "Recommended contents"],
                        ["Inner loop", "lint scoped to source roots, typecheck, smoke tests, fast build budget check"],
                        ["Pre-merge", "full check, bundle budget enforcement, targeted replay and rules tests"],
                        ["Release", "rollout reports, endpoint probes, soak and rollback scripts"],
                    ],
                    [1.4 * inch, 4.6 * inch],
                ),
            ],
        },
        {
            "title": "Testing Optimization Strategy",
            "subtitle": "Use the test suite to protect optimization work, not just regressions",
            "body": [
                p(
                    f"The repository already has about <b>{metrics['test_file_count']}</b> test files, which is a "
                    "good base. The next opportunity is to turn that coverage into a better optimization safety net. "
                    "Performance-sensitive refactors need before-and-after baselines, not only correctness assertions."
                ),
                Spacer(1, 0.16 * inch),
                bullet("Add micro-bench or timing probes around combat resolution, reducer dispatch, and registry normalization."),
                bullet("Snapshot bundle sizes and fail builds only on meaningful regression thresholds, not raw churn."),
                bullet("Create contract tests for extracted sub-engines before large file decomposition begins."),
                bullet("Use deterministic replay fixtures to prove that combat and sync refactors preserve canonical outcomes."),
                Spacer(1, 0.16 * inch),
                p(
                    "Optimization efforts often stall because teams cannot prove they are still correct. In this codebase, "
                    "replay-oriented infrastructure is already present, which means the project is unusually well positioned "
                    "to make structural changes safely if those fixtures are formalized."
                ),
                Spacer(1, 0.16 * inch),
                make_table(
                    [
                        ["Focus area", "Most useful test form"],
                        ["GameUI decomposition", "Interaction tests around save, auth, and mode transitions"],
                        ["Narrative pipeline", "Pure builder tests plus cache invalidation tests"],
                        ["Combat engine", "Deterministic scenario fixtures and timing probes"],
                        ["Registry compiler", "Schema validation and output-compatibility snapshots"],
                    ],
                    [1.8 * inch, 4.2 * inch],
                ),
            ],
        },
        {
            "title": "Phased Roadmap",
            "subtitle": "Sequence the work so every wave unlocks the next",
            "body": [
                p(
                    "The safest optimization roadmap is not the one that attacks the biggest file first. It is the one "
                    "that creates observability and extraction patterns before deep surgery begins. The proposed sequence "
                    "below is designed to generate confidence early while still targeting the highest-value hotspots."
                ),
                Spacer(1, 0.18 * inch),
                roadmap_table(),
                Spacer(1, 0.18 * inch),
                bullet("Begin by making problems visible: tighten lint scope, record chunk sizes, and baseline combat plus reducer timing."),
                bullet("Use GameUI and useNarrative as the first extraction exemplars because they improve team velocity quickly."),
                bullet("Only then move into CombatSystem and registry compilation, which are higher leverage but also higher risk."),
                bullet("Keep every wave independently shippable so optimization does not become a long-lived branch of hidden work."),
            ],
        },
        {
            "title": "Appendix A: Hotspot Reference",
            "subtitle": "Largest code files and their likely optimization role",
            "body": [
                p(
                    "This appendix groups the largest source files because they represent the highest-value review surface "
                    "for future optimization work. Large files are not automatically bad, but in this repository they align "
                    "closely with cross-cutting ownership."
                ),
                Spacer(1, 0.16 * inch),
                hotspot_table(metrics, 0, 12),
                Spacer(1, 0.16 * inch),
                p(
                    "The concentration pattern is strong enough that formal file ownership and review checklists would help. "
                    "When multiple systems converge in one file, reviews should verify both domain correctness and cost growth."
                ),
            ],
        },
        {
            "title": "Appendix B: Build and Content Evidence",
            "subtitle": "Concrete payload indicators behind the recommendations",
            "body": [
                p(
                    "This appendix captures the two evidence sets most relevant to runtime and startup costs: built asset "
                    "sizes and the heaviest raw content payloads under packages/game-core/src/data."
                ),
                Spacer(1, 0.16 * inch),
                asset_table(metrics, limit=8),
                Spacer(1, 0.16 * inch),
                data_table(metrics, limit=6),
            ],
        },
        {
            "title": "Closing Notes",
            "subtitle": "What to do next",
            "body": [
                p(
                    "The codebase does not read like a project in crisis. It reads like a project that has accumulated enough "
                    "successful systems that the first generation of architecture is now carrying too much at once. That is a "
                    "good problem to have, because the next step is not reinvention. It is refinement."
                ),
                Spacer(1, 0.16 * inch),
                p(
                    "If the team starts with a narrow, measured wave focused on GameUI, useNarrative, lint scope, and chunk "
                    "telemetry, it can create immediate momentum. From there, combat decomposition and content compilation become "
                    "much easier to justify and much safer to ship."
                ),
                Spacer(1, 0.16 * inch),
                bullet("Start with visibility, not surgery."),
                bullet("Reduce orchestration surfaces before chasing micro-optimizations."),
                bullet("Compile or lazily load static content wherever feature boundaries allow."),
                bullet("Use deterministic replay and bundle budgets as proof that the work is helping."),
                Spacer(1, 0.22 * inch),
                p(
                    "Report generated from the repository state observed on March 10, 2026. All recommendations are intended "
                    "as implementation-ready guidance rather than abstract best practices."
                ),
            ],
        },
    ]
    if len(pages) != PAGE_TOTAL:
        raise RuntimeError(f"Expected {PAGE_TOTAL} pages, found {len(pages)} page specs.")
    return pages


def draw_page_chrome(pdf: canvas.Canvas, page_number: int, title: str, subtitle: str | None) -> None:
    width, height = letter
    pdf.setFillColor(colors.HexColor("#0F1D2E"))
    pdf.rect(0, height - 72, width, 72, fill=1, stroke=0)
    pdf.setFillColor(colors.HexColor("#203955"))
    pdf.rect(0, 0, width, 36, fill=1, stroke=0)
    pdf.setFillColor(colors.HexColor("#FFFFFF"))
    pdf.setFont("Helvetica-Bold", 22 if page_number == 1 else 18)
    pdf.drawString(54, height - 46, title)
    if subtitle:
        pdf.setFont("Helvetica", 10)
        pdf.setFillColor(colors.HexColor("#D6E3F2"))
        pdf.drawString(54, height - 62, subtitle)

    pdf.setFillColor(colors.HexColor("#FFFFFF"))
    pdf.setFont("Helvetica", 9)
    footer = f"Code Optimization Audit | {REPORT_DATE.strftime('%B %d, %Y')} | Page {page_number} of {PAGE_TOTAL}"
    pdf.drawRightString(width - 54, 14, footer)


def render_pages(page_specs: list[dict[str, object]]) -> None:
    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)
    TMP_DIR.mkdir(parents=True, exist_ok=True)
    pdf = canvas.Canvas(str(OUTPUT_PATH), pagesize=letter)

    for index, spec in enumerate(page_specs, start=1):
        frame = Frame(48, 42, letter[0] - 96, letter[1] - 132, showBoundary=0)
        draw_page_chrome(pdf, index, str(spec["title"]), spec.get("subtitle"))
        story = []
        body = spec.get("body")
        if body:
            story.extend(body)
        leftover = story[:]
        frame.addFromList(leftover, pdf)
        if leftover:
            raise RuntimeError(f"Page {index} overflowed; reduce content for '{spec['title']}'.")
        pdf.showPage()

    pdf.save()


def render_previews() -> list[Path]:
    PREVIEW_DIR.mkdir(parents=True, exist_ok=True)
    document = pdfium.PdfDocument(str(OUTPUT_PATH))
    preview_paths: list[Path] = []
    for index in range(len(document)):
        page = document[index]
        image = page.render(scale=1.2).to_pil()
        out_path = PREVIEW_DIR / f"page-{index + 1:02d}.png"
        image.save(out_path)
        preview_paths.append(out_path)
    return preview_paths


def verify_pdf() -> dict[str, object]:
    reader = PdfReader(str(OUTPUT_PATH))
    page_count = len(reader.pages)
    with pdfplumber.open(str(OUTPUT_PATH)) as pdf:
        first_page_text = pdf.pages[0].extract_text() or ""
        last_page_text = pdf.pages[-1].extract_text() or ""
    previews = render_previews()
    return {
        "page_count": page_count,
        "first_page_text": first_page_text[:400],
        "last_page_text": last_page_text[:400],
        "preview_count": len(previews),
        "preview_dir": str(PREVIEW_DIR),
    }


def main() -> None:
    metrics = collect_metrics()
    pages = make_page_specs(metrics)
    render_pages(pages)
    verification = verify_pdf()
    if verification["page_count"] != PAGE_TOTAL:
        raise RuntimeError(
            f"Expected {PAGE_TOTAL} pages, got {verification['page_count']} pages."
        )
    print(json.dumps({"pdf": str(OUTPUT_PATH), "verification": verification}, indent=2))


if __name__ == "__main__":
    main()
