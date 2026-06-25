// src/components/MainTabs.tsx — Armazón con pestañas + overlays a pantalla completa.
import { useState } from 'react';
import { colors, fontFamily, fontSize, fontWeight, space, radius } from '../lib/tokens';
import { TabBar, type Tab } from './TabBar';
import { Hoy } from './Hoy';
import { Plan } from './Plan';
import { Moto } from './Moto';
import { Progreso } from './Progreso';
import { SesionGym } from './SesionGym';
import { RegistrarMoto } from './RegistrarMoto';
import { EditarPerfil } from './EditarPerfil';
import { MenuUsuario } from './MenuUsuario';
import { createPortal } from 'react-dom';
import { Button } from './ui';
import { usePlanWeek, useGenerarPlan, useSimularMoto, type PlanWeekRow } from '../lib/queries';

export function MainTabs({ userId }: { userId: string }) {
  const [tab, setTab] = useState<Tab>('hoy');
  const [sesionDia, setSesionDia] = useState<any | null>(null);
  const [registrarMoto, setRegistrarMoto] = useState(false);
  const [editarPerfil, setEditarPerfil] = useState(false);
  const [menu, setMenu] = useState(false);
  const { data: planWeek, isLoading } = usePlanWeek(userId);
  const pw = planWeek as PlanWeekRow | null | undefined;
  const simular = useSimularMoto();
  const onSimular = () => simular.mutate(undefined, {
    onSuccess: (rutina: any) => { if (rutina?.dias?.[0]) setSesionDia(rutina.dias[0]); },
  });

  if (registrarMoto) return <RegistrarMoto userId={userId} onCerrar={() => setRegistrarMoto(false)} />;
  if (menu) return <MenuUsuario userId={userId} onEditarPerfil={() => { setMenu(false); setEditarPerfil(true); }} onCerrar={() => setMenu(false)} />;
  if (editarPerfil) return <EditarPerfil userId={userId} planWeekId={pw?.id ?? null} onCerrar={() => setEditarPerfil(false)} />;
  if (sesionDia) return <SesionGym dia={sesionDia} userId={userId} planWeekId={pw?.id ?? null} mantenerCargas={(pw?.ciclo_semana ?? 0) === 4} onCerrar={() => setSesionDia(null)} />;

  const rutina = pw?.plan ?? null;

  let contenido;
  if (isLoading) contenido = <Centro>Cargando…</Centro>;
  else if (tab === 'moto') contenido = (
    <Moto userId={userId} onRegistrar={() => setRegistrarMoto(true)}
      onSimular={onSimular} simulando={simular.isPending}
      simularError={simular.isError ? String((simular.error as Error)?.message ?? simular.error) : null} />
  );
  else if (tab === 'progreso') contenido = <Progreso userId={userId} onEditarPerfil={() => setEditarPerfil(true)} />;
  else if (!planWeek) contenido = <SinPlan userId={userId} />;
  else if (tab === 'hoy') contenido = (
    <Hoy userId={userId} rutina={rutina} semanaInicio={pw!.semana_inicio} planWeekId={pw?.id ?? null}
      onEmpezar={setSesionDia} onRegistrarMoto={() => setRegistrarMoto(true)} />
  );
  else contenido = (
    <Plan userId={userId} rutina={rutina} semanaInicio={pw!.semana_inicio} planWeekId={pw?.id ?? null} cicloSemana={pw?.ciclo_semana ?? null} onEmpezar={setSesionDia} />
  );

  return (
    <div style={{ fontFamily, minHeight: '100vh', background: colors.bg, paddingBottom: 80 }}>
      {contenido}
      <TabBar active={tab} onChange={setTab} />
      <BotonMenu onClick={() => setMenu(true)} />
    </div>
  );
}

// Botón flotante de cuenta, arriba a la derecha (vía portal, como la TabBar).
function BotonMenu({ onClick }: { onClick: () => void }) {
  return createPortal(
    <button onClick={onClick} aria-label="Mi cuenta"
      style={{ position: 'fixed', top: 'calc(env(safe-area-inset-top) + 10px)', right: 14, zIndex: 90,
        width: 38, height: 38, borderRadius: radius.full, border: `1px solid ${colors.hairline}`,
        background: 'rgba(255,255,255,0.9)', backdropFilter: 'blur(8px)', WebkitBackdropFilter: 'blur(8px)',
        color: colors.ink2, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 0 }}>
      <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="8" r="4" /><path d="M4 21c0-4 4-6 8-6s8 2 8 6" />
      </svg>
    </button>,
    document.body,
  );
}

function Centro({ children }: { children: React.ReactNode }) {
  return <div style={{ minHeight: '70vh', display: 'flex', alignItems: 'center', justifyContent: 'center', color: colors.ink4, fontSize: fontSize.body }}>{children}</div>;
}

function SinPlan({ userId }: { userId: string }) {
  const generar = useGenerarPlan(userId);
  return (
    <div style={{ maxWidth: 480, margin: '0 auto', padding: space.lg }}>
      <h1 style={{ fontSize: fontSize.title1, fontWeight: fontWeight.bold, color: colors.ink, margin: `${space.xl}px 0 ${space.lg}px` }}>El gimnasio sirve a la moto</h1>
      <div style={{ background: colors.surface, borderRadius: radius.lg, padding: space.lg, textAlign: 'center' }}>
        <p style={{ fontSize: fontSize.subhead, color: colors.ink3, margin: `0 0 ${space.md}px` }}>Todavía no generaste tu plan de esta semana.</p>
        <Button full onClick={() => generar.mutate('general')} disabled={generar.isPending}>
          {generar.isPending ? 'Generando…' : 'Generar mi plan'}
        </Button>
        {generar.isError && (
          <div style={{ marginTop: space.md, background: colors.redSoft, color: colors.redInk, fontSize: fontSize.footnote, borderRadius: radius.sm, padding: space.sm }}>
            {String((generar.error as Error)?.message ?? generar.error)}
          </div>
        )}
      </div>
    </div>
  );
}
