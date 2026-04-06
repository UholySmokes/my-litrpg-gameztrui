import { readFileSync, writeFileSync } from 'fs';

const file = 'src/styles/runic-shell.css';
let css = readFileSync(file, 'utf8');

// Normalize line endings for matching
const originalHasCR = css.includes('\r\n');
css = css.replace(/\r\n/g, '\n');

// ═══════════════════════════════════════════════════════════════════
// LAYER 1: DARK :root (lines 1-~1088) → Twilight Crystal anime theme
// ═══════════════════════════════════════════════════════════════════

// :root variables
css = css.replace(
  `--shell-bg-0: #080b12;
  --shell-bg-1: #0d1117;
  --shell-bg-2: #161b22;`,
  `--shell-bg-0: #0f0a1e;
  --shell-bg-1: #1a1038;
  --shell-bg-2: #2d1a5e;`
);

css = css.replace(
  `--shell-surface: rgba(13, 17, 23, 0.92);
  --shell-surface-strong: rgba(8, 11, 17, 0.96);`,
  `--shell-surface: rgba(20, 14, 38, 0.92);
  --shell-surface-strong: rgba(12, 8, 24, 0.96);`
);

css = css.replace(
  `--shell-border: rgba(95, 233, 255, 0.16);
  --shell-border-strong: rgba(95, 233, 255, 0.28);`,
  `--shell-border: rgba(168, 85, 247, 0.18);
  --shell-border-strong: rgba(236, 72, 153, 0.3);`
);

css = css.replace(
  `--shell-shadow: 0 32px 86px rgba(0, 0, 0, 0.36);`,
  `--shell-shadow: 0 30px 80px rgba(168, 85, 247, 0.18);`
);

css = css.replace(
  `--shell-noise:
    radial-gradient(circle at 16% 18%, rgba(95, 233, 255, 0.07) 0 1px, transparent 1px),
    radial-gradient(circle at 78% 26%, rgba(58, 95, 139, 0.06) 0 1px, transparent 1px);`,
  `--shell-noise:
    radial-gradient(circle at 16% 18%, rgba(168, 85, 247, 0.07) 0 1px, transparent 1px),
    radial-gradient(circle at 78% 26%, rgba(236, 72, 153, 0.06) 0 1px, transparent 1px);`
);

css = css.replace(
  `--shell-radius: 24px;`,
  `--shell-radius: 26px;`
);

// Dark body backdrop
css = css.replace(
  `radial-gradient(circle at 12% 16%, rgba(95, 233, 255, 0.11), transparent 22%),
    radial-gradient(circle at 84% 10%, rgba(80, 140, 220, 0.14), transparent 20%),
    radial-gradient(circle at 50% 105%, rgba(255, 165, 90, 0.13), transparent 34%),
    linear-gradient(180deg, #0f1620 0%, #0a0e14 48%, #060a10 100%);`,
  `radial-gradient(circle at 16% 18%, rgba(168, 85, 247, 0.18), transparent 24%),
    radial-gradient(circle at 84% 16%, rgba(236, 72, 153, 0.14), transparent 22%),
    radial-gradient(circle at 48% 110%, rgba(56, 189, 248, 0.16), transparent 34%),
    linear-gradient(180deg, #1a1040 0%, #0f0a1e 48%, #080514 100%);`
);

// Dark app-frame
css = css.replace(
  `radial-gradient(circle at 14% 16%, rgba(95, 233, 255, 0.14), transparent 24%),
    radial-gradient(circle at 86% 12%, rgba(95, 180, 255, 0.12), transparent 22%),
    radial-gradient(circle at 50% 105%, rgba(255, 165, 90, 0.09), transparent 32%),
    linear-gradient(148deg, #101a28 0%, #0c1018 48%, #080c12 100%);`,
  `radial-gradient(circle at 16% 18%, rgba(168, 85, 247, 0.2), transparent 24%),
    radial-gradient(circle at 84% 16%, rgba(236, 72, 153, 0.12), transparent 22%),
    radial-gradient(circle at 48% 108%, rgba(56, 189, 248, 0.14), transparent 32%),
    linear-gradient(145deg, #1e1248 0%, #0f0a1e 48%, #080514 100%);`
);

// Dark app-container
css = css.replace(
  `background: rgba(10, 14, 20, 0.82);
  border: 1px solid rgba(95, 233, 255, 0.1);
  box-shadow:
    inset 0 1px 0 rgba(255, 255, 255, 0.06),
    0 32px 80px rgba(0, 0, 0, 0.32);`,
  `background: rgba(15, 10, 30, 0.84);
  border: 1px solid rgba(168, 85, 247, 0.12);
  box-shadow:
    inset 0 1px 0 rgba(255, 255, 255, 0.08),
    0 32px 80px rgba(168, 85, 247, 0.14);`
);

