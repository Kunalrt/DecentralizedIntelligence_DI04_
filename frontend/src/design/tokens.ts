/**
 * Agni Drishti - Cartographic Survey Office Design Tokens
 * 
 * Strict Guidelines:
 * - Palette: Warm off-white (#F5F3EE), white panels (#FFFFFF), charcoal text (#1F2328),
 *   muted borders (#D9D6CE), deep accent (#1F4E5F).
 * - Kiln Classes: FCBK (#E8710A, Circle), Zigzag (#1A73E8, Square), CFCBK (#188038, Triangle).
 * - Typography: IBM Plex Sans (UI), IBM Plex Mono (numbers/coords), Source Serif 4 (titles).
 * - Corner radius: max 4px. Borders: 1px solid #D9D6CE.
 * - Negative constraints: zero purple/pink gradients, zero glassmorphism, zero emoji, zero buzzwords.
 */

export const TOKENS = {
  colors: {
    bg: '#F5F3EE',
    panel: '#FFFFFF',
    text: '#1F2328',
    textMuted: '#656D76',
    border: '#D9D6CE',
    borderSubtle: '#E8E5DD',
    accent: '#1F4E5F',
    accentHover: '#163B48',
    darkMap: '#14181C',
    warning: '#D97706',
    danger: '#DC2626',
    success: '#16A34A',
    kiln: {
      fcbk: '#E8710A',
      zigzag: '#1A73E8',
      cfcbk: '#188038',
    },
    geo: {
      boundary: '#1F2328',
      roadPrimary: '#475569',
      roadSecondary: '#94A3B8',
      water: '#6BA4B8',
      rail: '#334155',
    },
  },
  typography: {
    fontSans: "'IBM Plex Sans', system-ui, -apple-system, sans-serif",
    fontMono: "'IBM Plex Mono', Consolas, monospace",
    fontSerif: "'Source Serif 4', Georgia, serif",
    scale: {
      '2xs': '11px',
      xs: '12px',
      sm: '14px',
      base: '16px',
      lg: '20px',
      xl: '28px',
    },
  },
  spacing: {
    grid: 8,
    xs: '4px',
    sm: '8px',
    md: '16px',
    lg: '24px',
    xl: '32px',
  },
  radius: {
    sm: '2px',
    md: '4px',
    max: '4px',
  },
  icons: {
    strokeWidth: 1.5,
    sizes: {
      sm: 16,
      md: 20,
      lg: 24,
    },
  },
  motion: {
    duration: '150ms',
    easing: 'ease-in-out',
  },
} as const;

export type KilnType = 'FCBK' | 'Zigzag' | 'CFCBK';
