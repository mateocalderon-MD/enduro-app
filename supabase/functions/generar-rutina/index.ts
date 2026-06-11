// index.ts — Edge Function "generar-rutina"
// Lee el perfil del usuario + el catálogo desde Postgres (con RLS), corre el motor
// determinista y devuelve la rutina. NO la guarda: el frontend la persiste en plan_weeks.

import { createClient } from 'npm:@supabase/supabase-js@2';
import { generarRutina, type Catalogo, type Plantillas } from './motor.ts';

const cors = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};
const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { ...cors, 'Content-Type': 'application/json' } });

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors });
  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) return json({ error: 'No autorizado' }, 401);

    // Cliente con el JWT del usuario: la RLS limita todo a lo suyo + catálogo público.
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_ANON_KEY')!,
      { global: { headers: { Authorization: authHeader } } },
    );

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return json({ error: 'No autorizado' }, 401);

    // Perfil del usuario
    const { data: perfil, error: perr } = await supabase
      .from('profiles').select('*').eq('user_id', user.id).single();
    if (perr || !perfil) return json({ error: 'Completá tu perfil primero' }, 400);

    // Objetivo: del body (para "simular") o el del perfil
    const body = await req.json().catch(() => ({} as Record<string, unknown>));
    const objetivo = (body?.objetivo as string) ?? perfil.objetivo ?? 'general';

    // Catálogo (4 tablas en paralelo)
    const [slotsR, varsR, tplR, tslotR] = await Promise.all([
      supabase.from('exercise_slots').select('*'),
      supabase.from('exercise_variants').select('*'),
      supabase.from('templates').select('*'),
      supabase.from('template_slots').select('*'),
    ]);
    const slots = slotsR.data ?? [], variants = varsR.data ?? [];
    const templates = tplR.data ?? [], tslots = tslotR.data ?? [];

    // Armar las formas anidadas que espera el motor
    const catalogo = {
      slots: slots.map((s: any) => ({
        id: s.id, nombre: s.nombre, categoria: s.categoria, innegociable: s.innegociable,
        variantes: variants.filter((v: any) => v.slot_id === s.id),
      })),
    } as Catalogo;
    const plantillas = {
      plantillas: templates.map((t: any) => ({
        disciplina: t.disciplina, nivel: t.nivel, objetivo: t.objetivo,
        slots: tslots.filter((ts: any) => ts.template_id === t.id)
          .map((ts: any) => ({ slot_id: ts.slot_id, prioridad: ts.prioridad, dosis_base: ts.dosis_base })),
      })),
    } as Plantillas;

    const rutina = generarRutina({ ...perfil, objetivo } as any, catalogo, plantillas);
    return json(rutina, ('error' in rutina) ? 400 : 200);
  } catch (e) {
    return json({ error: String(e) }, 500);
  }
});
