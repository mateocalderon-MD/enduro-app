// src/components/DiaCard.tsx — Tarjeta read-only con los ejercicios de un día (reusada en Plan y en la hoja del día).
import { colors, fontFamily, fontSize, fontWeight, space, radius } from '../lib/tokens';

// Resumen legible de la dosis según su forma.
export function resumenDosis(d: any): string {
  if (!d) return '';
  const rpe = typeof d.rpe === 'number' ? ` · RPE ${d.rpe}` : '';
  if (typeof d.series === 'number' && typeof d.reps_min === 'number') return `${d.series}×${d.reps_min}-${d.reps_max}${rpe}`;
  if (typeof d.series === 'number' && typeof d.duracion_seg === 'number') return `${d.series}×${d.duracion_seg}s${rpe}`;
  if (d.tipo === 'acondicionamiento' && typeof d.duracion_min === 'number') return `${d.duracion_min} min${rpe}`;
  if (typeof d.series === 'number') return `${d.series} series${rpe}`;
  return '';
}

export function DiaCard({ dia, plano = false }: { dia: any; plano?: boolean }) {
  const esCircuito = dia?.formato === 'circuito';
  const ejercicios: any[] = dia?.ejercicios ?? [];
  return (
    <div style={{
      fontFamily, background: plano ? 'transparent' : colors.surface,
      borderRadius: radius.lg, padding: plano ? 0 : space.md, marginBottom: plano ? 0 : space.md,
    }}>
      <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: space.sm }}>
        <h2 style={{ fontSize: fontSize.headline, fontWeight: fontWeight.semibold, color: colors.ink, margin: 0 }}>
          {esCircuito ? 'Circuito (simulación)' : `Día ${dia?.dia_numero}`}
        </h2>
        <span style={{ fontSize: fontSize.caption1, color: colors.ink4 }}>{ejercicios.length} ejercicios</span>
      </div>
      {ejercicios.map((e: any, i: number) => (
        <div key={i} style={{ padding: `${space.sm}px 0`, borderTop: i === 0 ? 'none' : `1px solid ${colors.hairline}` }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', gap: space.sm }}>
            <span style={{ fontSize: fontSize.subhead, fontWeight: fontWeight.medium, color: colors.ink2 }}>{e.variante_nombre}</span>
            <span style={{ fontSize: fontSize.footnote, color: colors.greenInk, fontWeight: fontWeight.medium, whiteSpace: 'nowrap' }}>{resumenDosis(e.dosis)}</span>
          </div>
          <div style={{ fontSize: fontSize.caption1, color: colors.ink4 }}>{e.slot_nombre}</div>
          {Array.isArray(e.alternativas) && e.alternativas.length > 0 && (
            <div style={{ fontSize: fontSize.caption2, color: colors.ink4, marginTop: 2 }}>
              Cambiar por: {e.alternativas.map((a: any) => a.variante_nombre).join(' · ')}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
