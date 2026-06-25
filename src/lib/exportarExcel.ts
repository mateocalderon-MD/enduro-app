// src/lib/exportarExcel.ts — Exporta los datos del usuario a un .xlsx (sesiones, ejercicios, perfil)
// para analizar donde quieras (p. ej. una plataforma de IA). Requiere la librería 'xlsx' (npm i xlsx).
import * as XLSX from 'xlsx';
import type { SessionRow, ProfileRow } from './queries';

export function exportarExcel(sesiones: SessionRow[], profile: ProfileRow | null) {
  const wb = XLSX.utils.book_new();

  // Hoja 1 — Sesiones: una fila por sesión (gym, moto y simulación).
  const sesionesRows = sesiones.map((s) => ({
    fecha: s.fecha,
    tipo: s.tipo,
    subtipo: s.subtipo ?? '',
    duracion_min: s.duracion_min,
    rpe: s.rpe,
    carga: s.carga,
    dia: s.payload?.dia_numero ?? '',
  }));
  XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(sesionesRows), 'Sesiones');

  // Hoja 2 — Ejercicios: una fila por ejercicio registrado (aplana el payload de gym/simulación).
  const ejercicioRows: Array<Record<string, unknown>> = [];
  for (const s of sesiones) {
    const ejs = s.payload?.ejercicios;
    if (!Array.isArray(ejs)) continue;
    for (const e of ejs) {
      ejercicioRows.push({
        fecha: s.fecha,
        tipo: s.tipo,
        ejercicio: e?.nombre ?? '',
        slot: e?.slot_id ?? '',
        peso_kg: typeof e?.peso === 'number' ? e.peso : '',
        reps: typeof e?.reps === 'number' ? e.reps : '',
      });
    }
  }
  XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(ejercicioRows), 'Ejercicios');

  // Hoja 3 — Perfil: campo / valor.
  if (profile) {
    const perfilRows = [
      { campo: 'disciplina', valor: profile.disciplina },
      { campo: 'nivel', valor: profile.nivel },
      { campo: 'objetivo', valor: profile.objetivo },
      { campo: 'edad', valor: profile.edad },
      { campo: 'peso_kg', valor: profile.peso_kg },
      { campo: 'altura_cm', valor: profile.altura_cm },
      { campo: 'dias_disponibles', valor: profile.dias_disponibles },
      { campo: 'equipo', valor: profile.equipo },
      { campo: 'lesiones', valor: (profile.lesiones ?? []).join(', ') },
    ];
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(perfilRows), 'Perfil');
  }

  const fecha = new Date().toISOString().slice(0, 10);
  XLSX.writeFile(wb, `enduro-app-datos-${fecha}.xlsx`);
}