// Dark panel gradient
css = css.replace(
  `linear-gradient(180deg, rgba(95, 233, 255, 0.04), rgba(8, 11, 17, 0.98));
  border: 1px solid rgba(95, 233, 255, 0.1);
  box-shadow:
    inset 0 1px 0 rgba(255, 255, 255, 0.05),
    0 18px 48px rgba(0, 0, 0, 0.22);
  backdrop-filter: blur(18px);`,
  `linear-gradient(180deg, rgba(168, 85, 247, 0.06), rgba(12, 8, 24, 0.98));
  border: 1px solid rgba(168, 85, 247, 0.12);
  box-shadow:
    inset 0 1px 0 rgba(255, 255, 255, 0.07),
    0 18px 48px rgba(168, 85, 247, 0.12);
  backdrop-filter: blur(20px);`
);

// Dark holo-button base
css = css.replace(
  `border-color: rgba(95, 233, 255, 0.22);
  background:
    linear-gradient(180deg, rgba(95, 233, 255, 0.08), rgba(10, 14, 20, 0.95));
  color: rgba(235, 248, 255, 0.92);
  box-shadow:
    inset 0 1px 0 rgba(255, 255, 255, 0.07),
    0 12px 28px rgba(0, 0, 0, 0.22);`,
  `border-color: rgba(168, 85, 247, 0.24);
  background:
    linear-gradient(180deg, rgba(168, 85, 247, 0.1), rgba(15, 10, 30, 0.95));
  color: rgba(240, 231, 255, 0.92);
  box-shadow:
    inset 0 1px 0 rgba(255, 255, 255, 0.08),
    0 12px 28px rgba(168, 85, 247, 0.12);`
);

// Dark holo-button:hover
css = css.replace(
  `border-color: rgba(95, 233, 255, 0.42);
  background:
    linear-gradient(180deg, rgba(95, 233, 255, 0.12), rgba(12, 18, 24, 0.97));
  color: rgba(255, 255, 255, 0.98);
  box-shadow:
    inset 0 1px 0 rgba(255, 255, 255, 0.1),
    0 16px 34px rgba(0, 0, 0, 0.26);`,
  `border-color: rgba(236, 72, 153, 0.38);
  background:
    linear-gradient(180deg, rgba(236, 72, 153, 0.12), rgba(18, 12, 32, 0.97));
  color: rgba(255, 255, 255, 0.98);
  box-shadow:
    inset 0 1px 0 rgba(255, 255, 255, 0.1),
    0 16px 34px rgba(168, 85, 247, 0.16);`
);

// Dark holo-button--solid
css = css.replace(
  `linear-gradient(180deg, rgba(95, 233, 255, 0.22), rgba(20, 45, 60, 0.98));
  border-color: rgba(95, 233, 255, 0.36);
  color: #e0f6ff;`,
  `linear-gradient(180deg, rgba(168, 85, 247, 0.28), rgba(40, 20, 80, 0.98));
  border-color: rgba(168, 85, 247, 0.38);
  color: #f0e7ff;`
);

// Dark holo-button--danger
css = css.replace(
  `linear-gradient(180deg, rgba(255, 83, 83, 0.18), rgba(35, 14, 14, 0.98));
  border-color: rgba(255, 83, 83, 0.34);`,
  `linear-gradient(180deg, rgba(244, 63, 94, 0.2), rgba(40, 14, 20, 0.98));
  border-color: rgba(244, 63, 94, 0.36);`
);

// Dark modal overlay
css = css.replace(
  `background: rgba(3, 6, 10, 0.78);`,
  `background: rgba(8, 5, 18, 0.8);`
);

// Entry shell backdrop
css = css.replace(
  `background:
    radial-gradient(circle at 50% 50%, rgba(95, 233, 255, 0.06), transparent 44%),
    radial-gradient(circle at 18% 24%, rgba(80, 140, 220, 0.06), transparent 22%),
    radial-gradient(circle at 82% 78%, rgba(255, 165, 90, 0.04), transparent 20%);`,
  `background:
    radial-gradient(circle at 50% 50%, rgba(168, 85, 247, 0.08), transparent 44%),
    radial-gradient(circle at 18% 24%, rgba(236, 72, 153, 0.06), transparent 22%),
    radial-gradient(circle at 82% 78%, rgba(56, 189, 248, 0.05), transparent 20%);`
);

// Entry shell hero gradient
css = css.replace(
  `linear-gradient(180deg, rgba(95, 233, 255, 0.04), rgba(8, 11, 17, 0.98));`,
  `linear-gradient(180deg, rgba(168, 85, 247, 0.06), rgba(12, 8, 24, 0.98));`
);

// Entry shell hero border
css = css.replace(
  `border: 1px solid rgba(95, 233, 255, 0.1);`,
  `border: 1px solid rgba(168, 85, 247, 0.12);`
);

// Entry shell eyebrow
css = css.replace(
  `color: rgba(95, 233, 255, 0.72);`,
  `color: rgba(168, 85, 247, 0.78);`
);

// Entry shell title gradient
css = css.replace(
  `background: linear-gradient(135deg, #5fe9ff, #a8c8ff);`,
  `background: linear-gradient(135deg, #a855f7, #ec4899);`
);

// Entry shell panel + status
css = css.replace(
  `border: 1px solid rgba(95, 233, 255, 0.08);
  box-shadow: 0 14px 38px rgba(0, 0, 0, 0.18);`,
  `border: 1px solid rgba(168, 85, 247, 0.1);
  box-shadow: 0 14px 38px rgba(168, 85, 247, 0.1);`
);

