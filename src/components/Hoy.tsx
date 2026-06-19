// src/components/Hoy.tsx — Pestaña Hoy: qué toca hoy + carga real de la semana.
import { colors, fontFamily, fontSize, fontWeight, space, radius } from '../lib/tokens';
import { Button } from './ui';
import { DiaCard } from './Plan';
import { useSesiones, resumenSemana } from '../lib/queries';

export function Hoy({ userId, rutina, onEmpezar }: { userId: string; rutina: any; onEmpezar: (dia: any) => void }) {
  const { data: sesiones } = useSesiones(userId);
  const r = resumenSemana(sesiones ?? []);
  const dias: any[] = rutina?.dias ?? [];
  const hoy = dias[0]; // MVP: la primera sesión. En adelante, Hoy sabrá cuál te toca.
  const pctGym = r.total > 0 ? (r.gym / r.total) * 100 : 0;

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

      {hoy ? (
        <>
          <DiaCard dia={hoy} />
          <Button full onClick={() => onEmpezar(hoy)}>Empezar sesión</Button>
        </>
      ) : (
        <div style={{ background: colors.surface, borderRadius: radius.lg, padding: space.lg, textAlign: 'center', color: colors.ink4, fontSize: fontSize.subhead }}>
          No hay sesión cargada todavía. Generá tu plan desde la pestaña Plan.
        </div>
      )}
    </div>
  );
}
