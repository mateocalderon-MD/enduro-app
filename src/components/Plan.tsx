// src/components/Plan.tsx — Pestaña Plan: la semana efectiva (lun-dom) + acciones por día.
import { useState } from 'react';
import { colors, fontFamily, fontSize, fontWeight, space, radius } from '../lib/tokens';
import { Button } from './ui';
import { useGenerarPlan, usePlanEdits, useRegistrarEdit, useEliminarEdit, useRestablecerSemana, useSesiones, hoyLocal } from '../lib/queries';
import { semanaEfectiva, nombreDow, type DiaSemana } from '../lib/semana';
import { DiaSheet } from './DiaSheet';
import { BloqueStrip } from './BloqueStrip';

// resumenDosis y DiaCard viven en ./DiaCard (reusados por la hoja del día). Se re-exportan para compatibilidad.
export { resumenDosis, DiaCard } from './DiaCard';

const ETIQUETA: Record<string, string> = { gym: 'Gimnasio', moto: 'Moto', simulacion: 'Simulación', descanso: 'Descanso' };

export function Plan({ userId, rutina, semanaInicio, planWeekId, cicloSemana, onEmpezar }: {
  userId: string; rutina: any; semanaInicio: string; planWeekId: string | null; cicloSemana: number | null; onEmpezar: (dia: any) => void;
}) {
  const generar = useGenerarPlan(userId);
  const { data: edits } = usePlanEdits(userId, planWeekId);
  const { data: sesiones } = useSesiones(userId);
  const registrarEdit = useRegistrarEdit(userId);
  const eliminar = useEliminarEdit();
  const restablecer = useRestablecerSemana();
  const [sel, setSel] = useState<DiaSemana | null>(null);

  const editsList = edits ?? [];
  const ultimo = editsList[editsList.length - 1];
  const deshacerUltimo = () => { if (ultimo && planWeekId) eliminar.mutate({ id: ultimo.id, plan_week_id: planWeekId }); };
  const restablecerSemana = () => { if (planWeekId) restablecer.mutate(planWeekId); };

  const dias: any[] = rutina?.dias ?? [];
  const advertencias: string[] = rutina?.advertencias ?? [];
  const semana = semanaEfectiva({
    semanaInicio, dias,
    edits: editsList.map((e) => ({ fecha: e.fecha, accion: e.accion, payload: e.payload, created_at: e.created_at })),
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

      <BloqueStrip cicloSemana={cicloSemana} />

      {editsList.length > 0 && (
        <div style={{ display: 'flex', alignItems: 'center', gap: space.md, marginBottom: space.lg, fontSize: fontSize.footnote, flexWrap: 'wrap' }}>
          <span style={{ color: colors.ink4 }}>{editsList.length} {editsList.length === 1 ? 'cambio' : 'cambios'} esta semana</span>
          <button onClick={deshacerUltimo} disabled={eliminar.isPending}
            style={{ background: 'none', border: 'none', padding: 0, fontFamily, fontSize: fontSize.footnote, fontWeight: fontWeight.semibold, color: colors.greenInk, cursor: 'pointer' }}>
            Deshacer último
          </button>
          <button onClick={restablecerSemana} disabled={restablecer.isPending}
            style={{ background: 'none', border: 'none', padding: 0, fontFamily, fontSize: fontSize.footnote, fontWeight: fontWeight.semibold, color: colors.ink3, cursor: 'pointer' }}>
            Restablecer
          </button>
        </div>
      )}

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
