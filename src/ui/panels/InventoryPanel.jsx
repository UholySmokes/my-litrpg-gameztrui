export default function InventoryPanel({ inventory }) {
  if (!inventory || inventory.length === 0) {
    return <div style={{ color: "var(--text-dim)" }}>Inventory empty.</div>;
  }

  return (
    <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
      {inventory.map((item, index) => (
        <li key={`${item.id || item.name}-${index}`} style={{ marginBottom: "0.35rem" }}>
          {item.name || "Unknown Item"}
        </li>
      ))}
    </ul>
  );
}
