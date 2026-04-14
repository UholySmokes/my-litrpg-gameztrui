import { useState } from "react";
import styles from "./WorldMapPanel.module.css";
import { buildWorldAtlasModel } from "./worldAtlasModel.js";

const ATLAS_VIEWBOX = Object.freeze({ width: 860, height: 700 });
const PLANET_DISC = Object.freeze({ x: 286, y: 336, radius: 216 });
const MERIDIAN_INSET = Object.freeze({ x: 488, y: 116, width: 326, height: 324 });

const STARFIELD_POINTS = Object.freeze([
  { cx: 42, cy: 44, r: 1.6 },
  { cx: 92, cy: 106, r: 1.2 },
  { cx: 132, cy: 52, r: 1.1 },
  { cx: 168, cy: 624, r: 1.6 },
  { cx: 224, cy: 36, r: 1.1 },
  { cx: 328, cy: 664, r: 1.8 },
  { cx: 388, cy: 76, r: 1.3 },
  { cx: 456, cy: 596, r: 1.1 },
  { cx: 534, cy: 68, r: 1.6 },
  { cx: 622, cy: 52, r: 1.2 },
  { cx: 704, cy: 610, r: 1.5 },
  { cx: 768, cy: 136, r: 1.2 },
  { cx: 800, cy: 534, r: 1.6 },
  { cx: 744, cy: 262, r: 1.3 },
  { cx: 664, cy: 652, r: 1.2 },
  { cx: 580, cy: 650, r: 1.1 },
  { cx: 94, cy: 692, r: 1.3 },
  { cx: 804, cy: 58, r: 1.4 },
]);

const FRACTURE_PATHS = Object.freeze([
  "M184 142 C236 186 216 248 262 298 C306 346 286 416 244 514",
  "M224 198 C268 232 272 278 304 318 C342 362 356 424 334 476",
  "M166 360 C212 334 246 338 298 358 C344 374 382 370 426 334",
]);

const ZONE_STATUS_LABELS = Object.freeze({
  current: "Current Zone",
  known: "Known Thread",
  unseen: "Veiled Thread",
});

function joinClasses(...values) {
  return values.filter(Boolean).join(" ");
}

function toHotspotId(kind, id) {
  return `${kind}:${id}`;
}

function capitalizeLabel(value) {
  return String(value || "")
    .split(/[_\s-]+/g)
    .filter(Boolean)
    .map((token) => token.charAt(0).toUpperCase() + token.slice(1))
    .join(" ");
}

function getOrbitMarker(region) {
  const dx = region.atlasPlacement.x - PLANET_DISC.x;
  const dy = region.atlasPlacement.y - PLANET_DISC.y;
  const distance = Math.hypot(dx, dy) || 1;
  return {
    x1: PLANET_DISC.x + (dx / distance) * (PLANET_DISC.radius + 12),
    y1: PLANET_DISC.y + (dy / distance) * (PLANET_DISC.radius + 12),
    x2: PLANET_DISC.x + (dx / distance) * (PLANET_DISC.radius + 28),
    y2: PLANET_DISC.y + (dy / distance) * (PLANET_DISC.radius + 28),
  };
}

function getMeridianCanvasPoint(zone) {
  return {
    x: MERIDIAN_INSET.x + zone.atlasPlacement.x,
    y: MERIDIAN_INSET.y + 46 + zone.atlasPlacement.y,
  };
}

function DetailToken({ accent = "var(--holo-cyan)", children }) {
  return (
    <span
      className={styles.detailToken}
      style={{
        borderColor: `color-mix(in srgb, ${accent} 36%, transparent)`,
        color: accent,
        background: `color-mix(in srgb, ${accent} 14%, transparent)`,
      }}
    >
      {children}
    </span>
  );
}