// Entry shell description
css = css.replace(
  `color: rgba(235, 248, 255, 0.62);`,
  `color: rgba(240, 231, 255, 0.62);`
);

// Entry shell footer
css = css.replace(
  `color: rgba(235, 248, 255, 0.42);`,
  `color: rgba(240, 231, 255, 0.44);`
);

// Character hub base colors
css = css.replace(
  `color: rgba(235, 248, 255, 0.92);`,
  `color: rgba(240, 231, 255, 0.92);`
);

// Character hub hero card
css = css.replace(
  `linear-gradient(145deg, rgba(95, 233, 255, 0.04), rgba(8, 11, 17, 0.98));
  border: 1px solid rgba(95, 233, 255, 0.08);`,
  `linear-gradient(145deg, rgba(168, 85, 247, 0.06), rgba(12, 8, 24, 0.98));
  border: 1px solid rgba(168, 85, 247, 0.1);`
);

// Character hub account
css = css.replace(
  `background: rgba(12, 16, 22, 0.72);
  border: 1px solid rgba(95, 233, 255, 0.08);
  color: rgba(235, 248, 255, 0.55);`,
  `background: rgba(15, 10, 30, 0.72);
  border: 1px solid rgba(168, 85, 247, 0.1);
  color: rgba(240, 231, 255, 0.55);`
);

// Character hub trait cards
css = css.replace(
  `background: rgba(10, 15, 22, 0.78);
  border: 1px solid rgba(95, 233, 255, 0.08);`,
  `background: rgba(15, 10, 30, 0.78);
  border: 1px solid rgba(168, 85, 247, 0.1);`
);

// Character hub metric text
css = css.replace(
  `color: rgba(235, 248, 255, 0.5);`,
  `color: rgba(240, 231, 255, 0.5);`
);

// Color variants - Amethyst: keep mostly as-is since it's already violet-ish
// Ember variant
css = css.replace(
  `border-color: rgba(255, 140, 50, 0.6);
  box-shadow: 0 0 22px rgba(255, 100, 30, 0.14);`,
  `border-color: rgba(249, 115, 22, 0.55);
  box-shadow: 0 0 22px rgba(249, 115, 22, 0.16);`
);

// Verdant variant
css = css.replace(
  `border-color: rgba(50, 220, 150, 0.55);
  box-shadow: 0 0 22px rgba(40, 200, 130, 0.12);`,
  `border-color: rgba(52, 211, 153, 0.5);
  box-shadow: 0 0 22px rgba(52, 211, 153, 0.14);`
);

// Adventure shell header pills
css = css.replace(
  `border: 1px solid rgba(95, 233, 255, 0.14);
  border-radius: 22px;
  background: rgba(10, 15, 22, 0.72);
  color: rgba(235, 248, 255, 0.58);`,
  `border: 1px solid rgba(168, 85, 247, 0.14);
  border-radius: 22px;
  background: rgba(15, 10, 30, 0.72);
  color: rgba(240, 231, 255, 0.58);`
);

// Adventure pill active
css = css.replace(
  `background: rgba(95, 233, 255, 0.14);
  border-color: rgba(95, 233, 255, 0.3);
  color: rgba(235, 248, 255, 0.92);`,
  `background: rgba(168, 85, 247, 0.14);
  border-color: rgba(168, 85, 247, 0.3);
  color: rgba(240, 231, 255, 0.92);`
);

// Creation flow step pill
css = css.replace(
  `border: 1px solid rgba(95, 233, 255, 0.08);
  background: rgba(8, 11, 17, 0.72);
  color: rgba(235, 248, 255, 0.42);`,
  `border: 1px solid rgba(168, 85, 247, 0.1);
  background: rgba(12, 8, 24, 0.72);
  color: rgba(240, 231, 255, 0.42);`
);

// Creation flow step current
css = css.replace(
  `border-color: rgba(95, 233, 255, 0.28);
  background: rgba(95, 233, 255, 0.08);
  color: rgba(235, 248, 255, 0.88);`,
  `border-color: rgba(168, 85, 247, 0.28);
  background: rgba(168, 85, 247, 0.1);
  color: rgba(240, 231, 255, 0.88);`
);

// Creation flow step visited
css = css.replace(
  `border-color: rgba(95, 233, 255, 0.18);
  color: rgba(235, 248, 255, 0.62);`,
  `border-color: rgba(168, 85, 247, 0.18);
  color: rgba(240, 231, 255, 0.62);`
);

// Error/notice text
css = css.replace(
  `color: rgba(255, 100, 100, 0.92);`,
  `color: rgba(244, 63, 94, 0.92);`
);
css = css.replace(
  `background: rgba(255, 80, 80, 0.08);
  border: 1px solid rgba(255, 80, 80, 0.18);
  border-radius: 14px;`,
  `background: rgba(244, 63, 94, 0.08);
  border: 1px solid rgba(244, 63, 94, 0.18);
  border-radius: 14px;`
);
css = css.replace(
  `background: rgba(95, 233, 255, 0.06);
  border: 1px solid rgba(95, 233, 255, 0.14);`,
  `background: rgba(56, 189, 248, 0.06);
  border: 1px solid rgba(168, 85, 247, 0.14);`
);

