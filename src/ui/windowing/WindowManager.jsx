import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import GameWindow from "./GameWindow.jsx";
import DockZone from "./DockZone.jsx";
import { useWindowLayout } from "./useWindowLayout.js";

const DEFAULT_DOCK_METRICS = {
  left: { min: 280, max: 340, width: 320 },
  right: { min: 340, max: 460, width: 380, compactWidth: 80 },
  snap: 80,
};
const COMPACT_VIEWPORT_WIDTH = 1100;

export default function WindowManager({
  mode = "game",
  windows = [],
  focusWindowRequest = null,
  forceFloating = false,
}) {
  const { layout, setWindowState, bringToFront } = useWindowLayout(mode);
  const windowMap = useMemo(() => layout?.windows || {}, [layout]);
  const rightDockCompact = Boolean(windowMap?.narrativeMemory?.dockCompact);
  const containerRef = useRef(null);
  const fullscreenOnceRef = useRef(new Set());
  const [bounds, setBounds] = useState({ width: 0, height: 0 });
  const [containerOffset, setContainerOffset] = useState({ left: 0, top: 0 });
  const [draggingId, setDraggingId] = useState(null);
  const [snapZone, setSnapZone] = useState(null);
  const [focusState, setFocusState] = useState({ id: null, snapshot: null });
  const isCompactViewport =
    bounds.width > 0 && bounds.width <= COMPACT_VIEWPORT_WIDTH;
  const shouldForceFloating = forceFloating && !isCompactViewport;
  const dockMetrics = useMemo(() => {
    const rightWidth = rightDockCompact
      ? DEFAULT_DOCK_METRICS.right.compactWidth
      : DEFAULT_DOCK_METRICS.right.width;
    return {
      left: DEFAULT_DOCK_METRICS.left,
      right: {
        ...DEFAULT_DOCK_METRICS.right,
        width: rightWidth,
        min: rightDockCompact ? rightWidth : DEFAULT_DOCK_METRICS.right.min,
        max: rightDockCompact ? rightWidth : DEFAULT_DOCK_METRICS.right.max,
      },
      snap: DEFAULT_DOCK_METRICS.snap,
    };
  }, [rightDockCompact]);

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

  useEffect(() => {
    if (!shouldForceFloating) return;
    if (!bounds.width || !bounds.height) return;
    windows.forEach((windowConfig) => {
      if (!windowConfig?.openFullscreenOnce) return;
      const id = windowConfig.id;
      if (!id || fullscreenOnceRef.current.has(id)) return;
      const storageKey = `window_fullscreen_once_${mode}_${id}`;
      let hasOpened = false;
      try {
        hasOpened = localStorage.getItem(storageKey) === "1";
      } catch {
        hasOpened = false;
      }
      if (hasOpened) {
        fullscreenOnceRef.current.add(id);
        return;
      }
      setWindowState(id, {
        dockZone: "float",
        position: { x: 0, y: 0 },
        size: { w: bounds.width, h: bounds.height },
        collapsed: false,
      });
      fullscreenOnceRef.current.add(id);
      try {
        localStorage.setItem(storageKey, "1");
      } catch {
        return;
      }
    });
  }, [bounds.height, bounds.width, mode, setWindowState, shouldForceFloating, windows]);

  const resolveWindowDockZone = useCallback(
    (windowConfig, state = windowMap[windowConfig.id] || windowConfig) => {
      let zone = shouldForceFloating
        ? "float"
        : windowConfig.lockDockZone ||
          state?.dockZone ||
          windowConfig.dockZone ||
          "float";

      // On compact screens, treat floating windows as center-stacked for reachability.
      if (!shouldForceFloating && isCompactViewport && zone === "float") {
        zone = "center";
      }

      return zone;
    },
    [isCompactViewport, shouldForceFloating, windowMap],
  );

  useEffect(() => {
    if (!bounds.width || !bounds.height) return;
    windows.forEach((windowConfig) => {
      const state = windowMap[windowConfig.id];
      const resolvedDockZone = resolveWindowDockZone(windowConfig, state);
      if (resolvedDockZone !== "float") return;
      const resolvedSize = state?.size || windowConfig.size || { w: 300, h: 200 };
      const resolvedPosition =
        state?.position || windowConfig.position || { x: 0, y: 0 };
      const maxX = Math.max(0, bounds.width - (resolvedSize?.w || 300));
      const maxY = Math.max(0, bounds.height - (resolvedSize?.h || 200));
      const nextX = Math.min(Math.max(0, resolvedPosition.x || 0), maxX);
      const nextY = Math.min(Math.max(0, resolvedPosition.y || 0), maxY);
      if (nextX !== resolvedPosition.x || nextY !== resolvedPosition.y) {
        setWindowState(windowConfig.id, {
          position: { x: nextX, y: nextY },
        });
      }
    });
  }, [
    bounds.height,
    bounds.width,
    resolveWindowDockZone,
    setWindowState,
    windowMap,
    windows,
  ]);

  const resolveSnapZone = useMemo(() => {
    return (position, size, windowConfig) => {
      if (shouldForceFloating || isCompactViewport) return "float";
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
  }, [bounds.height, bounds.width, dockMetrics, isCompactViewport, shouldForceFloating]);

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
    const resolvedDockZone = resolveWindowDockZone(windowConfig, state);
    const resolvedPosition = state.position || windowConfig.position || { x: 0, y: 0 };
    const resolvedSize = state.size || windowConfig.size || { w: 300, h: 200 };
    const isLocked = Boolean(windowConfig.lockDockZone);
    const moveOnly = Boolean(windowConfig.moveOnly);
    const isDockable = shouldForceFloating
      ? false
      : windowConfig.isDockable ?? !isLocked;
    const isDraggable = windowConfig.isDraggable ?? !isCompactViewport;
    const isResizable =
      windowConfig.isResizable ?? (moveOnly ? false : !isCompactViewport);
    const isCollapsible =
      windowConfig.isCollapsible ?? (moveOnly ? false : true);
    const isPinnable = windowConfig.isPinnable ?? (moveOnly ? false : true);
    const isActive = (state.zIndex ?? windowConfig.zIndex ?? 0) === maxZ;
    const dockCompact =
      resolvedDockZone === "right" && Boolean(state.dockCompact);
    const dockOrder = windowConfig.dockOrder || ["float", "left", "center", "right"];
    const allowedDockOrder = dockOrder.filter(
      (zone) => zone !== "right" || windowConfig.allowRightDock,
    );
    const canDockCompact =
      Boolean(windowConfig.allowDockCompact) &&
      resolvedDockZone === "right" &&
      !moveOnly;
    const resolvedCollapsed = isCollapsible ? state.collapsed : false;
    return (
      <GameWindow
        key={windowConfig.id}
        id={windowConfig.id}
        title={windowConfig.title}
        icon={windowConfig.icon}
        compactLabel={windowConfig.compactLabel}
        dockZone={resolvedDockZone}
        position={resolvedPosition}
        size={resolvedSize}
        minWidth={windowConfig.minWidth}
        minHeight={windowConfig.minHeight}
        maxWidth={windowConfig.maxWidth}
        maxHeight={windowConfig.maxHeight}
        bounds={bounds}
        containerOffset={containerOffset}
        collapsed={resolvedCollapsed}
        pinned={state.pinned}
        alwaysVisible={state.alwaysVisible}
        dockCompact={dockCompact}
        zIndex={state.zIndex}
        isActive={isActive}
        isDragging={draggingId === windowConfig.id}
        freeDrag={shouldForceFloating}
        isDraggable={isDraggable}
        isResizable={isResizable}
        isCollapsible={isCollapsible}
        isPinnable={isPinnable}
        isDockable={isDockable}
        onToggleFocus={
          shouldForceFloating
            ? () => {
                const snapshot = {
                  dockZone: resolvedDockZone,
                  position: resolvedPosition,
                  size: resolvedSize,
                  collapsed: resolvedCollapsed,
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
              }
            : undefined
        }
        onDock={
          isLocked || shouldForceFloating
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
          if (!isDraggable) return;
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
          if (!isDraggable) return;
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
        onToggleDockCompact={
          canDockCompact
            ? () =>
                setWindowState(windowConfig.id, {
                  dockCompact: !dockCompact,
                })
            : undefined
        }
        onClose={
          windowConfig.onClose
            ? () => windowConfig.onClose?.()
            : state.alwaysVisible || !isCollapsible
              ? undefined
              : () => setWindowState(windowConfig.id, { collapsed: true })
        }
        onDragEnd={(nextPosition) => {
          if (isLocked) return;
          if (!isDraggable) return;
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

  const leftWindows = shouldForceFloating
    ? []
    : windows
        .filter(
          (windowConfig) => resolveWindowDockZone(windowConfig) === "left",
        )
        .map(renderWindow);
  const centerWindows = shouldForceFloating
    ? []
    : windows
        .filter(
          (windowConfig) => resolveWindowDockZone(windowConfig) === "center",
        )
        .map(renderWindow);
  const rightWindows = shouldForceFloating
    ? []
    : windows
        .filter(
          (windowConfig) => resolveWindowDockZone(windowConfig) === "right",
        )
        .map(renderWindow);
  const floatWindows = shouldForceFloating
    ? windows.map(renderWindow)
    : windows
        .filter(
          (windowConfig) => resolveWindowDockZone(windowConfig) === "float",
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

  if (shouldForceFloating) {
    return (
      <div
        ref={containerRef}
        style={{
          width: "100%",
          height: "100%",
          position: "relative",
        }}
      >
        {floatWindows}
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      style={{
        display: isCompactViewport ? "flex" : "grid",
        flexDirection: isCompactViewport ? "column" : undefined,
        gridTemplateColumns: isCompactViewport ? undefined : "auto 1fr auto",
        gap: "0.5rem",
        width: "100%",
        height: "100%",
        position: "relative",
        overflowY: isCompactViewport ? "auto" : "hidden",
      }}
    >
      <DockZone
        zone="left"
        windows={leftWindows}
        minWidth={dockMetrics.left.min}
        maxWidth={dockMetrics.left.max}
        width={dockMetrics.left.width}
        compact={isCompactViewport}
      />
      <DockZone zone="center" windows={centerWindows} compact={isCompactViewport} />
      <DockZone
        zone="right"
        windows={rightWindows}
        minWidth={dockMetrics.right.min}
        maxWidth={dockMetrics.right.max}
        width={dockMetrics.right.width}
        compact={isCompactViewport}
      />
      {floatWindows}
      {!isCompactViewport && draggingId && overlayStyle && (
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
