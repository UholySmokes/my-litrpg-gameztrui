/* eslint-disable react-refresh/only-export-components */
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
} from "react";

const STORAGE_KEY = "gameTheme";

const THEME_REGISTRY = [
  {
    id: "mistglass",
    name: "Twilight Crystal",
    summary: "Deep indigo cosmos, violet energy, and anime starfield glow.",
    preview: "linear-gradient(135deg, #0f0a1e, #a855f7)",
    colorScheme: "dark",
    tokens: {
      "--bg-deep": "#0f0a1e",
      "--bg-glass": "rgba(15, 10, 30, 0.78)",
      "--bg-panel": "rgba(20, 14, 38, 0.9)",
      "--holo-cyan": "#a855f7",
      "--holo-cyan-rgb": "168, 85, 247",
      "--holo-alert": "#f43f5e",
      "--holo-alert-rgb": "244, 63, 94",
      "--holo-gold": "#fbbf24",
      "--holo-gold-rgb": "251, 191, 36",
      "--holo-blue": "#38bdf8",
      "--holo-green": "#34d399",
      "--holo-gray": "#a78bfa",
      "--holo-dark": "#080514",
      "--holo-primary": "#a855f7",
      "--holo-secondary": "#ec4899",
      "--holo-accent": "#f0e7ff",
      "--holo-ink": "#0e0824",
      "--text-main": "#f0e7ff",
      "--text-dim": "rgba(240, 231, 255, 0.65)",
      "--text-muted": "rgba(240, 231, 255, 0.5)",
      "--button-bg": "rgba(168, 85, 247, 0.14)",
      "--button-selected": "rgba(236, 72, 153, 0.22)",
      "--border-radius": "24px",
      "--font-hud": '"Outfit", "Quicksand", sans-serif',
      "--font-text": '"Quicksand", "Outfit", sans-serif',
      "--font-code": '"JetBrains Mono", monospace',
      "--shell-bg-0": "#0f0a1e",
      "--shell-bg-1": "#1a1038",
      "--shell-bg-2": "#2d1a5e",
      "--shell-surface": "rgba(20, 14, 38, 0.92)",
      "--shell-surface-strong": "rgba(12, 8, 24, 0.96)",
      "--shell-border": "rgba(168, 85, 247, 0.22)",
      "--shell-border-strong": "rgba(236, 72, 153, 0.32)",
      "--shell-shadow": "0 30px 80px rgba(168, 85, 247, 0.18)",
      "--shell-radius": "26px",
      "--shell-body-backdrop":
        "radial-gradient(circle at 16% 18%, rgba(168, 85, 247, 0.18), transparent 24%), radial-gradient(circle at 84% 16%, rgba(236, 72, 153, 0.14), transparent 22%), radial-gradient(circle at 48% 110%, rgba(56, 189, 248, 0.16), transparent 34%), linear-gradient(180deg, #1a1040 0%, #0f0a1e 48%, #080514 100%)",
      "--shell-frame-backdrop":
        "radial-gradient(circle at 16% 18%, rgba(168, 85, 247, 0.2), transparent 24%), radial-gradient(circle at 84% 16%, rgba(236, 72, 153, 0.12), transparent 22%), radial-gradient(circle at 48% 108%, rgba(56, 189, 248, 0.14), transparent 32%), linear-gradient(145deg, #1e1248 0%, #0f0a1e 48%, #080514 100%)",
      "--shell-panel-gradient":
        "linear-gradient(180deg, rgba(168, 85, 247, 0.06), rgba(12, 8, 24, 0.98))",
      "--shell-button-gradient":
        "linear-gradient(180deg, rgba(168, 85, 247, 0.18), rgba(20, 14, 38, 0.95))",
      "--shell-button-hover-gradient":
        "linear-gradient(180deg, rgba(236, 72, 153, 0.18), rgba(24, 16, 44, 0.97))",
      "--shell-button-solid-gradient":
        "linear-gradient(180deg, rgba(168, 85, 247, 0.4), rgba(100, 40, 180, 0.98))",
      "--shell-button-danger-gradient":
        "linear-gradient(180deg, rgba(244, 63, 94, 0.22), rgba(50, 18, 24, 0.95))",
      "--shell-card-gradient":
        "linear-gradient(180deg, rgba(168, 85, 247, 0.06), rgba(12, 8, 24, 0.98))",
      "--shell-scene-gradient":
        "linear-gradient(135deg, rgba(30, 18, 72, 0.94), rgba(12, 8, 24, 0.98))",
      "--shell-stage-gradient":
        "linear-gradient(180deg, rgba(26, 16, 56, 0.94), rgba(12, 8, 24, 0.98))",
      "--shell-quiet-gradient":
        "linear-gradient(180deg, rgba(24, 14, 52, 0.92), rgba(12, 8, 24, 0.96))",
    },
  },
  {
    id: "ashen-ledger",
    name: "Ember Scroll",
    summary: "Warm amber glow, sakura-lit parchment, and golden spell ink.",
    preview: "linear-gradient(135deg, #1a0e08, #fbbf24)",
    colorScheme: "dark",
    tokens: {
      "--bg-deep": "#140a06",
      "--bg-glass": "rgba(20, 10, 6, 0.78)",
      "--bg-panel": "rgba(28, 16, 10, 0.9)",
      "--holo-cyan": "#fbbf24",
      "--holo-cyan-rgb": "251, 191, 36",
      "--holo-alert": "#f43f5e",
      "--holo-alert-rgb": "244, 63, 94",
      "--holo-gold": "#f97316",
      "--holo-gold-rgb": "249, 115, 22",
      "--holo-blue": "#fb923c",
      "--holo-green": "#a3e635",
      "--holo-gray": "#d4a574",
      "--holo-dark": "#0e0704",
      "--holo-primary": "#fbbf24",
      "--holo-secondary": "#f97316",
      "--holo-accent": "#fff8e1",
      "--holo-ink": "#1c0f08",
      "--text-main": "#fff0d4",
      "--text-dim": "rgba(255, 240, 212, 0.65)",
      "--text-muted": "rgba(255, 240, 212, 0.5)",
      "--button-bg": "rgba(251, 191, 36, 0.14)",
      "--button-selected": "rgba(249, 115, 22, 0.22)",
      "--border-radius": "22px",
      "--font-hud": '"Outfit", "Quicksand", sans-serif',
      "--font-text": '"Quicksand", "Outfit", sans-serif',
      "--font-code": '"JetBrains Mono", monospace',
      "--shell-bg-0": "#1a0e08",
      "--shell-bg-1": "#2e1a10",
      "--shell-bg-2": "#4a2a18",
      "--shell-surface": "rgba(30, 18, 10, 0.92)",
      "--shell-surface-strong": "rgba(20, 12, 6, 0.96)",
      "--shell-border": "rgba(251, 191, 36, 0.22)",
      "--shell-border-strong": "rgba(249, 115, 22, 0.34)",
      "--shell-shadow": "0 34px 90px rgba(251, 191, 36, 0.14)",
      "--shell-radius": "24px",
      "--shell-body-backdrop":
        "radial-gradient(circle at 18% 16%, rgba(251, 191, 36, 0.16), transparent 24%), radial-gradient(circle at 82% 18%, rgba(249, 115, 22, 0.14), transparent 22%), radial-gradient(circle at 50% 110%, rgba(244, 63, 94, 0.12), transparent 34%), linear-gradient(180deg, #3a2010 0%, #1a0e08 48%, #0e0704 100%)",
      "--shell-frame-backdrop":
        "radial-gradient(circle at 12% 16%, rgba(251, 191, 36, 0.18), transparent 24%), radial-gradient(circle at 84% 12%, rgba(249, 115, 22, 0.14), transparent 22%), radial-gradient(circle at 48% 105%, rgba(244, 63, 94, 0.1), transparent 32%), linear-gradient(145deg, #2e1a10 0%, #1a0e08 50%, #0e0704 100%)",
      "--shell-panel-gradient":
        "linear-gradient(180deg, rgba(251, 191, 36, 0.06), rgba(20, 12, 6, 0.98))",
      "--shell-button-gradient":
        "linear-gradient(180deg, rgba(251, 191, 36, 0.18), rgba(30, 18, 10, 0.95))",
      "--shell-button-hover-gradient":
        "linear-gradient(180deg, rgba(249, 115, 22, 0.18), rgba(36, 22, 14, 0.97))",
      "--shell-button-solid-gradient":
        "linear-gradient(180deg, rgba(251, 191, 36, 0.42), rgba(140, 90, 20, 0.98))",
      "--shell-button-danger-gradient":
        "linear-gradient(180deg, rgba(244, 63, 94, 0.24), rgba(54, 18, 14, 0.95))",
      "--shell-card-gradient":
        "linear-gradient(180deg, rgba(251, 191, 36, 0.06), rgba(20, 12, 6, 0.98))",
      "--shell-scene-gradient":
        "linear-gradient(135deg, rgba(60, 34, 18, 0.94), rgba(20, 12, 6, 0.98))",
      "--shell-stage-gradient":
        "linear-gradient(180deg, rgba(46, 26, 16, 0.94), rgba(18, 10, 6, 0.98))",
      "--shell-quiet-gradient":
        "linear-gradient(180deg, rgba(42, 24, 14, 0.92), rgba(18, 10, 6, 0.96))",
    },
  },
  {
    id: "solar-dune",
    name: "Sakura Dawn",
    summary: "Warm blush cream, cherry-blossom pink radiance, and golden hour sky.",
    preview: "linear-gradient(135deg, #fff5f0, #ec4899)",
    colorScheme: "light",
    tokens: {
      "--bg-deep": "#fff5f0",
      "--bg-glass": "rgba(255, 245, 240, 0.82)",
      "--bg-panel": "rgba(255, 252, 250, 0.94)",
      "--holo-cyan": "#ec4899",
      "--holo-cyan-rgb": "236, 72, 153",
      "--holo-alert": "#ef4444",
      "--holo-alert-rgb": "239, 68, 68",
      "--holo-gold": "#f59e0b",
      "--holo-gold-rgb": "245, 158, 11",
      "--holo-blue": "#f472b6",
      "--holo-green": "#34d399",
      "--holo-gray": "#e8a4c8",
      "--holo-dark": "#fff0eb",
      "--holo-primary": "#ec4899",
      "--holo-secondary": "#f59e0b",
      "--holo-accent": "#fff0f5",
      "--holo-ink": "#4a1942",
      "--text-main": "#4a1942",
      "--text-dim": "rgba(74, 25, 66, 0.68)",
      "--text-muted": "rgba(74, 25, 66, 0.52)",
      "--button-bg": "rgba(236, 72, 153, 0.12)",
      "--button-selected": "rgba(245, 158, 11, 0.2)",
      "--border-radius": "24px",
      "--font-hud": '"Outfit", "Quicksand", sans-serif',
      "--font-text": '"Quicksand", "Outfit", sans-serif',
      "--font-code": '"JetBrains Mono", monospace',
      "--shell-bg-0": "#fff5f0",
      "--shell-bg-1": "#ffd6e8",
      "--shell-bg-2": "#ec4899",
      "--shell-surface": "rgba(255, 252, 250, 0.94)",
      "--shell-surface-strong": "rgba(255, 254, 253, 0.98)",
      "--shell-border": "rgba(236, 72, 153, 0.22)",
      "--shell-border-strong": "rgba(236, 72, 153, 0.38)",
      "--shell-shadow": "0 28px 78px rgba(236, 72, 153, 0.14)",
      "--shell-radius": "26px",
      "--shell-body-backdrop":
        "radial-gradient(circle at 12% 16%, rgba(236, 72, 153, 0.16), transparent 24%), radial-gradient(circle at 84% 18%, rgba(245, 158, 11, 0.14), transparent 22%), radial-gradient(circle at 52% 108%, rgba(168, 85, 247, 0.1), transparent 34%), linear-gradient(180deg, #fff5f0 0%, #ffd6e8 52%, #f9a8d4 100%)",
      "--shell-frame-backdrop":
        "radial-gradient(circle at 16% 18%, rgba(236, 72, 153, 0.18), transparent 24%), radial-gradient(circle at 84% 10%, rgba(245, 158, 11, 0.12), transparent 22%), radial-gradient(circle at 50% 108%, rgba(168, 85, 247, 0.08), transparent 32%), linear-gradient(145deg, #ffffff 0%, #ffe4f0 46%, #f9a8d4 100%)",
      "--shell-panel-gradient":
        "linear-gradient(180deg, rgba(255, 255, 255, 0.72), rgba(255, 245, 248, 0.96))",
      "--shell-button-gradient":
        "linear-gradient(180deg, rgba(236, 72, 153, 0.14), rgba(255, 252, 254, 0.96))",
      "--shell-button-hover-gradient":
        "linear-gradient(180deg, rgba(245, 158, 11, 0.16), rgba(255, 248, 240, 0.98))",
      "--shell-button-solid-gradient":
        "linear-gradient(180deg, rgba(236, 72, 153, 0.9), rgba(190, 50, 120, 0.98))",
      "--shell-button-danger-gradient":
        "linear-gradient(180deg, rgba(239, 68, 68, 0.16), rgba(255, 238, 238, 0.96))",
      "--shell-card-gradient":
        "linear-gradient(180deg, rgba(255, 255, 255, 0.74), rgba(255, 245, 248, 0.96))",
      "--shell-scene-gradient":
        "linear-gradient(135deg, rgba(255, 255, 255, 0.9), rgba(255, 240, 248, 0.98))",
      "--shell-stage-gradient":
        "linear-gradient(180deg, rgba(255, 255, 255, 0.62), rgba(255, 242, 248, 0.94))",
      "--shell-quiet-gradient":
        "linear-gradient(180deg, rgba(255, 255, 255, 0.56), rgba(255, 242, 248, 0.92))",
    },
  },
  {
    id: "verdant-signal",
    name: "Spirit Forest",
    summary: "Enchanted emerald canopy, luminous lime energy, and fairy-tale glow.",
    preview: "linear-gradient(135deg, #071a12, #34d399)",
    colorScheme: "dark",
    tokens: {
      "--bg-deep": "#071a12",
      "--bg-glass": "rgba(7, 26, 18, 0.78)",
      "--bg-panel": "rgba(10, 32, 22, 0.9)",
      "--holo-cyan": "#34d399",
      "--holo-cyan-rgb": "52, 211, 153",
      "--holo-alert": "#f43f5e",
      "--holo-alert-rgb": "244, 63, 94",
      "--holo-gold": "#a3e635",
      "--holo-gold-rgb": "163, 230, 53",
      "--holo-blue": "#2dd4bf",
      "--holo-green": "#4ade80",
      "--holo-gray": "#6ee7b7",
      "--holo-dark": "#040e0a",
      "--holo-primary": "#34d399",
      "--holo-secondary": "#a3e635",
      "--holo-accent": "#ecfdf5",
      "--holo-ink": "#0a2018",
      "--text-main": "#ecfdf5",
      "--text-dim": "rgba(236, 253, 245, 0.65)",
      "--text-muted": "rgba(236, 253, 245, 0.5)",
      "--button-bg": "rgba(52, 211, 153, 0.14)",
      "--button-selected": "rgba(163, 230, 53, 0.22)",
      "--border-radius": "28px",
      "--font-hud": '"Outfit", "Quicksand", sans-serif',
      "--font-text": '"Quicksand", "Outfit", sans-serif',
      "--font-code": '"JetBrains Mono", monospace',
      "--shell-bg-0": "#071a12",
      "--shell-bg-1": "#0e3422",
      "--shell-bg-2": "#166534",
      "--shell-surface": "rgba(10, 32, 22, 0.92)",
      "--shell-surface-strong": "rgba(6, 20, 14, 0.96)",
      "--shell-border": "rgba(52, 211, 153, 0.22)",
      "--shell-border-strong": "rgba(163, 230, 53, 0.3)",
      "--shell-shadow": "0 34px 88px rgba(52, 211, 153, 0.14)",
      "--shell-radius": "30px",
      "--shell-body-backdrop":
        "radial-gradient(circle at 14% 18%, rgba(52, 211, 153, 0.18), transparent 24%), radial-gradient(circle at 82% 14%, rgba(163, 230, 53, 0.14), transparent 22%), radial-gradient(circle at 50% 112%, rgba(45, 212, 191, 0.12), transparent 34%), linear-gradient(180deg, #0e3422 0%, #071a12 48%, #040e0a 100%)",
      "--shell-frame-backdrop":
        "radial-gradient(circle at 14% 18%, rgba(52, 211, 153, 0.2), transparent 24%), radial-gradient(circle at 86% 12%, rgba(163, 230, 53, 0.12), transparent 24%), radial-gradient(circle at 50% 105%, rgba(45, 212, 191, 0.1), transparent 32%), linear-gradient(145deg, #0e3422 0%, #071a12 48%, #040e0a 100%)",
      "--shell-panel-gradient":
        "linear-gradient(180deg, rgba(52, 211, 153, 0.06), rgba(6, 20, 14, 0.98))",
      "--shell-button-gradient":
        "linear-gradient(180deg, rgba(52, 211, 153, 0.18), rgba(10, 32, 22, 0.95))",
      "--shell-button-hover-gradient":
        "linear-gradient(180deg, rgba(163, 230, 53, 0.16), rgba(14, 36, 26, 0.97))",
      "--shell-button-solid-gradient":
        "linear-gradient(180deg, rgba(52, 211, 153, 0.38), rgba(22, 101, 52, 0.98))",
      "--shell-button-danger-gradient":
        "linear-gradient(180deg, rgba(244, 63, 94, 0.22), rgba(40, 16, 18, 0.95))",
      "--shell-card-gradient":
        "linear-gradient(180deg, rgba(52, 211, 153, 0.06), rgba(6, 20, 14, 0.98))",
      "--shell-scene-gradient":
        "linear-gradient(135deg, rgba(14, 52, 34, 0.94), rgba(6, 20, 14, 0.98))",
      "--shell-stage-gradient":
        "linear-gradient(180deg, rgba(14, 44, 30, 0.94), rgba(6, 18, 12, 0.98))",
      "--shell-quiet-gradient":
        "linear-gradient(180deg, rgba(12, 42, 28, 0.92), rgba(6, 18, 12, 0.96))",
    },
  },
  {
    id: "night-bloom",
    name: "Neon Bloom",
    summary: "Electric magenta, neon blue sparks, and midnight ritual energy.",
    preview: "linear-gradient(135deg, #0a0618, #ec4899)",
    colorScheme: "dark",
    tokens: {
      "--bg-deep": "#0a0618",
      "--bg-glass": "rgba(10, 6, 24, 0.78)",
      "--bg-panel": "rgba(16, 10, 34, 0.9)",
      "--holo-cyan": "#ec4899",
      "--holo-cyan-rgb": "236, 72, 153",
      "--holo-alert": "#f43f5e",
      "--holo-alert-rgb": "244, 63, 94",
      "--holo-gold": "#38bdf8",
      "--holo-gold-rgb": "56, 189, 248",
      "--holo-blue": "#818cf8",
      "--holo-green": "#34d399",
      "--holo-gray": "#c084fc",
      "--holo-dark": "#060410",
      "--holo-primary": "#ec4899",
      "--holo-secondary": "#38bdf8",
      "--holo-accent": "#fce7f3",
      "--holo-ink": "#100a22",
      "--text-main": "#fce7f3",
      "--text-dim": "rgba(252, 231, 243, 0.65)",
      "--text-muted": "rgba(252, 231, 243, 0.5)",
      "--button-bg": "rgba(236, 72, 153, 0.14)",
      "--button-selected": "rgba(56, 189, 248, 0.22)",
      "--border-radius": "28px",
      "--font-hud": '"Outfit", "Quicksand", sans-serif',
      "--font-text": '"Quicksand", "Outfit", sans-serif',
      "--font-code": '"JetBrains Mono", monospace',
      "--shell-bg-0": "#0a0618",
      "--shell-bg-1": "#1a0e38",
      "--shell-bg-2": "#3b1860",
      "--shell-surface": "rgba(16, 10, 34, 0.92)",
      "--shell-surface-strong": "rgba(8, 5, 18, 0.96)",
      "--shell-border": "rgba(236, 72, 153, 0.24)",
      "--shell-border-strong": "rgba(56, 189, 248, 0.3)",
      "--shell-shadow": "0 36px 96px rgba(236, 72, 153, 0.18)",
      "--shell-radius": "32px",
      "--shell-body-backdrop":
        "radial-gradient(circle at 16% 18%, rgba(236, 72, 153, 0.2), transparent 24%), radial-gradient(circle at 86% 14%, rgba(56, 189, 248, 0.16), transparent 22%), radial-gradient(circle at 50% 112%, rgba(168, 85, 247, 0.14), transparent 34%), linear-gradient(180deg, #1e0e40 0%, #0e0820 48%, #060410 100%)",
      "--shell-frame-backdrop":
        "radial-gradient(circle at 16% 18%, rgba(236, 72, 153, 0.22), transparent 24%), radial-gradient(circle at 86% 14%, rgba(56, 189, 248, 0.14), transparent 22%), radial-gradient(circle at 50% 105%, rgba(168, 85, 247, 0.12), transparent 32%), linear-gradient(145deg, #1a0c3c 0%, #0e0820 48%, #060410 100%)",
      "--shell-panel-gradient":
        "linear-gradient(180deg, rgba(236, 72, 153, 0.06), rgba(8, 5, 18, 0.98))",
      "--shell-button-gradient":
        "linear-gradient(180deg, rgba(236, 72, 153, 0.2), rgba(16, 10, 34, 0.95))",
      "--shell-button-hover-gradient":
        "linear-gradient(180deg, rgba(56, 189, 248, 0.18), rgba(20, 12, 40, 0.97))",
      "--shell-button-solid-gradient":
        "linear-gradient(180deg, rgba(236, 72, 153, 0.42), rgba(140, 30, 80, 0.98))",
      "--shell-button-danger-gradient":
        "linear-gradient(180deg, rgba(244, 63, 94, 0.24), rgba(50, 14, 18, 0.95))",
      "--shell-card-gradient":
        "linear-gradient(180deg, rgba(236, 72, 153, 0.06), rgba(8, 5, 18, 0.98))",
      "--shell-scene-gradient":
        "linear-gradient(135deg, rgba(36, 16, 60, 0.94), rgba(8, 5, 18, 0.98))",
      "--shell-stage-gradient":
        "linear-gradient(180deg, rgba(26, 14, 56, 0.94), rgba(8, 5, 18, 0.98))",
      "--shell-quiet-gradient":
        "linear-gradient(180deg, rgba(24, 12, 50, 0.92), rgba(8, 5, 18, 0.96))",
    },
  },
  {
    id: "iron-ember",
    name: "Dragon Forge",
    summary: "Crimson flame, molten orange energy, and dark volcanic steel.",
    preview: "linear-gradient(135deg, #10080a, #ef4444)",
    colorScheme: "dark",
    tokens: {
      "--bg-deep": "#10080a",
      "--bg-glass": "rgba(16, 8, 10, 0.78)",
      "--bg-panel": "rgba(24, 12, 16, 0.9)",
      "--holo-cyan": "#ef4444",
      "--holo-cyan-rgb": "239, 68, 68",
      "--holo-alert": "#f97316",
      "--holo-alert-rgb": "249, 115, 22",
      "--holo-gold": "#fbbf24",
      "--holo-gold-rgb": "251, 191, 36",
      "--holo-blue": "#fb7185",
      "--holo-green": "#f97316",
      "--holo-gray": "#f87171",
      "--holo-dark": "#080406",
      "--holo-primary": "#ef4444",
      "--holo-secondary": "#fbbf24",
      "--holo-accent": "#fef2f2",
      "--holo-ink": "#180a0e",
      "--text-main": "#fef2f2",
      "--text-dim": "rgba(254, 242, 242, 0.66)",
      "--text-muted": "rgba(254, 242, 242, 0.5)",
      "--button-bg": "rgba(239, 68, 68, 0.14)",
      "--button-selected": "rgba(251, 191, 36, 0.2)",
      "--border-radius": "20px",
      "--font-hud": '"Outfit", "Quicksand", sans-serif',
      "--font-text": '"Quicksand", "Outfit", sans-serif',
      "--font-code": '"JetBrains Mono", monospace',
      "--shell-bg-0": "#10080a",
      "--shell-bg-1": "#241014",
      "--shell-bg-2": "#3e1820",
      "--shell-surface": "rgba(24, 12, 16, 0.92)",
      "--shell-surface-strong": "rgba(14, 7, 10, 0.97)",
      "--shell-border": "rgba(239, 68, 68, 0.22)",
      "--shell-border-strong": "rgba(251, 191, 36, 0.3)",
      "--shell-shadow": "0 34px 88px rgba(239, 68, 68, 0.16)",
      "--shell-radius": "22px",
      "--shell-body-backdrop":
        "radial-gradient(circle at 14% 18%, rgba(239, 68, 68, 0.2), transparent 24%), radial-gradient(circle at 86% 14%, rgba(251, 191, 36, 0.14), transparent 22%), radial-gradient(circle at 50% 112%, rgba(249, 115, 22, 0.14), transparent 34%), linear-gradient(180deg, #2e1218 0%, #10080a 48%, #080406 100%)",
      "--shell-frame-backdrop":
        "radial-gradient(circle at 14% 18%, rgba(239, 68, 68, 0.22), transparent 24%), radial-gradient(circle at 86% 14%, rgba(251, 191, 36, 0.12), transparent 22%), radial-gradient(circle at 50% 105%, rgba(249, 115, 22, 0.12), transparent 32%), linear-gradient(145deg, #281014 0%, #10080a 48%, #080406 100%)",
      "--shell-panel-gradient":
        "linear-gradient(180deg, rgba(239, 68, 68, 0.06), rgba(14, 7, 10, 0.98))",
      "--shell-button-gradient":
        "linear-gradient(180deg, rgba(239, 68, 68, 0.2), rgba(24, 12, 16, 0.95))",
      "--shell-button-hover-gradient":
        "linear-gradient(180deg, rgba(251, 191, 36, 0.16), rgba(30, 14, 18, 0.97))",
      "--shell-button-solid-gradient":
        "linear-gradient(180deg, rgba(239, 68, 68, 0.48), rgba(130, 32, 32, 0.98))",
      "--shell-button-danger-gradient":
        "linear-gradient(180deg, rgba(249, 115, 22, 0.24), rgba(52, 20, 12, 0.95))",
      "--shell-card-gradient":
        "linear-gradient(180deg, rgba(239, 68, 68, 0.05), rgba(14, 7, 10, 0.98))",
      "--shell-scene-gradient":
        "linear-gradient(135deg, rgba(40, 18, 22, 0.94), rgba(14, 7, 10, 0.98))",
      "--shell-stage-gradient":
        "linear-gradient(180deg, rgba(30, 14, 18, 0.94), rgba(14, 7, 10, 0.98))",
      "--shell-quiet-gradient":
        "linear-gradient(180deg, rgba(28, 12, 16, 0.92), rgba(14, 7, 10, 0.96))",
    },
  },
  {
    id: "glacier-signal",
    name: "Frozen Echo",
    summary: "Ice crystal blue, aurora lavender, and snow-field clarity.",
    preview: "linear-gradient(135deg, #f0f4ff, #38bdf8)",
    colorScheme: "light",
    tokens: {
      "--bg-deep": "#f0f4ff",
      "--bg-glass": "rgba(240, 244, 255, 0.82)",
      "--bg-panel": "rgba(250, 252, 255, 0.94)",
      "--holo-cyan": "#38bdf8",
      "--holo-cyan-rgb": "56, 189, 248",
      "--holo-alert": "#f43f5e",
      "--holo-alert-rgb": "244, 63, 94",
      "--holo-gold": "#a855f7",
      "--holo-gold-rgb": "168, 85, 247",
      "--holo-blue": "#60a5fa",
      "--holo-green": "#34d399",
      "--holo-gray": "#93c5fd",
      "--holo-dark": "#eef2ff",
      "--holo-primary": "#38bdf8",
      "--holo-secondary": "#a855f7",
      "--holo-accent": "#ffffff",
      "--holo-ink": "#0c1a3a",
      "--text-main": "#0f1b3d",
      "--text-dim": "rgba(15, 27, 61, 0.66)",
      "--text-muted": "rgba(15, 27, 61, 0.52)",
      "--button-bg": "rgba(56, 189, 248, 0.14)",
      "--button-selected": "rgba(168, 85, 247, 0.2)",
      "--border-radius": "26px",
      "--font-hud": '"Outfit", "Quicksand", sans-serif',
      "--font-text": '"Quicksand", "Outfit", sans-serif',
      "--font-code": '"JetBrains Mono", monospace',
      "--shell-bg-0": "#f0f4ff",
      "--shell-bg-1": "#d4e0ff",
      "--shell-bg-2": "#93b8ff",
      "--shell-surface": "rgba(250, 252, 255, 0.94)",
      "--shell-surface-strong": "rgba(254, 254, 255, 0.98)",
      "--shell-border": "rgba(56, 189, 248, 0.24)",
      "--shell-border-strong": "rgba(168, 85, 247, 0.3)",
      "--shell-shadow": "0 28px 78px rgba(56, 189, 248, 0.12)",
      "--shell-radius": "28px",
      "--shell-body-backdrop":
        "radial-gradient(circle at 14% 18%, rgba(56, 189, 248, 0.18), transparent 24%), radial-gradient(circle at 84% 14%, rgba(168, 85, 247, 0.14), transparent 22%), radial-gradient(circle at 50% 110%, rgba(96, 165, 250, 0.12), transparent 34%), linear-gradient(180deg, #f0f4ff 0%, #d4e0ff 52%, #a5c4ff 100%)",
      "--shell-frame-backdrop":
        "radial-gradient(circle at 14% 18%, rgba(56, 189, 248, 0.2), transparent 24%), radial-gradient(circle at 84% 14%, rgba(168, 85, 247, 0.14), transparent 22%), radial-gradient(circle at 50% 105%, rgba(96, 165, 250, 0.1), transparent 32%), linear-gradient(145deg, #ffffff 0%, #e0eaff 48%, #b0ccff 100%)",
      "--shell-panel-gradient":
        "linear-gradient(180deg, rgba(255, 255, 255, 0.76), rgba(245, 248, 255, 0.97))",
      "--shell-button-gradient":
        "linear-gradient(180deg, rgba(56, 189, 248, 0.14), rgba(250, 252, 255, 0.96))",
      "--shell-button-hover-gradient":
        "linear-gradient(180deg, rgba(168, 85, 247, 0.14), rgba(245, 248, 255, 0.98))",
      "--shell-button-solid-gradient":
        "linear-gradient(180deg, rgba(56, 189, 248, 0.9), rgba(30, 140, 200, 0.98))",
      "--shell-button-danger-gradient":
        "linear-gradient(180deg, rgba(244, 63, 94, 0.16), rgba(255, 240, 242, 0.96))",
      "--shell-card-gradient":
        "linear-gradient(180deg, rgba(255, 255, 255, 0.76), rgba(244, 248, 255, 0.96))",
      "--shell-scene-gradient":
        "linear-gradient(135deg, rgba(255, 255, 255, 0.9), rgba(240, 246, 255, 0.98))",
      "--shell-stage-gradient":
        "linear-gradient(180deg, rgba(255, 255, 255, 0.6), rgba(242, 248, 255, 0.94))",
      "--shell-quiet-gradient":
        "linear-gradient(180deg, rgba(255, 255, 255, 0.56), rgba(242, 248, 255, 0.92))",
    },
  },
];

