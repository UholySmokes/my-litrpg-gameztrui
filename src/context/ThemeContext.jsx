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
    name: "Mistglass",
    summary: "Cool daylight, pale fog, and clear tactical contrast.",
    preview: "linear-gradient(135deg, #dbe6e8, #91aab2)",
    colorScheme: "light",
    tokens: {
      "--bg-deep": "#dbe6e8",
      "--bg-glass": "rgba(228, 238, 239, 0.78)",
      "--bg-panel": "rgba(244, 248, 248, 0.9)",
      "--holo-cyan": "#4f8d98",
      "--holo-cyan-rgb": "79, 141, 152",
      "--holo-alert": "#bb6b57",
      "--holo-alert-rgb": "187, 107, 87",
      "--holo-gold": "#8f7454",
      "--holo-gold-rgb": "143, 116, 84",
      "--holo-blue": "#6d8ca3",
      "--holo-green": "#73968d",
      "--holo-gray": "#9cadb4",
      "--holo-dark": "#e5edef",
      "--holo-primary": "#4f8d98",
      "--holo-secondary": "#b46e57",
      "--holo-accent": "#fff5e8",
      "--holo-ink": "#203038",
      "--text-main": "#17303a",
      "--text-dim": "rgba(23, 48, 58, 0.66)",
      "--text-muted": "rgba(23, 48, 58, 0.56)",
      "--button-bg": "rgba(79, 141, 152, 0.12)",
      "--button-selected": "rgba(180, 110, 87, 0.18)",
      "--border-radius": "22px",
      "--font-hud": "\"Sora\", sans-serif",
      "--font-text": "\"Spectral\", serif",
      "--font-code": "\"IBM Plex Mono\", monospace",
      "--shell-bg-0": "#dbe6e8",
      "--shell-bg-1": "#b9ccd2",
      "--shell-bg-2": "#91aab2",
      "--shell-surface": "rgba(242, 247, 247, 0.9)",
      "--shell-surface-strong": "rgba(250, 252, 252, 0.96)",
      "--shell-border": "rgba(66, 92, 99, 0.24)",
      "--shell-border-strong": "rgba(66, 92, 99, 0.38)",
      "--shell-shadow": "0 28px 72px rgba(33, 51, 58, 0.14)",
      "--shell-radius": "26px",
      "--shell-body-backdrop":
        "radial-gradient(circle at 14% 18%, rgba(79, 141, 152, 0.16), transparent 24%), radial-gradient(circle at 80% 16%, rgba(224, 201, 169, 0.16), transparent 20%), radial-gradient(circle at 52% 112%, rgba(187, 107, 87, 0.16), transparent 34%), linear-gradient(180deg, #dbe6e8 0%, #b9ccd2 48%, #91aab2 100%)",
      "--shell-frame-backdrop":
        "radial-gradient(circle at 14% 18%, rgba(79, 141, 152, 0.18), transparent 24%), radial-gradient(circle at 86% 12%, rgba(143, 116, 84, 0.12), transparent 24%), radial-gradient(circle at 50% 105%, rgba(187, 107, 87, 0.12), transparent 32%), linear-gradient(145deg, #eff5f5 0%, #d6e1e4 48%, #a6bbc2 100%)",
      "--shell-panel-gradient":
        "linear-gradient(180deg, rgba(255, 255, 255, 0.62), rgba(240, 246, 247, 0.88))",
      "--shell-button-gradient":
        "linear-gradient(180deg, rgba(79, 141, 152, 0.12), rgba(244, 248, 248, 0.94))",
      "--shell-button-hover-gradient":
        "linear-gradient(180deg, rgba(79, 141, 152, 0.2), rgba(233, 241, 243, 0.98))",
      "--shell-button-solid-gradient":
        "linear-gradient(180deg, rgba(180, 110, 87, 0.84), rgba(145, 95, 73, 0.98))",
      "--shell-button-danger-gradient":
        "linear-gradient(180deg, rgba(187, 107, 87, 0.2), rgba(244, 233, 229, 0.96))",
      "--shell-card-gradient":
        "linear-gradient(180deg, rgba(255, 255, 255, 0.68), rgba(240, 246, 247, 0.94))",
      "--shell-scene-gradient":
        "linear-gradient(135deg, rgba(255, 255, 255, 0.76), rgba(236, 244, 246, 0.96))",
      "--shell-stage-gradient":
        "linear-gradient(180deg, rgba(255, 255, 255, 0.52), rgba(240, 246, 247, 0.92))",
      "--shell-quiet-gradient":
        "linear-gradient(180deg, rgba(255, 255, 255, 0.52), rgba(240, 246, 247, 0.9))",
    },
  },
  {
    id: "ashen-ledger",
    name: "Ashen Ledger",
    summary: "Smoke, parchment, and brass like a field manual from a ruined archive.",
    preview: "linear-gradient(135deg, #201915, #8d6f4b)",
    colorScheme: "dark",
    tokens: {
      "--bg-deep": "#18120f",
      "--bg-glass": "rgba(26, 20, 16, 0.78)",
      "--bg-panel": "rgba(33, 24, 18, 0.92)",
      "--holo-cyan": "#d0b27a",
      "--holo-cyan-rgb": "208, 178, 122",
      "--holo-alert": "#c26a4a",
      "--holo-alert-rgb": "194, 106, 74",
      "--holo-gold": "#f0d9aa",
      "--holo-gold-rgb": "240, 217, 170",
      "--holo-blue": "#9d7f5e",
      "--holo-green": "#7f8a68",
      "--holo-gray": "#8f816f",
      "--holo-dark": "#120d0a",
      "--holo-primary": "#f0d9aa",
      "--holo-secondary": "#c26a4a",
      "--holo-accent": "#fff4d8",
      "--holo-ink": "#1a130f",
      "--text-main": "#f4e4c3",
      "--text-dim": "rgba(244, 228, 195, 0.62)",
      "--text-muted": "rgba(244, 228, 195, 0.5)",
      "--button-bg": "rgba(240, 217, 170, 0.12)",
      "--button-selected": "rgba(194, 106, 74, 0.2)",
      "--border-radius": "18px",
      "--font-hud": "\"Cinzel\", serif",
      "--font-text": "\"Cormorant Garamond\", serif",
      "--font-code": "\"IBM Plex Mono\", monospace",
      "--shell-bg-0": "#18120f",
      "--shell-bg-1": "#2b2119",
      "--shell-bg-2": "#4c3929",
      "--shell-surface": "rgba(34, 26, 19, 0.9)",
      "--shell-surface-strong": "rgba(22, 17, 12, 0.95)",
      "--shell-border": "rgba(240, 217, 170, 0.2)",
      "--shell-border-strong": "rgba(240, 217, 170, 0.34)",
      "--shell-shadow": "0 34px 90px rgba(0, 0, 0, 0.42)",
      "--shell-radius": "24px",
      "--shell-body-backdrop":
        "radial-gradient(circle at 18% 16%, rgba(240, 217, 170, 0.12), transparent 22%), radial-gradient(circle at 82% 18%, rgba(194, 106, 74, 0.16), transparent 20%), radial-gradient(circle at 50% 110%, rgba(109, 85, 59, 0.2), transparent 34%), linear-gradient(180deg, #3b2d22 0%, #241a14 48%, #120d0a 100%)",
      "--shell-frame-backdrop":
        "radial-gradient(circle at 12% 16%, rgba(240, 217, 170, 0.12), transparent 22%), radial-gradient(circle at 84% 12%, rgba(194, 106, 74, 0.14), transparent 20%), radial-gradient(circle at 48% 105%, rgba(88, 64, 46, 0.18), transparent 32%), linear-gradient(145deg, #2c221a 0%, #1b140f 50%, #120d0a 100%)",
      "--shell-panel-gradient":
        "linear-gradient(180deg, rgba(255, 238, 204, 0.04), rgba(27, 21, 16, 0.98))",
      "--shell-button-gradient":
        "linear-gradient(180deg, rgba(240, 217, 170, 0.16), rgba(34, 26, 19, 0.95))",
      "--shell-button-hover-gradient":
        "linear-gradient(180deg, rgba(194, 106, 74, 0.16), rgba(40, 30, 22, 0.97))",
      "--shell-button-solid-gradient":
        "linear-gradient(180deg, rgba(240, 217, 170, 0.36), rgba(122, 90, 56, 0.98))",
      "--shell-button-danger-gradient":
        "linear-gradient(180deg, rgba(194, 106, 74, 0.22), rgba(54, 26, 19, 0.95))",
      "--shell-card-gradient":
        "linear-gradient(180deg, rgba(240, 217, 170, 0.04), rgba(24, 19, 14, 0.98))",
      "--shell-scene-gradient":
        "linear-gradient(135deg, rgba(76, 57, 41, 0.92), rgba(22, 17, 12, 0.98))",
      "--shell-stage-gradient":
        "linear-gradient(180deg, rgba(54, 41, 30, 0.94), rgba(18, 14, 10, 0.98))",
      "--shell-quiet-gradient":
        "linear-gradient(180deg, rgba(50, 37, 27, 0.92), rgba(22, 17, 12, 0.96))",
    },
  },
  {
    id: "solar-dune",
    name: "Solar Dune",
    summary: "Hot ivory, sunburnt copper, and expedition-map contrast.",
    preview: "linear-gradient(135deg, #f6ead8, #d18a4c)",
    colorScheme: "light",
    tokens: {
      "--bg-deep": "#f3e6d3",
      "--bg-glass": "rgba(248, 240, 226, 0.78)",
      "--bg-panel": "rgba(255, 250, 242, 0.92)",
      "--holo-cyan": "#d18a4c",
      "--holo-cyan-rgb": "209, 138, 76",
      "--holo-alert": "#b94c3b",
      "--holo-alert-rgb": "185, 76, 59",
      "--holo-gold": "#8b6b2f",
      "--holo-gold-rgb": "139, 107, 47",
      "--holo-blue": "#b87d43",
      "--holo-green": "#8c9b64",
      "--holo-gray": "#b9a78f",
      "--holo-dark": "#efe4d3",
      "--holo-primary": "#d18a4c",
      "--holo-secondary": "#8b6b2f",
      "--holo-accent": "#fff8e8",
      "--holo-ink": "#46301f",
      "--text-main": "#432d1d",
      "--text-dim": "rgba(67, 45, 29, 0.66)",
      "--text-muted": "rgba(67, 45, 29, 0.54)",
      "--button-bg": "rgba(209, 138, 76, 0.12)",
      "--button-selected": "rgba(139, 107, 47, 0.18)",
      "--border-radius": "20px",
      "--font-hud": "\"Sora\", sans-serif",
      "--font-text": "\"Cormorant Garamond\", serif",
      "--font-code": "\"IBM Plex Mono\", monospace",
      "--shell-bg-0": "#f3e6d3",
      "--shell-bg-1": "#e4c79c",
      "--shell-bg-2": "#d18a4c",
      "--shell-surface": "rgba(255, 248, 237, 0.92)",
      "--shell-surface-strong": "rgba(255, 252, 246, 0.96)",
      "--shell-border": "rgba(126, 91, 50, 0.22)",
      "--shell-border-strong": "rgba(126, 91, 50, 0.36)",
      "--shell-shadow": "0 28px 78px rgba(107, 70, 28, 0.16)",
      "--shell-radius": "24px",
      "--shell-body-backdrop":
        "radial-gradient(circle at 12% 16%, rgba(209, 138, 76, 0.18), transparent 22%), radial-gradient(circle at 84% 18%, rgba(255, 240, 201, 0.26), transparent 20%), radial-gradient(circle at 52% 108%, rgba(185, 76, 59, 0.14), transparent 34%), linear-gradient(180deg, #f6ead8 0%, #e4c79c 52%, #d18a4c 100%)",
      "--shell-frame-backdrop":
        "radial-gradient(circle at 16% 18%, rgba(209, 138, 76, 0.2), transparent 24%), radial-gradient(circle at 84% 10%, rgba(139, 107, 47, 0.14), transparent 22%), radial-gradient(circle at 50% 108%, rgba(185, 76, 59, 0.12), transparent 32%), linear-gradient(145deg, #fff6eb 0%, #f1dcc0 46%, #dba05c 100%)",
      "--shell-panel-gradient":
        "linear-gradient(180deg, rgba(255, 255, 255, 0.68), rgba(251, 243, 230, 0.95))",
      "--shell-button-gradient":
        "linear-gradient(180deg, rgba(209, 138, 76, 0.16), rgba(255, 247, 236, 0.95))",
      "--shell-button-hover-gradient":
        "linear-gradient(180deg, rgba(139, 107, 47, 0.18), rgba(255, 243, 222, 0.98))",
      "--shell-button-solid-gradient":
        "linear-gradient(180deg, rgba(209, 138, 76, 0.92), rgba(171, 111, 55, 0.98))",
      "--shell-button-danger-gradient":
        "linear-gradient(180deg, rgba(185, 76, 59, 0.18), rgba(255, 235, 231, 0.96))",
      "--shell-card-gradient":
        "linear-gradient(180deg, rgba(255, 255, 255, 0.7), rgba(250, 240, 227, 0.95))",
      "--shell-scene-gradient":
        "linear-gradient(135deg, rgba(255, 248, 237, 0.9), rgba(250, 235, 214, 0.98))",
      "--shell-stage-gradient":
        "linear-gradient(180deg, rgba(255, 250, 242, 0.62), rgba(250, 239, 222, 0.92))",
      "--shell-quiet-gradient":
        "linear-gradient(180deg, rgba(255, 250, 242, 0.56), rgba(250, 239, 222, 0.9))",
    },
  },
  {
    id: "verdant-signal",
    name: "Verdant Signal",
    summary: "Canopy green, signal amber, and living-infrastructure calm.",
    preview: "linear-gradient(135deg, #0d1b18, #6f8c52)",
    colorScheme: "dark",
    tokens: {
      "--bg-deep": "#0d1514",
      "--bg-glass": "rgba(13, 24, 21, 0.78)",
      "--bg-panel": "rgba(17, 30, 26, 0.9)",
      "--holo-cyan": "#83b67a",
      "--holo-cyan-rgb": "131, 182, 122",
      "--holo-alert": "#d06d43",
      "--holo-alert-rgb": "208, 109, 67",
      "--holo-gold": "#e0c07f",
      "--holo-gold-rgb": "224, 192, 127",
      "--holo-blue": "#658d72",
      "--holo-green": "#8fbc75",
      "--holo-gray": "#7f9787",
      "--holo-dark": "#08100e",
      "--holo-primary": "#83b67a",
      "--holo-secondary": "#e0c07f",
      "--holo-accent": "#f1f7e6",
      "--holo-ink": "#0f1815",
      "--text-main": "#ecf4df",
      "--text-dim": "rgba(236, 244, 223, 0.62)",
      "--text-muted": "rgba(236, 244, 223, 0.5)",
      "--button-bg": "rgba(131, 182, 122, 0.12)",
      "--button-selected": "rgba(224, 192, 127, 0.2)",
      "--border-radius": "26px",
      "--font-hud": "\"Sora\", sans-serif",
      "--font-text": "\"Spectral\", serif",
      "--font-code": "\"IBM Plex Mono\", monospace",
      "--shell-bg-0": "#0d1514",
      "--shell-bg-1": "#173028",
      "--shell-bg-2": "#2d4b37",
      "--shell-surface": "rgba(16, 31, 27, 0.92)",
      "--shell-surface-strong": "rgba(11, 21, 18, 0.96)",
      "--shell-border": "rgba(131, 182, 122, 0.2)",
      "--shell-border-strong": "rgba(224, 192, 127, 0.28)",
      "--shell-shadow": "0 34px 88px rgba(0, 0, 0, 0.4)",
      "--shell-radius": "30px",
      "--shell-body-backdrop":
        "radial-gradient(circle at 14% 18%, rgba(131, 182, 122, 0.16), transparent 24%), radial-gradient(circle at 82% 14%, rgba(224, 192, 127, 0.14), transparent 20%), radial-gradient(circle at 50% 112%, rgba(208, 109, 67, 0.14), transparent 34%), linear-gradient(180deg, #1e312a 0%, #10201b 48%, #08100e 100%)",
      "--shell-frame-backdrop":
        "radial-gradient(circle at 14% 18%, rgba(131, 182, 122, 0.18), transparent 24%), radial-gradient(circle at 86% 12%, rgba(224, 192, 127, 0.12), transparent 24%), radial-gradient(circle at 50% 105%, rgba(208, 109, 67, 0.12), transparent 32%), linear-gradient(145deg, #183028 0%, #10211c 48%, #08100e 100%)",
      "--shell-panel-gradient":
        "linear-gradient(180deg, rgba(241, 247, 230, 0.04), rgba(11, 21, 18, 0.98))",
      "--shell-button-gradient":
        "linear-gradient(180deg, rgba(131, 182, 122, 0.16), rgba(16, 31, 27, 0.95))",
      "--shell-button-hover-gradient":
        "linear-gradient(180deg, rgba(224, 192, 127, 0.14), rgba(22, 36, 30, 0.97))",
      "--shell-button-solid-gradient":
        "linear-gradient(180deg, rgba(224, 192, 127, 0.26), rgba(94, 76, 45, 0.98))",
      "--shell-button-danger-gradient":
        "linear-gradient(180deg, rgba(208, 109, 67, 0.22), rgba(52, 23, 17, 0.95))",
      "--shell-card-gradient":
        "linear-gradient(180deg, rgba(131, 182, 122, 0.05), rgba(11, 21, 18, 0.98))",
      "--shell-scene-gradient":
        "linear-gradient(135deg, rgba(31, 57, 45, 0.94), rgba(10, 20, 17, 0.98))",
      "--shell-stage-gradient":
        "linear-gradient(180deg, rgba(22, 42, 34, 0.94), rgba(10, 18, 15, 0.98))",
      "--shell-quiet-gradient":
        "linear-gradient(180deg, rgba(21, 41, 34, 0.9), rgba(10, 18, 15, 0.96))",
    },
  },
  {
    id: "night-bloom",
    name: "Night Bloom",
    summary: "Ink violet, petal magenta, and nocturnal ritual energy.",
    preview: "linear-gradient(135deg, #100a1f, #da5ea4)",
    colorScheme: "dark",
    tokens: {
      "--bg-deep": "#0d0a17",
      "--bg-glass": "rgba(17, 10, 31, 0.78)",
      "--bg-panel": "rgba(22, 13, 41, 0.9)",
      "--holo-cyan": "#da5ea4",
      "--holo-cyan-rgb": "218, 94, 164",
      "--holo-alert": "#ff7a5c",
      "--holo-alert-rgb": "255, 122, 92",
      "--holo-gold": "#8fb1ff",
      "--holo-gold-rgb": "143, 177, 255",
      "--holo-blue": "#8ea2e0",
      "--holo-green": "#7fb3aa",
      "--holo-gray": "#998db5",
      "--holo-dark": "#090611",
      "--holo-primary": "#da5ea4",
      "--holo-secondary": "#8fb1ff",
      "--holo-accent": "#fde6fb",
      "--holo-ink": "#130d22",
      "--text-main": "#f6e9ff",
      "--text-dim": "rgba(246, 233, 255, 0.62)",
      "--text-muted": "rgba(246, 233, 255, 0.5)",
      "--button-bg": "rgba(218, 94, 164, 0.12)",
      "--button-selected": "rgba(143, 177, 255, 0.2)",
      "--border-radius": "28px",
      "--font-hud": "\"Space Grotesk\", sans-serif",
      "--font-text": "\"Spectral\", serif",
      "--font-code": "\"IBM Plex Mono\", monospace",
      "--shell-bg-0": "#0d0a17",
      "--shell-bg-1": "#221138",
      "--shell-bg-2": "#4b1d55",
      "--shell-surface": "rgba(21, 11, 39, 0.92)",
      "--shell-surface-strong": "rgba(13, 7, 24, 0.96)",
      "--shell-border": "rgba(218, 94, 164, 0.2)",
      "--shell-border-strong": "rgba(143, 177, 255, 0.28)",
      "--shell-shadow": "0 36px 96px rgba(0, 0, 0, 0.42)",
      "--shell-radius": "32px",
      "--shell-body-backdrop":
        "radial-gradient(circle at 16% 18%, rgba(218, 94, 164, 0.16), transparent 24%), radial-gradient(circle at 86% 14%, rgba(143, 177, 255, 0.14), transparent 22%), radial-gradient(circle at 50% 112%, rgba(255, 122, 92, 0.14), transparent 34%), linear-gradient(180deg, #2f1940 0%, #180c29 48%, #090611 100%)",
      "--shell-frame-backdrop":
        "radial-gradient(circle at 16% 18%, rgba(218, 94, 164, 0.18), transparent 24%), radial-gradient(circle at 86% 14%, rgba(143, 177, 255, 0.12), transparent 22%), radial-gradient(circle at 50% 105%, rgba(255, 122, 92, 0.12), transparent 32%), linear-gradient(145deg, #27143c 0%, #170b28 48%, #090611 100%)",
      "--shell-panel-gradient":
        "linear-gradient(180deg, rgba(253, 230, 251, 0.04), rgba(13, 7, 24, 0.98))",
      "--shell-button-gradient":
        "linear-gradient(180deg, rgba(218, 94, 164, 0.16), rgba(21, 11, 39, 0.95))",
      "--shell-button-hover-gradient":
        "linear-gradient(180deg, rgba(143, 177, 255, 0.16), rgba(24, 15, 43, 0.97))",
      "--shell-button-solid-gradient":
        "linear-gradient(180deg, rgba(218, 94, 164, 0.32), rgba(108, 40, 91, 0.98))",
      "--shell-button-danger-gradient":
        "linear-gradient(180deg, rgba(255, 122, 92, 0.2), rgba(52, 21, 18, 0.95))",
      "--shell-card-gradient":
        "linear-gradient(180deg, rgba(218, 94, 164, 0.05), rgba(13, 7, 24, 0.98))",
      "--shell-scene-gradient":
        "linear-gradient(135deg, rgba(45, 19, 61, 0.94), rgba(12, 7, 22, 0.98))",
      "--shell-stage-gradient":
        "linear-gradient(180deg, rgba(28, 14, 47, 0.94), rgba(11, 7, 22, 0.98))",
      "--shell-quiet-gradient":
        "linear-gradient(180deg, rgba(27, 14, 44, 0.9), rgba(11, 7, 22, 0.96))",
    },
  },
  {
    id: "iron-ember",
    name: "Iron Ember",
    summary: "Hammered steel, furnace red, and hard-edged industrial focus.",
    preview: "linear-gradient(135deg, #121416, #d36a2a)",
    colorScheme: "dark",
    tokens: {
      "--bg-deep": "#101214",
      "--bg-glass": "rgba(18, 21, 23, 0.78)",
      "--bg-panel": "rgba(22, 26, 29, 0.9)",
      "--holo-cyan": "#d36a2a",
      "--holo-cyan-rgb": "211, 106, 42",
      "--holo-alert": "#c3402c",
      "--holo-alert-rgb": "195, 64, 44",
      "--holo-gold": "#d0d4d9",
      "--holo-gold-rgb": "208, 212, 217",
      "--holo-blue": "#86909a",
      "--holo-green": "#78866b",
      "--holo-gray": "#8a9299",
      "--holo-dark": "#090a0c",
      "--holo-primary": "#d36a2a",
      "--holo-secondary": "#d0d4d9",
      "--holo-accent": "#f4f6f7",
      "--holo-ink": "#171a1d",
      "--text-main": "#edf1f3",
      "--text-dim": "rgba(237, 241, 243, 0.64)",
      "--text-muted": "rgba(237, 241, 243, 0.5)",
      "--button-bg": "rgba(211, 106, 42, 0.12)",
      "--button-selected": "rgba(208, 212, 217, 0.16)",
      "--border-radius": "18px",
      "--font-hud": "\"Space Grotesk\", sans-serif",
      "--font-text": "\"Spectral\", serif",
      "--font-code": "\"IBM Plex Mono\", monospace",
      "--shell-bg-0": "#101214",
      "--shell-bg-1": "#1d2126",
      "--shell-bg-2": "#343b42",
      "--shell-surface": "rgba(21, 24, 27, 0.92)",
      "--shell-surface-strong": "rgba(13, 15, 17, 0.97)",
      "--shell-border": "rgba(208, 212, 217, 0.18)",
      "--shell-border-strong": "rgba(211, 106, 42, 0.28)",
      "--shell-shadow": "0 34px 88px rgba(0, 0, 0, 0.42)",
      "--shell-radius": "20px",
      "--shell-body-backdrop":
        "radial-gradient(circle at 14% 18%, rgba(211, 106, 42, 0.16), transparent 24%), radial-gradient(circle at 86% 14%, rgba(208, 212, 217, 0.12), transparent 20%), radial-gradient(circle at 50% 112%, rgba(195, 64, 44, 0.12), transparent 34%), linear-gradient(180deg, #2a2f34 0%, #171a1d 48%, #090a0c 100%)",
      "--shell-frame-backdrop":
        "radial-gradient(circle at 14% 18%, rgba(211, 106, 42, 0.18), transparent 24%), radial-gradient(circle at 86% 14%, rgba(208, 212, 217, 0.1), transparent 20%), radial-gradient(circle at 50% 105%, rgba(195, 64, 44, 0.1), transparent 32%), linear-gradient(145deg, #262b31 0%, #171a1d 48%, #090a0c 100%)",
      "--shell-panel-gradient":
        "linear-gradient(180deg, rgba(244, 246, 247, 0.04), rgba(13, 15, 17, 0.98))",
      "--shell-button-gradient":
        "linear-gradient(180deg, rgba(211, 106, 42, 0.16), rgba(21, 24, 27, 0.95))",
      "--shell-button-hover-gradient":
        "linear-gradient(180deg, rgba(208, 212, 217, 0.12), rgba(28, 32, 36, 0.97))",
      "--shell-button-solid-gradient":
        "linear-gradient(180deg, rgba(211, 106, 42, 0.42), rgba(110, 58, 26, 0.98))",
      "--shell-button-danger-gradient":
        "linear-gradient(180deg, rgba(195, 64, 44, 0.2), rgba(49, 19, 16, 0.95))",
      "--shell-card-gradient":
        "linear-gradient(180deg, rgba(244, 246, 247, 0.03), rgba(13, 15, 17, 0.98))",
      "--shell-scene-gradient":
        "linear-gradient(135deg, rgba(42, 48, 54, 0.94), rgba(13, 15, 17, 0.98))",
      "--shell-stage-gradient":
        "linear-gradient(180deg, rgba(28, 32, 36, 0.94), rgba(13, 15, 17, 0.98))",
      "--shell-quiet-gradient":
        "linear-gradient(180deg, rgba(28, 32, 36, 0.9), rgba(13, 15, 17, 0.96))",
    },
  },
  {
    id: "glacier-signal",
    name: "Glacier Signal",
    summary: "Polar blue, aurora mint, and high-clarity frozen observatory tone.",
    preview: "linear-gradient(135deg, #e5f1f7, #5d9fbe)",
    colorScheme: "light",
    tokens: {
      "--bg-deep": "#e5f1f7",
      "--bg-glass": "rgba(232, 243, 248, 0.8)",
      "--bg-panel": "rgba(247, 251, 253, 0.94)",
      "--holo-cyan": "#5d9fbe",
      "--holo-cyan-rgb": "93, 159, 190",
      "--holo-alert": "#d86f6a",
      "--holo-alert-rgb": "216, 111, 106",
      "--holo-gold": "#6f86a6",
      "--holo-gold-rgb": "111, 134, 166",
      "--holo-blue": "#85b7d0",
      "--holo-green": "#7bb5a7",
      "--holo-gray": "#a2b5c3",
      "--holo-dark": "#eef6fa",
      "--holo-primary": "#5d9fbe",
      "--holo-secondary": "#7bb5a7",
      "--holo-accent": "#ffffff",
      "--holo-ink": "#183443",
      "--text-main": "#193746",
      "--text-dim": "rgba(25, 55, 70, 0.64)",
      "--text-muted": "rgba(25, 55, 70, 0.52)",
      "--button-bg": "rgba(93, 159, 190, 0.12)",
      "--button-selected": "rgba(123, 181, 167, 0.18)",
      "--border-radius": "24px",
      "--font-hud": "\"Sora\", sans-serif",
      "--font-text": "\"Spectral\", serif",
      "--font-code": "\"IBM Plex Mono\", monospace",
      "--shell-bg-0": "#e5f1f7",
      "--shell-bg-1": "#bdd7e4",
      "--shell-bg-2": "#89b6cb",
      "--shell-surface": "rgba(247, 251, 253, 0.92)",
      "--shell-surface-strong": "rgba(252, 254, 255, 0.98)",
      "--shell-border": "rgba(71, 110, 132, 0.22)",
      "--shell-border-strong": "rgba(71, 110, 132, 0.34)",
      "--shell-shadow": "0 28px 78px rgba(41, 76, 98, 0.14)",
      "--shell-radius": "28px",
      "--shell-body-backdrop":
        "radial-gradient(circle at 14% 18%, rgba(93, 159, 190, 0.16), transparent 24%), radial-gradient(circle at 84% 14%, rgba(123, 181, 167, 0.18), transparent 22%), radial-gradient(circle at 50% 110%, rgba(216, 111, 106, 0.12), transparent 34%), linear-gradient(180deg, #eef7fb 0%, #cfe3ee 52%, #89b6cb 100%)",
      "--shell-frame-backdrop":
        "radial-gradient(circle at 14% 18%, rgba(93, 159, 190, 0.2), transparent 24%), radial-gradient(circle at 84% 14%, rgba(123, 181, 167, 0.16), transparent 22%), radial-gradient(circle at 50% 105%, rgba(216, 111, 106, 0.1), transparent 32%), linear-gradient(145deg, #ffffff 0%, #d7e8f0 48%, #9fc3d4 100%)",
      "--shell-panel-gradient":
        "linear-gradient(180deg, rgba(255, 255, 255, 0.72), rgba(245, 250, 252, 0.96))",
      "--shell-button-gradient":
        "linear-gradient(180deg, rgba(93, 159, 190, 0.14), rgba(248, 252, 254, 0.96))",
      "--shell-button-hover-gradient":
        "linear-gradient(180deg, rgba(123, 181, 167, 0.16), rgba(240, 248, 251, 0.98))",
      "--shell-button-solid-gradient":
        "linear-gradient(180deg, rgba(93, 159, 190, 0.88), rgba(74, 128, 154, 0.98))",
      "--shell-button-danger-gradient":
        "linear-gradient(180deg, rgba(216, 111, 106, 0.16), rgba(254, 239, 238, 0.96))",
      "--shell-card-gradient":
        "linear-gradient(180deg, rgba(255, 255, 255, 0.72), rgba(244, 249, 252, 0.96))",
      "--shell-scene-gradient":
        "linear-gradient(135deg, rgba(255, 255, 255, 0.88), rgba(240, 248, 251, 0.98))",
      "--shell-stage-gradient":
        "linear-gradient(180deg, rgba(255, 255, 255, 0.58), rgba(242, 249, 252, 0.92))",
      "--shell-quiet-gradient":
        "linear-gradient(180deg, rgba(255, 255, 255, 0.54), rgba(242, 249, 252, 0.9))",
    },
  },
];

const THEME_BY_ID = Object.fromEntries(THEME_REGISTRY.map((theme) => [theme.id, theme]));
const DEFAULT_THEME_ID = THEME_REGISTRY[0].id;
const ThemeContext = createContext(null);

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
  Object.entries(theme.tokens || {}).forEach(([token, value]) => {
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
  const [isReduced, setIsReduced] = useState(false);
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
