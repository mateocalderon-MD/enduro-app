// src/lib/queries.ts — Hooks de datos (TanStack Query). Backend siempre por acá.
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from './supabase';
import { proximoEstado, aplicarLiviana, aplicarAcondicionamiento, ordenarDia } from './ciclo';
import { addDias } from './semana';

export interface ProfileRow {
  user_id: string;
  disciplina: string; nivel: string; objetivo: string;
  edad: number; peso_kg: number; altura_cm: number;
  dias_disponibles: number; minutos_por_sesion: number | null;
  equipo: string; lesiones: string[];
  parq: unknown; consent_at: string | null;
}

export interface PlanWeekRow {
  id: string; user_id: string; semana_inicio: string;
  plan: any; engine_version: string; generated_at: string;
  ciclo_semana: number | null;
}

export interface SessionRow {
  id: string; user_id: string; fecha: string;
  tipo: 'gym' | 'moto' | 'simulacion'; subtipo: string | null;
  duracion_min: number; rpe: number; carga: number;
  plan_week_id: string | null; payload: any;
  created_at: string; updated_at: string;
}

export interface NuevaSesion {
  fecha: string; tipo: 'gym' | 'moto' | 'simulacion'; subtipo?: string | null;
  duracion_min: number; rpe: number; plan_week_id?: string | null; payload?: any;
}

// Lunes de la semana actual, en hora LOCAL (YYYY-MM-DD).
export function lunesDeEstaSemana(): string {
  const d = new Date();
  const day = d.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  d.setDate(d.getDate() + diff);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

// Hoy en hora LOCAL (YYYY-MM-DD).
export function hoyLocal(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

// Días entre dos fechas ISO (YYYY-MM-DD).
function diasEntre(a: string, b: string): number {
  return Math.round((new Date(b + 'T00:00:00').getTime() - new Date(a + 'T00:00:00').getTime()) / 86400000);
}

// Estado del ciclo para la semana que se va a generar.
// reset=true (p. ej. al editar el perfil) -> arranca bloque nuevo en semana 1.
async function calcularProximoCiclo(userId: string, reset: boolean) {
  const lunes = lunesDeEstaSemana();
  if (reset) {
    return proximoEstado({ ultimoCicloSemana: null, semanasDesdeUltimo: 1, cargaUltimaSemana: 0, cargaUltimasSemanas: 0 });
  }
  // Última semana generada ANTES de esta.
  const { data: prev } = await supabase
    .from('plan_weeks').select('semana_inicio, ciclo_semana')
    .eq('user_id', userId).lt('semana_inicio', lunes)
    .order('semana_inicio', { ascending: false }).limit(1).maybeSingle();
  if (!prev) {
    return proximoEstado({ ultimoCicloSemana: null, semanasDesdeUltimo: 1, cargaUltimaSemana: 0, cargaUltimasSemanas: 0 });
  }
  const semanasDesdeUltimo = Math.max(1, Math.round(diasEntre(prev.semana_inicio, lunes) / 7));
  const inicioSemanaPasada = addDias(lunes, -7);
  const desde2 = addDias(lunes, -14);
  const { data: ses } = await supabase
    .from('sessions').select('fecha, carga')
    .eq('user_id', userId).gte('fecha', desde2).lt('fecha', lunes);
  const lista = (ses ?? []) as { fecha: string; carga: number }[];
  const cargaUltimaSemana = lista.filter((s) => s.fecha >= inicioSemanaPasada).reduce((a, s) => a + (s.carga ?? 0), 0);
  const cargaUltimasSemanas = lista.reduce((a, s) => a + (s.carga ?? 0), 0);
  return proximoEstado({
    ultimoCicloSemana: prev.ciclo_semana ?? null,
    semanasDesdeUltimo, cargaUltimaSemana, cargaUltimasSemanas,
  });
}

// ---------- Perfil ----------
export function useProfile(userId: string | undefined) {
  return useQuery({
    queryKey: ['profile', userId],
    enabled: !!userId,
    queryFn: async (): Promise<ProfileRow | null> => {
      const { data, error } = await supabase.from('profiles').select('*').eq('user_id', userId!).maybeSingle();
      if (error) throw error;
      return data as ProfileRow | null;
    },
  });
}

export function useSaveProfile() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (perfil: Partial<ProfileRow> & { user_id: string }): Promise<ProfileRow> => {
      const { data, error } = await supabase.from('profiles').upsert(perfil).select().single();
      if (error) throw error;
      return data as ProfileRow;
    },
    onSuccess: (data) => { qc.invalidateQueries({ queryKey: ['profile', data.user_id] }); },
  });
}

