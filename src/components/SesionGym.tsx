// src/components/SesionGym.tsx — Sesión de gimnasio a pantalla completa.
// "Terminé" captura duración + RPE de la sesión y la registra (carga = duración × RPE).
import { useState } from 'react';
import { colors, fontFamily, fontSize, fontWeight, space, radius } from '../lib/tokens';
import { Button, Field, NumberInput } from './ui';
import { resumenDosis } from './Plan';
import { useRegistrarSesion, useSesiones, hoyLocal } from '../lib/queries';
import { sugerir, incrementoKg, ultimosLifts, type Sugerencia } from '../lib/progresion';

export function SesionGym({ dia, userId, planWeekId, mantenerCargas = false, onCerrar }:
  { dia: any; userId: string; planWeekId: string | null; mantenerCargas?: boolean; onCerrar: () => void }) {
  const esCircuito = dia.formato === 'circuito';
  const titulo = esCircuito ? 'Simulación de moto' : `Día ${dia.dia_numero}`;
  const registrar = useRegistrarSesion(userId);
  const circuito = esCircuito ? dia.circuito : null;
  const aerobico = esCircuito ? (dia.bloque_aerobico ?? null) : null;
  const circuitoMin = circuito
    ? Math.round((circuito.rondas * dia.ejercicios.length * (circuito.trabajo_seg + circuito.descanso_seg)) / 60)
    : 0;
  const durEstimada: number | '' = esCircuito ? circuitoMin + (aerobico?.duracion_min ?? 0) : '';
  const [terminando, setTerminando] = useState(false);
  const [duracion, setDuracion] = useState<number | ''>(durEstimada);
  const [rpe, setRpe] = useState<number | null>(circuito ? circuito.rpe : null);

  const { data: sesiones } = useSesiones(userId);
  const memoria = ultimosLifts(sesiones ?? []);
  const [edits, setEdits] = useState<Record<string, { peso?: string; reps?: string }>>({});
  const [swaps, setSwaps] = useState<Record<string, any>>({});       // variante_id original -> alternativa elegida
  const [swapAbierto, setSwapAbierto] = useState<string | null>(null);

  const SLOTS_PESO = new Set(['bisagra_cadera', 'tren_inferior', 'traccion', 'empuje', 'potencia']);
  const esPrincipal = (ef: any) => !esCircuito && (
    ef?.dosis?.tipo === 'fuerza' || ef?.dosis?.tipo === 'potencia' || SLOTS_PESO.has(ef?.slot_id)
  );
  // Ejercicio efectivo: el prescrito, o la alternativa elegida (mismo slot y misma dosis).
  const efectivo = (e: any) => {
    const a = swaps[e.variante_id];
    return a
      ? { variante_id: a.variante_id, variante_nombre: a.variante_nombre, descripcion: a.descripcion, claves: a.claves, slot_id: e.slot_id, dosis: e.dosis }
      : { variante_id: e.variante_id, variante_nombre: e.variante_nombre, descripcion: e.descripcion, claves: e.claves, slot_id: e.slot_id, dosis: e.dosis };
  };
  const sugDe = (ef: any): Sugerencia | null => esPrincipal(ef)
    ? sugerir(memoria[ef.variante_id] ?? null,
        { reps_min: ef.dosis.reps_min ?? 1, reps_max: ef.dosis.reps_max ?? (ef.dosis.reps_min ?? 1) },
        incrementoKg(ef.slot_id), !mantenerCargas)
    : null;
  const valPeso = (ef: any, sug: Sugerencia) => edits[ef.variante_id]?.peso ?? (sug.peso > 0 ? String(sug.peso) : '');
  const valReps = (ef: any, sug: Sugerencia) => edits[ef.variante_id]?.reps ?? String(sug.reps_objetivo);
  const setCampo = (id: string, campo: 'peso' | 'reps', v: string) =>
    setEdits((prev) => ({ ...prev, [id]: { ...prev[id], [campo]: v } }));
  const elegirVar = (e: any, alt: any | null) => {        // alt null = volver al prescrito
    setSwaps((prev) => { const n = { ...prev }; if (alt) n[e.variante_id] = alt; else delete n[e.variante_id]; return n; });
    setSwapAbierto(null);
  };

  function guardar() {
    registrar.mutate(
      {
        fecha: hoyLocal(),
        tipo: esCircuito ? 'simulacion' : 'gym',
        subtipo: esCircuito ? 'simulacion' : `dia_${dia.dia_numero}`,
        duracion_min: Number(duracion), rpe: rpe!,
        plan_week_id: planWeekId,
        payload: {
          dia_numero: dia.dia_numero,
          aerobico: aerobico?.variante_nombre ?? null,
          ejercicios: dia.ejercicios.map((e: any) => {
            const ef = efectivo(e);
            const sug = sugDe(ef);
            if (sug) {
              return { variante_id: ef.variante_id, slot_id: ef.slot_id, nombre: ef.variante_nombre,
                peso: Number(valPeso(ef, sug)) || 0, reps: Number(valReps(ef, sug)) || 0 };
            }
            return { variante_id: ef.variante_id, nombre: ef.variante_nombre };
          }),
        },
      },
      { onSuccess: onCerrar },
    );
  }

  return (
    <div style={{ fontFamily, position: 'fixed', inset: 0, background: colors.bg, zIndex: 200, display: 'flex', flexDirection: 'column' }}>
      <header style={{ display: 'flex', alignItems: 'center', gap: space.md, padding: space.md, borderBottom: `1px solid ${colors.hairline}` }}>
        <button onClick={onCerrar} aria-label="Cerrar"
          style={{ width: 36, height: 36, borderRadius: radius.full, border: 'none', background: colors.surface, color: colors.ink2, fontSize: fontSize.body, cursor: 'pointer' }}>✕</button>
        <div>
          <div style={{ fontSize: fontSize.headline, fontWeight: fontWeight.semibold, color: colors.ink }}>{titulo}</div>
          <div style={{ fontSize: fontSize.caption1, color: colors.ink4 }}>{terminando ? '¿Cómo te fue?' : (esCircuito ? `${aerobico ? 'Aeróbico + ' : ''}${dia.ejercicios.length} estaciones` : `${dia.ejercicios.length} ejercicios`)}</div>
        </div>
      </header>

      <div style={{ flex: 1, overflowY: 'auto', maxWidth: 480, width: '100%', margin: '0 auto', padding: space.lg, boxSizing: 'border-box' }}>
        {!terminando ? (
          <>
          {mantenerCargas && (
            <div style={{ background: colors.greenSoft, borderRadius: radius.lg, padding: space.md, marginBottom: space.md }}>
              <div style={{ fontSize: fontSize.subhead, fontWeight: fontWeight.semibold, color: colors.greenInk }}>Semana liviana</div>
              <p style={{ fontSize: fontSize.footnote, color: colors.greenInk, margin: `2px 0 0`, lineHeight: 1.4 }}>
                Menos series y un punto menos de RPE, para llegar fresco. Mantené los pesos: no busques subir esta semana.
              </p>
            </div>
          )}
          {aerobico && (
            <div style={{ background: colors.coralSoft, borderRadius: radius.lg, padding: space.md, marginBottom: space.md }}>
              <div style={{ fontSize: fontSize.caption1, color: colors.coralInk, textTransform: 'uppercase', letterSpacing: 0.5, fontWeight: fontWeight.semibold }}>Aeróbico · primero</div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', gap: space.sm, marginTop: 2 }}>
                <h2 style={{ fontSize: fontSize.headline, fontWeight: fontWeight.semibold, color: colors.ink, margin: 0 }}>{aerobico.variante_nombre}</h2>
                <span style={{ fontSize: fontSize.footnote, color: colors.coralInk, fontWeight: fontWeight.semibold, whiteSpace: 'nowrap' }}>{aerobico.duracion_min} min</span>
              </div>
              {aerobico.descripcion && <p style={{ fontSize: fontSize.subhead, color: colors.ink2, lineHeight: 1.5, margin: `${space.xs}px 0 ${space.sm}px` }}>{aerobico.descripcion}</p>}
              <p style={{ fontSize: fontSize.footnote, color: colors.coralInk, lineHeight: 1.5, margin: 0 }}>
                Continuo y sostenido, sin parar, a RPE 6-7: te cuesta hablar pero no estás al límite. Es el motor de fondo de la salida.
              </p>
            </div>
          )}
          {circuito && (
            <div style={{ background: colors.coralSoft, borderRadius: radius.lg, padding: space.md, marginBottom: space.md }}>
              {aerobico && <div style={{ fontSize: fontSize.caption1, color: colors.coralInk, textTransform: 'uppercase', letterSpacing: 0.5, fontWeight: fontWeight.semibold, marginBottom: 2 }}>Circuito · después</div>}
              <div style={{ fontSize: fontSize.headline, fontWeight: fontWeight.semibold, color: colors.coralInk }}>
                {circuito.rondas} rondas · {circuito.trabajo_seg}s trabajo / {circuito.descanso_seg}s pausa
              </div>
              <p style={{ fontSize: fontSize.footnote, color: colors.coralInk, lineHeight: 1.5, margin: `${space.xs}px 0 0` }}>
                En cada estación trabajás {circuito.trabajo_seg}s y descansás {circuito.descanso_seg}s antes de pasar a la siguiente. Las {dia.ejercicios.length} estaciones son una vuelta; hacés {circuito.rondas} vueltas en total (~{Math.round((circuito.rondas * dia.ejercicios.length * (circuito.trabajo_seg + circuito.descanso_seg)) / 60)} min).
              </p>
              <p style={{ fontSize: fontSize.footnote, color: colors.coralInk, lineHeight: 1.5, margin: `${space.sm}px 0 0` }}>
                <strong>Aguante</strong> (plancha, colgarse, isométrico): sostené los {circuito.trabajo_seg}s. <strong>Dinámico</strong> (comba, sentadilla, remo, balón): el mayor trabajo de calidad en esos {circuito.trabajo_seg}s. Va fuerte: imita la moto y cuenta como carga de moto.
              </p>
            </div>
          )}
          {dia.ejercicios.map((e: any, i: number) => {
            const ef = efectivo(e);
            const sug = sugDe(ef);
            const swapped = !!swaps[e.variante_id];
            const tieneAlts = !esCircuito && Array.isArray(e.alternativas) && e.alternativas.length > 0;
            return (
            <div key={i} style={{ background: colors.surface, borderRadius: radius.lg, padding: space.md, marginBottom: space.md }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', gap: space.sm }}>
                <h2 style={{ fontSize: fontSize.headline, fontWeight: fontWeight.semibold, color: colors.ink, margin: 0 }}>{ef.variante_nombre}</h2>
                <span style={{ fontSize: fontSize.footnote, color: esCircuito ? colors.coralInk : colors.greenInk, fontWeight: fontWeight.semibold, whiteSpace: 'nowrap' }}>{esCircuito && circuito ? `${circuito.trabajo_seg} s` : resumenDosis(ef.dosis)}</span>
              </div>
              <div style={{ fontSize: fontSize.caption1, color: colors.ink4, marginBottom: ef.descripcion ? space.sm : 0 }}>{e.slot_nombre}{swapped ? ' · cambiado' : ''}</div>
              {ef.descripcion && <p style={{ fontSize: fontSize.subhead, color: colors.ink2, lineHeight: 1.5, margin: `0 0 ${space.sm}px` }}>{ef.descripcion}</p>}
              {Array.isArray(ef.claves) && ef.claves.length > 0 && (
                <ul style={{ margin: 0, padding: 0, listStyle: 'none' }}>
                  {ef.claves.map((c: string, j: number) => (
                    <li key={j} style={{ display: 'flex', gap: space.sm, alignItems: 'flex-start', fontSize: fontSize.footnote, color: colors.ink3, padding: '3px 0' }}>
                      <span style={{ color: esCircuito ? colors.coralInk : colors.greenInk, flexShrink: 0 }}>•</span>{c}
                    </li>
                  ))}
                </ul>
              )}
              {tieneAlts && (
                <SwapControl e={e} ef={ef} abierto={swapAbierto === e.variante_id} swapped={swapped}
                  onToggle={() => setSwapAbierto(swapAbierto === e.variante_id ? null : e.variante_id)}
                  onElegir={(alt) => elegirVar(e, alt)} />
              )}
              {sug && (
                <LiftLog sug={sug}
                  peso={valPeso(ef, sug)} reps={valReps(ef, sug)}
                  onPeso={(v) => setCampo(ef.variante_id, 'peso', v)}
                  onReps={(v) => setCampo(ef.variante_id, 'reps', v)} />
              )}
            </div>
            );
          })}
          </>
        ) : (
          <>
            <Field label="¿Cuánto duró?"><NumberInput value={duracion} onChange={setDuracion} suffix="min" placeholder="45" /></Field>
            <Field label="¿Qué tan dura fue?" hint="1 = muy suave · 10 = al límite">
              <div style={{ display: 'flex', gap: 4 }}>
                {Array.from({ length: 10 }, (_, i) => i + 1).map((n) => {
                  const on = rpe === n;
                  return (
                    <button key={n} onClick={() => setRpe(n)}
                      style={{ flex: 1, aspectRatio: '1', fontFamily, fontSize: fontSize.subhead, fontWeight: on ? fontWeight.bold : fontWeight.regular,
                        color: on ? '#fff' : colors.ink3, background: on ? colors.greenInk : colors.surface,
                        border: `1px solid ${on ? colors.greenInk : colors.hairlineStrong}`, borderRadius: radius.sm, cursor: 'pointer' }}>{n}</button>
                  );
                })}
              </div>
            </Field>
            {duracion !== '' && rpe !== null && (
              <div style={{ background: colors.greenSoft, color: colors.greenInk, borderRadius: radius.md, padding: space.md, fontSize: fontSize.subhead, textAlign: 'center' }}>
                Carga de esta sesión: <strong>{Number(duracion) * rpe}</strong>
              </div>
            )}
            {registrar.isError && (
              <div style={{ marginTop: space.md, background: colors.redSoft, color: colors.redInk, fontSize: fontSize.footnote, borderRadius: radius.sm, padding: space.sm }}>No se pudo guardar. Probá de nuevo.</div>
            )}
          </>
        )}
      </div>

      <footer style={{ padding: space.md, borderTop: `1px solid ${colors.hairline}`, background: colors.bg }}>
        <div style={{ maxWidth: 480, margin: '0 auto' }}>
          {!terminando ? (
            <Button full onClick={() => setTerminando(true)}>Terminé</Button>
          ) : (
            <Button full onClick={guardar} disabled={duracion === '' || duracion <= 0 || rpe === null || registrar.isPending}>
              {registrar.isPending ? 'Guardando…' : 'Registrar sesión'}
            </Button>
          )}
        </div>
      </footer>
    </div>
  );
}

function SwapControl({ e, ef, abierto, swapped, onToggle, onElegir }: {
  e: any; ef: any; abierto: boolean; swapped: boolean;
  onToggle: () => void; onElegir: (alt: any | null) => void;
}) {
  const opciones = [
    { variante_id: e.variante_id, variante_nombre: e.variante_nombre, prescrito: true },
    ...(e.alternativas ?? []).map((a: any) => ({ ...a, prescrito: false })),
  ];
  return (
    <div style={{ marginTop: space.sm, borderTop: `1px solid ${colors.hairline}`, paddingTop: space.sm }}>
      <button onClick={onToggle} style={{
        background: 'none', border: 'none', padding: 0, fontFamily, fontSize: fontSize.footnote,
        fontWeight: fontWeight.semibold, color: colors.greenInk, cursor: 'pointer',
      }}>
        ⇄ {swapped ? 'Cambiado · ver opciones' : 'Cambiar ejercicio'}
      </button>
      {abierto && (
        <div style={{ marginTop: space.sm, display: 'flex', flexDirection: 'column', gap: space.xs }}>
          {opciones.map((o: any) => {
            const activo = o.variante_id === ef.variante_id;
            return (
              <button key={o.variante_id} onClick={() => onElegir(o.prescrito ? null : o)} style={{
                textAlign: 'left', fontFamily, cursor: 'pointer',
                background: activo ? colors.greenSoft : colors.bg,
                border: `1px solid ${activo ? colors.greenInk : colors.hairlineStrong}`,
                borderRadius: radius.sm, padding: `${space.sm}px ${space.md}px`,
                fontSize: fontSize.subhead, color: activo ? colors.greenInk : colors.ink2,
                fontWeight: activo ? fontWeight.semibold : fontWeight.medium,
              }}>
                {o.variante_nombre}{o.prescrito ? ' · prescrito' : ''}{activo ? ' ✓' : ''}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

function LiftLog({ sug, peso, reps, onPeso, onReps }: {
  sug: Sugerencia; peso: string; reps: string;
  onPeso: (v: string) => void; onReps: (v: string) => void;
}) {
  const inputStyle = {
    width: '100%', boxSizing: 'border-box' as const, fontFamily, fontSize: fontSize.body,
    color: colors.ink, background: colors.bg, border: `1px solid ${colors.hairlineStrong}`,
    borderRadius: radius.sm, padding: '8px 10px', textAlign: 'center' as const,
  };
  const labelStyle = { fontSize: fontSize.caption2, color: colors.ink4, marginBottom: 2, display: 'block' };
  return (
    <div style={{ marginTop: space.sm, borderTop: `1px solid ${colors.hairline}`, paddingTop: space.sm }}>
      <p style={{ fontSize: fontSize.footnote, color: sug.subir ? colors.greenInk : colors.ink3, margin: `0 0 ${space.sm}px`, lineHeight: 1.4 }}>
        {sug.subir ? '⬆️ ' : ''}{sug.mensaje}
      </p>
      <div style={{ display: 'flex', gap: space.sm }}>
        <label style={{ flex: 1 }}>
          <span style={labelStyle}>Peso (kg)</span>
          <input type="number" inputMode="decimal" value={peso} placeholder="kg"
            onChange={(ev) => onPeso(ev.target.value)} style={inputStyle} />
        </label>
        <label style={{ flex: 1 }}>
          <span style={labelStyle}>Reps logradas</span>
          <input type="number" inputMode="numeric" value={reps}
            onChange={(ev) => onReps(ev.target.value)} style={inputStyle} />
        </label>
      </div>
    </div>
  );
}
