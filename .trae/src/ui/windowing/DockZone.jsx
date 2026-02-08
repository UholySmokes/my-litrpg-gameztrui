export default function DockZone({ zone, windows, width, minWidth, maxWidth }) {
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        gap: "0.75rem",
        padding: "0.75rem",
        width: width ? `${width}px` : "auto",
        minWidth: minWidth ? `${minWidth}px` : "auto",
        maxWidth: maxWidth ? `${maxWidth}px` : "none",
        flex: zone === "center" ? 1 : "0 0 auto",
      }}
    >
      {windows}
    </div>
  );
}
