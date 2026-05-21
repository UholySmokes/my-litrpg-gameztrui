import {useEffect, useMemo, useState} from "react";
import {fetchSyncReplay} from "../core/SyncReplayService.js";

const RUN_ID_STORAGE_KEY = "dev_sync_replay_run_id";
const LIMIT_STORAGE_KEY = "dev_sync_replay_limit";
const INCLUDE_REJECTED_STORAGE_KEY = "dev_sync_replay_include_rejected";

const readStoredValue = (key, fallback = "") => {
  if (typeof window === "undefined") return fallback;
  try {
    const value = localStorage.getItem(key);
    return typeof value === "string" && value.trim() ? value.trim() : fallback;
  } catch {
    return fallback;
  }
};

const readStoredBoolean = (key, fallback = false) => {
  const raw = readStoredValue(key, fallback ? "true" : "false").toLowerCase();
  if (["1", "true", "yes", "on"].includes(raw)) return true;
  if (["0", "false", "no", "off"].includes(raw)) return false;
  return fallback;
};

const formatTime = (value) => {
  const text = String(value || "").trim();
  if (!text) return "-";
  const parsed = Date.parse(text);
  if (!Number.isFinite(parsed)) return text;
  return new Date(parsed).toLocaleTimeString();
};

const formatHash = (value) => {
  const text = String(value || "").trim();
  if (!text) return "-";
  if (text.length <= 16) return text;
  return `${text.slice(0, 8)}...${text.slice(-8)}`;
};

