export default function StatusStatCard({ label, value, tooltip }) {
  return (
    <div className="holo-panel" style={{ padding: "0.75rem" }} title={tooltip}>
      <div style={{ color: "var(--text-dim)", fontSize: "0.8rem" }}>
        {label}
      </div>
      <div style={{ color: "var(--holo-cyan)", fontWeight: "bold" }}>
        {value}
      </div>
    </div>
  );
}
