// motor.ts — Motor determinista de generación de rutinas (port de pipeline.js v0.4)
// Módulo PURO: recibe perfil + catálogo + plantillas y devuelve una rutina.
// Sin IA, sin base de datos, sin red. Toda la I/O vive en index.ts.

export const ENGINE_VERSION = '0.4.0';

// ---------- Tipos ----------
export type Equipo = 'casa' | 'basico' | 'completo';
export type Nivel = 'principiante' | 'intermedio' | 'avanzado';
export type Impacto = 'bajo' | 'medio' | 'alto';
export type Lesion = 'cuello' | 'hombro' | 'muneca' | 'espalda_baja' | 'rodilla';
export type Disciplina = 'hard_enduro' | 'cross_country';
export type Objetivo = 'general' | 'simulacion';

export interface Dosis {
  tipo?: string; subtipo?: string; formato?: string;
  series?: number; reps_min?: number; reps_max?: number;
  duracion_seg?: number; duracion_min?: number;
  rpe?: number; frecuencia_semanal?: number; descanso_seg?: number;
  rondas?: number; trabajo_seg?: number;
  [k: string]: unknown;
}
export interface Variante {
  id: string; nombre: string;
  nivel_equipo: Equipo; impacto: Impacto; nivel_minimo: Nivel;
  contraindicaciones: Lesion[]; descripcion?: string; claves?: string[];
}
export interface Slot {
  id: string; nombre: string; categoria: string; innegociable: boolean; variantes: Variante[];
}
export interface Catalogo { slots: Slot[]; }
export interface PlantillaSlot { slot_id: string; prioridad: number; dosis_base: Dosis; }
export interface Plantilla { disciplina: Disciplina; nivel: Nivel; objetivo: Objetivo; slots: PlantillaSlot[]; }
export interface Plantillas { plantillas: Plantilla[]; }
export interface Perfil {
  disciplina: Disciplina; nivel: Nivel; objetivo?: Objetivo;
  edad: number; peso_kg?: number; altura_cm?: number;
  dias_disponibles: number; minutos_por_sesion?: number;
  equipo: Equipo; lesiones?: Lesion[];
}
export interface Ejercicio {
  slot_id: string; slot_nombre: string; variante_id: string; variante_nombre: string;
  descripcion: string; claves: string[]; dosis?: Dosis;
}
export interface DiaRutina { dia_numero: number; formato?: string; circuito?: Record<string, number>; ejercicios: Ejercicio[]; }
export interface Rutina { meta: Record<string, unknown>; dias: DiaRutina[]; advertencias: string[]; es_simulacion?: boolean; }
export interface RutinaError { error: string; }

// ---------- Tablas de orden ----------
const NIVEL_EQUIPO: Record<Equipo, number> = { casa: 0, basico: 1, completo: 2 };
const NIVEL: Record<Nivel, number> = { principiante: 0, intermedio: 1, avanzado: 2 };
const IMPACTO: Record<Impacto, number> = { bajo: 0, medio: 1, alto: 2 };

// ---------- Moduladora EDAD ----------
interface BandaEdad { factor_volumen: number; factor_descanso: number; impacto_max: Impacto; ajuste_frecuencia: number; rpe_max: number; }
function bandaEdad(edad: number): BandaEdad {
  if (edad >= 50) return { factor_volumen: 0.7, factor_descanso: 1.3, impacto_max: 'bajo', ajuste_frecuencia: -1, rpe_max: 7 };
  if (edad >= 40) return { factor_volumen: 0.85, factor_descanso: 1.15, impacto_max: 'medio', ajuste_frecuencia: 0, rpe_max: 8 };
  return { factor_volumen: 1.0, factor_descanso: 1.0, impacto_max: 'alto', ajuste_frecuencia: 0, rpe_max: 9 };
}

// ---------- Moduladora PESO (solo protección articular) ----------
function imcDe(perfil: Perfil): number | null {
  if (!perfil.peso_kg || !perfil.altura_cm) return null;
  const m = perfil.altura_cm / 100;
  return perfil.peso_kg / (m * m);
}

// ---------- Helpers ----------
const clamp = (x: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, x));
const minImpacto = (a: Impacto, b: Impacto): Impacto => (IMPACTO[a] <= IMPACTO[b] ? a : b);
const slotDef = (catalogo: Catalogo, id: string) => catalogo.slots.find((s) => s.id === id);

function techoImpacto(slot: Slot, banda: BandaEdad, imc: number | null): Impacto {
  let techo = banda.impacto_max;
  if (slot.categoria === 'acondicionamiento' && imc != null && imc >= 28) {
    techo = minImpacto(techo, 'bajo'); // peso alto -> cardio de bajo impacto
  }
  return techo;
}

