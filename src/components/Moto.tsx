// src/components/Moto.tsx — Pestaña Moto: registrar salidas + historial.
import { colors, fontFamily, fontSize, fontWeight, space, radius } from '../lib/tokens';
import { Button } from './ui';
import { useSesiones } from '../lib/queries';

const MESES = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'];
function fechaCorta(iso: string): string {
  const [, m, d] = iso.split('-').map(Number);
  return `${d} ${MESES[m - 1]}`;
}
const SUBTIPOS: Record<string, string> = { tirada: 'Tirada larga', tecnico: 'Técnico', carrera: 'Carrera', libre: 'Vuelta libre' };

export function Moto({ userId, onRegistrar }: { userId: string; onRegistrar: () => void }) {
  const { data: sesiones, isLoading } = useSesiones(userId);
  const salidas = (sesiones ?? []).filter((s) => s.tipo === 'moto' || s.tipo === 'simulacion');

  return (
    <div style={{ fontFamily, maxWidth: 480, width: '100%', margin: '0 auto', padding: space.lg, boxSizing: 'border-box' }}>
      <p style={{ fontSize: fontSize.footnote, color: colors.ink4, textTransform: 'uppercase', letterSpacing: 0.5, margin: 0 }}>Tu moto</p>
      <h1 style={{ fontSize: fontSize.title1, fontWeight: fontWeight.bold, color: colors.ink, margin: `${space.xs}px 0 ${space.lg}px` }}>Salidas</h1>

      <Button variant="moto" full onClick={onRegistrar}>Registrar salida</Button>

      <div style={{ marginTop: space.lg }}>
        {isLoading ? (
          <p style={{ color: colors.ink4, fontSize: fontSize.subhead, textAlign: 'center' }}>Cargando…</p>
        ) : salidas.length === 0 ? (
          <div style={{ background: colors.surface, borderRadius: radius.lg, padding: space.lg, textAlign: 'center', color: colors.ink4, fontSize: fontSize.subhead }}>
            Todavía no registraste salidas. Cuando montes, anotala acá — esa carga es la que maneja tu plan.
          </div>
        ) : (
          salidas.map((s) => (
            <div key={s.id} style={{ background: colors.surface, borderRadius: radius.lg, padding: space.md, marginBottom: space.sm, display: 'flex', alignItems: 'center', gap: space.md }}>
              <div style={{ width: 46, textAlign: 'center', flexShrink: 0 }}>
                <div style={{ fontSize: fontSize.footnote, color: colors.coralInk, fontWeight: fontWeight.semibold }}>{fechaCorta(s.fecha)}</div>
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: fontSize.subhead, fontWeight: fontWeight.semibold, color: colors.ink }}>
                  {s.tipo === 'simulacion' ? 'Simulación' : (SUBTIPOS[s.subtipo ?? ''] ?? 'Salida')}
                </div>
                <div style={{ fontSize: fontSize.caption1, color: colors.ink4 }}>{s.duracion_min} min · RPE {s.rpe}</div>
              </div>
              <div style={{ textAlign: 'right', flexShrink: 0 }}>
                <div style={{ fontSize: fontSize.headline, fontWeight: fontWeight.bold, color: colors.coralInk, fontVariantNumeric: 'tabular-nums' }}>{s.carga}</div>
                <div style={{ fontSize: fontSize.caption2, color: colors.ink4 }}>carga</div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