// ---------- Plan de la semana ----------
export function usePlanWeek(userId: string | undefined) {
  return useQuery({
    queryKey: ['plan_week', userId],
    enabled: !!userId,
    queryFn: async (): Promise<PlanWeekRow | null> => {
      const { data, error } = await supabase
        .from('plan_weeks').select('*').eq('user_id', userId!).eq('semana_inicio', lunesDeEstaSemana()).maybeSingle();
      if (error) throw error;
      return data as PlanWeekRow | null;
    },
  });
}

type GenerarArg = string | { objetivo?: string; reset?: boolean };

export function useGenerarPlan(userId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (arg: GenerarArg = 'general') => {
      const opts = typeof arg === 'string'
        ? { objetivo: arg, reset: false }
        : { objetivo: arg.objetivo ?? 'general', reset: !!arg.reset };
      const { data, error } = await supabase.functions.invoke('generar-rutina', { body: { objetivo: opts.objetivo } });
      if (error) {
        let msg = error.message;
        const ctx = (error as any).context;
        if (ctx && typeof ctx.json === 'function') {
          try { const body = await ctx.json(); if (body?.error) msg = body.error; } catch { /* sin cuerpo */ }
        }
        throw new Error(msg);
      }
      if (data?.error) throw new Error(data.error);
      const estado = await calcularProximoCiclo(userId, opts.reset);
      const conLiviana = aplicarLiviana(data, estado.factor_volumen, estado.ajuste_rpe);
      const conCardio = aplicarAcondicionamiento(conLiviana, estado.ciclo_semana);
      const planFinal = ordenarDia(conCardio);
      const { error: e2 } = await supabase
        .from('plan_weeks')
        .upsert({ user_id: userId, semana_inicio: lunesDeEstaSemana(), plan: planFinal,
          engine_version: data?.meta?.engine_version ?? '0.5.0', ciclo_semana: estado.ciclo_semana },
          { onConflict: 'user_id,semana_inicio' });
      if (e2) throw e2;
      return planFinal;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['plan_week', userId] }); },
  });
}

// ---------- Sesiones (registro) ----------
export function useSesiones(userId: string | undefined) {
  return useQuery({
    queryKey: ['sesiones', userId],
    enabled: !!userId,
    queryFn: async (): Promise<SessionRow[]> => {
      const { data, error } = await supabase
        .from('sessions').select('*').eq('user_id', userId!).order('fecha', { ascending: false }).limit(100);
      if (error) throw error;
      return (data ?? []) as SessionRow[];
    },
  });
}

export function useRegistrarSesion(userId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (s: NuevaSesion): Promise<SessionRow> => {
      const { data, error } = await supabase.from('sessions').insert({ user_id: userId, ...s }).select().single();
      if (error) throw error;
      return data as SessionRow;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['sesiones', userId] }); },
  });
}

// ---------- Resumen de carga de la semana (cálculo en cliente) ----------
export interface ResumenSemana { total: number; gym: number; moto: number; sesiones: number; porDia: number[] }

function indiceDiaSemana(iso: string): number {
  const [y, m, d] = iso.split('-').map(Number);
  const dow = new Date(y, m - 1, d).getDay(); // 0=Dom..6=Sáb (local)
  return dow === 0 ? 6 : dow - 1;             // Lun=0..Dom=6
}