// ---------- Capa 3: escalar dosis por edad ----------
function escalarDosis(dosisBase: Dosis, banda: BandaEdad): Dosis {
  const d: Dosis = JSON.parse(JSON.stringify(dosisBase));
  if (typeof d.series === 'number') d.series = Math.max(1, Math.round(d.series * banda.factor_volumen));
  if (typeof d.descanso_seg === 'number') d.descanso_seg = Math.round(d.descanso_seg * banda.factor_descanso);
  if (typeof d.rpe === 'number' && d.rpe > banda.rpe_max) d.rpe = banda.rpe_max; // tope de intensidad
  if (d.tipo === 'acondicionamiento') {
    if (typeof d.duracion_min === 'number') d.duracion_min = Math.round(d.duracion_min * banda.factor_volumen);
    if (typeof d.rondas === 'number') d.rondas = Math.max(1, Math.round(d.rondas * banda.factor_volumen));
  }
  return d;
}

// ---------- Capas 4 y 5: elegir variante + vetar por lesión ----------
function elegirVariante(slot: Slot, perfil: Perfil, techo: Impacto): Variante | null {
  const equ = NIVEL_EQUIPO[perfil.equipo];
  const niv = NIVEL[perfil.nivel];
  const lesiones = perfil.lesiones || [];
  const candidatas = slot.variantes.filter((v) =>
    NIVEL_EQUIPO[v.nivel_equipo] <= equ &&
    NIVEL[v.nivel_minimo] <= niv &&
    IMPACTO[v.impacto] <= IMPACTO[techo] &&
    !v.contraindicaciones.some((c) => lesiones.includes(c)),
  );
  if (candidatas.length === 0) return null;
  candidatas.sort((a, b) =>
    (NIVEL_EQUIPO[b.nivel_equipo] - NIVEL_EQUIPO[a.nivel_equipo]) ||
    (NIVEL[b.nivel_minimo] - NIVEL[a.nivel_minimo]),
  );
  return candidatas[0];
}

// ---------- Capa 2: corte por días ----------
function cortePorDias(plantillaSlots: PlantillaSlot[], catalogo: Catalogo, D: number): PlantillaSlot[] {
  const ordenados = plantillaSlots.slice().sort((a, b) => a.prioridad - b.prioridad);
  const esInneg = (s: PlantillaSlot) => slotDef(catalogo, s.slot_id)?.innegociable === true;
  const maxSlots = D <= 2 ? 7 : D === 3 ? 9 : D === 4 ? 11 : D === 5 ? 13 : 15;
  const seleccion: PlantillaSlot[] = [];
  for (const s of ordenados) if (esInneg(s)) seleccion.push(s);
  for (const s of ordenados) {
    if (esInneg(s)) continue;
    if (seleccion.length >= maxSlots) break;
    seleccion.push(s);
  }
  return seleccion.sort((a, b) => a.prioridad - b.prioridad);
}

