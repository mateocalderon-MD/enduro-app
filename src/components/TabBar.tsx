// src/components/TabBar.tsx — Barra de pestañas inferior. Vía createPortal (componente flotante).
import { createPortal } from 'react-dom';
import type { ReactNode } from 'react';
import { colors, fontFamily, fontSize, fontWeight, space } from '../lib/tokens';

export type Tab = 'hoy' | 'plan' | 'moto' | 'progreso';

const Svg = ({ children }: { children: ReactNode }) => (
  <svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">{children}</svg>
);
const ICONS: Record<Tab, ReactNode> = {
  hoy: <Svg><circle cx="12" cy="12" r="4" /><path d="M12 2v2M12 20v2M2 12h2M20 12h2M5 5l1.4 1.4M17.6 17.6 19 19M19 5l-1.4 1.4M6.4 17.6 5 19" /></Svg>,
  plan: <Svg><rect x="3" y="5" width="18" height="16" rx="2" /><path d="M3 9h18M8 3v4M16 3v4" /></Svg>,
  moto: <Svg><circle cx="6" cy="17" r="3" /><circle cx="18" cy="17" r="3" /><path d="M6 17l4-7h5l3 7" /></Svg>,
  progreso: <Svg><path d="M5 20V10M12 20V4M19 20v-7" /></Svg>,
};
const LABELS: Record<Tab, string> = { hoy: 'Hoy', plan: 'Plan', moto: 'Moto', progreso: 'Progreso' };
const ORDEN: Tab[] = ['hoy', 'plan', 'moto', 'progreso'];

export function TabBar({ active, onChange }: { active: Tab; onChange: (t: Tab) => void }) {
  return createPortal(
    <nav style={{ position: 'fixed', bottom: 0, left: 0, right: 0, display: 'flex', justifyContent: 'space-around',
      background: 'rgba(255,255,255,0.92)', backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)',
      borderTop: `1px solid ${colors.hairline}`, paddingBottom: 'env(safe-area-inset-bottom)', zIndex: 100 }}>
      {ORDEN.map((t) => {
        const on = active === t;
        return (
          <button key={t} onClick={() => onChange(t)}
            style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2,
              padding: `${space.sm}px 0`, background: 'none', border: 'none', cursor: 'pointer', color: on ? colors.greenInk : colors.ink4 }}>
            {ICONS[t]}
            <span style={{ fontFamily, fontSize: fontSize.caption2, fontWeight: on ? fontWeight.semibold : fontWeight.regular }}>{LABELS[t]}</span>
          </button>
        );
      })}
    </nav>,
    document.body,
  );
}