const THEME_BY_ID = Object.fromEntries(THEME_REGISTRY.map((theme) => [theme.id, theme]));
const DEFAULT_THEME_ID = THEME_REGISTRY[0].id;
const ThemeContext = createContext(null);

function parseHexColor(value) {
  if (typeof value !== "string") return null;

  const normalized = value.trim();
  if (!normalized.startsWith("#")) return null;

  const hex = normalized.slice(1);
  if (hex.length === 3) {
    return {
      r: Number.parseInt(hex[0] + hex[0], 16),
      g: Number.parseInt(hex[1] + hex[1], 16),
      b: Number.parseInt(hex[2] + hex[2], 16),
    };
  }

  if (hex.length === 6) {
    return {
      r: Number.parseInt(hex.slice(0, 2), 16),
      g: Number.parseInt(hex.slice(2, 4), 16),
      b: Number.parseInt(hex.slice(4, 6), 16),
    };
  }

  return null;
}

function toRgba(value, alpha) {
  const parsed = parseHexColor(value);
  if (!parsed) return value;
  return `rgba(${parsed.r}, ${parsed.g}, ${parsed.b}, ${alpha})`;
}

function relativeChannel(channel) {
  const normalized = channel / 255;
  if (normalized <= 0.03928) {
    return normalized / 12.92;
  }
  return ((normalized + 0.055) / 1.055) ** 2.4;
}

