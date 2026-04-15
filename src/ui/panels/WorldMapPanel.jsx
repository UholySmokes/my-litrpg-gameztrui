import { useState } from "react";
import styles from "./WorldMapPanel.module.css";
import { buildWorldAtlasModel } from "./worldAtlasModel.js";

const ATLAS_VIEWBOX = Object.freeze({ width: 920, height: 760 });
const PLANET_DISC = Object.freeze({ x: 340, y: 386, radius: 278 });

const STARFIELD_POINTS = Object.freeze([
  { cx: 48, cy: 72, r: 1.6 },
  { cx: 94, cy: 116, r: 1.1 },
  { cx: 142, cy: 56, r: 1.2 },
  { cx: 172, cy: 702, r: 1.5 },
  { cx: 252, cy: 44, r: 1.2 },
  { cx: 298, cy: 704, r: 1.7 },
  { cx: 412, cy: 94, r: 1.2 },
  { cx: 470, cy: 676, r: 1.1 },
  { cx: 558, cy: 84, r: 1.6 },
  { cx: 618, cy: 62, r: 1.2 },
  { cx: 706, cy: 698, r: 1.4 },
  { cx: 762, cy: 140, r: 1.2 },
  { cx: 842, cy: 566, r: 1.6 },
  { cx: 804, cy: 304, r: 1.3 },
  { cx: 724, cy: 718, r: 1.2 },
  { cx: 612, cy: 720, r: 1.1 },
  { cx: 82, cy: 730, r: 1.2 },
  { cx: 874, cy: 66, r: 1.4 },
]);

const LEYLINE_PATHS = Object.freeze([
  "M118 242 C192 198 246 214 308 250 C372 286 428 288 506 244",
  "M128 430 C198 390 250 384 318 412 C380 438 448 448 540 402",
  "M192 606 C268 560 332 556 402 582 C462 606 520 606 610 548",
  "M294 118 C334 168 350 220 356 280 C362 344 388 408 454 470",
  "M506 164 C548 220 562 268 566 334 C568 398 592 468 644 514",
]);

const STATUS_LABELS = Object.freeze({
  current: "Current foothold",
  known: "Known theater",
  unseen: "Unseen theater",
});

function joinClasses(...values) {
  return values.filter(Boolean).join(" ");
}

function capitalizeLabel(value) {
  return String(value || "")
    .split(/[_\s-]+/g)
    .filter(Boolean)
    .map((token) => token.charAt(0).toUpperCase() + token.slice(1))
    .join(" ");
}

function DetailToken({ children, tone = "cyan" }) {
  return (
    <span className={joinClasses(styles.detailToken, styles[`token${capitalizeLabel(tone)}`])}>
      {children}
    </span>
  );
}

function LegendSwatch({ className }) {
  return <span className={joinClasses(styles.legendSwatch, className)} />;
}

