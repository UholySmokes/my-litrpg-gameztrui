import { useCallback, useMemo, useState } from "react";
import { layoutPresets } from "./layoutPresets.js";

const STORAGE_KEYS = {
  creation: "layout_characterCreation",
  game: "layout_gameMode",
};

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

export function useWindowLayout(mode = "game") {
  const initialLayout = useMemo(() => {
    return readLayout(mode) || layoutPresets[mode] || layoutPresets.game;
  }, [mode]);
  const [layouts, setLayouts] = useState(() => ({ [mode]: initialLayout }));
  const layout = layouts[mode] || initialLayout;

  const setWindowState = useCallback((id, updates) => {
    setLayouts((prev) => {
      const currentLayout = prev[mode] || initialLayout;
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
      writeLayout(mode, next);
      return {
        ...prev,
        [mode]: next,
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