// Auth card close
css = css.replace(
  `color: rgba(235, 248, 255, 0.42);`,
  `color: rgba(240, 231, 255, 0.44);`
);
css = css.replace(
  `color: rgba(235, 248, 255, 0.72);`,
  `color: rgba(240, 231, 255, 0.72);`
);

// Save reset gate
css = css.replace(
  `linear-gradient(180deg, rgba(95, 233, 255, 0.04), rgba(8, 11, 17, 0.98));
  border: 1px solid rgba(95, 233, 255, 0.08);
  box-shadow: 0 18px 48px rgba(0, 0, 0, 0.22);`,
  `linear-gradient(180deg, rgba(168, 85, 247, 0.06), rgba(12, 8, 24, 0.98));
  border: 1px solid rgba(168, 85, 247, 0.1);
  box-shadow: 0 18px 48px rgba(168, 85, 247, 0.12);`
);

// Save reset gate eyebrow/text  
css = css.replace(
  `color: rgba(95, 233, 255, 0.68);`,
  `color: rgba(168, 85, 247, 0.72);`
);
css = css.replace(
  `color: rgba(235, 248, 255, 0.58);`,
  `color: rgba(240, 231, 255, 0.58);`
);

// System failure section
css = css.replace(
  `background: rgba(255, 40, 40, 0.06);
  border: 1px solid rgba(255, 40, 40, 0.22);`,
  `background: rgba(244, 63, 94, 0.06);
  border: 1px solid rgba(244, 63, 94, 0.22);`
);
css = css.replace(
  `color: rgba(255, 80, 80, 0.82);`,
  `color: rgba(244, 63, 94, 0.85);`
);

// ═══════════════════════════════════════════════════════════════════
// LAYER 2: WARM PARCHMENT :root (~1092+) → Sakura Dawn
// ═══════════════════════════════════════════════════════════════════

css = css.replace(
  `--shell-bg-0: #17120d;
  --shell-bg-1: #241b14;
  --shell-bg-2: #3a2c20;
  --shell-surface: rgba(247, 237, 214, 0.9);
  --shell-surface-strong: rgba(255, 248, 235, 0.95);
  --shell-border: rgba(102, 77, 47, 0.28);
  --shell-border-strong: rgba(102, 77, 47, 0.45);
  --shell-shadow: 0 24px 70px rgba(10, 7, 5, 0.28);
  --shell-noise:
    radial-gradient(circle at 20% 20%, rgba(120, 96, 64, 0.06) 0 1px, transparent 1px),
    radial-gradient(circle at 80% 30%, rgba(77, 57, 35, 0.04) 0 1px, transparent 1px);`,
  `--shell-bg-0: #fff5f0;
  --shell-bg-1: #ffe4f0;
  --shell-bg-2: #ec4899;
  --shell-surface: rgba(255, 252, 250, 0.94);
  --shell-surface-strong: rgba(255, 254, 253, 0.98);
  --shell-border: rgba(236, 72, 153, 0.22);
  --shell-border-strong: rgba(236, 72, 153, 0.38);
  --shell-shadow: 0 28px 78px rgba(236, 72, 153, 0.14);
  --shell-noise:
    radial-gradient(circle at 20% 20%, rgba(236, 72, 153, 0.06) 0 1px, transparent 1px),
    radial-gradient(circle at 80% 30%, rgba(168, 85, 247, 0.04) 0 1px, transparent 1px);`
);

// Warm body gradient
css = css.replace(
  `radial-gradient(circle at 12% 18%, rgba(255, 220, 167, 0.12), transparent 22%),
    radial-gradient(circle at 84% 10%, rgba(102, 77, 47, 0.16), transparent 20%),
    linear-gradient(180deg, #efe4cd 0%, #d8c3a2 48%, #a98863 100%);`,
  `radial-gradient(circle at 12% 18%, rgba(236, 72, 153, 0.16), transparent 22%),
    radial-gradient(circle at 84% 10%, rgba(245, 158, 11, 0.14), transparent 20%),
    linear-gradient(180deg, #fff5f0 0%, #ffd6e8 52%, #f9a8d4 100%);`
);

// Warm app-frame
css = css.replace(
  `radial-gradient(circle at 14% 16%, rgba(255, 226, 177, 0.26), transparent 24%),
    radial-gradient(circle at 84% 12%, rgba(124, 88, 48, 0.18), transparent 22%),
    linear-gradient(160deg, #f6eddc 0%, #dbc7aa 48%, #a37c56 100%);`,
  `radial-gradient(circle at 14% 16%, rgba(236, 72, 153, 0.18), transparent 24%),
    radial-gradient(circle at 84% 12%, rgba(168, 85, 247, 0.14), transparent 22%),
    linear-gradient(160deg, #ffffff 0%, #ffe4f0 46%, #f9a8d4 100%);`
);