// ---------- Pipeline general ----------
function generarGeneral(perfil: Perfil, catalogo: Catalogo, plantillas: Plantillas): Rutina | RutinaError {
  const advertencias: string[] = [];
  const plantilla = plantillas.plantillas.find(
    (p) => p.disciplina === perfil.disciplina && p.nivel === perfil.nivel && p.objetivo === 'general',
  );
  if (!plantilla) return { error: `No hay plantilla para ${perfil.disciplina} / ${perfil.nivel}` };

  const banda = bandaEdad(perfil.edad);
  const imc = imcDe(perfil);
  const D = clamp(perfil.dias_disponibles, 1, 6);

  const seleccion = cortePorDias(plantilla.slots, catalogo, D);

  const preparados: { slot_id: string; slot_nombre: string; variante: Variante; dosis: Dosis; frecuencia: number }[] = [];
  for (const s of seleccion) {
    const def = slotDef(catalogo, s.slot_id);
    if (!def) continue;
    const techo = techoImpacto(def, banda, imc);
    const variante = elegirVariante(def, perfil, techo);
    if (!variante) {
      const nivelAviso = def.innegociable ? 'ALTA' : 'info';
      advertencias.push(`[${nivelAviso}] Slot "${def.nombre}" sin variante válida (equipo/nivel/impacto/lesión) -> se omite.`);
      continue;
    }
    const dosis = escalarDosis(s.dosis_base, banda);
    const frec = clamp((s.dosis_base.frecuencia_semanal || 1) + banda.ajuste_frecuencia, 1, D);
    preparados.push({ slot_id: s.slot_id, slot_nombre: def.nombre, variante, dosis, frecuencia: frec });
  }

  const dias: DiaRutina[] = Array.from({ length: D }, (_, i) => ({ dia_numero: i + 1, ejercicios: [] }));
  for (const p of preparados) {
    const idx = dias.map((_d, i) => i).sort((a, b) => dias[a].ejercicios.length - dias[b].ejercicios.length).slice(0, p.frecuencia);
    for (const i of idx) {
      dias[i].ejercicios.push({
        slot_id: p.slot_id, slot_nombre: p.slot_nombre,
        variante_id: p.variante.id, variante_nombre: p.variante.nombre,
        descripcion: p.variante.descripcion || '', claves: p.variante.claves || [], dosis: p.dosis,
      });
    }
  }

  // Validación
  for (const def of catalogo.slots) {
    if (!def.innegociable) continue;
    const enPlantilla = plantilla.slots.some((s) => s.slot_id === def.id);
    const enRutina = preparados.some((p) => p.slot_id === def.id);
    if (enPlantilla && !enRutina) advertencias.push(`[ALTA] Innegociable "${def.nombre}" no quedó en la rutina.`);
  }
  const fuga = dias.flatMap((d) => d.ejercicios).find((e) => {
    const v = slotDef(catalogo, e.slot_id)?.variantes.find((x) => x.id === e.variante_id);
    return v ? v.contraindicaciones.some((c) => (perfil.lesiones || []).includes(c)) : false;
  });
  if (fuga) advertencias.push(`[CRITICA] Se coló un ejercicio contraindicado: ${fuga.variante_nombre}.`);

  const MAX_EJERCICIOS_DIA = 8;
  for (const d of dias) {
    if (d.ejercicios.length > MAX_EJERCICIOS_DIA) {
      advertencias.push(`[info] Día ${d.dia_numero} sobrecargado (${d.ejercicios.length} ejercicios).`);
    }
  }
  const seriesSemana = dias.flatMap((d) => d.ejercicios).reduce((acc, e) => acc + (typeof e.dosis?.series === 'number' ? e.dosis.series : 0), 0);
  if (seriesSemana > 110) advertencias.push(`[ALTA] Volumen semanal alto (${seriesSemana} series). Revisá antes de prescribir.`);

  return {
    meta: {
      disciplina: perfil.disciplina, nivel: perfil.nivel, dias_disponibles: D,
      moduladoras_aplicadas: {
        banda_edad: banda, imc: imc != null ? Math.round(imc * 10) / 10 : null,
        techo_impacto_general: banda.impacto_max, rpe_max_por_edad: banda.rpe_max, series_totales_semana: seriesSemana,
      },
      engine_version: ENGINE_VERSION,
    },
    dias, advertencias,
  };
}

// ---------- Intención SIMULACIÓN (circuito que imita la moto, cuenta como carga de moto) ----------
const SLOTS_SIMULACION = ['acondicionamiento', 'antebrazo', 'core', 'agilidad_coordinacion', 'reaccion', 'equilibrio'];
const RONDAS_POR_NIVEL: Record<Nivel, number> = { principiante: 2, intermedio: 3, avanzado: 4 };

function generarSimulacion(perfil: Perfil, catalogo: Catalogo): Rutina {
  const advertencias: string[] = [];
  const banda = bandaEdad(perfil.edad);
  const imc = imcDe(perfil);
  const rondas = RONDAS_POR_NIVEL[perfil.nivel];
  const trabajo_seg = 40;
  const descanso_seg = 20;
  const rpe = Math.min(8, banda.rpe_max); // anaeróbico pero con techo por edad

  const estaciones: Ejercicio[] = [];
  for (const slotId of SLOTS_SIMULACION) {
    const def = slotDef(catalogo, slotId);
    if (!def) continue;
    const techo = techoImpacto(def, banda, imc);
    const v = elegirVariante(def, perfil, techo); // mismos filtros de seguridad (equipo/nivel/impacto/lesión)
    if (!v) { advertencias.push(`[info] Estación "${def.nombre}" sin variante válida -> se omite.`); continue; }
    estaciones.push({
      slot_id: def.id, slot_nombre: def.nombre, variante_id: v.id, variante_nombre: v.nombre,
      descripcion: v.descripcion || '', claves: v.claves || [],
    });
  }
  const duracion_min = Math.round((rondas * estaciones.length * (trabajo_seg + descanso_seg)) / 60);

  return {
    es_simulacion: true,
    meta: {
      disciplina: perfil.disciplina, nivel: perfil.nivel, objetivo: 'simulacion',
      cuenta_como: 'moto',
      moduladoras_aplicadas: { banda_edad: banda, imc: imc != null ? Math.round(imc * 10) / 10 : null, rpe_circuito: rpe },
      duracion_estimada_min: duracion_min, engine_version: ENGINE_VERSION,
    },
    dias: [{ dia_numero: 1, formato: 'circuito', circuito: { rondas, trabajo_seg, descanso_seg, rpe }, ejercicios: estaciones }],
    advertencias,
  };
}

// ---------- Entrada única ----------
export function generarRutina(perfil: Perfil, catalogo: Catalogo, plantillas: Plantillas): Rutina | RutinaError {
  const objetivo: Objetivo = perfil.objetivo ?? 'general';
  if (objetivo === 'simulacion') return generarSimulacion(perfil, catalogo);
  return generarGeneral(perfil, catalogo, plantillas);
}
