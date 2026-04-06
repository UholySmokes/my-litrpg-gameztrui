import {
  findLocationsByZone,
  getAccessibleLocationIds,
  getLocationById,
  getZoneById,
  getZoneEntryLocationId,
} from "../../world/WorldDataRegistry.js";

function dedupe(ids = []) {
  return Array.from(new Set(ids.filter((id) => typeof id === "string" && id.trim())));
}

function ZoneNode({ title, subtitle, accent, active = false }) {
  return (
    <div
      style={{
        minWidth: active ? "13rem" : "11rem",
        padding: active ? "1rem 1.1rem" : "0.85rem 0.95rem",
        borderRadius: "18px",
        border: `1px solid ${accent}`,
        background: active
          ? `linear-gradient(180deg, color-mix(in srgb, ${accent} 22%, rgba(5, 10, 20, 0.96)), rgba(4, 8, 16, 0.94))`
          : "rgba(6, 10, 18, 0.88)",
        boxShadow: active ? `0 0 32px color-mix(in srgb, ${accent} 26%, transparent)` : "none",
      }}
    >
      <div style={{ fontSize: "0.7rem", textTransform: "uppercase", letterSpacing: "0.14em", color: accent }}>
        {active ? "Current Zone" : "Connected Route"}
      </div>
      <div style={{ marginTop: "0.35rem", fontSize: active ? "1.05rem" : "0.95rem", fontWeight: 700, color: "var(--text-main)" }}>
        {title}
      </div>
      <div style={{ marginTop: "0.3rem", fontSize: "0.78rem", lineHeight: 1.45, color: "var(--text-dim)" }}>
        {subtitle}
      </div>
    </div>
  );
}

function MapList({ title, items, emptyLabel, accent }) {
  return (
    <section
      style={{
        border: `1px solid color-mix(in srgb, ${accent} 35%, transparent)`,
        borderRadius: "16px",
        padding: "1rem",
        background: "rgba(4, 8, 16, 0.85)",
      }}
    >
      <div style={{ fontSize: "0.72rem", textTransform: "uppercase", letterSpacing: "0.14em", color: accent }}>
        {title}
      </div>
      <div style={{ marginTop: "0.75rem", display: "grid", gap: "0.65rem" }}>
        {items.length > 0 ? (
          items.map((item) => (
            <div
              key={item.id}
              style={{
                display: "grid",
                gap: "0.18rem",
                paddingBottom: "0.65rem",
                borderBottom: "1px solid rgba(255,255,255,0.08)",
              }}
            >
              <strong style={{ color: "var(--text-main)", fontSize: "0.9rem" }}>{item.name}</strong>
              <span style={{ color: "var(--text-dim)", fontSize: "0.76rem" }}>{item.meta}</span>
              <span style={{ color: "var(--text-dim)", fontSize: "0.76rem", lineHeight: 1.45 }}>{item.summary}</span>
            </div>
          ))
        ) : (
          <div style={{ color: "var(--text-dim)", fontSize: "0.82rem", lineHeight: 1.5 }}>{emptyLabel}</div>
        )}
      </div>
    </section>
  );
}

