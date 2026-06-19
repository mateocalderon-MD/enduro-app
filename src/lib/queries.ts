// src/lib/queries.ts — Hooks de datos (TanStack Query). Backend siempre por acá.
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from './supabase';

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

export function useGenerarPlan(userId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (objetivo: string = 'general') => {
      const { data, error } = await supabase.functions.invoke('generar-rutina', { body: { objetivo } });
      if (error) {
        let msg = error.message;
        const ctx = (error as any).context;
        if (ctx && typeof ctx.json === 'function') {
          try { const body = await ctx.json(); if (body?.error) msg = body.error; } catch { /* sin cuerpo */ }
        }
        throw new Error(msg);
      }
      if (data?.error) throw new Error(data.error);
      const { error: e2 } = await supabase
        .from('plan_weeks')
        .upsert({ user_id: userId, semana_inicio: lunesDeEstaSemana(), plan: data, engine_version: data?.meta?.engine_version ?? '0.4.0' },
          { onConflict: 'user_id,semana_inicio' });
      if (e2) throw e2;
      return data;
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
