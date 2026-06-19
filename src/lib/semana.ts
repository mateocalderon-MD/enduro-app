// src/lib/semana.ts — Proyección de la "semana efectiva". Lógica PURA (sin red).
// plan original (N días de gym) + reparto por día + ediciones (plan_edits) + sesiones registradas
// = qué te toca realmente cada día, de lunes (dow 0) a domingo (dow 6).

export type TipoDia = 'gym' | 'moto' | 'simulacion' | 'descanso';

export interface PlanEdit { fecha: string; accion: string; payload?: any; created_at?: string }
export interface SesionMin { fecha: string; tipo: string; carga?: number }

export interface DiaSemana {
  fecha: string;        // 'YYYY-MM-DD'
  dow: number;          // 0=lunes ... 6=domingo
  tipo: TipoDia;
  dia: any | null;      // objeto del día de gym (si tipo==='gym')
  hecho: boolean;       // hay al menos una sesión registrada ese día
  cargaHecha: number;   // suma de carga registrada ese día
  esHoy: boolean;
}

// Reparto por defecto de N días de gym sobre la semana (índices 0=lun..6=dom), descanso en el medio.
const REPARTO: Record<number, number[]> = {
  0: [],
  1: [2],                 // mié
  2: [1, 3],              // mar, jue
  3: [0, 2, 4],           // lun, mié, vie
  4: [0, 1, 3, 4],        // lun, mar, jue, vie
  5: [0, 1, 2, 4, 5],     // lun, mar, mié, vie, sáb
  6: [0, 1, 2, 3, 4, 5],  // lun..sáb
  7: [0, 1, 2, 3, 4, 5, 6],
};

const DOW_NOMBRE = ['lun', 'mar', 'mié', 'jue', 'vie', 'sáb', 'dom'];
export const nombreDow = (dow: number) => DOW_NOMBRE[dow] ?? '';

// Suma n días a una fecha ISO sin líos de huso horario (todo en UTC).
export function addDias(iso: string, n: number): string {
  const [y, m, d] = iso.split('-').map(Number);
  const dt = new Date(Date.UTC(y, m - 1, d));
  dt.setUTCDate(dt.getUTCDate() + n);
  return dt.toISOString().slice(0, 10);
}

export function semanaEfectiva(args: {
  semanaInicio: string;   // lunes 'YYYY-MM-DD'
  dias: any[];            // días de gym del plan (rutina.dias)
  edits?: PlanEdit[];
  sesiones?: SesionMin[];
  hoy: string;            // 'YYYY-MM-DD'
}): DiaSemana[] {
  const { semanaInicio, dias, hoy } = args;
  const edits = args.edits ?? [];
  const sesiones = args.sesiones ?? [];

  // 1) Armar los 7 días con sus fechas, todos en descanso.
  const semana: DiaSemana[] = [];
  for (let i = 0; i < 7; i++) {
    const fecha = addDias(semanaInicio, i);
    semana.push({ fecha, dow: i, tipo: 'descanso', dia: null, hecho: false, cargaHecha: 0, esHoy: fecha === hoy });
  }

  // 2) Reparto por defecto: colocar los N días de gym en sus slots.
  const n = Math.min(dias.length, 7);
  const slots = REPARTO[n] ?? Array.from({ length: n }, (_, i) => i);
  slots.forEach((dow, idx) => {
    if (dias[idx]) { semana[dow].tipo = 'gym'; semana[dow].dia = dias[idx]; }
  });

  // 3) Aplicar ediciones en orden de creación, solo las que caen dentro de esta semana.
  const enSemana = (f: string) => f >= semana[0].fecha && f <= semana[6].fecha;
  const idxDe = (f: string) => semana.findIndex((d) => d.fecha === f);
  const ordenadas = edits
    .filter((e) => enSemana(e.fecha))
    .slice()
    .sort((a, b) => (a.created_at ?? '').localeCompare(b.created_at ?? ''));

  for (const e of ordenadas) {
    const i = idxDe(e.fecha);
    if (i < 0) continue;
    if (e.accion === 'swap_moto') {
      semana[i].tipo = 'moto'; semana[i].dia = null;
    } else if (e.accion === 'descanso') {
      semana[i].tipo = 'descanso'; semana[i].dia = null;
    } else if (e.accion === 'mover') {
      const destino = e.payload?.hacia;
      if (typeof destino === 'string' && enSemana(destino)) {
        const j = idxDe(destino);
        if (j >= 0 && j !== i) {
          // swap de contenido entre el día origen y el destino.
          const tmpTipo = semana[j].tipo, tmpDia = semana[j].dia;
          semana[j].tipo = semana[i].tipo; semana[j].dia = semana[i].dia;
          semana[i].tipo = tmpTipo; semana[i].dia = tmpDia;
        }
      }
    } else if (e.accion === 'agregar') {
      // Sesión extra: ese día pasa a gym repitiendo un Día del plan (no quita de su slot original).
      const d = dias.find((x) => x.dia_numero === e.payload?.dia_numero) ?? null;
      if (d) { semana[i].tipo = 'gym'; semana[i].dia = d; }
    }
    // 'simular' y 'trim_volumen' no afectan el calendario acá.
  }

  // 4) Overlay de sesiones registradas: marcan "hecho" y suman carga.
  //    Si el día estaba en descanso y registraste moto/simulación, ese día adopta ese tipo (tu salida cuenta).
  for (const s of sesiones) {
    const i = idxDe(s.fecha);
    if (i < 0) continue;
    semana[i].hecho = true;
    semana[i].cargaHecha += s.carga ?? 0;
    if (semana[i].tipo === 'descanso' && (s.tipo === 'moto' || s.tipo === 'simulacion')) {
      semana[i].tipo = s.tipo as TipoDia;
    }
  }

  return semana;
}

// Atajo: el día de hoy dentro de la semana efectiva (o null si hoy cae fuera del rango).
export function diaDeHoy(semana: DiaSemana[]): DiaSemana | null {
  return semana.find((d) => d.esHoy) ?? null;
}