export default function WorldMapPanel({ state }) {
  const rawLocation = state?.world?.location;
  const currentLocationId = typeof rawLocation === "string" ? rawLocation : rawLocation?.current || "starting_zone";
  const currentLocation = getLocationById(currentLocationId);
  const currentZone = getZoneById(currentLocation?.zoneId);
  const accessibleIds = Array.from(getAccessibleLocationIds(state) || []);
  const accessibleSet = new Set(accessibleIds);
  const knownIds = dedupe([
    currentLocationId,
    ...(Array.isArray(rawLocation?.visited) ? rawLocation.visited : []),
    ...(Array.isArray(rawLocation?.unlockedAreas) ? rawLocation.unlockedAreas : []),
  ]);
  const knownSet = new Set(knownIds);

  const localLocations = (findLocationsByZone(currentZone?.id) || []).map((location) => ({
    id: location.id,
    name: location.name,
    meta: location.id === currentLocationId ? "Current position" : accessibleSet.has(location.id) ? "Nearby" : knownSet.has(location.id) ? "Known but not route-open" : "Undiscovered",
    summary: location.summary || "No map annotation recorded.",
    accessible: accessibleSet.has(location.id),
    current: location.id === currentLocationId,
  }));

  const routeZones = Array.isArray(currentZone?.connections)
    ? currentZone.connections
        .map((zoneId) => {
          const zone = getZoneById(zoneId);
          if (!zone) return null;
          const entryId = getZoneEntryLocationId(zoneId, { allowedLocationIds: accessibleSet });
          const entryLocation = entryId ? getLocationById(entryId) : null;
          return {
            id: zone.id,
            name: zone.name,
            summary: zone.summary || zone.description || "Connected route.",
            entryName: entryLocation?.name || "No mapped entry",
          };
        })
        .filter(Boolean)
    : [];

  const distantKnownLocations = knownIds
    .filter((locationId) => locationId !== currentLocationId && !accessibleSet.has(locationId))
    .map((locationId) => getLocationById(locationId))
    .filter(Boolean)
    .map((location) => ({
      id: location.id,
      name: location.name,
      meta: `${getZoneById(location.zoneId)?.name || location.zoneId} · known site`,
      summary: "You know this place exists, but you still need to travel route by route to reach it.",
    }));

  const nearbyTravelLocations = accessibleIds
    .filter((locationId) => locationId !== currentLocationId)
    .map((locationId) => getLocationById(locationId))
    .filter(Boolean)
    .map((location) => ({
      id: location.id,
      name: location.name,
      meta: `${getZoneById(location.zoneId)?.name || location.zoneId} · route open`,
      summary: location.summary || "A reachable route from your current position.",
    }));

  const accent = "var(--holo-cyan)";
  const routeAccent = "var(--holo-gold)";

  return (
    <div style={{ display: "grid", gap: "1rem" }}>
      <section
        style={{
          position: "relative",
          overflow: "hidden",
          borderRadius: "20px",
          padding: "1.35rem",
          border: "1px solid rgba(76, 201, 240, 0.28)",
          background:
            "radial-gradient(circle at top, rgba(76, 201, 240, 0.14), transparent 45%), linear-gradient(180deg, rgba(5, 10, 22, 0.98), rgba(3, 7, 16, 0.95))",
        }}
      >
        <div style={{ fontSize: "0.72rem", textTransform: "uppercase", letterSpacing: "0.16em", color: accent }}>
          Route Lattice
        </div>
        <div style={{ marginTop: "0.45rem", fontSize: "1.3rem", fontWeight: 700, color: "var(--text-main)" }}>
          {currentZone?.name || "Unknown Zone"} cartograph
        </div>
        <div style={{ marginTop: "0.35rem", maxWidth: "52rem", fontSize: "0.84rem", lineHeight: 1.55, color: "var(--text-dim)" }}>
          The map only resolves what is near enough to route right now. Far locations remain part of the world, but they stay off-route until the chronicle discovers a path to them.
        </div>

        <div
          style={{
            marginTop: "1.25rem",
            display: "grid",
            gridTemplateColumns: "minmax(16rem, 1.2fr) minmax(0, 2fr)",
            gap: "1rem",
            alignItems: "start",
          }}
        >
          <ZoneNode
            title={currentZone?.name || "Unknown Zone"}
            subtitle={`${currentLocation?.name || "Unknown location"} · ${currentZone?.summary || "No regional summary recorded."}`}
            accent={accent}
            active={true}
          />

          <div style={{ position: "relative", minHeight: "14rem", borderRadius: "18px", border: "1px solid rgba(255,255,255,0.08)", background: "rgba(7, 12, 22, 0.72)", padding: "1rem" }}>
            <svg viewBox="0 0 100 100" preserveAspectRatio="none" style={{ position: "absolute", inset: 0, width: "100%", height: "100%", opacity: 0.5 }}>
              {routeZones.map((zone, index) => {
                const count = Math.max(routeZones.length, 1);
                const y = 18 + index * (64 / count) + 8;
                return (
                  <line
                    key={zone.id}
                    x1="16"
                    y1="50"
                    x2="84"
                    y2={String(y)}
                    stroke="rgba(255, 212, 59, 0.38)"
                    strokeWidth="1.4"
                    strokeDasharray="4 4"
                  />
                );
              })}
            </svg>
            <div style={{ position: "relative", display: "grid", gap: "0.75rem" }}>
              {routeZones.length > 0 ? (
                routeZones.map((zone) => (
                  <ZoneNode
                    key={zone.id}
                    title={zone.name}
                    subtitle={`${zone.entryName} · ${zone.summary}`}
                    accent={routeAccent}
                  />
                ))
              ) : (
                <div style={{ color: "var(--text-dim)", fontSize: "0.82rem" }}>
                  No adjacent zone routes are currently mapped.
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(16rem, 1fr))", gap: "1rem" }}>
        <MapList
          title="Nearby Routes"
          items={nearbyTravelLocations}
          emptyLabel="No additional nearby routes are open from this position."
          accent={routeAccent}
        />
        <MapList
          title="Current Zone"
          items={localLocations}
          emptyLabel="No local landmarks recorded in this zone yet."
          accent={accent}
        />
        <MapList
          title="Distant Known Sites"
          items={distantKnownLocations}
          emptyLabel="No distant known sites are logged beyond your nearby travel routes."
          accent="var(--holo-violet)"
        />
      </div>
    </div>
  );
}