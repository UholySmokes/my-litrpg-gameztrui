// =================================================================
// THEME CONTEXT - Provides 6 different themes/layouts
// =================================================================

import React, { createContext, useContext, useState, useCallback } from 'react';

// Theme 1: Cyber Holo (Original/Default)
const THEME_CYBER_HOLO = {
  id: 1,
  name: 'Cyber Holo',
  colors: {
    bgDeep: '#050a10',
    bgPanel: 'rgba(5, 16, 26, 0.8)',
    primary: '#00f3ff',
    secondary: '#ffd700',
    alert: '#ff3333',
    textMain: '#e0e0e0',
    textDim: '#808080',
    border: '#00f3ff',
    buttonBg: 'rgba(0, 243, 255, 0.05)',
    buttonSelected: 'rgba(255, 215, 0, 0.15)',
    glow: 'rgba(0, 243, 255, 0.5)'
  },
  layout: 'standard',
  borderRadius: '4px',
  fontFamily: 'var(--font-text, sans-serif)',
  hudFont: 'var(--font-hud, monospace)'
};

// Theme 2: Dark Fantasy
const THEME_DARK_FANTASY = {
  id: 2,
  name: 'Dark Fantasy',
  colors: {
    bgDeep: '#1a0a0a',
    bgPanel: 'rgba(40, 15, 15, 0.9)',
    primary: '#c9a227',
    secondary: '#8b0000',
    alert: '#ff4444',
    textMain: '#d4c4a8',
    textDim: '#8b7355',
    border: '#5c4033',
    buttonBg: 'rgba(201, 162, 39, 0.1)',
    buttonSelected: 'rgba(139, 0, 0, 0.3)',
    glow: 'rgba(201, 162, 39, 0.4)'
  },
  layout: 'ornate',
  borderRadius: '2px',
  fontFamily: "'Cinzel', serif",
  hudFont: "'Cinzel', serif"
};

// Theme 3: Neon Synthwave
const THEME_NEON_SYNTHWAVE = {
  id: 3,
  name: 'Neon Synthwave',
  colors: {
    bgDeep: '#0d0221',
    bgPanel: 'rgba(13, 2, 33, 0.85)',
    primary: '#ff00ff',
    secondary: '#00ffff',
    alert: '#ff0055',
    textMain: '#ffffff',
    textDim: '#b366ff',
    border: '#ff00ff',
    buttonBg: 'rgba(255, 0, 255, 0.1)',
    buttonSelected: 'rgba(0, 255, 255, 0.2)',
    glow: 'rgba(255, 0, 255, 0.6)'
  },
  layout: 'angular',
  borderRadius: '0px',
  fontFamily: "'Orbitron', sans-serif",
  hudFont: "'Orbitron', sans-serif"
};

// Theme 4: Nature Grove
const THEME_NATURE_GROVE = {
  id: 4,
  name: 'Nature Grove',
  colors: {
    bgDeep: '#0a1f0a',
    bgPanel: 'rgba(15, 40, 15, 0.85)',
    primary: '#7cfc00',
    secondary: '#ffd700',
    alert: '#ff6b35',
    textMain: '#c8e6c9',
    textDim: '#6b8e6b',
    border: '#4a7c4a',
    buttonBg: 'rgba(124, 252, 0, 0.1)',
    buttonSelected: 'rgba(255, 215, 0, 0.2)',
    glow: 'rgba(124, 252, 0, 0.4)'
  },
  layout: 'organic',
  borderRadius: '12px',
  fontFamily: "'Quicksand', sans-serif",
  hudFont: "'Quicksand', sans-serif"
};

// Theme 5: Minimalist Light
const THEME_MINIMALIST_LIGHT = {
  id: 5,
  name: 'Minimalist Light',
  colors: {
    bgDeep: '#f5f5f5',
    bgPanel: 'rgba(255, 255, 255, 0.95)',
    primary: '#2196f3',
    secondary: '#ff9800',
    alert: '#f44336',
    textMain: '#212121',
    textDim: '#757575',
    border: '#e0e0e0',
    buttonBg: 'rgba(33, 150, 243, 0.05)',
    buttonSelected: 'rgba(255, 152, 0, 0.15)',
    glow: 'rgba(33, 150, 243, 0.2)'
  },
  layout: 'clean',
  borderRadius: '8px',
  fontFamily: "'Inter', sans-serif",
  hudFont: "'Inter', sans-serif"
};

// Theme 6: Cosmic Void
const THEME_COSMIC_VOID = {
  id: 6,
  name: 'Cosmic Void',
  colors: {
    bgDeep: '#000011',
    bgPanel: 'rgba(10, 10, 30, 0.9)',
    primary: '#9d4edd',
    secondary: '#f72585',
    alert: '#ff006e',
    textMain: '#e0e0ff',
    textDim: '#7b7bad',
    border: '#4361ee',
    buttonBg: 'rgba(157, 78, 221, 0.1)',
    buttonSelected: 'rgba(247, 37, 133, 0.2)',
    glow: 'rgba(157, 78, 221, 0.5)'
  },
  layout: 'floating',
  borderRadius: '16px',
  fontFamily: "'Space Grotesk', sans-serif",
  hudFont: "'Space Mono', monospace"
};

