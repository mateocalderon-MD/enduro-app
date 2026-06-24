// src/components/EditarPerfil.tsx — Editar el perfil (lo que afecta al plan) y regenerar.
import { useState } from 'react';
import { colors, fontFamily, fontSize, fontWeight, space } from '../lib/tokens';
import { Button, Field, NumberInput, Pills, MultiPills, type Opt } from './ui';
import { useProfile, useActualizarPerfil, useGenerarPlan, useRestablecerSemana, type ProfileRow } from '../lib/queries';

const DISCIPLINAS: Opt[] = [{ value: 'hard_enduro', label: 'Hard enduro' }, { value: 'cross_country', label: 'Cross country' }];
const NIVELES: Opt[] = [{ value: 'principiante', label: 'Principiante' }, { value: 'intermedio', label: 'Intermedio' }, { value: 'avanzado', label: 'Avanzado' }];
const EQUIPOS: Opt[] = [{ value: 'casa', label: 'En casa' }, { value: 'basico', label: 'Gimnasio básico' }, { value: 'completo', label: 'Gimnasio completo' }];
const LESIONES: Opt[] = [
  { value: 'cuello', label: 'Cuello' }, { value: 'hombro', label: 'Hombro' }, { value: 'muneca', label: 'Muñeca' },
  { value: 'espalda_baja', label: 'Espalda baja' }, { value: 'rodilla', label: 'Rodilla' },
];

export function EditarPerfil({ userId, planWeekId, onCerrar }: { userId: string; planWeekId: string | null; onCerrar: () => void }) {
  const { data: perfil, isLoading } = useProfile(userId);
  if (isLoading || !perfil) {
    return <div style={{ fontFamily, padding: space.lg, color: colors.ink4 }}>Cargando perfil…</div>;
  }
  return <Form userId={userId} perfil={perfil} planWeekId={planWeekId} onCerrar={onCerrar} />;
}

function Form({ userId, perfil, planWeekId, onCerrar }: { userId: string; perfil: ProfileRow; planWeekId: string | null; onCerrar: () => void }) {
  const actualizar = useActualizarPerfil(userId);
  const generar = useGenerarPlan(userId);
  const restablecer = useRestablecerSemana();

  const [disciplina, setDisciplina] = useState<string | null>(perfil.disciplina);
  const [nivel, setNivel] = useState<string | null>(perfil.nivel);
  const [edad, setEdad] = useState<number | ''>(perfil.edad ?? '');
  const [peso, setPeso] = useState<number | ''>(perfil.peso_kg ?? '');
  const [altura, setAltura] = useState<number | ''>(perfil.altura_cm ?? '');
  const [dias, setDias] = useState<number | ''>(perfil.dias_disponibles ?? '');
  const [equipo, setEquipo] = useState<string | null>(perfil.equipo);
  const [lesiones, setLesiones] = useState<string[]>(perfil.lesiones ?? []);
  const [error, setError] = useState<string | null>(null);

  const inRange = (v: number | '', lo: number, hi: number) => v !== '' && v >= lo && v <= hi;
  const valido = !!disciplina && !!nivel && !!equipo &&
    inRange(edad, 18, 100) && inRange(peso, 30, 250) && inRange(altura, 120, 230) && inRange(dias, 1, 6);

  const toggleLesion = (v: string) => setLesiones((xs) => xs.includes(v) ? xs.filter((x) => x !== v) : [...xs, v]);

  const ocupado = actualizar.isPending || generar.isPending || restablecer.isPending;

  async function guardar() {
    if (!valido || ocupado) return;
    setError(null);
    try {
      await actualizar.mutateAsync({
        disciplina: disciplina!, nivel: nivel!, equipo: equipo!,
        edad: Number(edad), peso_kg: Number(peso), altura_cm: Number(altura),
        dias_disponibles: Number(dias), lesiones,
      });
      await generar.mutateAsync({ objetivo: 'general', reset: true });
      if (planWeekId) await restablecer.mutateAsync(planWeekId);
      onCerrar();
    } catch (e: any) {
      setError(e?.message ?? 'No se pudo guardar. Probá de nuevo.');
    }
  }

  return (
    <div style={{ fontFamily, maxWidth: 480, width: '100%', margin: '0 auto', padding: space.lg, boxSizing: 'border-box' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: space.lg }}>
        <h1 style={{ fontSize: fontSize.title1, fontWeight: fontWeight.bold, color: colors.ink, margin: 0 }}>Editar objetivos</h1>
        <button onClick={onCerrar} style={{ border: 'none', background: 'none', color: colors.ink4, fontSize: fontSize.subhead, cursor: 'pointer', fontFamily }}>Cancelar</button>
      </div>

      <Field label="Disciplina"><Pills options={DISCIPLINAS} value={disciplina} onChange={setDisciplina} /></Field>
      <Field label="Tu nivel" hint="Sé honesto: define cuánto exige el plan."><Pills options={NIVELES} value={nivel} onChange={setNivel} /></Field>
      <Field label="Edad"><NumberInput value={edad} onChange={setEdad} suffix="años" /></Field>
      <Field label="Peso"><NumberInput value={peso} onChange={setPeso} suffix="kg" /></Field>
      <Field label="Altura"><NumberInput value={altura} onChange={setAltura} suffix="cm" /></Field>
      <Field label="Días de gym por semana"><NumberInput value={dias} onChange={setDias} suffix="días" /></Field>
      <Field label="¿Con qué contás?"><Pills options={EQUIPOS} value={equipo} onChange={setEquipo} /></Field>
      <Field label="Lesiones o zonas a cuidar" hint="El plan evita ejercicios que las compliquen.">
        <MultiPills options={LESIONES} values={lesiones} onToggle={toggleLesion} />
      </Field>

      <p style={{ fontSize: fontSize.footnote, color: colors.ink4, margin: `${space.md}px 0` }}>
        Al guardar, se regenera el plan de esta semana con los cambios y se borran las ediciones manuales (mover/swap/etc.) de la semana.
      </p>

      {error && (
        <div style={{ background: colors.redSoft, color: colors.redInk, borderRadius: 8, padding: space.sm, marginBottom: space.md, fontSize: fontSize.footnote }}>{error}</div>
      )}

      <Button full onClick={guardar} disabled={!valido || ocupado}>
        {ocupado ? 'Guardando…' : 'Guardar y regenerar plan'}
      </Button>
    </div>
  );
}
