// src/lib/ciclo.ts — Estado del ciclo de entrenamiento (módulo PURO, sin I/O).
// Bloque de 4 semanas: 3 de carga + 1 liviana. Da el "a dónde vas" de la pestaña Plan
// y decide cuándo el motor baja el volumen.
//
// Criterio de entrenador (v1, consciente del contexto: amateur, fase de base, poca moto):
//  - El bloque AVANZA solo si la semana se entrenó de verdad. Si casi no entrenaste, ESPERA.
//    -> Llegar a la semana liviana implica 3 semanas reales de carga: descarga justificada.
//  - Semana liviana SUAVE (-30%), no un deload profundo que a tu nivel frena el progreso.
//  - Tras un parate, REENTRADA suave (no slamear al que vuelve).
//  - v1 mira solo carga de GIMNASIO. Se vuelve consciente de la moto cuando conectemos el backoff.

export const BLOQUE = 4;                    // largo del bloque en semanas
export const FACTOR_LIVIANA = 0.7;          // semana liviana / reentrada: 70% del volumen (-30%)
export const AJUSTE_RPE_LIVIANO = -1;       // un punto menos de RPE en semana liviana/reentrada
export const SEMANAS_RESET = 2;             // >= 2 semanas casi sin entrenar -> reinicia el bloque
export const CARGA_MIN_ACTIVA = 60;         // carga (2 sem) por debajo de la cual hubo "parate"
export const CARGA_SEMANA_ENTRENADA = 250;  // carga semanal por encima de la cual la semana "cuenta"

export type Fase = 'carga' | 'liviana' | 'reentrada';

export interface EstadoCiclo {
  ciclo_semana: number;     // 1..BLOQUE
  fase: Fase;
  factor_volumen: number;   // 1 en carga; FACTOR_LIVIANA en liviana/reentrada
  ajuste_rpe: number;       // 0 en carga; AJUSTE_RPE_LIVIANO en liviana/reentrada
  mantener_cargas: boolean; // true -> la progresión no empuja PRs esta semana
  motivo: string;           // explicación legible (UI / debug)
}

export interface EntradaProximo {
  ultimoCicloSemana: number | null; // ciclo_semana de la última semana, o null si es la primera
  semanasDesdeUltimo: number;       // 1 = semana siguiente consecutiva; 2+ = hubo huecos
  cargaUltimaSemana: number;        // carga de la semana que se cierra -> ¿se entrenó de verdad?
  cargaUltimasSemanas: number;      // carga de las últimas ~2 semanas -> detectar parate
}

function carga(ciclo_semana: number, motivo: string): EstadoCiclo {
  return { ciclo_semana, fase: 'carga', factor_volumen: 1, ajuste_rpe: 0, mantener_cargas: false, motivo };
}
function liviana(motivo: string): EstadoCiclo {
  return { ciclo_semana: BLOQUE, fase: 'liviana', factor_volumen: FACTOR_LIVIANA, ajuste_rpe: AJUSTE_RPE_LIVIANO, mantener_cargas: true, motivo };
}
function reentrada(motivo: string): EstadoCiclo {
  return { ciclo_semana: 1, fase: 'reentrada', factor_volumen: FACTOR_LIVIANA, ajuste_rpe: AJUSTE_RPE_LIVIANO, mantener_cargas: true, motivo };
}

// Estado de la PRÓXIMA semana a generar.
export function proximoEstado(e: EntradaProximo): EstadoCiclo {
  // 1) Primera semana de todas.
  if (e.ultimoCicloSemana == null) return carga(1, 'Arranque: primer bloque, semana 1 de carga.');

  // 2) Parate: >= SEMANAS_RESET semanas casi sin entrenar -> reentrada suave.
  if (e.semanasDesdeUltimo >= SEMANAS_RESET && e.cargaUltimasSemanas < CARGA_MIN_ACTIVA) {
    return reentrada('Volvés tras un parate: semana de reentrada, suave, para reenganchar sin lastimarte.');
  }

  // 3) Tras una semana liviana, siempre arranca bloque nuevo (la liviana es de bajo volumen a propósito).
  if (e.ultimoCicloSemana === BLOQUE) return carga(1, 'Bloque nuevo: semana 1 de carga.');

  // 4) En semanas de carga (1-3): el bloque avanza solo si la semana CONTÓ como entrenada.
  if (e.cargaUltimaSemana < CARGA_SEMANA_ENTRENADA) {
    return carga(e.ultimoCicloSemana,
      `La semana pasada casi no entrenaste: el bloque te espera en la semana ${e.ultimoCicloSemana} de ${BLOQUE}.`);
  }

  // 5) Avance normal.
  const siguiente = e.ultimoCicloSemana + 1;
  if (siguiente === BLOQUE) {
    return liviana('Cerraste 3 semanas de carga: toca una semana más liviana (-30%) para llegar fresco. Mantené los pesos, no busques PRs.');
  }
  return carga(siguiente, `Semana ${siguiente} de ${BLOQUE}: carga.`);
}

