// src/components/Onboarding.tsx — Alta del perfil en pasos. Al terminar, guarda en `profiles`.
import { useState } from 'react';
import { colors, fontFamily, fontSize, fontWeight, space, radius } from '../lib/tokens';
import { Button, Field, NumberInput, Pills, MultiPills, YesNo, ProgressDots, type Opt } from './ui';
import { useSaveProfile } from '../lib/queries';

const DISCIPLINAS: Opt[] = [{ value: 'hard_enduro', label: 'Hard enduro' }, { value: 'cross_country', label: 'Cross country' }];
const NIVELES: Opt[] = [{ value: 'principiante', label: 'Principiante' }, { value: 'intermedio', label: 'Intermedio' }, { value: 'avanzado', label: 'Avanzado' }];
const EQUIPOS: Opt[] = [{ value: 'casa', label: 'En casa' }, { value: 'basico', label: 'Gimnasio básico' }, { value: 'completo', label: 'Gimnasio completo' }];
const LESIONES: Opt[] = [
  { value: 'cuello', label: 'Cuello' }, { value: 'hombro', label: 'Hombro' }, { value: 'muneca', label: 'Muñeca' },
  { value: 'espalda_baja', label: 'Espalda baja' }, { value: 'rodilla', label: 'Rodilla' },
];
const PARQ = [
  '¿Algún médico te dijo que tenés un problema del corazón y que solo deberías hacer actividad física supervisada?',
  '¿Sentís dolor en el pecho cuando hacés actividad física?',
  '¿En el último mes tuviste dolor en el pecho estando en reposo?',
  '¿Perdés el equilibrio por mareos, o alguna vez perdiste el conocimiento?',
  '¿Tenés algún problema óseo o articular que pueda empeorar con el ejercicio?',
  '¿Tomás medicación para la presión o para el corazón?',
  '¿Conocés alguna otra razón por la que no deberías hacer actividad física?',
];
const TOTAL = 5;

