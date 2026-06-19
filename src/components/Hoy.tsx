// src/components/Hoy.tsx — Pestaña Hoy: qué toca HOY (según la semana efectiva) + carga real.
import { colors, fontFamily, fontSize, fontWeight, space, radius } from '../lib/tokens';
import { Button } from './ui';
import { DiaCard } from './Plan';
import { useSesiones, usePlanEdits, resumenSemana, hoyLocal } from '../lib/queries';
import { semanaEfectiva, diaDeHoy } from '../lib/semana';

export function Hoy({ userId, rutina, semanaInicio, planWeekId, onEmpezar, onRegistrarMoto }: {
  userId: string; rutina: any; semanaInicio: string; planWeekId: string | null;
  onEmpezar: (dia: any) => void; onRegistrarMoto: () => void;
}) {
  const { data: sesiones } = useSesiones(userId);
  const { data: edits } = usePlanEdits(userId, planWeekId);
  const r = resumenSemana(sesiones ?? []);
  const pctGym = r.total > 0 ? (r.gym / r.total) * 100 : 0;

  const semana = semanaEfectiva({
    semanaInicio, dias: rutina?.dias ?? [],
    edits: (edits ?? []).map((e) => ({ fecha: e.fecha, accion: e.accion, payload: e.payload, created_at: e.created_at })),
    sesiones: (sesiones ?? []).map((s) => ({ fecha: s.fecha, tipo: s.tipo, carga: s.carga })),
    hoy: hoyLocal(),
  });
  const hoy = diaDeHoy(semana);

  return (
    <div style={{ fontFamily, maxWidth: 480, width: '100%', margin: '0 auto', padding: space.lg, boxSizing: 'border-box' }}>
      <p style={{ fontSize: fontSize.footnote, color: colors.ink4, textTransform: 'uppercase', letterSpacing: 0.5, margin: 0 }}>Hoy</p>
      <h1 style={{ fontSize: fontSize.title1, fontWeight: fontWeight.bold, color: colors.ink, margin: `${space.xs}px 0 ${space.lg}px` }}>Tu día</h1>

      {/* Carga de la semana — real */}
      <div style={{ background: colors.surface, borderRadius: radius.lg, padding: space.md, marginBottom: space.lg }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: space.sm }}>
          <span style={{ fontSize: fontSize.subhead, fontWeight: fontWeight.semibold, color: colors.ink2 }}>Carga de la semana</span>
          <span style={{ fontSize: fontSize.subhead, fontWeight: fontWeight.semibold, color: colors.ink, fontVariantNumeric: 'tabular-nums' }}>{r.total}</span>
        </div>
        {r.total > 0 ? (
          <>
            <div style={{ display: 'flex', height: 8, borderRadius: radius.full, overflow: 'hidden', background: colors.bg }}>
              <div style={{ width: `${pctGym}%`, background: colors.greenInk }} />
              <div style={{ width: `${100 - pctGym}%`, background: colors.coralInk }} />
            </div>
            <p style={{ fontSize: fontSize.footnote, color: colors.ink4, margin: `${space.sm}px 0 0` }}>Gimnasio {r.gym} · Moto {r.moto} · {r.sesiones} {r.sesiones === 1 ? 'sesión' : 'sesiones'}</p>
          </>
        ) : (
          <p style={{ fontSize: fontSize.footnote, color: colors.ink4, margin: 0 }}>Cuando registres gimnasio y moto, tu carga aparece acá.</p>
        )}
      </div>

      {/* Qué toca hoy */}
      {!hoy ? (
        <Aviso>No hay plan para esta semana. Generalo desde la pestaña Plan.</Aviso>
      ) : hoy.hecho ? (
        <Aviso>Ya entrenaste hoy. Carga del día: <strong>{hoy.cargaHecha}</strong>. Si querés sumar algo más, está perfecto igual.</Aviso>
      ) : hoy.tipo === 'gym' && hoy.dia ? (
        <>
          <DiaCard dia={hoy.dia} />
          <Button full onClick={() => onEmpezar(hoy.dia)}>Empezar sesión</Button>
        </>
      ) : hoy.tipo === 'moto' || hoy.tipo === 'simulacion' ? (
        <div style={{ background: colors.coralSoft, borderRadius: radius.lg, padding: space.lg, marginBottom: space.md, textAlign: 'center' }}>
          <div style={{ fontSize: fontSize.headline, fontWeight: fontWeight.semibold, color: colors.coralInk, marginBottom: space.xs }}>Hoy toca moto</div>
          <p style={{ fontSize: fontSize.subhead, color: colors.coralInk, margin: `0 0 ${space.md}px` }}>Andá a andar. Cuando vuelvas, registrá la salida para que cuente tu carga.</p>
          <Button variant="moto" full onClick={onRegistrarMoto}>Registrar salida</Button>
        </div>
      ) : (
        <div style={{ background: colors.surface, borderRadius: radius.lg, padding: space.lg, textAlign: 'center' }}>
          <div style={{ fontSize: fontSize.headline, fontWeight: fontWeight.semibold, color: colors.ink, marginBottom: space.xs }}>Hoy toca descanso</div>
          <p style={{ fontSize: fontSize.subhead, color: colors.ink4, margin: 0 }}>El descanso también entrena: es cuando el cuerpo asimila la carga. Si igual querés moverte, en Plan podés mover una sesión a hoy.</p>
        </div>
      )}
    </div>
  );
}

function Aviso({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ background: colors.surface, borderRadius: radius.lg, padding: space.lg, textAlign: 'center', color: colors.ink3, fontSize: fontSize.subhead }}>
      {children}
    </div>
  );
}
