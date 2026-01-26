import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import GameWindow from "./GameWindow.jsx";
import DockZone from "./DockZone.jsx";
import { useWindowLayout } from "./useWindowLayout.js";

export default function WindowManager({
  mode = "game",
  windows = [],
  focusWindowRequest = null,
}) {
  const { layout, setWindowState, bringToFront } = useWindowLayout(mode);
  const windowMap = layout?.windows || {};
  const containerRef = useRef(null);
  const [bounds, setBounds] = useState({ width: 0, height: 0 });
  const [containerOffset, setContainerOffset] = useState({ left: 0, top: 0 });
  const [draggingId, setDraggingId] = useState(null);
  const [snapZone, setSnapZone] = useState(null);
  const [focusState, setFocusState] = useState({ id: null, snapshot: null });
  const dockMetrics = useMemo(
    () => ({
      left: { min: 280, max: 340, width: 320 },
      right: { min: 340, max: 460, width: 380 },
      snap: 80,
    }),
    [],
  );

  useEffect(() => {
    const updateBounds = () => {
      if (!containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      setBounds({ width: rect.width, height: rect.height });
      setContainerOffset({ left: rect.left, top: rect.top });
    };
    updateBounds();
    window.addEventListener("resize", updateBounds);
    return () => window.removeEventListener("resize", updateBounds);
  }, []);

  useEffect(() => {
    if (focusWindowRequest?.id) {
      bringToFront(focusWindowRequest.id);
    }
  }, [bringToFront, focusWindowRequest]);

  const resolveSnapZone = useMemo(() => {
    return (position, size, windowConfig) => {
      if (!bounds.width || !bounds.height) return "float";
      const width = size?.w || 300;
      const leftEdge = position.x;
      const rightEdge = position.x + width;
      const topEdge = position.y;
      const leftSnap = leftEdge <= dockMetrics.snap;
      const rightSnap = rightEdge >= bounds.width - dockMetrics.snap;
      const centerSnap =
        topEdge <= dockMetrics.snap &&
        leftEdge >= dockMetrics.left.width - dockMetrics.snap &&
        rightEdge <= bounds.width - dockMetrics.right.width + dockMetrics.snap;
      if (leftSnap) return "left";
      if (rightSnap) {
        return windowConfig?.allowRightDock ? "right" : "float";
      }
      if (centerSnap) return "center";
      return "float";
    };
  }, [bounds.height, bounds.width, dockMetrics]);

  const applyFocus = useCallback(
    (id, snapshot) => {
      const centerWidth = Math.max(
        360,
        bounds.width - dockMetrics.left.width - dockMetrics.right.width,
      );
      const centerHeight = Math.max(360, bounds.height);
      setWindowState(id, {
        dockZone: "float",
        position: { x: dockMetrics.left.width, y: 0 },
        size: { w: centerWidth, h: centerHeight },
        collapsed: false,
        zIndex: 9999,
      });
      setFocusState({ id, snapshot });
    },
    [bounds.height, bounds.width, dockMetrics.left.width, dockMetrics.right.width, setWindowState],
  );

  const clearFocus = useCallback(() => {
    if (!focusState.id || !focusState.snapshot) return;
    setWindowState(focusState.id, focusState.snapshot);
    setFocusState({ id: null, snapshot: null });
  }, [focusState.id, focusState.snapshot, setWindowState]);

  const maxZ = useMemo(() => {
    return windows.reduce((currentMax, windowConfig) => {
      const z = windowMap[windowConfig.id]?.zIndex ?? windowConfig.zIndex ?? 0;
      return Math.max(currentMax, z);
    }, 0);
  }, [windowMap, windows]);

  const renderWindow = (windowConfig) => {
    const state = windowMap[windowConfig.id] || windowConfig;
    const resolvedDockZone = windowConfig.lockDockZone || state.dockZone;
    const resolvedPosition = state.position || windowConfig.position || { x: 0, y: 0 };
    const resolvedSize = state.size || windowConfig.size || { w: 300, h: 200 };
    const isLocked = Boolean(windowConfig.lockDockZone);
    const isActive = (state.zIndex ?? windowConfig.zIndex ?? 0) === maxZ;
    const dockOrder = windowConfig.dockOrder || ["float", "left", "center", "right"];
    const allowedDockOrder = dockOrder.filter(
      (zone) => zone !== "right" || windowConfig.allowRightDock,
    );
    return (
      <GameWindow
        key={windowConfig.id}
        id={windowConfig.id}
        title={windowConfig.title}
        icon={windowConfig.icon}
        dockZone={resolvedDockZone}
        position={resolvedPosition}
        size={resolvedSize}
        minWidth={windowConfig.minWidth}
        minHeight={windowConfig.minHeight}
        maxWidth={windowConfig.maxWidth}
        maxHeight={windowConfig.maxHeight}
        bounds={bounds}
        containerOffset={containerOffset}
        collapsed={state.collapsed}
        pinned={state.pinned}
        alwaysVisible={state.alwaysVisible}
        zIndex={state.zIndex}
        isActive={isActive}
        isDraggable={windowConfig.isDraggable ?? true}
        isResizable={windowConfig.isResizable ?? true}
        isCollapsible={windowConfig.isCollapsible ?? true}
        isPinnable={windowConfig.isPinnable ?? true}
        isDockable={windowConfig.isDockable ?? !isLocked}
        onToggleFocus={() => {
          const snapshot = {
            dockZone: resolvedDockZone,
            position: resolvedPosition,
            size: resolvedSize,
            collapsed: state.collapsed,
            zIndex: state.zIndex,
          };
          if (focusState.id && focusState.id !== windowConfig.id) {
            clearFocus();
          }
          if (focusState.id === windowConfig.id) {
            clearFocus();
          } else {
            applyFocus(windowConfig.id, snapshot);
          }
        }}
        onDock={
          isLocked
            ? undefined
            : () => {
                if (!allowedDockOrder.length) return;
                const currentIndex = Math.max(
                  0,
                  allowedDockOrder.indexOf(resolvedDockZone),
                );
                const nextZone =
                  allowedDockOrder[(currentIndex + 1) % allowedDockOrder.length];
                if (nextZone === "float") {
                  setWindowState(windowConfig.id, {
                    dockZone: "float",
                    position: resolvedPosition,
                  });
                  return;
                }
                setWindowState(windowConfig.id, {
                  dockZone: nextZone,
                  position: { x: 0, y: 0 },
                });
              }
        }
        onDragStart={(payload) => {
          if (isLocked) return;
          if (focusState.id === windowConfig.id) {
            clearFocus();
          }
          const rect = payload?.rect;
          if (rect) {
            const nextX = Math.max(0, rect.left - containerOffset.left);
            const nextY = Math.max(0, rect.top - containerOffset.top);
            setWindowState(windowConfig.id, {
              dockZone: "float",
              position: { x: nextX, y: nextY },
              size: { w: rect.width, h: rect.height },
            });
          }
          bringToFront(windowConfig.id);
          setDraggingId(windowConfig.id);
          setSnapZone(null);
        }}
        onDragMove={(nextPosition) => {
          if (isLocked) return;
          const zone = resolveSnapZone(nextPosition, resolvedSize, windowConfig);
          setSnapZone(zone);
          setWindowState(windowConfig.id, {
            dockZone: "float",
            position: nextPosition,
          });
        }}
        onToggleCollapse={() =>
          setWindowState(windowConfig.id, { collapsed: !state.collapsed })
        }
        onTogglePin={() =>
          setWindowState(windowConfig.id, { pinned: !state.pinned })
        }
        onClose={
          windowConfig.onClose
            ? () => windowConfig.onClose?.()
            : state.alwaysVisible
              ? undefined
              : () => setWindowState(windowConfig.id, { collapsed: true })
        }
        onDragEnd={(nextPosition) => {
          if (isLocked) return;
          const zone = resolveSnapZone(nextPosition, resolvedSize, windowConfig);
          if (zone === "float") {
            setWindowState(windowConfig.id, {
              dockZone: "float",
              position: nextPosition,
            });
          } else {
            setWindowState(windowConfig.id, {
              dockZone: zone,
              position: { x: 0, y: 0 },
            });
          }
          setDraggingId(null);
          setSnapZone(null);
        }}
        onResizeEnd={(nextSize) =>
          setWindowState(windowConfig.id, { size: nextSize })
        }
        onFocus={() => bringToFront(windowConfig.id)}
      >
        {windowConfig.content}
      </GameWindow>
    );
  };

  const leftWindows = windows
    .filter(
      (windowConfig) =>
        (windowConfig.lockDockZone ||
          windowMap[windowConfig.id]?.dockZone ||
          windowConfig.dockZone) === "left",
    )
    .map(renderWindow);
  const centerWindows = windows
    .filter(
      (windowConfig) =>
        (windowConfig.lockDockZone ||
          windowMap[windowConfig.id]?.dockZone ||
          windowConfig.dockZone) === "center",
    )
    .map(renderWindow);
  const rightWindows = windows
    .filter(
      (windowConfig) =>
        (windowConfig.lockDockZone ||
          windowMap[windowConfig.id]?.dockZone ||
          windowConfig.dockZone) === "right",
    )
    .map(renderWindow);
  const floatWindows = windows
    .filter(
      (windowConfig) =>
        (windowConfig.lockDockZone ||
          windowMap[windowConfig.id]?.dockZone ||
          windowConfig.dockZone) === "float",
    )
    .map(renderWindow);

  const overlayStyle = useMemo(() => {
    if (!snapZone) return null;
    if (snapZone === "left") {
      return {
        left: 0,
        top: 0,
        width: `${dockMetrics.left.width}px`,
        height: "100%",
      };
    }
    if (snapZone === "right") {
      return {
        right: 0,
        top: 0,
        width: `${dockMetrics.right.width}px`,
        height: "100%",
      };
    }
    if (snapZone === "center") {
      return {
        left: `${dockMetrics.left.width}px`,
        right: `${dockMetrics.right.width}px`,
        top: 0,
        height: "100%",
      };
    }
    return null;
  }, [dockMetrics.left.width, dockMetrics.right.width, snapZone]);

  return (
    <div
      ref={containerRef}
      style={{
        display: "grid",
        gridTemplateColumns: "auto 1fr auto",
        gap: "0.5rem",
        width: "100%",
        height: "100%",
        position: "relative",
      }}
    >
      <DockZone
        zone="left"
        windows={leftWindows}
        minWidth={dockMetrics.left.min}
        maxWidth={dockMetrics.left.max}
        width={dockMetrics.left.width}
      />
      <DockZone zone="center" windows={centerWindows} />
      <DockZone
        zone="right"
        windows={rightWindows}
        minWidth={dockMetrics.right.min}
        maxWidth={dockMetrics.right.max}
        width={dockMetrics.right.width}
      />
      {floatWindows}
      {draggingId && overlayStyle && (
        <div
          style={{
            position: "absolute",
            pointerEvents: "none",
            border: "1px solid rgba(0, 243, 255, 0.6)",
            background: "rgba(0, 243, 255, 0.08)",
            boxShadow: "0 0 24px rgba(0, 243, 255, 0.35)",
            borderRadius: "12px",
            zIndex: 100,
            ...overlayStyle,
          }}
        />
      )}
    </div>
  );
}
