// src/components/Progreso.tsx — Carga de la semana: total, split gym/moto, por día.
import { colors, fontFamily, fontSize, fontWeight, space, radius } from '../lib/tokens';
import { supabase } from '../lib/supabase';
import { useSesiones, resumenSemana } from '../lib/queries';

const DIAS = ['L', 'M', 'M', 'J', 'V', 'S', 'D'];

export function Progreso({ userId }: { userId: string }) {
  const { data: sesiones, isLoading } = useSesiones(userId);
  const r = resumenSemana(sesiones ?? []);
  const maxDia = Math.max(1, ...r.porDia);
  const pctGym = r.total > 0 ? (r.gym / r.total) * 100 : 0;

  return (
    <div style={{ fontFamily, maxWidth: 480, width: '100%', margin: '0 auto', padding: space.lg, boxSizing: 'border-box' }}>
      <p style={{ fontSize: fontSize.footnote, color: colors.ink4, textTransform: 'uppercase', letterSpacing: 0.5, margin: 0 }}>Esta semana</p>
      <h1 style={{ fontSize: fontSize.title1, fontWeight: fontWeight.bold, color: colors.ink, margin: `${space.xs}px 0 ${space.lg}px` }}>Progreso</h1>

      {isLoading ? (
        <p style={{ color: colors.ink4, fontSize: fontSize.subhead, textAlign: 'center' }}>Cargando…</p>
      ) : r.sesiones === 0 ? (
        <div style={{ background: colors.surface, borderRadius: radius.lg, padding: space.lg, textAlign: 'center', color: colors.ink4, fontSize: fontSize.subhead }}>
          Todavía no registraste nada esta semana. Cargá una sesión de gym o una salida y tu carga aparece acá.
        </div>
      ) : (
        <>
          {/* Total + split */}
          <div style={{ background: colors.surface, borderRadius: radius.lg, padding: space.lg, marginBottom: space.md }}>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: space.sm, marginBottom: space.md }}>
              <span style={{ fontSize: fontSize.heroMedium, fontWeight: fontWeight.bold, color: colors.ink, fontVariantNumeric: 'tabular-nums' }}>{r.total}</span>
              <span style={{ fontSize: fontSize.subhead, color: colors.ink4 }}>carga total · {r.sesiones} {r.sesiones === 1 ? 'sesión' : 'sesiones'}</span>
            </div>
            <div style={{ display: 'flex', height: 12, borderRadius: radius.full, overflow: 'hidden', background: colors.bg }}>
              <div style={{ width: `${pctGym}%`, background: colors.greenInk }} />
              <div style={{ width: `${100 - pctGym}%`, background: colors.coralInk }} />
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: space.sm, fontSize: fontSize.footnote }}>
              <span style={{ color: colors.greenInk, fontWeight: fontWeight.medium }}>● Gimnasio {r.gym}</span>
              <span style={{ color: colors.coralInk, fontWeight: fontWeight.medium }}>Moto {r.moto} ●</span>
            </div>
          </div>

          {/* Por día */}
          <div style={{ background: colors.surface, borderRadius: radius.lg, padding: space.lg, marginBottom: space.md }}>
            <div style={{ fontSize: fontSize.subhead, fontWeight: fontWeight.semibold, color: colors.ink2, marginBottom: space.md }}>Carga por día</div>
            <div style={{ display: 'flex', alignItems: 'flex-end', gap: space.sm, height: 100 }}>
              {r.porDia.map((v, i) => (
                <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: space.xs }}>
                  <div style={{ width: '100%', height: `${(v / maxDia) * 80}px`, minHeight: v > 0 ? 4 : 0, background: v > 0 ? colors.greenInk : 'transparent', borderRadius: radius.sm }} />
                  <span style={{ fontSize: fontSize.caption2, color: colors.ink4 }}>{DIAS[i]}</span>
                </div>
              ))}
            </div>
          </div>
        </>
      )}

      <button onClick={() => supabase.auth.signOut()}
        style={{ display: 'block', margin: `${space.lg}px auto 0`, fontFamily, fontSize: fontSize.footnote, color: colors.ink4, background: 'none', border: 'none', cursor: 'pointer' }}>
        Cerrar sesión
      </button>
    </div>
  );
}
