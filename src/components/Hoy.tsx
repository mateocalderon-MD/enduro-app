// src/components/Hoy.tsx — Pestaña Hoy: qué toca hoy.
import { colors, fontFamily, fontSize, fontWeight, space, radius } from '../lib/tokens';
import { Button } from './ui';
import { DiaCard } from './Plan';

export function Hoy({ rutina, onEmpezar }: { rutina: any; onEmpezar: (dia: any) => void }) {
  const dias: any[] = rutina?.dias ?? [];
  const hoy = dias[0]; // MVP: la primera sesión de la semana. En la Sem 3, Hoy sabrá cuál te toca.

  return (
    <div style={{ fontFamily, maxWidth: 480, width: '100%', margin: '0 auto', padding: space.lg, boxSizing: 'border-box' }}>
      <p style={{ fontSize: fontSize.footnote, color: colors.ink4, textTransform: 'uppercase', letterSpacing: 0.5, margin: 0 }}>Hoy</p>
      <h1 style={{ fontSize: fontSize.title1, fontWeight: fontWeight.bold, color: colors.ink, margin: `${space.xs}px 0 ${space.lg}px` }}>Tu día</h1>

      {/* Carga de la semana — estado vacío honesto (el registro llega en la Sem 3) */}
      <div style={{ background: colors.surface, borderRadius: radius.lg, padding: space.md, marginBottom: space.lg }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: space.sm }}>
          <span style={{ fontSize: fontSize.subhead, fontWeight: fontWeight.semibold, color: colors.ink2 }}>Carga de la semana</span>
          <span style={{ fontSize: fontSize.caption1, color: colors.ink4 }}>0 sesiones</span>
        </div>
        <div style={{ height: 8, borderRadius: radius.full, background: colors.bg }} />
        <p style={{ fontSize: fontSize.footnote, color: colors.ink4, margin: `${space.sm}px 0 0` }}>Cuando registres gimnasio y moto, tu carga aparece acá.</p>
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