export function resumenSemana(sesiones: SessionRow[]): ResumenSemana {
  const lunes = lunesDeEstaSemana();
  const dela = sesiones.filter((s) => s.fecha >= lunes); // YYYY-MM-DD compara bien como texto
  let gym = 0, moto = 0;
  const porDia = [0, 0, 0, 0, 0, 0, 0];
  for (const s of dela) {
    if (s.tipo === 'gym') gym += s.carga; else moto += s.carga; // moto + simulación
    porDia[indiceDiaSemana(s.fecha)] += s.carga;
  }
  return { total: gym + moto, gym, moto, sesiones: dela.length, porDia };
}

// ---------- Simular moto: pide un circuito (objetivo=simulacion) SIN guardar el plan ----------
export function useSimularMoto() {
  return useMutation({
    mutationFn: async () => {
      const { data, error } = await supabase.functions.invoke('generar-rutina', { body: { objetivo: 'simulacion' } });
      if (error) {
        let msg = error.message;
        const ctx = (error as any).context;
        if (ctx && typeof ctx.json === 'function') {
          try { const b = await ctx.json(); if (b?.error) msg = b.error; } catch { /* sin cuerpo */ }
        }
        throw new Error(msg);
      }
      if (data?.error) throw new Error(data.error);
      return data; // rutina con es_simulacion: true y dias[0] = circuito
    },
  });
}

// ---------- Ediciones del plan (flexibilidad: mover / swap_moto / descanso) ----------
export interface PlanEditRow {
  id: string; user_id: string; plan_week_id: string; fecha: string;
  accion: 'mover' | 'descanso' | 'swap_moto' | 'agregar' | 'simular' | 'trim_volumen';
  payload: any; created_at: string;
}
export interface NuevoEdit {
  plan_week_id: string; fecha: string;
  accion: 'mover' | 'descanso' | 'swap_moto' | 'agregar'; payload?: any;
}

export function usePlanEdits(userId: string | undefined, planWeekId: string | null | undefined) {
  return useQuery({
    queryKey: ['plan_edits', planWeekId],
    enabled: !!userId && !!planWeekId,
    queryFn: async (): Promise<PlanEditRow[]> => {
      const { data, error } = await supabase
        .from('plan_edits').select('*').eq('plan_week_id', planWeekId!).order('created_at', { ascending: true });
      if (error) throw error;
      return (data ?? []) as PlanEditRow[];
    },
  });
}

export function useRegistrarEdit(userId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (e: NuevoEdit): Promise<PlanEditRow> => {
      const { data, error } = await supabase
        .from('plan_edits').insert({ user_id: userId, ...e }).select().single();
      if (error) throw error;
      return data as PlanEditRow;
    },
    onSuccess: (row) => { qc.invalidateQueries({ queryKey: ['plan_edits', row.plan_week_id] }); },
  });
}

// ---------- Deshacer ediciones ----------
export function useEliminarEdit() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (e: { id: string; plan_week_id: string }): Promise<void> => {
      const { error } = await supabase.from('plan_edits').delete().eq('id', e.id);
      if (error) throw error;
    },
    onSuccess: (_d, e) => { qc.invalidateQueries({ queryKey: ['plan_edits', e.plan_week_id] }); },
  });
}

export function useRestablecerSemana() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (planWeekId: string): Promise<void> => {
      const { error } = await supabase.from('plan_edits').delete().eq('plan_week_id', planWeekId);
      if (error) throw error;
    },
    onSuccess: (_d, planWeekId) => { qc.invalidateQueries({ queryKey: ['plan_edits', planWeekId] }); },
  });
}

// ---------- Editar perfil ----------
export function useActualizarPerfil(userId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (campos: Partial<ProfileRow>): Promise<void> => {
      const { error } = await supabase.from('profiles').update(campos).eq('user_id', userId);
      if (error) throw error;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['profile', userId] }); },
  });
}
