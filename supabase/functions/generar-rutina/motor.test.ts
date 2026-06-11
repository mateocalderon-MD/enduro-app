// motor.test.ts — Tests de seguridad del motor (correr con: deno test)
// El motor toca seguridad: estos tests blindan los invariantes que NUNCA deben romperse.

import { assert } from 'jsr:@std/assert@1';
import { generarRutina, type Catalogo, type Plantillas, type Perfil } from './motor.ts';

// ---------- Fixture mínimo pero representativo ----------
const CAT: Catalogo = { slots: [
  { id: 'antebrazo', nombre: 'Antebrazo', categoria: 'antebrazo', innegociable: true, variantes: [
    { id: 'ant_casa', nombre: 'Toalla', nivel_equipo: 'casa', impacto: 'bajo', nivel_minimo: 'principiante', contraindicaciones: [] }] },
  { id: 'core', nombre: 'Core', categoria: 'core', innegociable: true, variantes: [
    { id: 'core_casa', nombre: 'Plancha', nivel_equipo: 'casa', impacto: 'bajo', nivel_minimo: 'principiante', contraindicaciones: [] },
    { id: 'core_pro', nombre: 'Pallof', nivel_equipo: 'completo', impacto: 'bajo', nivel_minimo: 'intermedio', contraindicaciones: [] },
    { id: 'core_rodilla', nombre: 'X', nivel_equipo: 'casa', impacto: 'bajo', nivel_minimo: 'principiante', contraindicaciones: ['rodilla'] }] },
  { id: 'tren', nombre: 'Tren inferior', categoria: 'tren_inferior', innegociable: false, variantes: [
    { id: 'tren_alto', nombre: 'Salto', nivel_equipo: 'casa', impacto: 'alto', nivel_minimo: 'principiante', contraindicaciones: ['rodilla'] },
    { id: 'tren_bajo', nombre: 'Sentadilla', nivel_equipo: 'casa', impacto: 'bajo', nivel_minimo: 'principiante', contraindicaciones: [] }] },
  { id: 'acondicionamiento', nombre: 'Acond', categoria: 'acondicionamiento', innegociable: false, variantes: [
    { id: 'acond_alto', nombre: 'Carrera', nivel_equipo: 'casa', impacto: 'alto', nivel_minimo: 'principiante', contraindicaciones: [] },
    { id: 'acond_bajo', nombre: 'Marcha', nivel_equipo: 'casa', impacto: 'bajo', nivel_minimo: 'principiante', contraindicaciones: [] }] },
  { id: 'agilidad_coordinacion', nombre: 'Agilidad', categoria: 'agilidad', innegociable: false, variantes: [
    { id: 'agi_casa', nombre: 'Escalera', nivel_equipo: 'casa', impacto: 'medio', nivel_minimo: 'principiante', contraindicaciones: [] }] },
  { id: 'reaccion', nombre: 'Reacción', categoria: 'reaccion', innegociable: false, variantes: [
    { id: 'rea_casa', nombre: 'Pelota', nivel_equipo: 'casa', impacto: 'bajo', nivel_minimo: 'principiante', contraindicaciones: [] }] },
  { id: 'equilibrio', nombre: 'Equilibrio', categoria: 'equilibrio', innegociable: false, variantes: [
    { id: 'equi_casa', nombre: 'Un pie', nivel_equipo: 'casa', impacto: 'bajo', nivel_minimo: 'principiante', contraindicaciones: [] }] },
] };

const d = (tipo: string, extra: Record<string, unknown>) => ({ tipo, frecuencia_semanal: 2, ...extra });
const PL: Plantillas = { plantillas: [{ disciplina: 'hard_enduro', nivel: 'principiante', objetivo: 'general', slots: [
  { slot_id: 'antebrazo', prioridad: 1, dosis_base: d('isometrico', { series: 3, duracion_seg: 30, rpe: 8, descanso_seg: 60 }) },
  { slot_id: 'core', prioridad: 2, dosis_base: d('isometrico', { series: 3, duracion_seg: 30, rpe: 9, descanso_seg: 60 }) },
  { slot_id: 'tren', prioridad: 3, dosis_base: d('fuerza', { series: 3, reps_min: 8, reps_max: 10, rpe: 9, descanso_seg: 120 }) },
  { slot_id: 'acondicionamiento', prioridad: 4, dosis_base: d('acondicionamiento', { subtipo: 'aerobico', formato: 'continuo', duracion_min: 30, rpe: 7 }) },
  { slot_id: 'agilidad_coordinacion', prioridad: 5, dosis_base: d('neuromotor', { series: 3, duracion_seg: 30 }) },
  { slot_id: 'reaccion', prioridad: 6, dosis_base: d('neuromotor', { series: 3, duracion_seg: 20 }) },
  { slot_id: 'equilibrio', prioridad: 7, dosis_base: d('neuromotor', { series: 2, duracion_seg: 30 }) },
] }] };

const base: Perfil = { disciplina: 'hard_enduro', nivel: 'principiante', objetivo: 'general', edad: 30, peso_kg: 75, altura_cm: 178, dias_disponibles: 4, equipo: 'casa', lesiones: [] };
const ejs = (r: any) => r.dias.flatMap((x: any) => x.ejercicios);

Deno.test('lesión: nunca prescribe un ejercicio contraindicado', () => {
  const r: any = generarRutina({ ...base, lesiones: ['rodilla'] }, CAT, PL);
  assert(!ejs(r).some((e: any) => e.variante_id === 'tren_alto'));
  assert(!ejs(r).some((e: any) => e.variante_id === 'core_rodilla'));
});

Deno.test('equipo: con equipo "casa" no usa variantes que pidan más equipo', () => {
  const r: any = generarRutina(base, CAT, PL);
  assert(ejs(r).every((e: any) => e.variante_id !== 'core_pro'));
  assert(ejs(r).some((e: any) => e.variante_id === 'core_casa'));
});

Deno.test('edad 50+: respeta el techo de RPE (<=7) y no usa impacto alto', () => {
  const r: any = generarRutina({ ...base, edad: 55 }, CAT, PL);
  assert(ejs(r).every((e: any) => typeof e.dosis.rpe !== 'number' || e.dosis.rpe <= 7));
  assert(!ejs(r).some((e: any) => ['tren_alto', 'acond_alto'].includes(e.variante_id)));
});

Deno.test('IMC alto: fuerza acondicionamiento de bajo impacto', () => {
  const r: any = generarRutina({ ...base, edad: 25, peso_kg: 100, altura_cm: 170 }, CAT, PL);
  assert(ejs(r).some((e: any) => e.variante_id === 'acond_bajo'));
  assert(!ejs(r).some((e: any) => e.variante_id === 'acond_alto'));
});

Deno.test('innegociables: siempre aparecen en la rutina', () => {
  const r: any = generarRutina(base, CAT, PL);
  assert(ejs(r).some((e: any) => e.slot_id === 'core'));
  assert(ejs(r).some((e: any) => e.slot_id === 'antebrazo'));
});

Deno.test('determinismo: mismo input -> mismo output', () => {
  assert(JSON.stringify(generarRutina(base, CAT, PL)) === JSON.stringify(generarRutina(base, CAT, PL)));
});

Deno.test('simulación: devuelve un circuito y respeta las lesiones', () => {
  const r: any = generarRutina({ ...base, objetivo: 'simulacion', lesiones: ['rodilla'] }, CAT, PL);
  assert(r.es_simulacion === true);
  assert(r.dias[0].formato === 'circuito');
  assert(!r.dias[0].ejercicios.some((e: any) => e.variante_id === 'core_rodilla'));
});