// Warm app-container
css = css.replace(
  `background: rgba(248, 241, 227, 0.88);
  border: 1px solid rgba(104, 73, 41, 0.18);
  box-shadow:
    inset 0 1px 0 rgba(255, 255, 255, 0.45),
    0 20px 40px rgba(50, 31, 12, 0.18);`,
  `background: rgba(255, 250, 248, 0.9);
  border: 1px solid rgba(236, 72, 153, 0.16);
  box-shadow:
    inset 0 1px 0 rgba(255, 255, 255, 0.6),
    0 20px 40px rgba(236, 72, 153, 0.1);`
);

// Warm panels
css = css.replace(
  `linear-gradient(180deg, rgba(255, 252, 246, 0.98), rgba(239, 229, 209, 0.96));
  border: 1px solid rgba(104, 73, 41, 0.16);
  box-shadow:
    inset 0 1px 0 rgba(255, 255, 255, 0.6),
    0 20px 36px rgba(55, 33, 13, 0.12);
  backdrop-filter: blur(12px);`,
  `linear-gradient(180deg, rgba(255, 255, 255, 0.98), rgba(255, 245, 248, 0.96));
  border: 1px solid rgba(236, 72, 153, 0.14);
  box-shadow:
    inset 0 1px 0 rgba(255, 255, 255, 0.7),
    0 20px 36px rgba(236, 72, 153, 0.08);
  backdrop-filter: blur(14px);`
);

// Warm holo-button
css = css.replace(
  `border-color: rgba(85, 60, 34, 0.28);
  background:
    linear-gradient(180deg, rgba(255, 247, 232, 0.96), rgba(219, 198, 166, 0.95));
  color: #23170f;
  box-shadow:
    inset 0 1px 0 rgba(255, 255, 255, 0.7),
    0 10px 22px rgba(75, 50, 25, 0.12);`,
  `border-color: rgba(236, 72, 153, 0.24);
  background:
    linear-gradient(180deg, rgba(255, 252, 254, 0.98), rgba(255, 228, 240, 0.96));
  color: #4a1942;
  box-shadow:
    inset 0 1px 0 rgba(255, 255, 255, 0.8),
    0 10px 22px rgba(236, 72, 153, 0.08);`
);

// Warm button hover
css = css.replace(
  `border-color: rgba(85, 60, 34, 0.45);
  color: #1b120b;
  background:
    linear-gradient(180deg, rgba(255, 250, 240, 0.98), rgba(233, 212, 178, 0.96));
  box-shadow:
    inset 0 1px 0 rgba(255, 255, 255, 0.82),
    0 14px 26px rgba(70, 45, 18, 0.16);`,
  `border-color: rgba(236, 72, 153, 0.4);
  color: #3a1236;
  background:
    linear-gradient(180deg, rgba(255, 254, 255, 1), rgba(255, 220, 238, 0.98));
  box-shadow:
    inset 0 1px 0 rgba(255, 255, 255, 0.9),
    0 14px 26px rgba(236, 72, 153, 0.12);`
);

// Warm button solid
css = css.replace(
  `linear-gradient(180deg, rgba(82, 58, 36, 0.96), rgba(43, 28, 17, 0.98));
  border-color: rgba(52, 35, 21, 0.72);
  color: #fff6e9;`,
  `linear-gradient(180deg, rgba(236, 72, 153, 0.92), rgba(180, 40, 110, 0.98));
  border-color: rgba(190, 50, 120, 0.72);
  color: #fff0f5;`
);

// Warm button danger
css = css.replace(
  `linear-gradient(180deg, rgba(154, 83, 55, 0.92), rgba(100, 48, 33, 0.98));
  border-color: rgba(123, 60, 38, 0.7);
  color: #fff1ea;`,
  `linear-gradient(180deg, rgba(239, 68, 68, 0.9), rgba(180, 48, 48, 0.98));
  border-color: rgba(200, 56, 56, 0.7);
  color: #fff0f0;`
);

// Warm adventure shell color
css = css.replace(`color: #25170f;`, `color: #4a1942;`);

// Warm topbar
css = css.replace(
  `linear-gradient(180deg, rgba(255, 252, 247, 0.98), rgba(234, 221, 197, 0.96));
  border: 1px solid rgba(102, 77, 47, 0.18);`,
  `linear-gradient(180deg, rgba(255, 255, 255, 0.98), rgba(255, 240, 248, 0.96));
  border: 1px solid rgba(236, 72, 153, 0.16);`
);

// Warm scene card
css = css.replace(
  `linear-gradient(145deg, rgba(255, 247, 233, 0.98), rgba(230, 212, 181, 0.95));
  border: 1px solid rgba(102, 77, 47, 0.18);`,
  `linear-gradient(145deg, rgba(255, 254, 255, 0.98), rgba(255, 235, 245, 0.96));
  border: 1px solid rgba(236, 72, 153, 0.16);`
);

// Warm battle stage
css = css.replace(
  `linear-gradient(180deg, rgba(255, 251, 244, 0.98), rgba(235, 222, 197, 0.96));
  border: 1px solid rgba(102, 77, 47, 0.16);`,
  `linear-gradient(180deg, rgba(255, 254, 255, 0.98), rgba(255, 238, 248, 0.96));
  border: 1px solid rgba(236, 72, 153, 0.14);`
);

