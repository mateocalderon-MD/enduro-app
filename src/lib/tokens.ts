// src/lib/tokens.ts
// Tokens de diseño — App enduro (ecosistema Mateo Calderón)
//
// Base = tokens del ecosistema (Cuentas Claras / Stock Claro): neutrales,
// estados, tipografía SF, espaciado, radios, sombras. NO se tocan, para
// mantener consistencia entre apps.
//
// Decisión de dominio (esta app): dos "mundos" con color propio.
//   - GIMNASIO  = el verde de marca del ecosistema.
//   - MOTO      = coral (único color nuevo que suma esta app).
//
// Regla de contraste (AA): para botones/relleno con texto blanco usar las
// variantes *Ink* (greenInk / coralInk). Los tonos brillantes (green / coral)
// son para acentos sin texto encima: FAB, puntos, íconos.

export const colors = {
  // ── GIMNASIO (verde de marca) ──────────────────────────────
  green:     '#34C759', // acento brillante: FAB, punto de actividad gym
  greenSoft: '#E3F7E8', // fondos suaves: tab activo, chips, día de gym
  greenInk:  '#0F6428', // texto sobre greenSoft · relleno de botón gym (AA)

  // ── MOTO (coral) ───────────────────────────────────────────
  coral:     '#FF6B3D', // acento brillante: punto de actividad moto
  coralSoft: '#FCEAE2', // fondos suaves: tag "simulación", día de moto
  coralInk:  '#8A3417', // texto sobre coralSoft · relleno de botón moto (AA)

  // ── Neutrales ──────────────────────────────────────────────
  bg:            '#F2F2F7', // fondo de pantallas
  surface:       '#FFFFFF', // cards, modales
  ink:           '#000000', // texto principal
  ink2:          '#1c1c1e', // texto secundario
  ink3:          '#3c3c43', // texto terciario / iconos inactivos
  ink4:          '#6c6c70', // texto deshabilitado / hints
  inkDisabled:   '#aeaeb2',
  hairline:        'rgba(60,60,67,0.12)', // separadores sutiles
  hairlineStrong:  'rgba(60,60,67,0.29)', // bordes de inputs

  // ── Estados ────────────────────────────────────────────────
  red:        '#FF3B30',
  redSoft:    '#FFE5E3',
  redInk:     '#7A1A14',
  blue:       '#007AFF',
  blueSoft:   '#E0EFFF',
  blueInk:    '#003D80',
  orange:     '#FF9500',
  orangeSoft: '#FFF0DC',
  orangeInk:  '#7A4500',
} as const;

// Tipografía: SF Pro (Apple) con fallback
export const fontFamily =
  '-apple-system, BlinkMacSystemFont, "SF Pro Display", "Inter", sans-serif';

export const fontSize = {
  caption2:   11,
  caption1:   12,
  footnote:   13,
  subhead:    15,
  callout:    16,
  body:       17,
  headline:   17,
  title3:     20,
  title2:     22,
  title1:     28,
  heroMedium: 36,
  heroTotal:  44,
} as const;

export const fontWeight = {
  regular:  400,
  medium:   500,
  semibold: 600,
  bold:     700,
} as const;

export const space = {
  xs: 4, sm: 8, md: 16, lg: 24, xl: 32, xxl: 48,
} as const;

export const radius = {
  sm: 8, md: 12, lg: 16, xl: 20, full: 999,
} as const;

export const shadow = {
  rest:  '0 1px 3px rgba(0,0,0,0.04)',
  hover: '0 4px 12px rgba(0,0,0,0.08)',
  elev:  '0 8px 24px rgba(0,0,0,0.12)',
  heroGym:  '0 4px 16px rgba(52,199,89,0.30)',  // tinte verde (gym)
  heroMoto: '0 4px 16px rgba(255,107,61,0.28)', // tinte coral (moto)
} as const;

export const transition = {
  fast: 'all 0.15s ease',
} as const;