function DetailRail({ selectedHotspot, currentLocationName }) {
  const scaleLabel = selectedHotspot?.isMajor
    ? "Major supercontinent"
    : selectedHotspot?.startingEligible
      ? "Starting continent"
      : "Advanced continent";
  const statusLabel = STATUS_LABELS[selectedHotspot?.status] || "Atlas focus";

  return (
    <aside className={styles.detailRail}>
      <section className={styles.detailCard}>
        <div className={styles.detailEyebrow}>Crowngrave Focus</div>
        <h3 className={styles.detailTitle}>{selectedHotspot?.name || "No focus selected"}</h3>
        <div className={styles.detailMeta}>
          {scaleLabel} • {selectedHotspot?.countryCount || 0} countries • {statusLabel}
        </div>
        <p className={styles.detailCopy}>
          {selectedHotspot?.summary ||
            "The atlas waits for a stable landmass focus before it reveals its deeper strata."}
        </p>
        <p className={styles.doctrineCopy}>
          {selectedHotspot?.uniquenessThesis ||
            "Crowngrave does not keep ordinary geography. Each landmass is a political ecology with its own death logic and awakening rites."}
        </p>
        <div className={styles.detailTokenRow}>
          {selectedHotspot?.isMajor ? <DetailToken tone="gold">Major landmass</DetailToken> : null}
          {selectedHotspot?.startingEligible ? (
            <DetailToken tone="cyan">Starting region</DetailToken>
          ) : null}
          {selectedHotspot?.isLocked ? (
            <DetailToken tone="dim">Locked advanced region</DetailToken>
          ) : null}
          {selectedHotspot?.isCurrent ? (
            <DetailToken tone="gold">Current foothold</DetailToken>
          ) : null}
        </div>
      </section>

      <section className={styles.detailCard}>
        <div className={styles.sectionLabel}>Climate Bands</div>
        <div className={styles.detailTokenRow}>
          {(selectedHotspot?.climateBands || []).map((climate) => (
            <DetailToken key={climate}>{climate}</DetailToken>
          ))}
        </div>
      </section>

      <section className={styles.detailCard}>
        <div className={styles.sectionLabel}>Exemplar Countries</div>
        <div className={styles.metaList}>
          {(selectedHotspot?.countries || []).map((country) => (
            <div key={country.id} className={styles.metaItem}>
              <strong>{country.name}</strong>
              <span>Exemplar state within the broader continental sprawl.</span>
            </div>
          ))}
        </div>
      </section>

      <section className={styles.detailCard}>
        <div className={styles.sectionLabel}>Hazard And Wonder</div>
        <div className={styles.metaList}>
          <div className={styles.metaItem}>
            <strong>{selectedHotspot?.deathZone?.name || "No death zone recorded"}</strong>
            <span>
              {selectedHotspot?.deathZone?.kind
                ? `${capitalizeLabel(selectedHotspot.deathZone.kind)} • `
                : ""}
              {selectedHotspot?.deathZone?.summary || "No hazard summary recorded."}
            </span>
          </div>
          <div className={styles.metaItem}>
            <strong>{selectedHotspot?.mysticalPlace?.name || "No mystical place recorded"}</strong>
            <span>
              {selectedHotspot?.mysticalPlace?.kind
                ? `${capitalizeLabel(selectedHotspot.mysticalPlace.kind)} • `
                : ""}
              {selectedHotspot?.mysticalPlace?.summary || "No mystical note recorded."}
            </span>
          </div>
        </div>
      </section>

      <section className={styles.detailCard}>
        <div className={styles.sectionLabel}>Essence Triad</div>
        <div className={styles.detailTokenRow}>
          {(selectedHotspot?.essenceTriad || []).map((essence) => (
            <DetailToken key={essence} tone="gold">
              {capitalizeLabel(essence)}
            </DetailToken>
          ))}
        </div>
        {selectedHotspot?.isCurrent ? (
          <div className={styles.currentFooting}>
            Current foothold: {selectedHotspot.currentLocationName || currentLocationName}
          </div>
        ) : null}
      </section>

      <section className={styles.detailCard}>
        <div className={styles.sectionLabel}>Legend</div>
        <div className={styles.legend}>
          <span className={styles.legendItem}>
            <LegendSwatch className={styles.legendMajor} />
            Major supercontinent
          </span>
          <span className={styles.legendItem}>
            <LegendSwatch className={styles.legendStarter} />
            Starting continent
          </span>
          <span className={styles.legendItem}>
            <LegendSwatch className={styles.legendLocked} />
            Locked advanced region
          </span>
          <span className={styles.legendItem}>
            <LegendSwatch className={styles.legendDeath} />
            Death zone marker
          </span>
          <span className={styles.legendItem}>
            <LegendSwatch className={styles.legendMystical} />
            Mystical place marker
          </span>
          <span className={styles.legendItem}>
            <LegendSwatch className={styles.legendCurrent} />
            Current foothold
          </span>
        </div>
      </section>
    </aside>
  );
}