function relativeLuminance(value) {
  const parsed = parseHexColor(value);
  if (!parsed) return 0;

  return (
    0.2126 * relativeChannel(parsed.r) +
    0.7152 * relativeChannel(parsed.g) +
    0.0722 * relativeChannel(parsed.b)
  );
}

function getReadableAccentText(accentColor) {
  return relativeLuminance(accentColor) > 0.42 ? "#13080a" : "#fffaf5";
}

function getReadableOutlineText(baseColor) {
  return relativeLuminance(baseColor) > 0.42 ? "rgba(7, 9, 14, 0.58)" : "rgba(255, 250, 245, 0.46)";
}

function getDerivedThemeTokens(theme) {
  const tokens = theme?.tokens || {};
  const textMain = tokens["--text-main"] || (theme?.colorScheme === "light" ? "#111827" : "#f8fafc");
  const colorScheme = theme?.colorScheme || "dark";
  const dimAlpha = colorScheme === "light" ? 0.84 : 0.82;
  const mutedAlpha = colorScheme === "light" ? 0.72 : 0.7;
  const primaryAccent = tokens["--holo-primary"] || tokens["--holo-cyan"] || textMain;
  const alertAccent = tokens["--holo-alert"] || primaryAccent;

  return {
    "--text-dim": toRgba(textMain, dimAlpha),
    "--text-muted": toRgba(textMain, mutedAlpha),
    "--text-on-accent": getReadableAccentText(primaryAccent),
    "--text-on-danger": getReadableAccentText(alertAccent),
    "--text-outline-soft": getReadableOutlineText(textMain),
    "--text-outline-strong": getReadableOutlineText(primaryAccent),
  };
}

