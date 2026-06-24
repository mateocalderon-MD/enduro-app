// src/components/BloqueStrip.tsx — Orientación del bloque en la pestaña Plan:
// "Semana N de 4 · fase" + la tira de 4 casilleros con la semana actual resaltada.
import { colors, fontFamily, fontSize, fontWeight, space, radius } from '../lib/tokens';
import { tiraBloque, etiquetaFase, BLOQUE } from '../lib/ciclo';

export function BloqueStrip({ cicloSemana }: { cicloSemana: number | null }) {
  const semana = cicloSemana ?? 1; // sin dato todavía -> arranque de bloque
  const sinDato = cicloSemana == null;
  const casilleros = tiraBloque(semana);

  return (
    <div style={{ fontFamily, background: colors.surface, borderRadius: radius.lg, padding: space.md, marginBottom: space.lg }}>
      <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: space.sm, marginBottom: space.sm }}>
        <span style={{ fontSize: fontSize.subhead, fontWeight: fontWeight.semibold, color: colors.ink }}>
          Semana {semana} de {BLOQUE} · {etiquetaFase(semana)}
        </span>
        {sinDato && <span style={{ fontSize: fontSize.caption2, color: colors.ink4 }}>se activa al regenerar</span>}
      </div>
      <div style={{ display: 'flex', gap: space.xs }}>
        {casilleros.map((c) => {
          const pasada = c.semana < semana;
          const bg = c.actual ? colors.greenInk : pasada ? colors.greenSoft : colors.bg;
          const fg = c.actual ? '#fff' : pasada ? colors.greenInk : colors.ink4;
          const borde = c.actual ? colors.greenInk : colors.hairlineStrong;
          return (
            <div key={c.semana} style={{
              flex: 1, textAlign: 'center', padding: `${space.sm}px 2px`, borderRadius: radius.sm,
              background: bg, border: `1px solid ${borde}`,
            }}>
              <div style={{ fontSize: fontSize.caption1, fontWeight: fontWeight.bold, color: fg }}>{c.semana}</div>
              <div style={{ fontSize: fontSize.caption2, color: fg, marginTop: 1 }}>{c.etiqueta}</div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
