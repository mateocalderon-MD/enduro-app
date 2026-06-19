// src/components/RegistrarMoto.tsx — Registrar una salida de moto (sRPE = duración × RPE).
import { useState } from 'react';
import { colors, fontFamily, fontSize, fontWeight, space, radius } from '../lib/tokens';
import { Button, Field, NumberInput, Pills, type Opt } from './ui';
import { useRegistrarSesion, hoyLocal } from '../lib/queries';

const TIPOS: Opt[] = [
  { value: 'tirada', label: 'Tirada larga' },
  { value: 'tecnico', label: 'Técnico' },
  { value: 'carrera', label: 'Carrera' },
  { value: 'libre', label: 'Vuelta libre' },
];

export function RegistrarMoto({ userId, onCerrar }: { userId: string; onCerrar: () => void }) {
  const registrar = useRegistrarSesion(userId);
  const [fecha, setFecha] = useState(hoyLocal());
  const [subtipo, setSubtipo] = useState<string | null>(null);
  const [duracion, setDuracion] = useState<number | ''>('');
  const [rpe, setRpe] = useState<number | null>(null);
  const [notas, setNotas] = useState('');

  const valido = !!fecha && !!subtipo && duracion !== '' && duracion > 0 && rpe !== null;
  const carga = duracion !== '' && rpe !== null ? duracion * rpe : null;

  function guardar() {
    registrar.mutate(
      { fecha, tipo: 'moto', subtipo, duracion_min: Number(duracion), rpe: rpe!, payload: notas ? { notas } : {} },
      { onSuccess: onCerrar },
    );
  }

  return (
    <div style={{ fontFamily, position: 'fixed', inset: 0, background: colors.bg, zIndex: 200, display: 'flex', flexDirection: 'column' }}>
      <header style={{ display: 'flex', alignItems: 'center', gap: space.md, padding: space.md, borderBottom: `1px solid ${colors.hairline}` }}>
        <button onClick={onCerrar} aria-label="Cerrar"
          style={{ width: 36, height: 36, borderRadius: radius.full, border: 'none', background: colors.surface, color: colors.ink2, fontSize: fontSize.body, cursor: 'pointer' }}>✕</button>
        <div style={{ fontSize: fontSize.headline, fontWeight: fontWeight.semibold, color: colors.ink }}>Registrar salida</div>
      </header>

      <div style={{ flex: 1, overflowY: 'auto', maxWidth: 480, width: '100%', margin: '0 auto', padding: space.lg, boxSizing: 'border-box' }}>
        <Field label="Fecha">
          <input type="date" value={fecha} max={hoyLocal()} onChange={(e) => setFecha(e.target.value)}
            style={{ width: '100%', fontFamily, fontSize: fontSize.body, color: colors.ink, background: colors.surface, border: `1px solid ${colors.hairlineStrong}`, borderRadius: radius.md, padding: space.sm, boxSizing: 'border-box' }} />
        </Field>

        <Field label="Tipo de salida"><Pills options={TIPOS} value={subtipo} onChange={setSubtipo} /></Field>

        <Field label="Duración"><NumberInput value={duracion} onChange={setDuracion} suffix="min" placeholder="90" /></Field>

        <Field label="¿Qué tan exigente fue?" hint="1 = muy suave · 10 = al límite">
          <div style={{ display: 'flex', gap: 4 }}>
            {Array.from({ length: 10 }, (_, i) => i + 1).map((n) => {
              const on = rpe === n;
              return (
                <button key={n} onClick={() => setRpe(n)}
                  style={{ flex: 1, aspectRatio: '1', fontFamily, fontSize: fontSize.subhead, fontWeight: on ? fontWeight.bold : fontWeight.regular,
                    color: on ? '#fff' : colors.ink3, background: on ? colors.coralInk : colors.surface,
                    border: `1px solid ${on ? colors.coralInk : colors.hairlineStrong}`, borderRadius: radius.sm, cursor: 'pointer' }}>
                  {n}
                </button>
              );
            })}
          </div>
        </Field>

        <Field label="Notas (opcional)">
          <textarea value={notas} onChange={(e) => setNotas(e.target.value)} rows={3} placeholder="Terreno, sensaciones, lo que quieras…"
            style={{ width: '100%', fontFamily, fontSize: fontSize.body, color: colors.ink, background: colors.surface, border: `1px solid ${colors.hairlineStrong}`, borderRadius: radius.md, padding: space.sm, boxSizing: 'border-box', resize: 'vertical' }} />
        </Field>

        {carga !== null && (
          <div style={{ background: colors.coralSoft, color: colors.coralInk, borderRadius: radius.md, padding: space.md, fontSize: fontSize.subhead, textAlign: 'center' }}>
            Carga de esta salida: <strong>{carga}</strong> <span style={{ fontSize: fontSize.footnote }}>({duracion} min × RPE {rpe})</span>
          </div>
        )}
        {registrar.isError && (
          <div style={{ marginTop: space.md, background: colors.redSoft, color: colors.redInk, fontSize: fontSize.footnote, borderRadius: radius.sm, padding: space.sm }}>
            No se pudo guardar. Probá de nuevo.
          </div>
        )}
      </div>

      <footer style={{ padding: space.md, borderTop: `1px solid ${colors.hairline}`, background: colors.bg }}>
        <div style={{ maxWidth: 480, margin: '0 auto' }}>
          <Button variant="moto" full onClick={guardar} disabled={!valido || registrar.isPending}>
            {registrar.isPending ? 'Guardando…' : 'Guardar salida'}
          </Button>
        </div>
      </footer>
    </div>
  );
}
