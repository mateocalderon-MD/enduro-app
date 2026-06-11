// src/components/Plan.tsx — Pestaña Plan: la semana completa.
import { colors, fontFamily, fontSize, fontWeight, space, radius } from '../lib/tokens';
import { Button } from './ui';
import { useGenerarPlan } from '../lib/queries';

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

export function DiaCard({ dia }: { dia: any }) {
  const esCircuito = dia.formato === 'circuito';
  return (
    <div style={{ background: colors.surface, borderRadius: radius.lg, padding: space.md, marginBottom: space.md }}>
      <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: space.sm }}>
        <h2 style={{ fontSize: fontSize.headline, fontWeight: fontWeight.semibold, color: colors.ink, margin: 0 }}>
          {esCircuito ? 'Circuito (simulación)' : `Día ${dia.dia_numero}`}
        </h2>
        <span style={{ fontSize: fontSize.caption1, color: colors.ink4 }}>{dia.ejercicios.length} ejercicios</span>
      </div>
      {dia.ejercicios.map((e: any, i: number) => (
        <div key={i} style={{ padding: `${space.sm}px 0`, borderTop: i === 0 ? 'none' : `1px solid ${colors.hairline}` }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', gap: space.sm }}>
            <span style={{ fontSize: fontSize.subhead, fontWeight: fontWeight.medium, color: colors.ink2 }}>{e.variante_nombre}</span>
            <span style={{ fontSize: fontSize.footnote, color: colors.greenInk, fontWeight: fontWeight.medium, whiteSpace: 'nowrap' }}>{resumenDosis(e.dosis)}</span>
          </div>
          <div style={{ fontSize: fontSize.caption1, color: colors.ink4 }}>{e.slot_nombre}</div>
        </div>
      ))}
    </div>
  );
}

export function Plan({ userId, rutina }: { userId: string; rutina: any }) {
  const generar = useGenerarPlan(userId);
  const dias: any[] = rutina?.dias ?? [];
  const advertencias: string[] = rutina?.advertencias ?? [];

  return (
    <div style={{ fontFamily, maxWidth: 480, width: '100%', margin: '0 auto', padding: space.lg, boxSizing: 'border-box' }}>
      <p style={{ fontSize: fontSize.footnote, color: colors.ink4, textTransform: 'uppercase', letterSpacing: 0.5, margin: 0 }}>Tu semana</p>
      <h1 style={{ fontSize: fontSize.title1, fontWeight: fontWeight.bold, color: colors.ink, margin: `${space.xs}px 0 ${space.lg}px` }}>Plan</h1>

      {dias.map((d) => <DiaCard key={d.dia_numero} dia={d} />)}

      {advertencias.length > 0 && (
        <div style={{ background: colors.orangeSoft, color: colors.orangeInk, borderRadius: radius.md, padding: space.md, marginBottom: space.md, fontSize: fontSize.footnote }}>
          {advertencias.map((a, i) => <div key={i} style={{ padding: '2px 0' }}>{a}</div>)}
        </div>
      )}

      <Button variant="ghost" full onClick={() => generar.mutate('general')} disabled={generar.isPending}>
        {generar.isPending ? 'Regenerando…' : 'Regenerar plan'}
      </Button>
    </div>
  );
}
