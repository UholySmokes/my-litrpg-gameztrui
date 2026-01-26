import { useCallback, useRef } from "react";

export default function GameWindow({
  id,
  title,
  dockZone,
  position,
  size,
  minWidth = 240,
  minHeight = 160,
  maxWidth,
  maxHeight,
  bounds,
  containerOffset,
  collapsed,
  pinned,
  alwaysVisible,
  zIndex,
  isDraggable = true,
  isResizable = true,
  onDragStart,
  onDragMove,
  onToggleFocus,
  onToggleCollapse,
  onTogglePin,
  onClose,
  onDragEnd,
  onResizeEnd,
  onFocus,
  children,
}) {
  const dragRef = useRef(null);
  const resizeRef = useRef(null);
  const lastPositionRef = useRef(position || { x: 0, y: 0 });

  const handlePointerDown = useCallback(
    (event) => {
      if (!isDraggable) return;
      onFocus?.();
      const rect = dragRef.current?.getBoundingClientRect();
      onDragStart?.({ rect });
      const startX = event.clientX;
      const startY = event.clientY;
      const startLeft =
        dockZone === "float"
          ? position?.x || 0
          : rect && containerOffset
            ? rect.left - containerOffset.left
            : position?.x || 0;
      const startTop =
        dockZone === "float"
          ? position?.y || 0
          : rect && containerOffset
            ? rect.top - containerOffset.top
            : position?.y || 0;
      const move = (moveEvent) => {
        let nextX = startLeft + (moveEvent.clientX - startX);
        let nextY = startTop + (moveEvent.clientY - startY);
        if (bounds) {
          const maxX = Math.max(0, bounds.width - (size?.w || 300));
          const maxY = Math.max(0, bounds.height - (size?.h || 200));
          nextX = Math.min(Math.max(0, nextX), maxX);
          nextY = Math.min(Math.max(0, nextY), maxY);
        }
        lastPositionRef.current = { x: nextX, y: nextY };
        onDragMove?.({ x: nextX, y: nextY });
      };
      const end = () => {
        window.removeEventListener("pointermove", move);
        window.removeEventListener("pointerup", end);
        onDragEnd?.(lastPositionRef.current);
      };
      window.addEventListener("pointermove", move);
      window.addEventListener("pointerup", end);
    },
    [
      bounds,
      containerOffset,
      dockZone,
      isDraggable,
      onDragEnd,
      onDragMove,
      onDragStart,
      onFocus,
      position,
      size,
    ],
  );

  const handleResizePointerDown = useCallback(
    (event) => {
      if (!isResizable || dockZone !== "float") return;
      onFocus?.();
      const startX = event.clientX;
      const startY = event.clientY;
      const startW = size?.w || 300;
      const startH = size?.h || 200;
      const move = (moveEvent) => {
        let nextW = startW + (moveEvent.clientX - startX);
        let nextH = startH + (moveEvent.clientY - startY);
        const maxAllowedW =
          maxWidth ??
          (bounds ? Math.max(minWidth, bounds.width - (position?.x || 0)) : Infinity);
        const maxAllowedH =
          maxHeight ??
          (bounds ? Math.max(minHeight, bounds.height - (position?.y || 0)) : Infinity);
        nextW = Math.min(Math.max(minWidth, nextW), maxAllowedW);
        nextH = Math.min(Math.max(minHeight, nextH), maxAllowedH);
        onResizeEnd?.({ w: nextW, h: nextH });
      };
      const end = () => {
        window.removeEventListener("pointermove", move);
        window.removeEventListener("pointerup", end);
      };
      window.addEventListener("pointermove", move);
      window.addEventListener("pointerup", end);
    },
    [bounds, dockZone, isResizable, maxHeight, maxWidth, minHeight, minWidth, onFocus, onResizeEnd, position, size],
  );

  const style = {
    position: dockZone === "float" ? "absolute" : "relative",
    left: dockZone === "float" ? `${position?.x || 0}px` : "auto",
    top: dockZone === "float" ? `${position?.y || 0}px` : "auto",
    width: `${size?.w || 300}px`,
    height: collapsed ? "auto" : `${size?.h || 200}px`,
    zIndex: zIndex || 1,
    backdropFilter: "blur(14px)",
    background: "rgba(10, 12, 18, 0.78)",
    border: "1px solid rgba(0, 243, 255, 0.3)",
    borderRadius: "16px",
    boxShadow: "0 0 18px rgba(0, 243, 255, 0.18)",
    overflow: "hidden",
    display: alwaysVisible || !collapsed ? "block" : "none",
  };

  return (
    <div
      ref={dragRef}
      style={style}
      onPointerDown={() => onFocus?.()}
      data-window-id={id}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "0.4rem 0.6rem",
          background: "rgba(5, 8, 12, 0.85)",
          borderBottom: "1px solid rgba(0, 243, 255, 0.15)",
          cursor: isDraggable ? "grab" : "default",
          fontFamily: "monospace",
          color: "var(--holo-cyan)",
          fontSize: "0.75rem",
          letterSpacing: "1px",
        }}
        onPointerDown={handlePointerDown}
        onDoubleClick={() => onToggleFocus?.()}
      >
        <div>{title}</div>
        <div style={{ display: "flex", gap: "0.35rem" }}>
          <button
            className="holo-button"
            type="button"
            onClick={onToggleCollapse}
            style={{ padding: "0 0.4rem", fontSize: "0.65rem" }}
          >
            {collapsed ? "+" : "–"}
          </button>
          <button
            className="holo-button"
            type="button"
            onClick={onTogglePin}
            style={{ padding: "0 0.4rem", fontSize: "0.65rem" }}
          >
            {pinned ? "📌" : "📍"}
          </button>
          {onClose && (
            <button
              className="holo-button"
              type="button"
              onClick={onClose}
              style={{ padding: "0 0.4rem", fontSize: "0.65rem" }}
            >
              ✕
            </button>
          )}
        </div>
      </div>
      {!collapsed && <div style={{ padding: "0.75rem" }}>{children}</div>}
      {dockZone === "float" && isResizable && (
        <div
          ref={resizeRef}
          onPointerDown={handleResizePointerDown}
          style={{
            position: "absolute",
            right: 6,
            bottom: 6,
            width: 12,
            height: 12,
            cursor: "nwse-resize",
            borderRight: "2px solid rgba(0, 243, 255, 0.5)",
            borderBottom: "2px solid rgba(0, 243, 255, 0.5)",
          }}
        />
      )}
    </div>
  );
}
