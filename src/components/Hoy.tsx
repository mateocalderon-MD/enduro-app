// src/components/Hoy.tsx — Pestaña Hoy: el foco del día (nunca un callejón sin salida) + tu progreso real.
import { colors, fontFamily, fontSize, fontWeight, space, radius } from '../lib/tokens';
import { Button } from './ui';
import { DiaCard } from './DiaCard';
import { useSesiones, usePlanEdits, hoyLocal } from '../lib/queries';
import { semanaEfectiva, diaDeHoy, nombreDow, type DiaSemana } from '../lib/semana';
import { progresoLifts, semanasEntrenadas } from '../lib/progresion';

export function Hoy({ userId, rutina, semanaInicio, planWeekId, onEmpezar, onRegistrarMoto }: {
  userId: string; rutina: any; semanaInicio: string; planWeekId: string | null;
  onEmpezar: (dia: any) => void; onRegistrarMoto: () => void;
}) {
  const { data: sesiones } = useSesiones(userId);
  const { data: edits } = usePlanEdits(userId, planWeekId);

  const semana = semanaEfectiva({
    semanaInicio, dias: rutina?.dias ?? [],
    edits: (edits ?? []).map((e) => ({ fecha: e.fecha, accion: e.accion, payload: e.payload, created_at: e.created_at })),
    sesiones: (sesiones ?? []).map((s) => ({ fecha: s.fecha, tipo: s.tipo, carga: s.carga })),
    hoy: hoyLocal(),
  });
  const hoy = diaDeHoy(semana);

  // Próxima sesión de gym después de hoy (para mirar adelante en estados "ya está" / descanso).
  const idxHoy = semana.findIndex((d) => d.esHoy);
  const proxima = idxHoy >= 0 ? semana.slice(idxHoy + 1).find((d) => d.tipo === 'gym' && !d.hecho) : undefined;

  // Momentum (progreso real).
  const lifts = progresoLifts(sesiones ?? []);
  const semEntren = semanasEntrenadas(sesiones ?? []);
  const totalSes = (sesiones ?? []).length;

  return (
    <div style={{ fontFamily, maxWidth: 480, width: '100%', margin: '0 auto', padding: space.lg, boxSizing: 'border-box' }}>
      <p style={{ fontSize: fontSize.footnote, color: colors.ink4, textTransform: 'uppercase', letterSpacing: 0.5, margin: 0 }}>Hoy</p>
      <h1 style={{ fontSize: fontSize.title1, fontWeight: fontWeight.bold, color: colors.ink, margin: `${space.xs}px 0 ${space.lg}px` }}>Tu día</h1>

      {/* Foco del día */}
      {!hoy ? (
        <Aviso>No hay plan para esta semana. Generalo desde la pestaña Plan.</Aviso>
      ) : hoy.tipo === 'gym' && hoy.dia && !hoy.hecho ? (
        <>
          <DiaCard dia={hoy.dia} />
          <Button full onClick={() => onEmpezar(hoy.dia)}>Empezar sesión</Button>
        </>
      ) : (hoy.tipo === 'moto' || hoy.tipo === 'simulacion') && !hoy.hecho ? (
        <div style={{ background: colors.coralSoft, borderRadius: radius.lg, padding: space.lg, textAlign: 'center' }}>
          <div style={{ fontSize: fontSize.headline, fontWeight: fontWeight.semibold, color: colors.coralInk, marginBottom: space.xs }}>Hoy toca moto</div>
          <p style={{ fontSize: fontSize.subhead, color: colors.coralInk, margin: `0 0 ${space.md}px` }}>Andá a andar. Cuando vuelvas, registrá la salida para que cuente tu carga.</p>
          <Button variant="moto" full onClick={onRegistrarMoto}>Registrar salida</Button>
        </div>
      ) : (
        <ForwardBlock hoy={hoy} proxima={proxima} onRegistrarMoto={onRegistrarMoto} />
      )}

      {/* Momentum: tu progreso real */}
      {totalSes > 0 && (
        <div style={{ marginTop: space.lg }}>
          <p style={{ fontSize: fontSize.footnote, color: colors.ink4, textTransform: 'uppercase', letterSpacing: 0.5, margin: `0 0 ${space.sm}px` }}>Tu progreso</p>
          <div style={{ background: colors.surface, borderRadius: radius.lg, padding: space.md }}>
            {lifts.length > 0 ? (
              <div>
                {lifts.slice(0, 3).map((l) => (
                  <div key={l.variante_id} style={{ display: 'flex', justifyContent: 'space-between', gap: space.sm, padding: '4px 0' }}>
                    <span style={{ fontSize: fontSize.subhead, color: colors.ink2, minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{l.nombre}</span>
                    <span style={{ fontSize: fontSize.subhead, fontWeight: fontWeight.semibold, color: colors.greenInk, whiteSpace: 'nowrap' }}>{l.primero} → {l.ultimo} kg ↑</span>
                  </div>
                ))}
              </div>
            ) : (
              <p style={{ fontSize: fontSize.footnote, color: colors.ink4, margin: 0 }}>Registrá tus pesos un par de veces y acá vas a ver cómo suben.</p>
            )}
            <div style={{
              borderTop: lifts.length > 0 ? `1px solid ${colors.hairline}` : 'none',
              marginTop: lifts.length > 0 ? space.sm : 0, paddingTop: lifts.length > 0 ? space.sm : 0,
              fontSize: fontSize.footnote, color: colors.ink4,
            }}>
              {semEntren} {semEntren === 1 ? 'semana' : 'semanas'} entrenando · {totalSes} {totalSes === 1 ? 'sesión' : 'sesiones'}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Estado "ya entrenaste hoy" o "descanso": en vez de un callejón sin salida, mira para adelante.
function ForwardBlock({ hoy, proxima, onRegistrarMoto }: {
  hoy: DiaSemana; proxima: DiaSemana | undefined; onRegistrarMoto: () => void;
}) {
  const hecho = hoy.hecho;
  return (
    <div style={{ background: colors.surface, borderRadius: radius.lg, padding: space.lg, textAlign: 'center' }}>
      <div style={{ fontSize: fontSize.headline, fontWeight: fontWeight.semibold, color: hecho ? colors.greenInk : colors.ink, marginBottom: space.xs }}>
        {hecho ? 'Listo por hoy ✓' : 'Hoy toca descanso'}
      </div>
      <p style={{ fontSize: fontSize.subhead, color: colors.ink4, margin: `0 0 ${space.md}px` }}>
        {hecho
          ? `Carga del día: ${hoy.cargaHecha}. El descanso es parte del plan.`
          : 'El descanso también entrena: es cuando el cuerpo asimila la carga.'}
      </p>
      {proxima ? (
        <div style={{ background: colors.bg, borderRadius: radius.md, padding: space.md, marginBottom: space.md }}>
          <div style={{ fontSize: fontSize.caption1, color: colors.ink4, marginBottom: 2 }}>Próxima sesión</div>
          <div style={{ fontSize: fontSize.subhead, fontWeight: fontWeight.semibold, color: colors.ink }}>
            Día {proxima.dia?.dia_numero} · {nombreDow(proxima.dow)} {proxima.fecha.slice(8)}
          </div>
        </div>
      ) : (
        <p style={{ fontSize: fontSize.footnote, color: colors.ink4, margin: `0 0 ${space.md}px` }}>No quedan sesiones de gym esta semana.</p>
      )}
      <button onClick={onRegistrarMoto} style={{
        width: '100%', fontFamily, fontSize: fontSize.subhead, fontWeight: fontWeight.semibold,
        color: colors.coralInk, background: colors.coralSoft, border: 'none', borderRadius: radius.md,
        padding: `${space.md}px`, cursor: 'pointer',
      }}>
        Registré una salida de moto
      </button>
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