export function Onboarding({ userId }: { userId: string }) {
  const save = useSaveProfile();
  const [step, setStep] = useState(0);
  const [disciplina, setDisciplina] = useState<string | null>(null);
  const [nivel, setNivel] = useState<string | null>(null);
  const [edad, setEdad] = useState<number | ''>('');
  const [peso, setPeso] = useState<number | ''>('');
  const [altura, setAltura] = useState<number | ''>('');
  const [dias, setDias] = useState<number | ''>('');
  const [minutos, setMinutos] = useState<number | ''>('');
  const [equipo, setEquipo] = useState<string | null>(null);
  const [lesiones, setLesiones] = useState<string[]>([]);
  const [parq, setParq] = useState<(boolean | null)[]>(Array(PARQ.length).fill(null));
  const [consent, setConsent] = useState(false);

  const inRange = (v: number | '', lo: number, hi: number) => v !== '' && v >= lo && v <= hi;
  const valido =
    step === 0 ? !!disciplina && !!nivel :
    step === 1 ? inRange(edad, 18, 100) && inRange(peso, 30, 250) && inRange(altura, 120, 230) && inRange(dias, 1, 6) && (minutos === '' || inRange(minutos, 10, 240)) && !!equipo :
    step === 2 ? true :
    step === 3 ? parq.every((p) => p !== null) :
    consent;
  const algunaBandera = parq.some((p) => p === true);

  function toggleLesion(v: string) {
    setLesiones((cur) => (cur.includes(v) ? cur.filter((x) => x !== v) : [...cur, v]));
  }

  function finalizar() {
    save.mutate({
      user_id: userId,
      disciplina: disciplina!, nivel: nivel!, objetivo: 'general',
      edad: Number(edad), peso_kg: Number(peso), altura_cm: Number(altura),
      dias_disponibles: Number(dias), minutos_por_sesion: minutos === '' ? null : Number(minutos),
      equipo: equipo!, lesiones,
      parq: { version: 'parq-7', respuestas: parq, alguna_bandera: algunaBandera },
      consent_at: new Date().toISOString(),
    });
    // Al guardarse, el perfil se invalida y App muestra el Home.
  }

  const titulos = ['Tu moto', 'Sobre vos', '¿Alguna lesión?', 'Chequeo de salud', 'Antes de empezar'];

  return (
    <div style={{ fontFamily, minHeight: '100vh', background: colors.bg, display: 'flex', flexDirection: 'column' }}>
      <div style={{ flex: 1, maxWidth: 480, width: '100%', margin: '0 auto', padding: space.lg, boxSizing: 'border-box' }}>
        <ProgressDots total={TOTAL} current={step} />
        <h1 style={{ fontSize: fontSize.title1, fontWeight: fontWeight.bold, color: colors.ink, margin: `0 0 ${space.lg}px` }}>{titulos[step]}</h1>

        {step === 0 && (
          <>
            <Field label="Disciplina"><Pills options={DISCIPLINAS} value={disciplina} onChange={setDisciplina} /></Field>
            <Field label="Tu nivel" hint="Sé honesto: define cuánto exige el plan."><Pills options={NIVELES} value={nivel} onChange={setNivel} /></Field>
          </>
        )}

        {step === 1 && (
          <>
            <Field label="Edad"><NumberInput value={edad} onChange={setEdad} suffix="años" /></Field>
            <Field label="Peso"><NumberInput value={peso} onChange={setPeso} suffix="kg" /></Field>
            <Field label="Altura"><NumberInput value={altura} onChange={setAltura} suffix="cm" /></Field>
            <Field label="Días por semana para el gimnasio" hint="De 1 a 6."><NumberInput value={dias} onChange={setDias} suffix="días" /></Field>
            <Field label="Minutos por sesión (opcional)"><NumberInput value={minutos} onChange={setMinutos} suffix="min" placeholder="60" /></Field>
            <Field label="¿Con qué contás?"><Pills options={EQUIPOS} value={equipo} onChange={setEquipo} /></Field>
          </>
        )}

        {step === 2 && (
          <Field label="Marcá las que tengas (o ninguna)" hint="El plan evita los ejercicios que puedan agravarlas.">
            <MultiPills options={LESIONES} values={lesiones} onToggle={toggleLesion} />
          </Field>
        )}

        {step === 3 && (
          <>
            {PARQ.map((q, i) => (
              <Field key={i} label={`${i + 1}. ${q}`}>
                <YesNo value={parq[i]} onChange={(v) => setParq((cur) => cur.map((x, j) => (j === i ? v : x)))} />
              </Field>
            ))}
            {algunaBandera && (
              <div style={{ background: colors.orangeSoft, color: colors.orangeInk, fontSize: fontSize.footnote, borderRadius: radius.md, padding: space.md }}>
                Respondiste que sí a alguna. Te recomendamos consultar con un profesional de salud antes de arrancar a entrenar.
              </div>
            )}
          </>
        )}

        {step === 4 && (
          <>
            <p style={{ fontSize: fontSize.subhead, color: colors.ink2, lineHeight: 1.5, margin: `0 0 ${space.md}px` }}>
              Esta app arma planes de entrenamiento generales. No reemplaza el consejo de un médico ni de un profesional del ejercicio.
              Entrenás y manejás bajo tu responsabilidad. Si algo te duele o no se siente bien, pará y consultá.
            </p>
            <button onClick={() => setConsent((c) => !c)}
              style={{ display: 'flex', gap: space.sm, alignItems: 'flex-start', width: '100%', textAlign: 'left',
                background: consent ? colors.greenSoft : colors.surface, border: `1px solid ${consent ? colors.greenInk : colors.hairlineStrong}`,
                borderRadius: radius.md, padding: space.md, cursor: 'pointer', fontFamily }}>
              <span style={{ width: 22, height: 22, flexShrink: 0, borderRadius: radius.sm, border: `2px solid ${consent ? colors.greenInk : colors.hairlineStrong}`,
                background: consent ? colors.greenInk : 'transparent', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: fontSize.footnote }}>
                {consent ? '✓' : ''}
              </span>
              <span style={{ fontSize: fontSize.subhead, color: colors.ink2 }}>Entiendo y acepto. Quiero empezar.</span>
            </button>
            {save.isError && (
              <div style={{ marginTop: space.md, background: colors.redSoft, color: colors.redInk, fontSize: fontSize.footnote, borderRadius: radius.sm, padding: space.sm }}>
                No se pudo guardar. Revisá los datos y probá de nuevo.
              </div>
            )}
          </>
        )}
      </div>

      <div style={{ position: 'sticky', bottom: 0, background: colors.bg, borderTop: `1px solid ${colors.hairline}`,
        padding: space.md, display: 'flex', gap: space.sm, maxWidth: 480, width: '100%', margin: '0 auto', boxSizing: 'border-box' }}>
        {step > 0 && <Button variant="ghost" onClick={() => setStep((s) => s - 1)}>Atrás</Button>}
        {step < TOTAL - 1
          ? <Button full onClick={() => setStep((s) => s + 1)} disabled={!valido}>Seguir</Button>
          : <Button full onClick={finalizar} disabled={!valido || save.isPending}>{save.isPending ? 'Guardando…' : 'Empezar'}</Button>}
      </div>
    </div>
  );
}
