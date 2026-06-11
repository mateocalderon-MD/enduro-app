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

// Lunes de la semana actual, en hora LOCAL (formato YYYY-MM-DD).
function lunesDeEstaSemana(): string {
  const d = new Date();
  const day = d.getDay();            // 0=Dom .. 6=Sáb
  const diff = day === 0 ? -6 : 1 - day;
  d.setDate(d.getDate() + diff);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${dd}`;
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
      const semana = lunesDeEstaSemana();
      const { data, error } = await supabase
        .from('plan_weeks').select('*').eq('user_id', userId!).eq('semana_inicio', semana).maybeSingle();
      if (error) throw error;
      return data as PlanWeekRow | null;
    },
  });
}

// Llama a la Edge Function generar-rutina y guarda el resultado en plan_weeks.
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
      const semana_inicio = lunesDeEstaSemana();
      const engine_version = data?.meta?.engine_version ?? '0.4.0';
      const { error: e2 } = await supabase
        .from('plan_weeks')
        .upsert({ user_id: userId, semana_inicio, plan: data, engine_version }, { onConflict: 'user_id,semana_inicio' });
      if (e2) throw e2;
      return data;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['plan_week', userId] }); },
  });
}