function getStoredThemeId() {
  if (typeof window === "undefined") return DEFAULT_THEME_ID;

  try {
    const savedThemeId = window.localStorage.getItem(STORAGE_KEY);
    return THEME_BY_ID[savedThemeId] ? savedThemeId : DEFAULT_THEME_ID;
  } catch {
    return DEFAULT_THEME_ID;
  }
}

function applyThemeTokens(theme) {
  if (typeof document === "undefined" || !theme) return;

  const root = document.documentElement;
  const resolvedTokens = {
    ...(theme.tokens || {}),
    ...getDerivedThemeTokens(theme),
  };

  Object.entries(resolvedTokens).forEach(([token, value]) => {
    root.style.setProperty(token, value);
  });
  root.dataset.shellTheme = theme.id;
  root.style.colorScheme = theme.colorScheme || "dark";
}

export function ThemeProvider({ children }) {
  const [currentThemeId, setCurrentThemeId] = useState(getStoredThemeId);
  const theme = THEME_BY_ID[currentThemeId] || THEME_BY_ID[DEFAULT_THEME_ID];

  useEffect(() => {
    applyThemeTokens(theme);
  }, [theme]);

  const setTheme = useCallback((themeId) => {
    if (!THEME_BY_ID[themeId]) return;

    setCurrentThemeId(themeId);
    if (typeof window !== "undefined") {
      try {
        window.localStorage.setItem(STORAGE_KEY, themeId);
      } catch {
        // Ignore storage failures and keep the in-memory theme.
      }
    }
  }, []);

  const value = useMemo(
    () => ({
      theme,
      currentThemeId,
      setTheme,
      themes: THEME_REGISTRY,
    }),
    [currentThemeId, setTheme, theme],
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error("useTheme must be used within a ThemeProvider");
  }
  return context;
}

