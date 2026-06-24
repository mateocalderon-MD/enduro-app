// src/lib/progresion.ts — Progresión de CARGA por doble progresión. Lógica PURA (sin red).
// Doble progresión: dentro de un rango de reps, primero sumás reps; cuando llegás al tope del
// rango con buena técnica, subís un poco de peso y volvés al piso del rango. La sugerencia sale
// del último registro (peso + reps logradas) de cada ejercicio.
// 'permitirSubir' es el freno de la moto: si esa semana venís muy cargado, se mantiene el peso.

export interface RegistroLift { peso: number; reps: number }
export interface PrescripcionLift { reps_min: number; reps_max: number }
export interface Sugerencia {
  peso: number;            // peso sugerido para la próxima sesión
  reps_objetivo: number;   // a cuántas reps apuntar
  subir: boolean;          // true si la sugerencia es subir el peso
  mensaje: string;
}

// Salto de peso por defecto: compuestos de tren inferior toleran más; el resto, fino.
export function incrementoKg(slotId: string): number {
  return (slotId === 'tren_inferior' || slotId === 'bisagra_cadera') ? 5 : 2.5;
}

// Redondeo a 0.5 kg para que no queden números raros.
function redondear(kg: number): number {
  return Math.round(kg * 2) / 2;
}

export function sugerir(
  ultimo: RegistroLift | null,
  pres: PrescripcionLift,
  incremento: number,
  permitirSubir = true,
): Sugerencia {
  // Sin registro previo: arrancás vos, apuntando al piso del rango.
  if (!ultimo || !(ultimo.peso > 0)) {
    return {
      peso: ultimo?.peso ?? 0, reps_objetivo: pres.reps_min, subir: false,
      mensaje: 'Primera vez: elegí un peso con el que llegues cómodo al piso del rango.',
    };
  }
  const llegoAlTope = ultimo.reps >= pres.reps_max;

  if (llegoAlTope && permitirSubir) {
    const nuevo = redondear(ultimo.peso + incremento);
    return {
      peso: nuevo, reps_objetivo: pres.reps_min, subir: true,
      mensaje: `La última: ${ultimo.peso} kg × ${ultimo.reps}. Llegaste al tope → subí a ${nuevo} kg (volvé a ${pres.reps_min} reps).`,
    };
  }
  if (llegoAlTope && !permitirSubir) {
    return {
      peso: ultimo.peso, reps_objetivo: pres.reps_max, subir: false,
      mensaje: `Llegaste al tope, pero esta semana venís cargado de moto: mantené ${ultimo.peso} kg.`,
    };
  }
  // Todavía no llegaste al tope: mismo peso, una rep más.
  const objetivo = Math.min(pres.reps_max, ultimo.reps + 1);
  return {
    peso: ultimo.peso, reps_objetivo: objetivo, subir: false,
    mensaje: `La última: ${ultimo.peso} kg × ${ultimo.reps}. Mantené el peso y apuntá a ${objetivo} reps.`,
  };
}

// Memoria de cargas: de las sesiones de gym, el último peso/reps registrado por variante_id.
// Tolera sesiones viejas (payload.ejercicios como strings) -> las saltea.
export function ultimosLifts(sesiones: any[]): Record<string, RegistroLift> {
  const out: Record<string, RegistroLift> = {};
  const orden = [...(sesiones ?? [])].sort((a, b) => (b?.fecha ?? '').localeCompare(a?.fecha ?? ''));
  for (const s of orden) {
    const ejs = s?.payload?.ejercicios;
    if (!Array.isArray(ejs)) continue;
    for (const e of ejs) {
      if (e && typeof e === 'object' && e.variante_id && typeof e.peso === 'number' && out[e.variante_id] == null) {
        out[e.variante_id] = { peso: e.peso, reps: typeof e.reps === 'number' ? e.reps : 0 };
      }
    }
  }
  return out;
}

// ---- Momentum / progreso real (para la pestaña Hoy) ----

export interface ProgresoLift { variante_id: string; nombre: string; primero: number; ultimo: number }

// Lifts cuyo peso subió desde la primera vez registrada hasta la última. Ordenados por mayor mejora.
export function progresoLifts(sesiones: any[]): ProgresoLift[] {
  const orden = [...(sesiones ?? [])].sort((a, b) => (a?.fecha ?? '').localeCompare(b?.fecha ?? '')); // viejo -> nuevo
  const map: Record<string, { nombre: string; primero: number; ultimo: number }> = {};
  for (const s of orden) {
    const ejs = s?.payload?.ejercicios;
    if (!Array.isArray(ejs)) continue;
    for (const e of ejs) {
      if (e && typeof e === 'object' && e.variante_id && typeof e.peso === 'number' && e.peso > 0) {
        if (map[e.variante_id] == null) map[e.variante_id] = { nombre: e.nombre ?? e.variante_id, primero: e.peso, ultimo: e.peso };
        else map[e.variante_id].ultimo = e.peso;
      }
    }
  }
  return Object.entries(map)
    .map(([variante_id, v]) => ({ variante_id, nombre: v.nombre, primero: v.primero, ultimo: v.ultimo }))
    .filter((p) => p.ultimo > p.primero)
    .sort((a, b) => (b.ultimo - b.primero) - (a.ultimo - a.primero));
}

function lunesDeFecha(iso: string): string {
  const [y, m, d] = iso.split('-').map(Number);
  const dt = new Date(Date.UTC(y, m - 1, d));
  const day = dt.getUTCDay();
  dt.setUTCDate(dt.getUTCDate() + (day === 0 ? -6 : 1 - day));
  return dt.toISOString().slice(0, 10);
}

// Semanas distintas (lun-dom) con al menos una sesión registrada.
export function semanasEntrenadas(sesiones: any[]): number {
  const set = new Set<string>();
  for (const s of (sesiones ?? [])) if (s?.fecha) set.add(lunesDeFecha(s.fecha));
  return set.size;
}