const THEMES = {
  1: THEME_CYBER_HOLO,
  2: THEME_DARK_FANTASY,
  3: THEME_NEON_SYNTHWAVE,
  4: THEME_NATURE_GROVE,
  5: THEME_MINIMALIST_LIGHT,
  6: THEME_COSMIC_VOID,
  7: {
    id: 7, name: 'Dark Grimoire', mobileThemeKey: 'dark-grimoire',
    colors: { bgDeep: '#0d0a07', bgPanel: 'rgba(25,18,10,0.92)', primary: '#c9a84c', secondary: '#8b1a1a', alert: '#8b1a1a', textMain: '#d4c5a0', textDim: 'rgba(212,197,160,0.55)', border: 'rgba(201,168,76,0.35)', buttonBg: 'rgba(25,18,10,0.85)', buttonSelected: 'rgba(201,168,76,0.2)', glow: 'rgba(201,168,76,0.4)' },
    layout: 'ornate', borderRadius: '2px', fontFamily: "'Cinzel Decorative', serif", hudFont: "'JetBrains Mono', monospace"
  },
  8: {
    id: 8, name: 'Void Nexus', mobileThemeKey: 'void-nexus',
    colors: { bgDeep: '#020108', bgPanel: 'rgba(10,5,25,0.88)', primary: '#b266ff', secondary: '#00e5ff', alert: '#ff2a6d', textMain: '#e0dff0', textDim: 'rgba(224,223,240,0.5)', border: 'rgba(178,102,255,0.3)', buttonBg: 'rgba(10,5,25,0.7)', buttonSelected: 'rgba(178,102,255,0.18)', glow: 'rgba(178,102,255,0.5)' },
    layout: 'floating', borderRadius: '12px', fontFamily: "'Orbitron', sans-serif", hudFont: "'Fira Code', monospace"
  },
  9: {
    id: 9, name: 'Jade Meridian', mobileThemeKey: 'jade-meridian',
    colors: { bgDeep: '#0a0e08', bgPanel: 'rgba(15,25,15,0.9)', primary: '#4ecdc4', secondary: '#e8d5b7', alert: '#d4380d', textMain: '#e8e0d0', textDim: 'rgba(232,224,208,0.5)', border: 'rgba(78,205,196,0.4)', buttonBg: 'rgba(15,25,15,0.8)', buttonSelected: 'rgba(78,205,196,0.15)', glow: 'rgba(78,205,196,0.4)' },
    layout: 'organic', borderRadius: '6px', fontFamily: "'Noto Serif SC', serif", hudFont: "'IBM Plex Mono', monospace"
  },
  10: {
    id: 10, name: 'Ironbound Codex', mobileThemeKey: 'ironbound-codex',
    colors: { bgDeep: '#0c0a07', bgPanel: 'rgba(28,22,14,0.93)', primary: '#cd7f32', secondary: '#2ecc71', alert: '#c0392b', textMain: '#efe5d0', textDim: 'rgba(239,229,208,0.5)', border: 'rgba(205,127,50,0.45)', buttonBg: 'rgba(28,22,14,0.85)', buttonSelected: 'rgba(205,127,50,0.2)', glow: 'rgba(205,127,50,0.4)' },
    layout: 'ornate', borderRadius: '2px', fontFamily: "'Pirata One', serif", hudFont: "'Source Code Pro', monospace"
  },
  11: {
    id: 11, name: 'Runic Edda', mobileThemeKey: 'runic-edda',
    colors: { bgDeep: '#0a0c10', bgPanel: 'rgba(18,22,32,0.92)', primary: '#5dade2', secondary: '#e67e22', alert: '#c0392b', textMain: '#d5dbe0', textDim: 'rgba(213,219,224,0.5)', border: 'rgba(93,173,226,0.35)', buttonBg: 'rgba(18,22,32,0.85)', buttonSelected: 'rgba(93,173,226,0.15)', glow: 'rgba(93,173,226,0.4)' },
    layout: 'standard', borderRadius: '4px', fontFamily: "'Metamorphous', serif", hudFont: "'Fira Mono', monospace"
  }
};

const ThemeContext = createContext(null);

export function ThemeProvider({ children }) {
  const [currentThemeId, setCurrentThemeId] = useState(1);
  
  const theme = THEMES[currentThemeId];
  
  const setTheme = useCallback((themeId) => {
    if (THEMES[themeId]) {
      setCurrentThemeId(themeId);
      localStorage.setItem('gameTheme', themeId.toString());
    }
  }, []);
  
  // Load saved theme on mount
  React.useEffect(() => {
    const saved = localStorage.getItem('gameTheme');
    if (saved && THEMES[parseInt(saved)]) {
      setCurrentThemeId(parseInt(saved));
    }
  }, []);
  
  return (
    <ThemeContext.Provider value={{ theme, setTheme, currentThemeId, allThemes: THEMES }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}

// Theme Switcher Component
function ThemeSwitcher({ style = {} }) {
  const { currentThemeId, setTheme, allThemes } = useTheme();
  
  return (
    <div style={{
      display: 'flex',
      gap: '0.5rem',
      padding: '0.5rem',
      background: 'rgba(0, 0, 0, 0.3)',
      borderRadius: '4px',
      ...style
    }}>
      {Object.values(allThemes).map(theme => (
        <button
          key={theme.id}
          onClick={() => setTheme(theme.id)}
          title={theme.name}
          style={{
            width: '32px',
            height: '32px',
            border: currentThemeId === theme.id ? '2px solid #fff' : '1px solid rgba(255,255,255,0.3)',
            borderRadius: '4px',
            background: theme.colors.primary,
            color: theme.colors.bgDeep,
            cursor: 'pointer',
            fontWeight: 'bold',
            fontSize: '0.9rem',
            transition: 'all 0.2s ease',
            boxShadow: currentThemeId === theme.id ? `0 0 10px ${theme.colors.primary}` : 'none'
          }}
        >
          {theme.id}
        </button>
      ))}
    </div>
  );
}