export function ThemeDock() {
  const { currentThemeId, setTheme, theme, themes } = useTheme();
  const gridId = useId();
  const [isReduced, setIsReduced] = useState(true);
  const dockRef = useRef(null);

  useEffect(() => {
    if (typeof document === "undefined") return undefined;

    const root = document.documentElement;
    const dockElement = dockRef.current;
    if (!dockElement) return undefined;

    const syncDockHeight = () => {
      root.style.setProperty("--theme-dock-height", `${dockElement.offsetHeight}px`);
    };

    syncDockHeight();

    if (typeof ResizeObserver !== "function") {
      window.addEventListener("resize", syncDockHeight);
      return () => {
        window.removeEventListener("resize", syncDockHeight);
        root.style.removeProperty("--theme-dock-height");
      };
    }

    const observer = new ResizeObserver(() => {
      syncDockHeight();
    });

    observer.observe(dockElement);
    window.addEventListener("resize", syncDockHeight);

    return () => {
      observer.disconnect();
      window.removeEventListener("resize", syncDockHeight);
      root.style.removeProperty("--theme-dock-height");
    };
  }, [isReduced]);

  return (
    <aside
      ref={dockRef}
      className={`theme-dock ${isReduced ? "theme-dock--reduced" : ""}`}
      aria-label="Theme selection"
    >
      <div className="theme-dock__header">
        <div className="theme-dock__meta">
          <div className="theme-dock__eyebrow">Theme Set</div>
          <div className="theme-dock__title-row">
            <span
              className="theme-dock__active-preview"
              style={{ background: theme.preview }}
              aria-hidden="true"
            />
            <div className="theme-dock__title">{theme.name}</div>
          </div>
          <div className="theme-dock__summary">{theme.summary}</div>
        </div>
        <button
          type="button"
          className="theme-dock__toggle"
          onClick={() => setIsReduced((prev) => !prev)}
          aria-expanded={!isReduced}
          aria-controls={gridId}
          aria-label={isReduced ? "Expand theme list" : "Retract theme list"}
        >
          {isReduced ? "Expand" : "Retract"}
        </button>
      </div>

      <div id={gridId} className="theme-dock__grid" hidden={isReduced}>
        {themes.map((entry) => {
          const isActive = entry.id === currentThemeId;
          return (
            <button
              key={entry.id}
              type="button"
              className={`theme-dock__swatch ${isActive ? "theme-dock__swatch--active" : ""}`}
              onClick={() => setTheme(entry.id)}
              aria-pressed={isActive}
              title={entry.name}
            >
              <span
                className="theme-dock__swatch-preview"
                style={{ background: entry.preview }}
                aria-hidden="true"
              />
              <span className="theme-dock__swatch-name">{entry.name}</span>
            </button>
          );
        })}
      </div>
    </aside>
  );
}
