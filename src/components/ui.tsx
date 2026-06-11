// src/components/ui.tsx — Piezas reutilizables de UI, estiladas con los tokens.
import type { ReactNode, CSSProperties } from 'react';
import { colors, fontFamily, fontSize, fontWeight, space, radius } from '../lib/tokens';

type Variant = 'primary' | 'moto' | 'ghost';
export function Button({ children, onClick, variant = 'primary', disabled, full }:
  { children: ReactNode; onClick?: () => void; variant?: Variant; disabled?: boolean; full?: boolean }) {
  const bg = disabled ? colors.inkDisabled : variant === 'moto' ? colors.coralInk : variant === 'ghost' ? 'transparent' : colors.greenInk;
  const fg = variant === 'ghost' ? colors.ink2 : '#fff';
  return (
    <button onClick={onClick} disabled={disabled}
      style={{ width: full ? '100%' : undefined, fontFamily, fontSize: fontSize.callout, fontWeight: fontWeight.semibold,
        color: fg, background: bg, border: variant === 'ghost' ? `1px solid ${colors.hairlineStrong}` : 'none',
        borderRadius: radius.md, padding: `${space.md}px ${space.lg}px`, cursor: disabled ? 'default' : 'pointer' }}>
      {children}
    </button>
  );
}

export function Field({ label, hint, children }: { label: string; hint?: string; children: ReactNode }) {
  return (
    <div style={{ marginBottom: space.md }}>
      <label style={{ display: 'block', fontSize: fontSize.subhead, fontWeight: fontWeight.medium, color: colors.ink2, marginBottom: space.xs }}>{label}</label>
      {children}
      {hint && <p style={{ fontSize: fontSize.footnote, color: colors.ink4, margin: `${space.xs}px 0 0` }}>{hint}</p>}
    </div>
  );
}

const inputBase: CSSProperties = { width: '100%', fontFamily, fontSize: fontSize.body, color: colors.ink,
  background: colors.surface, border: `1px solid ${colors.hairlineStrong}`, borderRadius: radius.md, padding: space.sm, boxSizing: 'border-box' };

export function NumberInput({ value, onChange, suffix, placeholder }:
  { value: number | ''; onChange: (v: number | '') => void; suffix?: string; placeholder?: string }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: space.sm }}>
      <input type="number" inputMode="numeric" placeholder={placeholder} value={value}
        onChange={(e) => onChange(e.target.value === '' ? '' : Number(e.target.value))} style={inputBase} />
      {suffix && <span style={{ fontSize: fontSize.subhead, color: colors.ink4 }}>{suffix}</span>}
    </div>
  );
}

export interface Opt { value: string; label: string }
export function Pills({ options, value, onChange }: { options: Opt[]; value: string | null; onChange: (v: string) => void }) {
  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: space.sm }}>
      {options.map((o) => {
        const on = value === o.value;
        return (
          <button key={o.value} onClick={() => onChange(o.value)}
            style={{ fontFamily, fontSize: fontSize.subhead, fontWeight: on ? fontWeight.semibold : fontWeight.regular,
              color: on ? colors.greenInk : colors.ink2, background: on ? colors.greenSoft : colors.surface,
              border: `1px solid ${on ? colors.greenInk : colors.hairlineStrong}`, borderRadius: radius.full,
              padding: `${space.sm}px ${space.md}px`, cursor: 'pointer' }}>
            {o.label}
          </button>
        );
      })}
    </div>
  );
}

export function MultiPills({ options, values, onToggle }: { options: Opt[]; values: string[]; onToggle: (v: string) => void }) {
  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: space.sm }}>
      {options.map((o) => {
        const on = values.includes(o.value);
        return (
          <button key={o.value} onClick={() => onToggle(o.value)}
            style={{ fontFamily, fontSize: fontSize.subhead, fontWeight: on ? fontWeight.semibold : fontWeight.regular,
              color: on ? colors.coralInk : colors.ink2, background: on ? colors.coralSoft : colors.surface,
              border: `1px solid ${on ? colors.coralInk : colors.hairlineStrong}`, borderRadius: radius.full,
              padding: `${space.sm}px ${space.md}px`, cursor: 'pointer' }}>
            {o.label}
          </button>
        );
      })}
    </div>
  );
}

export function YesNo({ value, onChange }: { value: boolean | null; onChange: (v: boolean) => void }) {
  const opt = (v: boolean, label: string) => {
    const on = value === v;
    return (
      <button onClick={() => onChange(v)}
        style={{ flex: 1, fontFamily, fontSize: fontSize.subhead, fontWeight: on ? fontWeight.semibold : fontWeight.regular,
          color: on ? colors.ink : colors.ink3, background: on ? colors.bg : colors.surface,
          border: `1px solid ${on ? colors.ink3 : colors.hairlineStrong}`, borderRadius: radius.md, padding: space.sm, cursor: 'pointer' }}>
        {label}
      </button>
    );
  };
  return <div style={{ display: 'flex', gap: space.sm }}>{opt(false, 'No')}{opt(true, 'Sí')}</div>;
}

export function ProgressDots({ total, current }: { total: number; current: number }) {
  return (
    <div style={{ display: 'flex', gap: space.xs, justifyContent: 'center', marginBottom: space.lg }}>
      {Array.from({ length: total }, (_, i) => (
        <div key={i} style={{ width: i === current ? 20 : 7, height: 7, borderRadius: radius.full,
          background: i <= current ? colors.greenInk : colors.hairlineStrong, transition: 'width .2s' }} />
      ))}
    </div>
  );
}
