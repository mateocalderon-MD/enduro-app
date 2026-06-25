// src/components/MenuUsuario.tsx — Menú de usuario a pantalla completa (vía portal).
import { useEffect, useState, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { supabase } from '../lib/supabase';
import { colors, fontFamily, fontSize, fontWeight, space, radius } from '../lib/tokens';
import { useSesiones, useProfile } from '../lib/queries';
import { exportarExcel } from '../lib/exportarExcel';
import { usePwaInstall } from '../lib/usePwaInstall';

const APP_VERSION = '1.0.0';

export function MenuUsuario({ userId, onEditarPerfil, onCerrar }:
  { userId: string; onEditarPerfil: () => void; onCerrar: () => void }) {
  const [email, setEmail] = useState('');
  const { data: sesiones } = useSesiones(userId);
  const { data: profile } = useProfile(userId);
  const { instalable, esIOS, yaInstalada, instalar } = usePwaInstall();
  const [exportando, setExportando] = useState(false);
  const [errExport, setErrExport] = useState<string | null>(null);
  const [mostrarIOS, setMostrarIOS] = useState(false);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setEmail(data.user?.email ?? ''));
  }, []);

  const inicial = (email[0] ?? '?').toUpperCase();

  async function onExportar() {
    setExportando(true); setErrExport(null);
    try { exportarExcel(sesiones ?? [], profile ?? null); }
    catch (e) { setErrExport('No se pudo generar el Excel. Probá de nuevo.'); console.error(e); }
    finally { setExportando(false); }
  }

  return createPortal(
    <div style={{ fontFamily, position: 'fixed', inset: 0, background: colors.bg, zIndex: 300, display: 'flex', flexDirection: 'column' }}>
      <header style={{ display: 'flex', alignItems: 'center', gap: space.md, padding: space.md, borderBottom: `1px solid ${colors.hairline}` }}>
        <button onClick={onCerrar} aria-label="Cerrar"
          style={{ width: 36, height: 36, borderRadius: radius.full, border: 'none', background: colors.surface, color: colors.ink2, fontSize: fontSize.body, cursor: 'pointer' }}>✕</button>
        <div style={{ fontSize: fontSize.headline, fontWeight: fontWeight.semibold, color: colors.ink }}>Mi cuenta</div>
      </header>

      <div style={{ flex: 1, overflowY: 'auto', maxWidth: 480, width: '100%', margin: '0 auto', padding: space.lg, boxSizing: 'border-box' }}>
        {/* Identidad */}
        <div style={{ display: 'flex', alignItems: 'center', gap: space.md, marginBottom: space.xl }}>
          <div style={{ width: 52, height: 52, borderRadius: radius.full, background: colors.greenInk, color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: fontSize.headline, fontWeight: fontWeight.bold, flexShrink: 0 }}>{inicial}</div>
          <div style={{ minWidth: 0 }}>
            <div style={{ fontSize: fontSize.body, fontWeight: fontWeight.semibold, color: colors.ink, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{email || 'Tu cuenta'}</div>
            {profile && <div style={{ fontSize: fontSize.caption1, color: colors.ink4 }}>{profile.disciplina.replace('_', ' ')} · {profile.nivel}</div>}
          </div>
        </div>

        <Grupo>
          <Item icono="🎯" titulo="Editar objetivos" sub="Disciplina, nivel, equipo, lesiones" onClick={() => { onCerrar(); onEditarPerfil(); }} />
        </Grupo>

        <Grupo>
          <Item icono="📊" titulo={exportando ? 'Generando…' : 'Descargar mis datos (Excel)'}
            sub="Sesiones, ejercicios y perfil — para analizar donde quieras"
            onClick={onExportar} disabled={exportando} />
          {errExport && <div style={{ padding: `0 ${space.md}px ${space.md}px`, fontSize: fontSize.footnote, color: colors.redInk }}>{errExport}</div>}
        </Grupo>

        {!yaInstalada && (
          <Grupo>
            {esIOS ? (
              <>
                <Item icono="📱" titulo="Instalar app en el celular" sub="Agregala a tu pantalla de inicio" onClick={() => setMostrarIOS(!mostrarIOS)} />
                {mostrarIOS && (
                  <div style={{ padding: `0 ${space.md}px ${space.md}px`, fontSize: fontSize.footnote, color: colors.ink3, lineHeight: 1.7 }}>
                    1. Tocá <b>Compartir</b> (el cuadrado con la flecha ↑) abajo en Safari.<br />
                    2. Bajá y tocá <b>“Agregar a inicio”</b>.<br />
                    3. Confirmá — te queda como una app más. 🏍️
                  </div>
                )}
              </>
            ) : instalable ? (
              <Item icono="📱" titulo="Instalar app en el celular" sub="Se abre como app, sin barra del navegador" onClick={instalar} />
            ) : (
              <Item icono="📱" titulo="Instalar app en el celular" sub="En el celu: menú del navegador (⋮) → “Instalar app” o “Agregar a inicio”" onClick={() => {}} disabled />
            )}
          </Grupo>
        )}

        <Grupo>
          <Item icono="🚪" titulo="Cerrar sesión" onClick={() => supabase.auth.signOut()} peligro />
        </Grupo>

        <div style={{ textAlign: 'center', marginTop: space.xl, fontSize: fontSize.caption2, color: colors.ink4 }}>
          El gimnasio sirve a la moto · v{APP_VERSION}
        </div>
      </div>
    </div>,
    document.body,
  );
}

function Grupo({ children }: { children: ReactNode }) {
  return <div style={{ background: colors.surface, borderRadius: radius.lg, overflow: 'hidden', marginBottom: space.md }}>{children}</div>;
}

function Item({ icono, titulo, sub, onClick, disabled, peligro }:
  { icono: string; titulo: string; sub?: string; onClick: () => void; disabled?: boolean; peligro?: boolean }) {
  return (
    <button onClick={onClick} disabled={disabled}
      style={{ width: '100%', display: 'flex', alignItems: 'center', gap: space.md, padding: space.md, background: 'none', border: 'none',
        cursor: disabled ? 'default' : 'pointer', textAlign: 'left', opacity: disabled ? 0.55 : 1, fontFamily }}>
      <span style={{ fontSize: 22, flexShrink: 0 }}>{icono}</span>
      <span style={{ flex: 1, minWidth: 0 }}>
        <span style={{ display: 'block', fontSize: fontSize.body, fontWeight: fontWeight.medium, color: peligro ? colors.redInk : colors.ink }}>{titulo}</span>
        {sub && <span style={{ display: 'block', fontSize: fontSize.caption1, color: colors.ink4, marginTop: 1 }}>{sub}</span>}
      </span>
    </button>
  );
}
