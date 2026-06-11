// src/components/MainTabs.tsx — Armazón con pestañas + sesión a pantalla completa.
import { useState } from 'react';
import { colors, fontFamily, fontSize, fontWeight, space, radius } from '../lib/tokens';
import { TabBar, type Tab } from './TabBar';
import { Hoy } from './Hoy';
import { Plan } from './Plan';
import { SesionGym } from './SesionGym';
import { Button } from './ui';
import { supabase } from '../lib/supabase';
import { usePlanWeek, useGenerarPlan, type PlanWeekRow } from '../lib/queries';

export function MainTabs({ userId }: { userId: string }) {
  const [tab, setTab] = useState<Tab>('hoy');
  const [sesionDia, setSesionDia] = useState<any | null>(null);
  const { data: planWeek, isLoading } = usePlanWeek(userId);

  // Sesión a pantalla completa: tapa todo, sin barra de pestañas.
  if (sesionDia) return <SesionGym dia={sesionDia} onCerrar={() => setSesionDia(null)} />;

  const rutina = (planWeek as PlanWeekRow | null | undefined)?.plan ?? null;

  let contenido;
  if (isLoading) contenido = <Centro>Cargando…</Centro>;
  else if (!planWeek) contenido = <SinPlan userId={userId} />;
  else if (tab === 'hoy') contenido = <Hoy rutina={rutina} onEmpezar={setSesionDia} />;
  else if (tab === 'plan') contenido = <Plan userId={userId} rutina={rutina} />;
  else if (tab === 'moto') contenido = <Placeholder titulo="Moto" nota="Registrar salidas. Llega en la Semana 3." />;
  else contenido = <Placeholder titulo="Progreso" nota="Tu carga semanal. Llega en la Semana 3." conSalir />;

  return (
    <div style={{ fontFamily, minHeight: '100vh', background: colors.bg, paddingBottom: 80 }}>
      {contenido}
      <TabBar active={tab} onChange={setTab} />
    </div>
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

function Placeholder({ titulo, nota, conSalir }: { titulo: string; nota: string; conSalir?: boolean }) {
  return (
    <div style={{ maxWidth: 480, margin: '0 auto', padding: space.lg, textAlign: 'center', minHeight: '70vh', display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: space.sm }}>
      <h1 style={{ fontSize: fontSize.title2, fontWeight: fontWeight.bold, color: colors.ink, margin: 0 }}>{titulo}</h1>
      <p style={{ fontSize: fontSize.subhead, color: colors.ink4, margin: 0 }}>{nota}</p>
      {conSalir && (
        <button onClick={() => supabase.auth.signOut()}
          style={{ marginTop: space.lg, fontFamily, fontSize: fontSize.footnote, color: colors.ink4, background: 'none', border: 'none', cursor: 'pointer' }}>
          Cerrar sesión
        </button>
      )}
    </div>
  );
}
