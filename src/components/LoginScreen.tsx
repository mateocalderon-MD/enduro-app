// src/components/LoginScreen.tsx
// Auth básico: entrar o crear cuenta con email + contraseña (Supabase Auth).
// Al loguearse, el listener de App actualiza la sesión solo (no hace falta callback).

import { useState } from 'react';
import { supabase } from '../lib/supabase';
import { colors, fontFamily, fontSize, space, radius } from '../lib/tokens';

type Mode = 'signin' | 'signup';

export function LoginScreen() {
  const [mode, setMode] = useState<Mode>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function submit() {
    setError(null);
    setInfo(null);
    setLoading(true);
    if (mode === 'signin') {
      const { error: err } = await supabase.auth.signInWithPassword({ email, password });
      if (err) setError(traducir(err.message));
    } else {
      const { data, error: err } = await supabase.auth.signUp({ email, password });
      if (err) setError(traducir(err.message));
      else if (!data.session) setInfo('Te mandamos un mail para confirmar la cuenta.');
    }
    setLoading(false);
  }

  const disabled = loading || !email || password.length < 6;

  return (
    <div style={{ fontFamily, minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: colors.bg, padding: space.md }}>
      <div style={{ width: '100%', maxWidth: 360, background: colors.surface, borderRadius: radius.xl, padding: space.lg, boxShadow: '0 1px 3px rgba(0,0,0,0.06)' }}>
        <h1 style={{ fontSize: fontSize.title1, fontWeight: 700, color: colors.ink, margin: `0 0 ${space.xs}px` }}>
          {mode === 'signin' ? 'Entrar' : 'Crear cuenta'}
        </h1>
        <p style={{ fontSize: fontSize.footnote, color: colors.ink4, margin: `0 0 ${space.lg}px` }}>
          El gimnasio sirve a la moto.
        </p>

        <Field label="Mail">
          <input
            type="email"
            inputMode="email"
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            style={inputStyle}
          />
        </Field>

        <Field label="Contraseña">
          <input
            type="password"
            autoComplete={mode === 'signin' ? 'current-password' : 'new-password'}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            style={inputStyle}
          />
        </Field>

        {error && <Note bg={colors.redSoft} color={colors.redInk}>{error}</Note>}
        {info && <Note bg={colors.blueSoft} color={colors.blueInk}>{info}</Note>}

        <button
          onClick={submit}
          disabled={disabled}
          style={{ width: '100%', marginTop: space.md, fontFamily, fontSize: fontSize.callout, fontWeight: 600, color: '#fff', background: disabled ? colors.inkDisabled : colors.greenInk, border: 'none', borderRadius: radius.md, padding: space.md, cursor: disabled ? 'default' : 'pointer' }}
        >
          {loading ? 'Un segundo…' : mode === 'signin' ? 'Entrar' : 'Crear cuenta'}
        </button>

        <button
          onClick={() => { setMode(mode === 'signin' ? 'signup' : 'signin'); setError(null); setInfo(null); }}
          style={{ width: '100%', marginTop: space.sm, fontFamily, fontSize: fontSize.footnote, color: colors.ink3, background: 'none', border: 'none', cursor: 'pointer' }}
        >
          {mode === 'signin' ? '¿No tenés cuenta? Crear una' : '¿Ya tenés cuenta? Entrar'}
        </button>
      </div>
    </div>
  );
}

const inputStyle: React.CSSProperties = {
  width: '100%',
  fontFamily,
  fontSize: fontSize.body,
  color: colors.ink,
  background: colors.surface,
  border: `1px solid ${colors.hairlineStrong}`,
  borderRadius: radius.md,
  padding: space.sm,
  boxSizing: 'border-box',
};

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: space.md }}>
      <label style={{ display: 'block', fontSize: fontSize.footnote, color: colors.ink3, marginBottom: space.xs }}>{label}</label>
      {children}
    </div>
  );
}

function Note({ bg, color, children }: { bg: string; color: string; children: React.ReactNode }) {
  return (
    <div style={{ marginTop: space.sm, background: bg, color, fontSize: fontSize.footnote, borderRadius: radius.sm, padding: space.sm }}>
      {children}
    </div>
  );
}

function traducir(msg: string): string {
  if (msg.includes('Invalid login credentials')) return 'Mail o contraseña incorrectos.';
  if (msg.toLowerCase().includes('already registered')) return 'Ese mail ya tiene cuenta. Probá entrar.';
  if (msg.includes('at least 6')) return 'La contraseña necesita al menos 6 caracteres.';
  if (msg.toLowerCase().includes('email')) return 'Revisá el mail, parece inválido.';
  return 'Algo salió mal. Probá de nuevo.';
}
