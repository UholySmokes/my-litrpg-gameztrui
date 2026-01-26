import { useCallback, useRef } from "react";

export default function GameWindow({
  id,
  title,
  icon,
  compactLabel,
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
  dockCompact,
  zIndex,
  isActive,
  isDragging = false,
  freeDrag = false,
  isDraggable = true,
  isResizable = true,
  isCollapsible = true,
  isPinnable = true,
  isDockable = true,
  onToggleDockCompact,
  onDragStart,
  onDragMove,
  onToggleFocus,
  onToggleCollapse,
  onTogglePin,
  onDock,
  onClose,
  onDragEnd,
  onResizeEnd,
  onFocus,
  children,
}) {
  const dragRef = useRef(null);
  const resizeRef = useRef(null);
  const lastPositionRef = useRef(position || { x: 0, y: 0 });
  const isCompact = Boolean(dockCompact);
  const isCollapsed = Boolean(collapsed || isCompact);
  const compactContent =
    compactLabel ??
    icon ??
    (typeof title === "string" ? title.slice(0, 3).toUpperCase() : "");

  const handlePointerDown = useCallback(
    (event) => {
      if (!isDraggable) return;
      if (event.button !== 0) return;
      if (
        event.target?.closest &&
        event.target.closest("button, input, textarea, select, a")
      ) {
        return;
      }
      event.preventDefault();
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
      lastPositionRef.current = { x: startLeft, y: startTop };
      const move = (moveEvent) => {
        let nextX = startLeft + (moveEvent.clientX - startX);
        let nextY = startTop + (moveEvent.clientY - startY);
        if (!freeDrag && bounds && bounds.width > 0 && bounds.height > 0) {
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
      freeDrag,
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
      if (!isResizable) return;
      if (event.button !== 0) return;
      event.preventDefault();
      onFocus?.();
      const allowWidthResize = dockZone === "float";
      const startX = event.clientX;
      const startY = event.clientY;
      const startW = size?.w || 300;
      const startH = size?.h || 200;
      const move = (moveEvent) => {
        let nextW = allowWidthResize ? startW + (moveEvent.clientX - startX) : startW;
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
    width: dockZone === "float" ? `${size?.w || 300}px` : "100%",
    height: isCollapsed ? "auto" : `${size?.h || 200}px`,
    zIndex: zIndex || 1,
    backdropFilter: "blur(14px)",
    background: "rgba(10, 12, 18, 0.78)",
    border: isActive
      ? "1px solid rgba(0, 243, 255, 0.75)"
      : "1px solid rgba(0, 243, 255, 0.3)",
    borderRadius: "16px",
    boxShadow: isActive
      ? "0 0 28px rgba(0, 243, 255, 0.38)"
      : "0 0 18px rgba(0, 243, 255, 0.18)",
    overflow: "hidden",
    display: alwaysVisible || !isCollapsed ? "block" : "none",
    transition:
      isDragging
        ? "none"
        : "left 0.2s ease, top 0.2s ease, width 0.2s ease, height 0.2s ease, box-shadow 0.2s ease",
  };
  const controlButtonStyle = {
    padding: "0 0.4rem",
    fontSize: "0.65rem",
    minWidth: "auto",
    flex: "0 0 auto",
  };

  return (
    <div
      ref={dragRef}
      style={style}
      onPointerDown={() => onFocus?.()}
      data-window-id={id}
      className="game-window"
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: isCompact ? "0.35rem 0.4rem" : "0.4rem 0.6rem",
          background: "rgba(5, 8, 12, 0.85)",
          borderBottom: "1px solid rgba(0, 243, 255, 0.15)",
          cursor: isDraggable ? (isDragging ? "grabbing" : "grab") : "default",
          fontFamily: "monospace",
          color: "var(--holo-cyan)",
          fontSize: "0.75rem",
          letterSpacing: "1px",
          touchAction: "none",
          userSelect: "none",
        }}
        onPointerDown={handlePointerDown}
        onDoubleClick={() => onToggleFocus?.()}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "0.4rem",
            minWidth: 0,
          }}
        >
          {!isCompact && icon && <span>{icon}</span>}
          <span
            style={{
              whiteSpace: "nowrap",
              overflow: "hidden",
              textOverflow: "ellipsis",
              fontSize: isCompact ? "0.65rem" : "0.75rem",
              letterSpacing: isCompact ? "2px" : "1px",
            }}
          >
            {isCompact ? compactContent : title}
          </span>
        </div>
        <div style={{ display: "flex", gap: "0.35rem" }}>
          {!isCompact && isDockable && onDock && (
            <button
              className="holo-button"
              type="button"
              onClick={onDock}
              style={controlButtonStyle}
              title="Cycle dock"
            >
              ⇄
            </button>
          )}
          {!isCompact && isCollapsible && (
            <button
              className="holo-button"
              type="button"
              onClick={onToggleCollapse}
              style={controlButtonStyle}
              title={collapsed ? "Expand" : "Collapse"}
            >
              {collapsed ? "+" : "–"}
            </button>
          )}
          {!isCompact && isPinnable && (
            <button
              className="holo-button"
              type="button"
              onClick={onTogglePin}
              style={controlButtonStyle}
              title={pinned ? "Unpin" : "Pin"}
            >
              {pinned ? "📌" : "📍"}
            </button>
          )}
          {onToggleDockCompact && (
            <button
              className="holo-button"
              type="button"
              onClick={onToggleDockCompact}
              style={controlButtonStyle}
              title={isCompact ? "Expand memory rail" : "Minimize memory rail"}
            >
              {isCompact ? ">>" : "<<"}
            </button>
          )}
          {!isCompact && onClose && (
            <button
              className="holo-button"
              type="button"
              onClick={onClose}
              style={controlButtonStyle}
              title="Close"
            >
              ✕
            </button>
          )}
        </div>
      </div>
      {!isCollapsed && <div style={{ padding: "0.75rem" }}>{children}</div>}
      {isResizable &&
        !isCompact &&
        (dockZone === "float" || dockZone === "left" || dockZone === "center") && (
        <div
          ref={resizeRef}
          onPointerDown={handleResizePointerDown}
          style={{
            position: "absolute",
            right: dockZone === "float" ? 6 : 12,
            bottom: 6,
            width: dockZone === "float" ? 12 : 40,
            height: 12,
            cursor: dockZone === "float" ? "nwse-resize" : "ns-resize",
            borderRight:
              dockZone === "float" ? "2px solid rgba(0, 243, 255, 0.5)" : "none",
            borderBottom: "2px solid rgba(0, 243, 255, 0.5)",
            left: dockZone === "float" ? "auto" : "50%",
            transform: dockZone === "float" ? "none" : "translateX(-50%)",
          }}
        />
      )}
    </div>
  );
}
