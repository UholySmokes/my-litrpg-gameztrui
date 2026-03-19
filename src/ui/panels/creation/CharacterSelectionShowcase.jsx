import { useMemo, useState } from "react";
import styles from "./CharacterSelectionShowcase.module.css";

const HEROES = [
  {
    id: "astra",
    name: "Astra Veil",
    role: "Arcane Duelist",
    lineage: "Moon Elf · Spellblade",
    summary: "Blink-chains through openings and cashes in crit bursts with spell-etched blades.",
    badges: ["Burst", "Mobility", "Arcane"],
    stats: { atk: 84, arc: 97, tech: 72 },
    portrait: "linear-gradient(145deg, #4b2a7f, #132843)",
    figure: "linear-gradient(180deg, #ebc4ad, #c89476)",
    hair: "#9d6cff",
  },
  {
    id: "brakka",
    name: "Brakka Ironroot",
    role: "Frontline Guardian",
    lineage: "Stoneborn · Bastion",
    summary:
      "Converts incoming pressure into barriers, threat spikes, and safe breathing room for the party.",
    badges: ["Tank", "Control", "Bulwark"],
    stats: { hp: 99, def: 93, will: 76 },
    portrait: "linear-gradient(145deg, #5d3a24, #1b273c)",
    figure: "linear-gradient(180deg, #e4c2a8, #b67c5c)",
    hair: "#d2834b",
  },
  {
    id: "lyra",
    name: "Lyra Ashwind",
    role: "Ranger",
    lineage: "Wildborn · Marksman",
    summary:
      "Plays the edges of the arena with marked shots, traps, and evasive tempo resets.",
    badges: ["Crit", "Range", "Scout"],
    stats: { atk: 89, agi: 91, crit: 88 },
    portrait: "linear-gradient(145deg, #284823, #15283f)",
    figure: "linear-gradient(180deg, #ebc6ad, #c89671)",
    hair: "#7aa24d",
  },
  {
    id: "veyn",
    name: "Veyn Hollow",
    role: "Shadow Assassin",
    lineage: "Nightkin · Executioner",
    summary:
      "Vanishes into tempo gaps, then detonates isolated targets with execution windows.",
    badges: ["Stealth", "Burst", "Execution"],
    stats: { atk: 92, crit: 94, agi: 90 },
    portrait: "linear-gradient(145deg, #3f315d, #131a2e)",
    figure: "linear-gradient(180deg, #dbb8aa, #b28476)",
    hair: "#5c4e88",
  },
];

function formatStatLabel(label) {
  return label.slice(0, 3).toUpperCase();
}

function MiniRenderCard({ hero, active = false, pixel = false }) {
  const statEntries = Object.entries(hero.stats).slice(0, 3);

  return (
    <div
      className={`${styles.renderCard} ${pixel ? styles.renderCardPixel : ""} ${active ? styles.renderCardActive : ""}`}
      style={{
        "--portrait": hero.portrait,
        "--figure": hero.figure,
        "--hair": hero.hair,
      }}
    >
      <div className={styles.renderPortrait} />
      <div className={styles.renderName}>{hero.name}</div>
      <div className={styles.renderRole}>{hero.role}</div>
      <div className={styles.renderStatRow}>
        {statEntries.map(([label, value]) => (
          <div className={styles.renderStatChip} key={label}>
            <span>{formatStatLabel(label)}</span>
            <strong>{value}</strong>
          </div>
        ))}
      </div>
    </div>
  );
}

function ConceptRender({ variant, selectedHero }) {
  const isPixel = variant === "pixel";

  return (
    <div className={`${styles.preview} ${isPixel ? styles.previewPixel : ""}`}>
      <div className={styles.previewHeader}>
        <div>
          <div className={styles.previewKicker}>Choose Your Champion</div>
          <div className={styles.previewSubkicker}>
            {isPixel
              ? "RETRO ROSTER // COMPARE CLASSES // LOCK IN YOUR RUN"
              : "Summon a hero, compare archetypes, and bind your next LitRPG run."}
          </div>
        </div>
        <div className={styles.previewMode}>{isPixel ? "PIXEL" : "PAINTED"}</div>
      </div>

      <div className={styles.previewBody}>
        <div className={styles.previewRoster}>
          {HEROES.map((hero) => (
            <MiniRenderCard
              key={hero.id}
              hero={hero}
              active={hero.id === selectedHero.id}
              pixel={isPixel}
            />
          ))}
        </div>

        <div className={`${styles.previewDetail} ${isPixel ? styles.previewDetailPixel : ""}`}>
          <div className={styles.previewDetailLabel}>Selected hero</div>
          <div className={styles.previewDetailName}>{selectedHero.name}</div>
          <div className={styles.previewDetailMeta}>
            {selectedHero.lineage} · {selectedHero.role}
          </div>
          <div className={styles.previewBadgeRow}>
            {selectedHero.badges.map((badge) => (
              <span className={styles.previewBadge} key={badge}>
                {badge}
              </span>
            ))}
          </div>
          <div className={styles.previewDetailCopy}>{selectedHero.summary}</div>
          <div className={styles.renderStatRow}>
            {Object.entries(selectedHero.stats).map(([label, value]) => (
              <div className={styles.renderStatChip} key={label}>
                <span>{formatStatLabel(label)}</span>
                <strong>{value}</strong>
              </div>
            ))}
          </div>
          <div className={styles.previewLoadout}>
            <span>Bastion Slam</span>
            <span>Threat Beacon</span>
            <span>Fortress Step</span>
            <span>Last Wall</span>
          </div>
        </div>
      </div>

      <div className={styles.previewFooter}>
        <span>Compare hero cards, inspect role stats, then confirm your run starter.</span>
        <div className={styles.previewFooterActions}>
          <span className={styles.previewAction}>Back</span>
          <span className={styles.previewAction}>Randomize</span>
          <span className={styles.previewActionPrimary}>Confirm Hero</span>
        </div>
      </div>
    </div>
  );
}