function DetailRail({ selectedHotspot, currentLocationName }) {
  const isZone = selectedHotspot?.kind === "zone";
  const accent = selectedHotspot?.accent || "var(--holo-cyan)";
  const statusLabel = isZone ? ZONE_STATUS_LABELS[selectedHotspot.status] : "Macro Region";

  return (
    <aside className={styles.detailRail}>
      <section className={styles.detailCard}>
        <div className={styles.detailEyebrow}>
          {isZone ? "Meridian Zone Focus" : "Planetary Focus"}
        </div>
        <h3 className={styles.detailTitle}>{selectedHotspot?.name || "No focus selected"}</h3>
        <div className={styles.detailMeta}>{statusLabel}</div>
        <p className={styles.detailCopy}>
          {selectedHotspot?.summary ||
            "The atlas waits for a locus to stabilize before it reveals detail."}
        </p>

        <div className={styles.detailTokenRow}>
          <DetailToken accent={accent}>{isZone ? "Lore hotspot" : "World shell"}</DetailToken>
          {isZone && selectedHotspot?.isCurrent ? (
            <DetailToken accent="var(--holo-gold)">Current footing</DetailToken>
          ) : null}
          {!isZone && selectedHotspot?.isCurrentTheater ? (
            <DetailToken accent="var(--holo-gold)">Playable theater</DetailToken>
          ) : null}
        </div>
      </section>

      {isZone ? (
        <>
          <section className={styles.detailCard}>
            <div className={styles.sectionLabel}>Essence Triad</div>
            <div className={styles.detailTokenRow}>
              {selectedHotspot.essenceTriad.map((essence) => (
                <DetailToken key={essence} accent={selectedHotspot.accent}>
                  {capitalizeLabel(essence)}
                </DetailToken>
              ))}
            </div>
          </section>

          <section className={styles.detailCard}>
            <div className={styles.sectionLabel}>
              {selectedHotspot.isCurrent ? "Current Foothold" : "Notable Sites"}
            </div>
            {selectedHotspot.isCurrent ? (
              <div className={styles.currentFooting}>{currentLocationName}</div>
            ) : null}
            <div className={styles.metaList}>
              {selectedHotspot.notableLocations.map((location) => (
                <div key={location.id} className={styles.metaItem}>
                  <strong>{location.name}</strong>
                  <span>{location.summary}</span>
                </div>
              ))}
            </div>
          </section>
        </>
      ) : (
        <section className={styles.detailCard}>
          <div className={styles.sectionLabel}>Signal Hooks</div>
          <div className={styles.detailTokenRow}>
            {selectedHotspot?.hooks?.map((hook) => (
              <DetailToken key={hook} accent={accent}>
                {hook}
              </DetailToken>
            ))}
          </div>
        </section>
      )}

      <section className={styles.detailCard}>
        <div className={styles.sectionLabel}>Atlas Doctrine</div>
        <p className={styles.doctrineCopy}>
          Lore hotspots only. The atlas records mythic scale and known pressure lines, but it does
          not replace route discovery or travel commands.
        </p>
      </section>

      <section className={styles.detailCard}>
        <div className={styles.sectionLabel}>Legend</div>
        <div className={styles.legend}>
          <span className={styles.legendItem}>
            <span className={joinClasses(styles.legendSwatch, styles.legendCurrent)} />
            Current zone
          </span>
          <span className={styles.legendItem}>
            <span className={joinClasses(styles.legendSwatch, styles.legendKnown)} />
            Known zone
          </span>
          <span className={styles.legendItem}>
            <span className={joinClasses(styles.legendSwatch, styles.legendVeiled)} />
            Veiled zone
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

  const selectedHotspotId =
    hoveredHotspotId || pinnedHotspotId || model.defaultHotspotId;
  const selectedHotspot =
    model.hotspotsById[selectedHotspotId] ||
    model.hotspotsById[model.defaultHotspotId] ||
    model.macroRegions[0];

  const setPinnedHotspot = (hotspotId) => {
    setPinnedHotspotId(hotspotId);
  };

  const handleHotspotKeyDown = (event, hotspotId) => {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      setPinnedHotspot(hotspotId);
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
          <div className={styles.eyebrow}>Celestial Atlas</div>
          <h2 className={styles.title}>Map the bound world, not the route lattice.</h2>
          <p className={styles.copy}>
            This planet refuses literal scale. The atlas renders it as a sigil-disc: seven
            macro-realms around the brightest fracture seam, with Shardfall Meridian unfolded into
            a readable inset.
          </p>
        </header>

        <div className={styles.layout}>
          <div className={styles.canvas} onMouseLeave={() => setHoveredHotspotId(null)}>
            <svg
              className={styles.svg}
              viewBox={`0 0 ${ATLAS_VIEWBOX.width} ${ATLAS_VIEWBOX.height}`}
              role="img"
              aria-label="Celestial atlas of the mythic world shell and the Shardfall Meridian inset."
            >
              <defs>
                <radialGradient id="atlas-disc-glow" cx="48%" cy="42%" r="62%">
                  <stop offset="0%" stopColor="rgba(255,255,255,0.28)" />
                  <stop offset="28%" stopColor="rgba(115, 239, 227, 0.16)" />
                  <stop offset="70%" stopColor="rgba(10, 14, 28, 0.94)" />
                  <stop offset="100%" stopColor="rgba(6, 9, 18, 0.98)" />
                </radialGradient>
                <linearGradient id="atlas-seam-glow" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="rgba(211, 165, 106, 0.2)" />
                  <stop offset="45%" stopColor="rgba(115, 239, 227, 0.9)" />
                  <stop offset="100%" stopColor="rgba(211, 165, 106, 0.36)" />
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
                r={PLANET_DISC.radius + 34}
                className={styles.orbitRing}
              />
              <circle
                cx={PLANET_DISC.x}
                cy={PLANET_DISC.y}
                r={PLANET_DISC.radius + 12}
                className={styles.orbitRingInner}
              />
              <circle
                cx={PLANET_DISC.x}
                cy={PLANET_DISC.y}
                r={PLANET_DISC.radius}
                fill="url(#atlas-disc-glow)"
                className={styles.planetDisc}
              />

              {FRACTURE_PATHS.map((pathData) => (
                <path
                  key={pathData}
                  d={pathData}
                  className={styles.fractureSeam}
                  stroke="url(#atlas-seam-glow)"
                />
              ))}

              {model.macroRegions.map((region) => {
                const isSelected = selectedHotspotId === region.hotspotId;
                const isPinned = pinnedHotspotId === region.hotspotId;
                const orbitMarker = getOrbitMarker(region);
                const regionStyle = {
                  fill:
                    isSelected || region.isCurrentTheater
                      ? `color-mix(in srgb, ${region.accent} 26%, transparent)`
                      : `color-mix(in srgb, ${region.accent} 14%, transparent)`,
                  stroke: region.accent,
                };

                return (
                  <g
                    key={region.id}
                    className={joinClasses(
                      styles.hotspot,
                      styles.macroHotspot,
                      isSelected && styles.hotspotSelected,
                      region.isCurrentTheater && styles.hotspotCurrentTheater,
                    )}
                    role="button"
                    tabIndex={0}
                    aria-label={`${region.name}: ${region.summary}`}
                    aria-pressed={isPinned}
                    onMouseEnter={() => setHoveredHotspotId(region.hotspotId)}
                    onMouseLeave={() => setHoveredHotspotId(null)}
                    onFocus={() => setHoveredHotspotId(region.hotspotId)}
                    onBlur={() => setHoveredHotspotId(null)}
                    onClick={() => setPinnedHotspot(region.hotspotId)}
                    onKeyDown={(event) => handleHotspotKeyDown(event, region.hotspotId)}
                  >
                    <line
                      x1={orbitMarker.x1}
                      y1={orbitMarker.y1}
                      x2={orbitMarker.x2}
                      y2={orbitMarker.y2}
                      className={styles.orbitTick}
                      style={{ stroke: region.accent }}
                    />
                    <ellipse
                      cx={region.atlasPlacement.x}
                      cy={region.atlasPlacement.y}
                      rx={region.atlasPlacement.rx}
                      ry={region.atlasPlacement.ry}
                      transform={`rotate(${region.atlasPlacement.rotate} ${region.atlasPlacement.x} ${region.atlasPlacement.y})`}
                      className={styles.macroShape}
                      style={regionStyle}
                    />
                    {region.isCurrentTheater ? (
                      <ellipse
                        cx={region.atlasPlacement.x}
                        cy={region.atlasPlacement.y}
                        rx={region.atlasPlacement.rx + 9}
                        ry={region.atlasPlacement.ry + 9}
                        transform={`rotate(${region.atlasPlacement.rotate} ${region.atlasPlacement.x} ${region.atlasPlacement.y})`}
                        className={styles.macroPulse}
                        style={{ stroke: region.accent }}
                      />
                    ) : null}
                    <line
                      x1={region.atlasPlacement.x}
                      y1={region.atlasPlacement.y}
                      x2={region.atlasPlacement.labelX}
                      y2={region.atlasPlacement.labelY - 12}
                      className={styles.regionCallout}
                      style={{ stroke: region.accent }}
                    />
                    <text
                      x={region.atlasPlacement.labelX}
                      y={region.atlasPlacement.labelY}
                      textAnchor={region.atlasPlacement.labelAnchor}
                      className={styles.regionLabel}
                      style={{ fill: region.accent }}
                    >
                      {region.name}
                    </text>
                  </g>
                );
              })}

              <g>
                <rect
                  x={MERIDIAN_INSET.x}
                  y={MERIDIAN_INSET.y}
                  width={MERIDIAN_INSET.width}
                  height={MERIDIAN_INSET.height}
                  rx="26"
                  className={styles.insetFrame}
                />
                <rect
                  x={MERIDIAN_INSET.x + 18}
                  y={MERIDIAN_INSET.y + 18}
                  width={MERIDIAN_INSET.width - 36}
                  height={MERIDIAN_INSET.height - 36}
                  rx="18"
                  className={styles.insetFrameInner}
                />
                <text
                  x={MERIDIAN_INSET.x + 24}
                  y={MERIDIAN_INSET.y + 36}
                  className={styles.insetEyebrow}
                >
                  SHARDFALL MERIDIAN // ZONE SIGIL
                </text>
                <text
                  x={MERIDIAN_INSET.x + 24}
                  y={MERIDIAN_INSET.y + 62}
                  className={styles.insetTitle}
                >
                  Current chronicle theater
                </text>

                {model.meridianConnections.map((connection) => {
                  const from = model.hotspotsById[toHotspotId("zone", connection.from)];
                  const to = model.hotspotsById[toHotspotId("zone", connection.to)];
                  if (!from || !to) return null;
                  const fromPoint = getMeridianCanvasPoint(from);
                  const toPoint = getMeridianCanvasPoint(to);
                  const controlX = (fromPoint.x + toPoint.x) / 2 + (connection.detached ? 28 : 0);
                  const controlY = (fromPoint.y + toPoint.y) / 2 - (connection.detached ? 36 : 14);
                  return (
                    <path
                      key={connection.id}
                      d={`M ${fromPoint.x} ${fromPoint.y} Q ${controlX} ${controlY} ${toPoint.x} ${toPoint.y}`}
                      className={joinClasses(
                        styles.connectionPath,
                        connection.detached && styles.connectionDetached,
                      )}
                    />
                  );
                })}

                {model.meridianZones.map((zone) => {
                  const isSelected = selectedHotspotId === zone.hotspotId;
                  const isPinned = pinnedHotspotId === zone.hotspotId;
                  const point = getMeridianCanvasPoint(zone);
                  const labelX = point.x + Number(zone.atlasPlacement.labelDx || 0);
                  const labelY = point.y + Number(zone.atlasPlacement.labelDy || 0);

                  return (
                    <g
                      key={zone.id}
                      className={joinClasses(
                        styles.hotspot,
                        styles.zoneHotspot,
                        styles[`zoneStatus${capitalizeLabel(zone.status)}`],
                        zone.detached && styles.zoneDetached,
                        isSelected && styles.hotspotSelected,
                        zone.isCurrent && styles.hotspotCurrent,
                      )}
                      role="button"
                      tabIndex={0}
                      aria-label={`${zone.name}: ${zone.summary}`}
                      aria-pressed={isPinned}
                      aria-current={zone.isCurrent ? "true" : undefined}
                      onMouseEnter={() => setHoveredHotspotId(zone.hotspotId)}
                      onMouseLeave={() => setHoveredHotspotId(null)}
                      onFocus={() => setHoveredHotspotId(zone.hotspotId)}
                      onBlur={() => setHoveredHotspotId(null)}
                      onClick={() => setPinnedHotspot(zone.hotspotId)}
                      onKeyDown={(event) => handleHotspotKeyDown(event, zone.hotspotId)}
                    >
                      {zone.detached ? (
                        <circle
                          cx={point.x}
                          cy={point.y}
                          r={zone.radius + 11}
                          className={styles.detachedOrbit}
                          style={{ stroke: zone.accent }}
                        />
                      ) : null}
                      {zone.isCurrent ? (
                        <circle
                          cx={point.x}
                          cy={point.y}
                          r={zone.radius + 8}
                          className={styles.currentBeacon}
                          style={{ stroke: zone.accent }}
                        />
                      ) : null}
                      <circle
                        cx={point.x}
                        cy={point.y}
                        r={zone.radius + 4}
                        className={styles.zoneHalo}
                        style={{ fill: `color-mix(in srgb, ${zone.accent} 16%, transparent)` }}
                      />
                      <circle
                        cx={point.x}
                        cy={point.y}
                        r={zone.radius}
                        className={styles.zoneCore}
                        style={{
                          fill:
                            zone.status === "unseen"
                              ? "rgba(255, 255, 255, 0.035)"
                              : `color-mix(in srgb, ${zone.accent} 24%, rgba(6, 10, 18, 0.8))`,
                          stroke: zone.accent,
                        }}
                      />
                      <text
                        x={labelX}
                        y={labelY}
                        textAnchor={zone.atlasPlacement.labelAnchor}
                        className={styles.zoneLabel}
                        style={{ fill: zone.accent }}
                      >
                        {zone.name}
                      </text>
                    </g>
                  );
                })}
              </g>
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