// Warm battle combat
css = css.replace(
  `linear-gradient(180deg, rgba(252, 246, 235, 0.98), rgba(226, 205, 175, 0.96));`,
  `linear-gradient(180deg, rgba(255, 248, 252, 0.98), rgba(248, 218, 236, 0.96));`
);

// Warm meterfill
css = css.replace(
  `background: linear-gradient(90deg, #9d5e3f, #d18855);`,
  `background: linear-gradient(90deg, #ec4899, #f59e0b);`
);

// Warm drawer tab active
css = css.replace(
  `background: linear-gradient(180deg, rgba(77, 56, 34, 0.98), rgba(44, 29, 18, 0.98));
  color: #fff5e7;
  border-color: rgba(52, 35, 21, 0.8);`,
  `background: linear-gradient(180deg, rgba(236, 72, 153, 0.95), rgba(180, 40, 110, 0.98));
  color: #fff0f5;
  border-color: rgba(190, 50, 120, 0.8);`
);

// Warm lane-chip active
css = css.replace(
  `background: rgba(77, 56, 34, 0.94);
  color: #fff4e7;`,
  `background: rgba(236, 72, 153, 0.92);
  color: #fff0f5;`
);

// Warm meterbar bg
css = css.replace(
  `background: rgba(93, 67, 41, 0.14);`,
  `background: rgba(236, 72, 153, 0.12);`
);

// Bulk warm color replacements
css = css.replaceAll(`color: #7c5e39;`, `color: #c026d3;`);
css = css.replaceAll(`color: #24160f;`, `color: #4a1942;`);
css = css.replaceAll(`color: #261911;`, `color: #4a1942;`);
css = css.replaceAll(`color: #2b1c11;`, `color: #4a1942;`);
css = css.replaceAll(`rgba(56, 39, 23, 0.72)`, `rgba(74, 25, 66, 0.68)`);
css = css.replaceAll(`rgba(57, 40, 22, 0.76)`, `rgba(74, 25, 66, 0.72)`);
css = css.replaceAll(`rgba(57, 40, 22, 0.74)`, `rgba(74, 25, 66, 0.7)`);
css = css.replaceAll(`rgba(57, 40, 22, 0.72)`, `rgba(74, 25, 66, 0.68)`);
css = css.replaceAll(`rgba(62, 43, 24, 0.72)`, `rgba(74, 25, 66, 0.68)`);
css = css.replaceAll(`rgba(74, 54, 33, 0.62)`, `rgba(74, 25, 66, 0.56)`);
css = css.replaceAll(`rgba(74, 54, 33, 0.72)`, `rgba(74, 25, 66, 0.68)`);
css = css.replaceAll(`rgba(102, 77, 47, 0.12)`, `rgba(236, 72, 153, 0.1)`);
css = css.replaceAll(`rgba(102, 77, 47, 0.14)`, `rgba(236, 72, 153, 0.12)`);
css = css.replaceAll(`rgba(102, 77, 47, 0.16)`, `rgba(236, 72, 153, 0.14)`);
css = css.replaceAll(`rgba(102, 77, 47, 0.18)`, `rgba(236, 72, 153, 0.16)`);
css = css.replaceAll(`rgba(255, 251, 243, 0.9)`, `rgba(255, 250, 252, 0.92)`);
css = css.replaceAll(`rgba(255, 250, 243, 0.92)`, `rgba(255, 248, 252, 0.94)`);
css = css.replaceAll(`rgba(255, 249, 241, 0.92)`, `rgba(255, 248, 252, 0.94)`);
css = css.replaceAll(`rgba(250, 244, 232, 0.92)`, `rgba(255, 246, 252, 0.94)`);
css = css.replaceAll(`rgba(255, 250, 243, 0.88)`, `rgba(255, 248, 252, 0.9)`);
css = css.replaceAll(`rgba(112, 73, 39, 0.32)`, `rgba(236, 72, 153, 0.3)`);
css = css.replaceAll(`rgba(92, 56, 25, 0.6)`, `rgba(236, 72, 153, 0.5)`);
css = css.replaceAll(`rgba(92, 56, 25, 0.2)`, `rgba(236, 72, 153, 0.16)`);
css = css.replaceAll(`rgba(51, 35, 20, 0.72)`, `rgba(74, 25, 66, 0.68)`);
css = css.replaceAll(`color: #23170f;`, `color: #4a1942;`);

// ═══════════════════════════════════════════════════════════════════
// LAYER 3: FROST/TEAL :root → Frozen Echo (ice-blue/lavender)
// ═══════════════════════════════════════════════════════════════════

