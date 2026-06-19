// src/components/SesionGym.tsx — Sesión de gimnasio a pantalla completa.
// "Terminé" captura duración + RPE de la sesión y la registra (carga = duración × RPE).
import { useState } from 'react';
import { colors, fontFamily, fontSize, fontWeight, space, radius } from '../lib/tokens';
import { Button, Field, NumberInput } from './ui';
import { resumenDosis } from './Plan';
import { useRegistrarSesion, hoyLocal } from '../lib/queries';

export function SesionGym({ dia, userId, planWeekId, onCerrar }:
  { dia: any; userId: string; planWeekId: string | null; onCerrar: () => void }) {
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

  function guardar() {
    registrar.mutate(
      {
        fecha: hoyLocal(),
        tipo: esCircuito ? 'simulacion' : 'gym',
        subtipo: esCircuito ? 'simulacion' : `dia_${dia.dia_numero}`,
        duracion_min: Number(duracion), rpe: rpe!,
        plan_week_id: planWeekId,
        payload: { dia_numero: dia.dia_numero, aerobico: aerobico?.variante_nombre ?? null, ejercicios: dia.ejercicios.map((e: any) => e.variante_nombre) },
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
          {dia.ejercicios.map((e: any, i: number) => (
            <div key={i} style={{ background: colors.surface, borderRadius: radius.lg, padding: space.md, marginBottom: space.md }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', gap: space.sm }}>
                <h2 style={{ fontSize: fontSize.headline, fontWeight: fontWeight.semibold, color: colors.ink, margin: 0 }}>{e.variante_nombre}</h2>
                <span style={{ fontSize: fontSize.footnote, color: esCircuito ? colors.coralInk : colors.greenInk, fontWeight: fontWeight.semibold, whiteSpace: 'nowrap' }}>{esCircuito && circuito ? `${circuito.trabajo_seg} s` : resumenDosis(e.dosis)}</span>
              </div>
              <div style={{ fontSize: fontSize.caption1, color: colors.ink4, marginBottom: e.descripcion ? space.sm : 0 }}>{e.slot_nombre}</div>
              {e.descripcion && <p style={{ fontSize: fontSize.subhead, color: colors.ink2, lineHeight: 1.5, margin: `0 0 ${space.sm}px` }}>{e.descripcion}</p>}
              {Array.isArray(e.claves) && e.claves.length > 0 && (
                <ul style={{ margin: 0, padding: 0, listStyle: 'none' }}>
                  {e.claves.map((c: string, j: number) => (
                    <li key={j} style={{ display: 'flex', gap: space.sm, alignItems: 'flex-start', fontSize: fontSize.footnote, color: colors.ink3, padding: '3px 0' }}>
                      <span style={{ color: esCircuito ? colors.coralInk : colors.greenInk, flexShrink: 0 }}>•</span>{c}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          ))}
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
