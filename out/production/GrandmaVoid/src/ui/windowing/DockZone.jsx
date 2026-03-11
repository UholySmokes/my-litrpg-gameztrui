export default function DockZone({
  zone,
  windows,
  width,
  minWidth,
  maxWidth,
  compact = false,
}) {
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        gap: compact ? "0.5rem" : "0.75rem",
        padding: compact ? "0.25rem 0" : "0.75rem",
        width: compact ? "100%" : width ? `${width}px` : "auto",
        minWidth: compact ? "0" : minWidth ? `${minWidth}px` : "auto",
        maxWidth: compact ? "100%" : maxWidth ? `${maxWidth}px` : "none",
        flex: compact ? "0 0 auto" : zone === "center" ? 1 : "0 0 auto",
        minHeight: compact ? "auto" : 0,
      }}
    >
      {windows}
    </div>
  );
}
