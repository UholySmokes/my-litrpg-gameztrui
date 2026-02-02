import { useCallback, useMemo, useState } from "react";
import { layoutPresets } from "./layoutPresets.js";

const STORAGE_KEYS = {
  creation: "layout_characterCreation",
  game: "layout_gameMode",
};
const SHARED_PIN_KEY = "layout_sharedPins";

const readLayout = (mode) => {
  if (typeof window === "undefined") return null;
  const key = STORAGE_KEYS[mode];
  if (!key) return null;
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch {
    return null;
  }
};

const writeLayout = (mode, layout) => {
  if (typeof window === "undefined") return;
  const key = STORAGE_KEYS[mode];
  if (!key) return;
  try {
    localStorage.setItem(key, JSON.stringify(layout));
  } catch {
    return;
  }
};

const readSharedPins = () => {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(SHARED_PIN_KEY);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch {
    return null;
  }
};

const writeSharedPins = (pins) => {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(SHARED_PIN_KEY, JSON.stringify(pins));
  } catch {
    return;
  }
};

const applySharedPins = (layout) => {
  if (!layout || !layout.windows) return layout;
  const pins = readSharedPins();
  if (!pins || typeof pins.narrativeMemory !== "boolean") return layout;
  return {
    ...layout,
    windows: {
      ...layout.windows,
      narrativeMemory: {
        ...layout.windows.narrativeMemory,
        pinned: pins.narrativeMemory,
      },
    },
  };
};

const normalizeLayout = (layout) => {
  if (!layout || !layout.windows) return layout;
  const nextWindows = { ...layout.windows };
  Object.keys(nextWindows).forEach((id) => {
    if (id !== "narrativeMemory" && nextWindows[id]?.alwaysVisible) {
      nextWindows[id] = { ...nextWindows[id], alwaysVisible: false };
    }
    if (id !== "narrativeMemory" && nextWindows[id]?.dockCompact) {
      nextWindows[id] = { ...nextWindows[id], dockCompact: false };
    }
  });
  if (layout.mode === "creation") {
    const creationWindowIds = Object.keys(nextWindows).filter(
      (id) => id !== "narrativeMemory",
    );
    const allCollapsed =
      creationWindowIds.length > 0 &&
      creationWindowIds.every((id) => nextWindows[id]?.collapsed);
    if (allCollapsed) {
      creationWindowIds.forEach((id) => {
        nextWindows[id] = { ...nextWindows[id], collapsed: false };
      });
    }
  }
  return {
    ...layout,
    windows: nextWindows,
  };
};

const mergeLayouts = (preset, stored) => {
  if (!stored) return preset;
  if (!preset) return stored;
  const presetWindows = preset.windows || {};
  const storedWindows = stored.windows || {};
  const mergedWindows = {};
  const windowIds = new Set([
    ...Object.keys(presetWindows),
    ...Object.keys(storedWindows),
  ]);
  windowIds.forEach((id) => {
    mergedWindows[id] = {
      ...(presetWindows[id] || {}),
      ...(storedWindows[id] || {}),
    };
  });
  return {
    ...preset,
    ...stored,
    windows: mergedWindows,
  };
};

export function useWindowLayout(mode = "game") {
  const initialLayout = useMemo(() => {
    const preset = layoutPresets[mode] || layoutPresets.game;
    const stored = readLayout(mode);
    const base = mergeLayouts(preset, stored);
    return normalizeLayout(applySharedPins(base));
  }, [mode]);
  const [layouts, setLayouts] = useState(() => ({ [mode]: initialLayout }));
  const layout = layouts[mode] || initialLayout;

  const setWindowState = useCallback((id, updates) => {
    setLayouts((prev) => {
      const currentLayout = prev[mode] || initialLayout;
      if (
        id === "narrativeMemory" &&
        Object.prototype.hasOwnProperty.call(updates, "pinned")
      ) {
        const existingPins = readSharedPins() || {};
        writeSharedPins({
          ...existingPins,
          narrativeMemory: updates.pinned,
        });
      }
      const next = {
        ...currentLayout,
        windows: {
          ...currentLayout.windows,
          [id]: {
            ...currentLayout.windows[id],
            ...updates,
          },
        },
      };
      const normalized = normalizeLayout(next);
      writeLayout(mode, normalized);
      return {
        ...prev,
        [mode]: normalized,
      };
    });
  }, [initialLayout, mode]);

  const bringToFront = useCallback((id) => {
    setLayouts((prev) => {
      const currentLayout = prev[mode] || initialLayout;
      const zValues = Object.values(currentLayout.windows || {}).map(
        (win) => win.zIndex || 0,
      );
      const maxZ = zValues.length ? Math.max(...zValues) : 0;
      const next = {
        ...currentLayout,
        windows: {
          ...currentLayout.windows,
          [id]: {
            ...currentLayout.windows[id],
            zIndex: maxZ + 1,
          },
        },
      };
      writeLayout(mode, next);
      return {
        ...prev,
        [mode]: next,
      };
    });
  }, [initialLayout, mode]);

  return {
    layout,
    setWindowState,
    bringToFront,
  };
}
