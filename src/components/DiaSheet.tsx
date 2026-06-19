// src/components/DiaSheet.tsx — Hoja de acciones de un día (se abre desde la vista semanal).
// Acciones: empezar sesión · cambié por moto (swap) · mover a otro día · marcar descanso.
import { useState } from 'react';
import { createPortal } from 'react-dom';
import { colors, fontFamily, fontSize, fontWeight, space, radius } from '../lib/tokens';
import { nombreDow, type DiaSemana } from '../lib/semana';

const MESES = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'];
function fechaLarga(iso: string): string {
  const [, m, d] = iso.split('-').map(Number);
  return `${d} ${MESES[m - 1]}`;
}
const ETIQUETA: Record<string, string> = { gym: 'Gimnasio', moto: 'Moto', simulacion: 'Simulación', descanso: 'Descanso' };

function Item({ label, sub, color, onClick }: { label: string; sub?: string; color?: string; onClick: () => void }) {
  return (
    <button onClick={onClick} style={{
      width: '100%', textAlign: 'left', fontFamily, background: colors.surface, border: 'none',
      borderRadius: radius.md, padding: `${space.md}px`, marginBottom: space.sm, cursor: 'pointer',
    }}>
      <div style={{ fontSize: fontSize.body, fontWeight: fontWeight.semibold, color: color ?? colors.ink }}>{label}</div>
      {sub && <div style={{ fontSize: fontSize.footnote, color: colors.ink4, marginTop: 2 }}>{sub}</div>}
    </button>
  );
}

export function DiaSheet({ dia, dias, semana, onCerrar, onEmpezar, onSwapMoto, onMover, onDescanso, onAgregar }: {
  dia: DiaSemana | null;
  dias: any[];
  semana: DiaSemana[];
  onCerrar: () => void;
  onEmpezar: (d: any) => void;
  onSwapMoto: (fecha: string) => void;
  onMover: (fecha: string, hacia: string) => void;
  onDescanso: (fecha: string) => void;
  onAgregar: (fecha: string, diaNumero: number) => void;
}) {
  const [modo, setModo] = useState<'acciones' | 'mover' | 'traer' | 'agregar'>('acciones');
  if (!dia) return null;

  const cerrar = () => { setModo('acciones'); onCerrar(); };
  const subTitulo = { fontSize: fontSize.footnote, color: colors.ink4, margin: `0 0 ${space.sm}px` };
  const gymOtros = semana.filter((d) => d.tipo === 'gym' && d.fecha !== dia.fecha);

  let cuerpo;
  if (modo === 'mover') {
    cuerpo = (
      <>
        <div style={subTitulo}>Mover a…</div>
        {semana.filter((d) => d.fecha !== dia.fecha).map((d) => (
          <Item key={d.fecha} label={`${nombreDow(d.dow)} ${d.fecha.slice(8)}`}
            sub={d.tipo === 'gym' ? `Tiene Día ${d.dia?.dia_numero} (se intercambian)` : ETIQUETA[d.tipo]}
            onClick={() => { onMover(dia.fecha, d.fecha); cerrar(); }} />
        ))}
        <Item label="Volver" color={colors.ink3} onClick={() => setModo('acciones')} />
      </>
    );
  } else if (modo === 'traer') {
    cuerpo = (
      <>
        <div style={subTitulo}>Traer una sesión de gym a este día</div>
        {gymOtros.length === 0
          ? <div style={{ fontSize: fontSize.footnote, color: colors.ink4, padding: `${space.sm}px 0 ${space.md}px` }}>No hay sesiones de gym para traer.</div>
          : gymOtros.map((d) => (
            <Item key={d.fecha} label={`Día ${d.dia?.dia_numero}`} color={colors.greenInk}
              sub={`Está el ${nombreDow(d.dow)} ${d.fecha.slice(8)} (se intercambian)`}
              onClick={() => { onMover(d.fecha, dia.fecha); cerrar(); }} />
          ))}
        <Item label="Volver" color={colors.ink3} onClick={() => setModo('acciones')} />
      </>
    );
  } else if (modo === 'agregar') {
    cuerpo = (
      <>
        <div style={subTitulo}>¿Qué día repetís? (suma una sesión extra)</div>
        {dias.length === 0
          ? <div style={{ fontSize: fontSize.footnote, color: colors.ink4, padding: `${space.sm}px 0 ${space.md}px` }}>No hay días en el plan.</div>
          : dias.map((d: any) => (
            <Item key={d.dia_numero} label={`Día ${d.dia_numero}`} sub={`${d.ejercicios.length} ejercicios`}
              color={colors.greenInk} onClick={() => { onAgregar(dia.fecha, d.dia_numero); cerrar(); }} />
          ))}
        <Item label="Volver" color={colors.ink3} onClick={() => setModo('acciones')} />
      </>
    );
  } else if (dia.tipo === 'gym') {
    cuerpo = (
      <>
        {dia.dia && <Item label="Empezar sesión" color={colors.greenInk} onClick={() => { onEmpezar(dia.dia); cerrar(); }} />}
        <Item label="Cambié por moto" sub="Hoy anduviste: el gimnasio cede a la salida" color={colors.coralInk}
          onClick={() => { onSwapMoto(dia.fecha); cerrar(); }} />
        <Item label="Mover a otro día" onClick={() => setModo('mover')} />
        <Item label="Marcar descanso" color={colors.ink3} onClick={() => { onDescanso(dia.fecha); cerrar(); }} />
      </>
    );
  } else {
    cuerpo = (
      <>
        <Item label="Voy a andar" sub="Marco este día como salida de moto" color={colors.coralInk}
          onClick={() => { onSwapMoto(dia.fecha); cerrar(); }} />
        <Item label="Traer una sesión de gym" sub="Muevo un día existente acá (no suma volumen)" color={colors.greenInk}
          onClick={() => setModo('traer')} />
        <Item label="Agregar una sesión extra" sub="Repito un día: suma una sesión a la semana" color={colors.greenInk}
          onClick={() => setModo('agregar')} />
      </>
    );
  }

  return createPortal(
    <div onClick={cerrar} style={{
      position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.35)', zIndex: 300,
      display: 'flex', alignItems: 'flex-end', justifyContent: 'center', fontFamily,
    }}>
      <div onClick={(e) => e.stopPropagation()} style={{
        width: '100%', maxWidth: 480, background: colors.bg, borderTopLeftRadius: radius.xl, borderTopRightRadius: radius.xl,
        padding: space.lg, boxSizing: 'border-box', paddingBottom: space.xl,
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: space.md }}>
          <div style={{ fontSize: fontSize.headline, fontWeight: fontWeight.semibold, color: colors.ink }}>
            {nombreDow(dia.dow)} {fechaLarga(dia.fecha)}
          </div>
          <button onClick={cerrar} style={{ border: 'none', background: 'none', color: colors.ink4, fontSize: fontSize.subhead, cursor: 'pointer' }}>Cerrar</button>
        </div>
        {cuerpo}
      </div>
    </div>,
    document.body,
  );
}
