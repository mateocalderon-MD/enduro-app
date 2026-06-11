// src/components/SesionGym.tsx — Sesión de gimnasio a pantalla completa (solo lectura).
// El registro de series (lo que hiciste) llega en la Semana 3.
import { colors, fontFamily, fontSize, fontWeight, space, radius } from '../lib/tokens';
import { Button } from './ui';
import { resumenDosis } from './Plan';

export function SesionGym({ dia, onCerrar }: { dia: any; onCerrar: () => void }) {
  const esCircuito = dia.formato === 'circuito';
  const titulo = esCircuito ? 'Circuito (simulación)' : `Día ${dia.dia_numero}`;

  return (
    <div style={{ fontFamily, position: 'fixed', inset: 0, background: colors.bg, zIndex: 200, display: 'flex', flexDirection: 'column' }}>
      {/* Header */}
      <header style={{ display: 'flex', alignItems: 'center', gap: space.md, padding: space.md, borderBottom: `1px solid ${colors.hairline}`,
        background: 'rgba(255,255,255,0.92)', backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)' }}>
        <button onClick={onCerrar} aria-label="Cerrar"
          style={{ width: 36, height: 36, borderRadius: radius.full, border: 'none', background: colors.bg, color: colors.ink2, fontSize: fontSize.body, cursor: 'pointer' }}>✕</button>
        <div>
          <div style={{ fontSize: fontSize.headline, fontWeight: fontWeight.semibold, color: colors.ink }}>{titulo}</div>
          <div style={{ fontSize: fontSize.caption1, color: colors.ink4 }}>{dia.ejercicios.length} ejercicios</div>
        </div>
      </header>

      {/* Lista de ejercicios */}
      <div style={{ flex: 1, overflowY: 'auto', maxWidth: 480, width: '100%', margin: '0 auto', padding: space.lg, boxSizing: 'border-box' }}>
        {dia.ejercicios.map((e: any, i: number) => (
          <div key={i} style={{ background: colors.surface, borderRadius: radius.lg, padding: space.md, marginBottom: space.md }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', gap: space.sm }}>
              <h2 style={{ fontSize: fontSize.headline, fontWeight: fontWeight.semibold, color: colors.ink, margin: 0 }}>{e.variante_nombre}</h2>
              <span style={{ fontSize: fontSize.footnote, color: colors.greenInk, fontWeight: fontWeight.semibold, whiteSpace: 'nowrap' }}>{resumenDosis(e.dosis)}</span>
            </div>
            <div style={{ fontSize: fontSize.caption1, color: colors.ink4, marginBottom: e.descripcion ? space.sm : 0 }}>{e.slot_nombre}</div>
            {e.descripcion && <p style={{ fontSize: fontSize.subhead, color: colors.ink2, lineHeight: 1.5, margin: `0 0 ${space.sm}px` }}>{e.descripcion}</p>}
            {Array.isArray(e.claves) && e.claves.length > 0 && (
              <ul style={{ margin: 0, padding: 0, listStyle: 'none' }}>
                {e.claves.map((c: string, j: number) => (
                  <li key={j} style={{ display: 'flex', gap: space.sm, alignItems: 'flex-start', fontSize: fontSize.footnote, color: colors.ink3, padding: '3px 0' }}>
                    <span style={{ color: colors.greenInk, flexShrink: 0 }}>•</span>{c}
                  </li>
                ))}
              </ul>
            )}
          </div>
        ))}
      </div>

      {/* Footer */}
      <footer style={{ padding: space.md, borderTop: `1px solid ${colors.hairline}`, background: colors.bg }}>
        <div style={{ maxWidth: 480, margin: '0 auto' }}>
          <Button full onClick={onCerrar}>Terminé</Button>
          <p style={{ fontSize: fontSize.caption1, color: colors.ink4, textAlign: 'center', margin: `${space.sm}px 0 0` }}>El registro de lo que hiciste llega en la Semana 3.</p>
        </div>
      </footer>
    </div>
  );
}