// Etiqueta corta por semana del bloque (tira de la pestaña Plan).
export function etiquetaFase(ciclo_semana: number): string {
  if (ciclo_semana === BLOQUE) return 'Liviana';
  if (ciclo_semana === BLOQUE - 1) return 'Pico';
  return 'Carga';
}

export interface CasilleroBloque { semana: number; etiqueta: string; actual: boolean }

// Tira de 4 casilleros, con la semana actual resaltada.
export function tiraBloque(ciclo_semana: number): CasilleroBloque[] {
  return Array.from({ length: BLOQUE }, (_, i) => {
    const semana = i + 1;
    return { semana, etiqueta: etiquetaFase(semana), actual: semana === ciclo_semana };
  });
}

// Aplica una semana liviana al plan: baja VOLUMEN (series) e intensidad (RPE), sin tocar reps.
// Determinista y puro. Se usa cuando proximoEstado devuelve factor_volumen < 1 (liviana o reentrada).
export function aplicarLiviana(rutina: any, factorVolumen: number, ajusteRpe: number): any {
  if (!rutina || factorVolumen >= 1) return rutina;
  const ajustarDosis = (d: any) => {
    if (!d) return d;
    const nd = { ...d };
    if (typeof d.series === 'number') nd.series = Math.max(1, Math.round(d.series * factorVolumen));
    if (typeof d.rpe === 'number') nd.rpe = Math.max(5, d.rpe + ajusteRpe);
    return nd;
  };
  const dias = (rutina.dias ?? []).map((dia: any) => ({
    ...dia,
    ejercicios: (dia.ejercicios ?? []).map((e: any) => ({ ...e, dosis: ajustarDosis(e.dosis) })),
  }));
  return { ...rutina, dias, meta: { ...(rutina.meta ?? {}), semana_liviana: true } };
}

// ---- Acondicionamiento periodizado por fase del bloque ----
// El motor enduro pesa tanto como el hierro: el cardio cambia de intención según dónde estás en el bloque.
const MODOS_CARDIO: Record<string, { duracion_min: number; rpe: number; titulo: string; texto: string }> = {
  base:       { duracion_min: 40, rpe: 6, titulo: 'Base aeróbica', texto: 'Continuo y sostenido a RPE 6 (podés hablar entrecortado), 35-45 min. Es tu motor de fondo para aguantar la salida.' },
  intervalos: { duracion_min: 36, rpe: 9, titulo: 'Intervalos', texto: '6 series de 3 min fuerte (RPE 8-9) con 3 min suave entre medio. Sube tu techo para las subidas y lo técnico.' },
  suave:      { duracion_min: 20, rpe: 5, titulo: 'Regenerativo', texto: 'Suave, 20 min a RPE 5. Solo mover sangre y recuperar.' },
};

export function modoCardio(cicloSemana: number): 'base' | 'intervalos' | 'suave' {
  if (cicloSemana === BLOQUE) return 'suave';          // semana liviana
  if (cicloSemana === BLOQUE - 1) return 'intervalos'; // pico
  return 'base';                                        // carga
}

// Reescribe la sesión de cardio según la fase. Determinista.
export function aplicarAcondicionamiento(rutina: any, cicloSemana: number): any {
  if (!rutina) return rutina;
  const clave = modoCardio(cicloSemana);
  const m = MODOS_CARDIO[clave];
  const tocar = (e: any) => (e?.slot_id === 'acondicionamiento' || e?.dosis?.tipo === 'acondicionamiento')
    ? { ...e, descripcion: m.texto, claves: [m.titulo, `~${m.duracion_min} min`, `RPE ${m.rpe}`],
        dosis: { ...(e.dosis ?? {}), tipo: 'acondicionamiento', duracion_min: m.duracion_min, rpe: m.rpe, modo: clave } }
    : e;
  const dias = (rutina.dias ?? []).map((d: any) => ({ ...d, ejercicios: (d.ejercicios ?? []).map(tocar) }));
  return { ...rutina, dias };
}

// ---- Orden intra-día por intención de entrenamiento ----
// No por prioridad de slot: primero lo fresco y técnico, el agarre AL FINAL (bajo fatiga), cardio último.
const ORDEN_ROL: Record<string, number> = {
  movilidad: 0, 'muñeca': 0,
  potencia: 1,
  bisagra_cadera: 2,
  tren_inferior: 3, traccion: 3, empuje: 3,
  posicion_ataque: 4,
  core: 4, cuello: 4, equilibrio: 4, agilidad_coordinacion: 4, reaccion: 4, pantorrilla: 4,
  antebrazo: 5,            // agarre al final: se entrena pampeado, como en la moto
  acondicionamiento: 6,    // cardio, al cierre
};

export function ordenarDia(rutina: any): any {
  if (!rutina) return rutina;
  const rango = (e: any) => ORDEN_ROL[e?.slot_id] ?? 4;
  const dias = (rutina.dias ?? []).map((d: any) => ({
    ...d,
    ejercicios: (d.ejercicios ?? []).map((e: any, i: number) => ({ e, i }))
      .sort((a: any, b: any) => (rango(a.e) - rango(b.e)) || (a.i - b.i))
      .map((x: any) => x.e),
  }));
  return { ...rutina, dias };
}