export default function WorldMapPanel({ state }) {
  const model = buildWorldAtlasModel(state);
  const [pinnedHotspotId, setPinnedHotspotId] = useState(null);
  const [hoveredHotspotId, setHoveredHotspotId] = useState(null);

  const selectedHotspotId = hoveredHotspotId || pinnedHotspotId || model.defaultHotspotId;
  const selectedHotspot =
    model.hotspotsById[selectedHotspotId] ||
    model.hotspotsById[model.defaultHotspotId] ||
    model.landmasses[0];

  const handleHotspotKeyDown = (event, hotspotId) => {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      setPinnedHotspotId(hotspotId);
    }
    if (event.key === "Escape") {
      setPinnedHotspotId(null);
      setHoveredHotspotId(null);
    }
  };

  return (
    <div className={styles.root}>
      <section className={styles.surface}>
        <header className={styles.header}>
          <div className={styles.eyebrow}>Crowngrave Atlas</div>
          <h2 className={styles.title}>Eighteen landmasses, two supercontinents, one impossible world.</h2>
          <p className={styles.copy}>
            Crowngrave is rendered as a ritual disc rather than a literal globe. Every hotspot is a
            continent-scale polity with its own climates, death zones, awakening sites, and
            continental thesis. Hover or focus to preview; click or tap to pin.
          </p>
        </header>

        <div className={styles.layout}>
          <div className={styles.canvas} onMouseLeave={() => setHoveredHotspotId(null)}>
            <svg
              className={styles.svg}
              viewBox={`0 0 ${ATLAS_VIEWBOX.width} ${ATLAS_VIEWBOX.height}`}
              role="img"
              aria-label="Crowngrave world atlas showing two major supercontinents and sixteen continental theaters."
            >
              <defs>
                <radialGradient id="crowngrave-disc-glow" cx="44%" cy="38%" r="66%">
                  <stop offset="0%" stopColor="rgba(255,255,255,0.2)" />
                  <stop offset="24%" stopColor="rgba(115,239,227,0.18)" />
                  <stop offset="72%" stopColor="rgba(10,14,28,0.94)" />
                  <stop offset="100%" stopColor="rgba(6,9,18,0.98)" />
                </radialGradient>
                <linearGradient id="crowngrave-seam" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="rgba(211,165,106,0.18)" />
                  <stop offset="46%" stopColor="rgba(115,239,227,0.82)" />
                  <stop offset="100%" stopColor="rgba(211,165,106,0.28)" />
                </linearGradient>
              </defs>

              {STARFIELD_POINTS.map((point, index) => (
                <circle
                  key={`star-${index}`}
                  cx={point.cx}
                  cy={point.cy}
                  r={point.r}
                  className={styles.star}
                />
              ))}

              <circle
                cx={PLANET_DISC.x}
                cy={PLANET_DISC.y}
                r={PLANET_DISC.radius + 30}
                className={styles.orbitRing}
              />
              <circle
                cx={PLANET_DISC.x}
                cy={PLANET_DISC.y}
                r={PLANET_DISC.radius + 10}
                className={styles.orbitRingInner}
              />
              <circle
                cx={PLANET_DISC.x}
                cy={PLANET_DISC.y}
                r={PLANET_DISC.radius}
                fill="url(#crowngrave-disc-glow)"
                className={styles.planetDisc}
              />

              {LEYLINE_PATHS.map((pathData) => (
                <path
                  key={pathData}
                  d={pathData}
                  className={styles.leyline}
                  stroke="url(#crowngrave-seam)"
                />
              ))}

              {model.landmasses.map((landmass) => {
                const isSelected = selectedHotspotId === landmass.hotspotId;
                const isPinned = pinnedHotspotId === landmass.hotspotId;
                const point = landmass.atlasPlacement;
                const deathMarkerX = point.x + point.rx * 0.34;
                const deathMarkerY = point.y - point.ry * 0.18;
                const mysticalMarkerX = point.x - point.rx * 0.28;
                const mysticalMarkerY = point.y + point.ry * 0.22;

                return (
                  <g
                    key={landmass.id}
                    className={joinClasses(
                      styles.hotspot,
                      landmass.isMajor && styles.hotspotMajor,
                      landmass.startingEligible && styles.hotspotStarter,
                      landmass.isLocked && styles.hotspotLocked,
                      isSelected && styles.hotspotSelected,
                      landmass.isCurrent && styles.hotspotCurrent,
                    )}
                    role="button"
                    tabIndex={0}
                    aria-label={`${landmass.name}: ${landmass.summary}`}
                    aria-pressed={isPinned}
                    aria-current={landmass.isCurrent ? "true" : undefined}
                    onMouseEnter={() => setHoveredHotspotId(landmass.hotspotId)}
                    onMouseLeave={() => setHoveredHotspotId(null)}
                    onFocus={() => setHoveredHotspotId(landmass.hotspotId)}
                    onBlur={() => setHoveredHotspotId(null)}
                    onClick={() => setPinnedHotspotId(landmass.hotspotId)}
                    onKeyDown={(event) => handleHotspotKeyDown(event, landmass.hotspotId)}
                  >
                    {landmass.isCurrent ? (
                      <ellipse
                        cx={point.x}
                        cy={point.y}
                        rx={point.rx + 10}
                        ry={point.ry + 10}
                        transform={`rotate(${point.rotate} ${point.x} ${point.y})`}
                        className={styles.currentBeacon}
                      />
                    ) : null}
                    <ellipse
                      cx={point.x}
                      cy={point.y}
                      rx={point.rx}
                      ry={point.ry}
                      transform={`rotate(${point.rotate} ${point.x} ${point.y})`}
                      className={joinClasses(
                        styles.landmassShape,
                        landmass.isMajor && styles.landmassMajor,
                        landmass.status === "known" && styles.landmassKnown,
                        landmass.status === "unseen" && styles.landmassUnseen,
                      )}
                    />
                    <polygon
                      points={`${deathMarkerX},${deathMarkerY - 6} ${deathMarkerX + 6},${deathMarkerY} ${deathMarkerX},${deathMarkerY + 6} ${deathMarkerX - 6},${deathMarkerY}`}
                      className={styles.deathZoneMarker}
                    />
                    <circle
                      cx={mysticalMarkerX}
                      cy={mysticalMarkerY}
                      r="4.5"
                      className={styles.mysticalMarker}
                    />
                    <line
                      x1={point.x}
                      y1={point.y}
                      x2={point.labelX}
                      y2={point.labelY - 12}
                      className={styles.callout}
                    />
                    <text
                      x={point.labelX}
                      y={point.labelY}
                      textAnchor={point.labelAnchor}
                      className={styles.regionLabel}
                    >
                      {landmass.name}
                    </text>
                  </g>
                );
              })}
            </svg>
          </div>

          <DetailRail
            selectedHotspot={selectedHotspot}
            currentLocationName={model.currentLocationName}
          />
        </div>
      </section>
    </div>
  );
}