export default function CharacterSelectionShowcase() {
  const [variant, setVariant] = useState("painted");
  const [selectedHeroId, setSelectedHeroId] = useState("brakka");

  const selectedHero = useMemo(
    () => HEROES.find((hero) => hero.id === selectedHeroId) ?? HEROES[1],
    [selectedHeroId],
  );

  const variantCopy =
    variant === "painted"
      ? "Premium painted-fantasy skin with rune-metal framing, soft atmospheric glow, and splash-art portrait treatment."
      : "Retro pixel-skin adaptation using crisp panel geometry, chunky stats, and a collectible JRPG roster feel.";

  return (
    <section className={styles.shell} aria-label="Character selection design showcase">
      <div className={styles.header}>
        <div>
          <div className={styles.kicker}>Character selection redesign</div>
          <h2 className={styles.title}>Card-based hero roster with dual art skins</h2>
          <p className={styles.subtitle}>
            Compare the approved layout in both a painted fantasy presentation and a
            pixel-art adaptation, then drill into the selected hero&apos;s role, stats,
            and starting fantasy before confirming your run.
          </p>
        </div>

        <div className={styles.variantToggle} role="tablist" aria-label="Design variant switcher">
          <button
            type="button"
            className={`${styles.variantButton} ${variant === "painted" ? styles.variantButtonActive : ""}`}
            onClick={() => setVariant("painted")}
          >
            Painted
          </button>
          <button
            type="button"
            className={`${styles.variantButton} ${styles.variantButtonPixel} ${variant === "pixel" ? styles.variantButtonActive : ""}`}
            onClick={() => setVariant("pixel")}
          >
            Pixel
          </button>
        </div>
      </div>

      <div className={styles.layout}>
        <div className={styles.roster}>
          {HEROES.map((hero) => {
            const statEntries = Object.entries(hero.stats).slice(0, 3);
            const isActive = hero.id === selectedHero.id;
            return (
              <button
                key={hero.id}
                type="button"
                className={`${styles.card} ${variant === "pixel" ? styles.cardPixel : ""} ${isActive ? styles.cardActive : ""}`}
                onClick={() => setSelectedHeroId(hero.id)}
              >
                <div
                  className={styles.cardPortrait}
                  style={{
                    "--portrait": hero.portrait,
                    "--figure": hero.figure,
                    "--hair": hero.hair,
                  }}
                />
                <div>
                  <div className={styles.cardName}>{hero.name}</div>
                  <div className={styles.cardMeta}>{hero.role}</div>
                </div>
                <div className={styles.statRow}>
                  {statEntries.map(([label, value]) => (
                    <div className={styles.statChip} key={label}>
                      <span className={styles.statLabel}>{formatStatLabel(label)}</span>
                      <span className={styles.statValue}>{value}</span>
                    </div>
                  ))}
                </div>
                <div className={styles.cardSummary}>{hero.summary}</div>
              </button>
            );
          })}
        </div>

        <aside className={`${styles.detail} ${variant === "pixel" ? styles.detailPixel : ""}`}>
          <ConceptRender variant={variant} selectedHero={selectedHero} />
          <div>
            <div className={styles.detailLabel}>Selected hero</div>
            <h3 className={styles.detailName}>{selectedHero.name}</h3>
            <div className={styles.detailMeta}>
              {selectedHero.lineage} · {selectedHero.role}
            </div>
          </div>
          <div className={styles.badges}>
            {selectedHero.badges.map((badge) => (
              <span className={styles.badge} key={badge}>
                {badge}
              </span>
            ))}
          </div>
          <div className={styles.detailBody}>{selectedHero.summary}</div>
          <div className={styles.detailBody}>{variantCopy}</div>
          <div className={styles.statRow}>
            {Object.entries(selectedHero.stats).map(([label, value]) => (
              <div className={styles.statChip} key={label}>
                <span className={styles.statLabel}>{formatStatLabel(label)}</span>
                <span className={styles.statValue}>{value}</span>
              </div>
            ))}
          </div>
        </aside>
      </div>

      <div className={styles.footer}>
        <div className={styles.footerCopy}>
          Both concept pictures are now rendered directly from reviewable React and CSS,
          so the design can be inspected in diffs without unsupported image artifacts.
        </div>
        <div className={styles.actions}>
          <span className={styles.action}>Painted mockup rendered in-app</span>
          <span className={styles.action}>Pixel mockup rendered in-app</span>
          <span className={styles.actionPrimary}>Confirm Hero</span>
        </div>
      </div>
    </section>
  );
}
