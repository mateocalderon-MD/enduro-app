// src/components/Plan.tsx — Pestaña Plan: la semana efectiva (lun-dom) + acciones por día.
import { useState } from 'react';
import { colors, fontFamily, fontSize, fontWeight, space, radius } from '../lib/tokens';
import { Button } from './ui';
import { useGenerarPlan, usePlanEdits, useRegistrarEdit, useSesiones, hoyLocal } from '../lib/queries';
import { semanaEfectiva, nombreDow, type DiaSemana } from '../lib/semana';
import { DiaSheet } from './DiaSheet';

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

const ETIQUETA: Record<string, string> = { gym: 'Gimnasio', moto: 'Moto', simulacion: 'Simulación', descanso: 'Descanso' };

export function Plan({ userId, rutina, semanaInicio, planWeekId, onEmpezar }: {
  userId: string; rutina: any; semanaInicio: string; planWeekId: string | null; onEmpezar: (dia: any) => void;
}) {
  const generar = useGenerarPlan(userId);
  const { data: edits } = usePlanEdits(userId, planWeekId);
  const { data: sesiones } = useSesiones(userId);
  const registrarEdit = useRegistrarEdit(userId);
  const [sel, setSel] = useState<DiaSemana | null>(null);

  const dias: any[] = rutina?.dias ?? [];
  const advertencias: string[] = rutina?.advertencias ?? [];
  const semana = semanaEfectiva({
    semanaInicio, dias,
    edits: (edits ?? []).map((e) => ({ fecha: e.fecha, accion: e.accion, payload: e.payload, created_at: e.created_at })),
    sesiones: (sesiones ?? []).map((s) => ({ fecha: s.fecha, tipo: s.tipo, carga: s.carga })),
    hoy: hoyLocal(),
  });

  const editar = (fecha: string, accion: 'swap_moto' | 'descanso' | 'mover' | 'agregar', payload?: any) => {
    if (planWeekId) registrarEdit.mutate({ plan_week_id: planWeekId, fecha, accion, payload });
  };

  return (
    <div style={{ fontFamily, maxWidth: 480, width: '100%', margin: '0 auto', padding: space.lg, boxSizing: 'border-box' }}>
      <p style={{ fontSize: fontSize.footnote, color: colors.ink4, textTransform: 'uppercase', letterSpacing: 0.5, margin: 0 }}>Tu semana</p>
      <h1 style={{ fontSize: fontSize.title1, fontWeight: fontWeight.bold, color: colors.ink, margin: `${space.xs}px 0 ${space.lg}px` }}>Plan</h1>

      <div style={{ marginBottom: space.lg }}>
        {semana.map((d) => {
          const esGym = d.tipo === 'gym';
          const editable = !d.hecho && (esGym || d.tipo === 'descanso');
          const colorTipo = (d.tipo === 'moto' || d.tipo === 'simulacion') ? colors.coralInk : esGym ? colors.greenInk : colors.ink4;
          const etiqueta = esGym ? `Día ${d.dia?.dia_numero}` : ETIQUETA[d.tipo];
          return (
            <button key={d.fecha} onClick={() => editable && setSel(d)} disabled={!editable}
              style={{
                width: '100%', textAlign: 'left', fontFamily, cursor: editable ? 'pointer' : 'default',
                background: d.esHoy ? colors.greenSoft : colors.surface, border: 'none',
                borderRadius: radius.md, padding: `${space.md}px`, marginBottom: space.sm,
                display: 'flex', alignItems: 'center', gap: space.md,
              }}>
              <div style={{ width: 42, flexShrink: 0 }}>
                <div style={{ fontSize: fontSize.footnote, fontWeight: fontWeight.semibold, color: d.esHoy ? colors.greenInk : colors.ink3 }}>{nombreDow(d.dow)}</div>
                <div style={{ fontSize: fontSize.caption2, color: colors.ink4 }}>{d.fecha.slice(8)}</div>
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: fontSize.subhead, fontWeight: fontWeight.semibold, color: colorTipo }}>{etiqueta}</div>
                {d.hecho && <div style={{ fontSize: fontSize.caption1, color: colors.ink4 }}>Hecho · carga {d.cargaHecha}</div>}
              </div>
              {editable && <span style={{ color: colors.ink4, fontSize: fontSize.body, flexShrink: 0 }}>›</span>}
              {d.hecho && <span style={{ color: colors.greenInk, fontSize: fontSize.body, flexShrink: 0 }}>✓</span>}
            </button>
          );
        })}
      </div>

      {advertencias.length > 0 && (
        <div style={{ background: colors.orangeSoft, color: colors.orangeInk, borderRadius: radius.md, padding: space.md, marginBottom: space.md, fontSize: fontSize.footnote }}>
          {advertencias.map((a, i) => <div key={i} style={{ padding: '2px 0' }}>{a}</div>)}
        </div>
      )}

      <Button variant="ghost" full onClick={() => generar.mutate('general')} disabled={generar.isPending}>
        {generar.isPending ? 'Regenerando…' : 'Regenerar plan'}
      </Button>

      <DiaSheet dia={sel} dias={dias} semana={semana} onCerrar={() => setSel(null)}
        onEmpezar={onEmpezar}
        onSwapMoto={(f) => editar(f, 'swap_moto')}
        onMover={(f, h) => editar(f, 'mover', { hacia: h })}
        onDescanso={(f) => editar(f, 'descanso')}
        onAgregar={(f, n) => editar(f, 'agregar', { dia_numero: n })} />
    </div>
  );
}