export default function ReplayInspector({ gameState = null }) {
  const initialRunId = useMemo(() => {
    const fromStorage = readStoredValue(RUN_ID_STORAGE_KEY, "");
    if (fromStorage) return fromStorage;
    const fromState = String(
      gameState?.syncMeta?.runId ||
        gameState?.narrative?.runId ||
        gameState?.runId ||
        "",
    ).trim();
    return fromState;
  }, [gameState]);

  const [runId, setRunId] = useState(initialRunId);
  const [limit, setLimit] = useState(() => readStoredValue(LIMIT_STORAGE_KEY, "200"));
  const [includeRejected, setIncludeRejected] = useState(() =>
    readStoredBoolean(INCLUDE_REJECTED_STORAGE_KEY, false),
  );
  const [afterSeq, setAfterSeq] = useState("0");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [payload, setPayload] = useState(null);
  const [lastFetchedAt, setLastFetchedAt] = useState("");

  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      const normalized = String(runId || "").trim();
      if (normalized) localStorage.setItem(RUN_ID_STORAGE_KEY, normalized);
    } catch {
      // Ignore localStorage errors
    }
  }, [runId]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      const parsedLimit = Number.parseInt(limit, 10);
      const normalized = Number.isFinite(parsedLimit) && parsedLimit > 0 ? String(parsedLimit) : "200";
      localStorage.setItem(LIMIT_STORAGE_KEY, normalized);
    } catch {
      // Ignore localStorage errors
    }
  }, [limit]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      localStorage.setItem(
        INCLUDE_REJECTED_STORAGE_KEY,
        includeRejected ? "true" : "false",
      );
    } catch {
      // Ignore localStorage errors
    }
  }, [includeRejected]);

  const doFetch = async () => {
    setError("");
    setIsLoading(true);
    try {
      const result = await fetchSyncReplay({
        runId,
        afterSeq: Number.parseInt(afterSeq, 10) || 0,
        limit: Number.parseInt(limit, 10) || 200,
        includeRejected,
      });
      if (!result.success) {
        setPayload(null);
        setError(result.error || "Failed to fetch replay data.");
        return;
      }
      setPayload(result.data || null);
      setLastFetchedAt(new Date().toISOString());
    } catch (err) {
      setPayload(null);
      setError(String(err?.message || err || "Failed to fetch replay data."));
    } finally {
      setIsLoading(false);
    }
  };

  const timeline = Array.isArray(payload?.timeline) ? payload.timeline : [];
  const hashTimeline = Array.isArray(payload?.hashTimeline) ? payload.hashTimeline : [];
  const canonical = payload?.canonicalState || null;

  return (
    <div className="holo-panel" style={{ display: "grid", gap: "0.75rem", minHeight: "100%" }}>
      <div style={{ display: "grid", gap: "0.5rem", gridTemplateColumns: "2fr 1fr 1fr auto auto", alignItems: "end" }}>
        <label style={{ display: "grid", gap: "0.25rem" }}>
          <span style={{ color: "var(--text-dim)", fontSize: "0.75rem" }}>Run ID</span>
          <input
            value={runId}
            onChange={(event) => setRunId(event.target.value)}
            placeholder="run-abc"
            className="holo-input"
            style={{ width: "100%" }}
          />
        </label>
        <label style={{ display: "grid", gap: "0.25rem" }}>
          <span style={{ color: "var(--text-dim)", fontSize: "0.75rem" }}>After Seq</span>
          <input
            value={afterSeq}
            onChange={(event) => setAfterSeq(event.target.value)}
            className="holo-input"
            style={{ width: "100%" }}
          />
        </label>
        <label style={{ display: "grid", gap: "0.25rem" }}>
          <span style={{ color: "var(--text-dim)", fontSize: "0.75rem" }}>Limit</span>
          <input
            value={limit}
            onChange={(event) => setLimit(event.target.value)}
            className="holo-input"
            style={{ width: "100%" }}
          />
        </label>
        <label style={{ display: "flex", alignItems: "center", gap: "0.4rem", fontSize: "0.8rem", color: "var(--text-main)", whiteSpace: "nowrap" }}>
          <input
            type="checkbox"
            checked={includeRejected}
            onChange={(event) => setIncludeRejected(Boolean(event.target.checked))}
          />
          Include rejected
        </label>
        <button type="button" className="holo-button" onClick={doFetch} disabled={isLoading}>
          {isLoading ? "Loading..." : "Fetch"}
        </button>
      </div>

      {error && (
        <div
          style={{
            border: "1px solid var(--holo-alert)",
            color: "var(--holo-alert)",
            padding: "0.5rem 0.75rem",
            borderRadius: "0.35rem",
            fontSize: "0.85rem",
          }}
        >
          {error}
        </div>
      )}

      {payload && (
        <>
          <div
            style={{
              display: "grid",
              gap: "0.75rem",
              gridTemplateColumns: "repeat(6, minmax(0, 1fr))",
            }}
          >
            <MetricCard label="Canonical Seq" value={canonical?.seq ?? "-"} />
            <MetricCard label="Canonical Tick" value={canonical?.tick ?? "-"} />
            <MetricCard label="Map" value={canonical?.mapId || "-"} />
            <MetricCard label="Timeline Events" value={timeline.length} />
            <MetricCard label="Hash Checkpoints" value={hashTimeline.length} />
            <MetricCard
              label="Fetched"
              value={lastFetchedAt ? formatTime(lastFetchedAt) : "-"}
            />
          </div>

          <section style={{ display: "grid", gap: "0.5rem" }}>
            <h3 style={{ margin: 0, color: "var(--holo-cyan)", fontSize: "0.9rem" }}>
              Hash Timeline
            </h3>
            <div style={{ maxHeight: "160px", overflow: "auto", border: "1px solid var(--holo-grid)", borderRadius: "0.35rem" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.8rem" }}>
                <thead>
                  <tr style={{ background: "rgba(0, 255, 255, 0.08)" }}>
                    <Th>Seq</Th>
                    <Th>Tick</Th>
                    <Th>State Hash</Th>
                  </tr>
                </thead>
                <tbody>
                  {hashTimeline.length === 0 && (
                    <tr>
                      <Td colSpan={3}>No hash checkpoints.</Td>
                    </tr>
                  )}
                  {hashTimeline.map((entry, index) => (
                    <tr key={`hash-${index}`}>
                      <Td>{entry?.seq ?? "-"}</Td>
                      <Td>{entry?.tick ?? "-"}</Td>
                      <Td title={entry?.stateHash || ""}>{formatHash(entry?.stateHash)}</Td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          <section style={{ display: "grid", gap: "0.5rem" }}>
            <h3 style={{ margin: 0, color: "var(--holo-cyan)", fontSize: "0.9rem" }}>
              Replay Timeline
            </h3>
            <div style={{ maxHeight: "220px", overflow: "auto", border: "1px solid var(--holo-grid)", borderRadius: "0.35rem" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.8rem" }}>
                <thead>
                  <tr style={{ background: "rgba(0, 255, 255, 0.08)" }}>
                    <Th>Client Seq</Th>
                    <Th>Type</Th>
                    <Th>Accepted</Th>
                    <Th>Code</Th>
                    <Th>Hash</Th>
                    <Th>At</Th>
                  </tr>
                </thead>
                <tbody>
                  {timeline.length === 0 && (
                    <tr>
                      <Td colSpan={6}>No timeline events.</Td>
                    </tr>
                  )}
                  {timeline.map((entry, index) => (
                    <tr key={`event-${entry?.commitId || index}`}>
                      <Td>{entry?.clientSeq ?? "-"}</Td>
                      <Td>{entry?.triggerType || entry?.eventType || "-"}</Td>
                      <Td style={{ color: entry?.accepted ? "var(--holo-mint)" : "var(--holo-alert)" }}>
                        {entry?.accepted ? "yes" : "no"}
                      </Td>
                      <Td>{entry?.errorCode || "-"}</Td>
                      <Td title={entry?.stateHash || ""}>{formatHash(entry?.stateHash)}</Td>
                      <Td>{formatTime(entry?.createdAt)}</Td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        </>
      )}
    </div>
  );
}

function MetricCard({ label, value }) {
  return (
    <div
      style={{
        border: "1px solid var(--holo-grid)",
        borderRadius: "0.35rem",
        padding: "0.45rem 0.6rem",
      }}
    >
      <div style={{ color: "var(--text-dim)", fontSize: "0.7rem", textTransform: "uppercase" }}>
        {label}
      </div>
      <div style={{ color: "var(--text-main)", fontSize: "0.9rem", fontWeight: 600 }}>
        {String(value)}
      </div>
    </div>
  );
}

function Th({ children }) {
  return (
    <th
      style={{
        textAlign: "left",
        padding: "0.45rem 0.5rem",
        borderBottom: "1px solid var(--holo-grid)",
        color: "var(--text-dim)",
      }}
    >
      {children}
    </th>
  );
}

function Td({ children, colSpan = 1, title = "" }) {
  return (
    <td
      colSpan={colSpan}
      title={title}
      style={{
        padding: "0.4rem 0.5rem",
        borderBottom: "1px solid rgba(255, 255, 255, 0.06)",
        color: "var(--text-main)",
      }}
    >
      {children}
    </td>
  );
}