css = css.replace(
  `--shell-bg-0: #dbe6e8;
  --shell-bg-1: #b9ccd2;
  --shell-bg-2: #91aab2;
  --shell-surface: rgba(242, 247, 247, 0.9);
  --shell-surface-strong: rgba(250, 252, 252, 0.96);
  --shell-border: rgba(66, 92, 99, 0.24);
  --shell-border-strong: rgba(66, 92, 99, 0.38);
  --shell-shadow: 0 28px 72px rgba(33, 51, 58, 0.14);
  --shell-noise:
    radial-gradient(circle at 16% 18%, rgba(255, 255, 255, 0.18) 0 1px, transparent 1px),
    radial-gradient(circle at 78% 26%, rgba(77, 109, 117, 0.08) 0 1px, transparent 1px);`,
  `--shell-bg-0: #f0f4ff;
  --shell-bg-1: #d4e0ff;
  --shell-bg-2: #93b8ff;
  --shell-surface: rgba(250, 252, 255, 0.94);
  --shell-surface-strong: rgba(254, 254, 255, 0.98);
  --shell-border: rgba(56, 189, 248, 0.24);
  --shell-border-strong: rgba(168, 85, 247, 0.3);
  --shell-shadow: 0 28px 78px rgba(56, 189, 248, 0.12);
  --shell-noise:
    radial-gradient(circle at 16% 18%, rgba(56, 189, 248, 0.08) 0 1px, transparent 1px),
    radial-gradient(circle at 78% 26%, rgba(168, 85, 247, 0.06) 0 1px, transparent 1px);`
);

// Frost body/frame
css = css.replace(
  `radial-gradient(circle at 12% 15%, rgba(116, 182, 186, 0.18), transparent 22%),
    radial-gradient(circle at 85% 10%, rgba(255, 255, 255, 0.42), transparent 20%),
    radial-gradient(circle at 50% 100%, rgba(218, 144, 102, 0.18), transparent 34%),
    linear-gradient(180deg, #eef5f5 0%, #d7e5e8 42%, #afc3c8 100%);`,
  `radial-gradient(circle at 12% 15%, rgba(56, 189, 248, 0.18), transparent 22%),
    radial-gradient(circle at 85% 10%, rgba(255, 255, 255, 0.42), transparent 20%),
    radial-gradient(circle at 50% 100%, rgba(168, 85, 247, 0.14), transparent 34%),
    linear-gradient(180deg, #f0f4ff 0%, #d4e0ff 42%, #a5c4ff 100%);`
);

// Frost app-container
css = css.replace(
  `background: rgba(238, 245, 245, 0.82);
  border: 1px solid rgba(66, 92, 99, 0.16);
  box-shadow:
    inset 0 1px 0 rgba(255, 255, 255, 0.62),
    0 28px 64px rgba(33, 51, 58, 0.12);`,
  `background: rgba(245, 248, 255, 0.86);
  border: 1px solid rgba(56, 189, 248, 0.16);
  box-shadow:
    inset 0 1px 0 rgba(255, 255, 255, 0.7),
    0 28px 64px rgba(56, 189, 248, 0.08);`
);

// Frost panels
css = css.replace(
  `linear-gradient(180deg, rgba(252, 254, 254, 0.96), rgba(232, 241, 242, 0.94));
  border: 1px solid rgba(66, 92, 99, 0.16);
  box-shadow:
    inset 0 1px 0 rgba(255, 255, 255, 0.78),
    0 18px 38px rgba(40, 60, 66, 0.1);`,
  `linear-gradient(180deg, rgba(255, 255, 255, 0.97), rgba(240, 246, 255, 0.95));
  border: 1px solid rgba(56, 189, 248, 0.16);
  box-shadow:
    inset 0 1px 0 rgba(255, 255, 255, 0.82),
    0 18px 38px rgba(56, 189, 248, 0.08);`
);

// Frost holo-button
css = css.replace(
  `border-color: rgba(49, 108, 112, 0.28);
  background:
    linear-gradient(180deg, rgba(245, 251, 251, 0.98), rgba(205, 226, 229, 0.94));
  color: #163137;
  box-shadow:
    inset 0 1px 0 rgba(255, 255, 255, 0.82),
    0 10px 20px rgba(41, 66, 72, 0.1);`,
  `border-color: rgba(56, 189, 248, 0.24);
  background:
    linear-gradient(180deg, rgba(252, 254, 255, 0.98), rgba(224, 240, 255, 0.95));
  color: #0f1b3d;
  box-shadow:
    inset 0 1px 0 rgba(255, 255, 255, 0.86),
    0 10px 20px rgba(56, 189, 248, 0.08);`
);

// Frost button hover
css = css.replace(
  `border-color: rgba(49, 108, 112, 0.46);
  background:
    linear-gradient(180deg, rgba(252, 254, 254, 1), rgba(194, 220, 224, 0.96));
  color: #10262b;`,
  `border-color: rgba(168, 85, 247, 0.36);
  background:
    linear-gradient(180deg, rgba(255, 255, 255, 1), rgba(232, 244, 255, 0.98));
  color: #0c1530;`
);

// Frost button solid
css = css.replace(
  `linear-gradient(180deg, rgba(41, 97, 102, 0.96), rgba(25, 58, 61, 0.98));
  border-color: rgba(29, 68, 71, 0.72);
  color: #eef8f8;`,
  `linear-gradient(180deg, rgba(56, 189, 248, 0.92), rgba(30, 140, 200, 0.98));
  border-color: rgba(38, 160, 220, 0.72);
  color: #f0f8ff;`
);

// Frost button danger
css = css.replace(
  `linear-gradient(180deg, rgba(180, 102, 72, 0.92), rgba(122, 64, 44, 0.98));
  border-color: rgba(143, 78, 53, 0.62);`,
  `linear-gradient(180deg, rgba(244, 63, 94, 0.9), rgba(180, 48, 48, 0.98));
  border-color: rgba(200, 56, 56, 0.62);`
);

// Frost character hub color
css = css.replace(`color: #173036;`, `color: #0f1b3d;`);

// Frost hero bg
css = css.replace(
  `linear-gradient(145deg, rgba(252, 254, 254, 0.96), rgba(222, 236, 238, 0.92));
  border: 1px solid rgba(66, 92, 99, 0.16);`,
  `linear-gradient(145deg, rgba(255, 255, 255, 0.97), rgba(232, 244, 255, 0.94));
  border: 1px solid rgba(56, 189, 248, 0.16);`
);

// Frost titles
css = css.replaceAll(`color: #19353a;`, `color: #0f1b3d;`);

// Frost body text
css = css.replaceAll(`rgba(35, 62, 68, 0.72)`, `rgba(15, 27, 61, 0.66)`);
css = css.replaceAll(`rgba(35, 62, 68, 0.62)`, `rgba(15, 27, 61, 0.56)`);

// Frost borders
css = css.replaceAll(`rgba(66, 92, 99, 0.12)`, `rgba(56, 189, 248, 0.1)`);
css = css.replaceAll(`rgba(66, 92, 99, 0.14)`, `rgba(56, 189, 248, 0.12)`);
css = css.replaceAll(`rgba(66, 92, 99, 0.16)`, `rgba(56, 189, 248, 0.14)`);
css = css.replaceAll(`rgba(66, 92, 99, 0.18)`, `rgba(56, 189, 248, 0.16)`);

// Frost cards/bg
css = css.replaceAll(`rgba(247, 251, 251, 0.9)`, `rgba(248, 252, 255, 0.94)`);
css = css.replaceAll(`rgba(245, 250, 250, 0.84)`, `rgba(245, 250, 255, 0.88)`);

// Frost kicker
css = css.replaceAll(`rgba(35, 96, 100, 0.74)`, `rgba(56, 120, 248, 0.72)`);

// Frost path step
css = css.replace(
  `background: rgba(41, 97, 102, 0.12);
  color: #1a5a60;`,
  `background: rgba(56, 189, 248, 0.14);
  color: #1e6cf7;`
);

// Frost topbar/scene/battle
css = css.replace(
  `linear-gradient(160deg, rgba(252, 254, 254, 0.98), rgba(225, 236, 238, 0.94));
  border-color: rgba(66, 92, 99, 0.14);`,
  `linear-gradient(160deg, rgba(255, 255, 255, 0.98), rgba(236, 246, 255, 0.95));
  border-color: rgba(56, 189, 248, 0.12);`
);

// Frost meterfill
css = css.replace(
  `background: linear-gradient(90deg, #2f8185, #d18c60);`,
  `background: linear-gradient(90deg, #38bdf8, #a855f7);`
);

// ═══════════════════════════════════════════════════════════════════
// LAYER 5: Portal Cards + Dialog Tones → anime energy
// ═══════════════════════════════════════════════════════════════════

css = css.replace(
  `border: 1px solid rgba(95, 233, 255, 0.35);
  border-radius: 14px;
  background:
    linear-gradient(160deg, rgba(9, 32, 48, 0.85), rgba(7, 13, 27, 0.88)),
    rgba(5, 10, 16, 0.8);
  color: #d8f8ff;`,
  `border: 1px solid rgba(168, 85, 247, 0.35);
  border-radius: 18px;
  background:
    linear-gradient(160deg, rgba(20, 14, 38, 0.88), rgba(12, 8, 24, 0.92)),
    rgba(8, 5, 18, 0.85);
  color: #f0e7ff;`
);

css = css.replace(
  `border-color: rgba(138, 242, 255, 0.62);
  box-shadow: 0 0 24px rgba(66, 212, 255, 0.18);`,
  `border-color: rgba(236, 72, 153, 0.55);
  box-shadow: 0 0 28px rgba(168, 85, 247, 0.22);`
);

css = css.replace(
  `color: rgba(159, 241, 255, 0.8);`,
  `color: rgba(168, 85, 247, 0.82);`
);

css = css.replace(
  `color: rgba(210, 241, 255, 0.78);`,
  `color: rgba(240, 231, 255, 0.75);`
);

// Dialog tones
css = css.replace(
  `0 0 28px rgba(132, 94, 247, 0.18)`,
  `0 0 32px rgba(168, 85, 247, 0.22)`
);

css = css.replace(
  `0 0 28px rgba(32, 201, 151, 0.18)`,
  `0 0 32px rgba(52, 211, 153, 0.22)`
);

css = css.replace(
  `0 0 28px rgba(123, 104, 238, 0.16)`,
  `0 0 32px rgba(139, 92, 246, 0.22)`
);

// ── Restore original line endings ──
if (originalHasCR) {
  css = css.replace(/\n/g, '\r\n');
}

writeFileSync(file, css, 'utf8');
console.log('All runic-shell.css layers converted to anime theme!');
console.log(`File size: ${css.length}`);
