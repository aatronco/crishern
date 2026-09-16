// js/workout-data.js
// Jacked & Tan 2.0 (GZCL, Cody Lefever) — versión de 4 días, 12 semanas.
// Transcrito fiel al spreadsheet original ("GZCL Free Compendium", hoja
// "J&T2.0 KGS"): mismos porcentajes, reps, series y semanas de test/deload.
// Training Max (2RM estimado) de Crishern: Sentadilla 140 kg, Banca 60 kg,
// Peso Muerto 140 kg. El de Press Militar no se conoce — se deja como '?'
// hasta que él lo defina en su primera sesión del Día 4.
//
// Simplificación consciente respecto al original: el spreadsheet reasigna
// qué ejercicio ocupa cada casillero de T2b/T2c/T3 en las semanas 7-11 (el
// propio autor lo llama "T3 Variety Option... optional"). Aquí se mantienen
// los mismos ejercicios de accesorio durante las 12 semanas en vez de
// rotarlos, conservando el mismo esquema de series/reps y semanas de
// descanso — el "puro" del programa (T1, T2a y su progresión) no cambia.

export const PROGRAM_WEEKS = 12;

export const APP_NAME = 'Crishern';
export const APP_ICON = '🏴‍☠️';
export const APP_TAGLINE = 'Jacked & Tan 2.0 — 4 días, 12 semanas (GZCL)';

const round25 = kg => Math.round(kg / 2.5) * 2.5;
const pct = p => `${Math.round(p * 1000) / 10}%`;

// ── T1 — movimiento principal del día ───────────────────────────────────────
// Semanas 1-5: buscar un Rep Max de la semana, luego series de backoff a
// % de tu Training Max (TM) fijo. Semana 6: test de 1RM (sin backoff).
// Semanas 7-11: buscar un nuevo Rep Max, backoff a % de ESE Rep Max (no de
// tu TM). Semana 12: test final de 1RM.
function t1Wave(tm, pctBlock1) {
  const rm1 = ['10RM', '8RM', '6RM', '4RM', '2RM'];
  const reps1 = [6, 5, 4, 3, 2];
  const sets1 = ['3+', '3+', '3+', '3+', '4+'];
  const rm2 = ['6RM', '4RM', '2RM', '5RM', '3RM'];
  const pctBlock2 = [0.85, 0.85, 0.85, 0.9, 0.9];
  const reps2 = [3, 2, 1, 2, 1];
  const sets2 = ['5+', '5+', '5+', '3+', '3+'];

  const byWeek = {};
  for (let i = 0; i < 5; i++) {
    const kg = tm ? round25(tm * pctBlock1[i]) : '?';
    byWeek[i + 1] = { warmup: [], work: [
      { label: 'Buscar RM', reps: `Encontrar ${rm1[i]}`, kg: 'Según tu esfuerzo de hoy', rest: 180, type: 'work',
        note: 'Sube de peso en tus aproximaciones hasta llegar a un peso con el que completes justo esas reps, dejando 1-2 en reserva.' },
      { label: `${sets1[i]}×${reps1[i]}`, reps: reps1[i], kg, rest: 240, type: 'work',
        note: `Backoff a ${pct(pctBlock1[i])} de tu Training Max (no del RM que acabas de encontrar).` },
    ] };
  }
  byWeek[6] = { warmup: [], work: [
    { label: 'Test', reps: 'Encontrar 1RM', kg: 'Tu máximo de hoy', rest: 300, type: 'work',
      note: 'Semana de test — sin series de backoff. Registra el resultado: puedes usarlo para actualizar tu Training Max de cara al bloque 2 (semanas 7-12).' },
  ] };
  for (let i = 0; i < 5; i++) {
    byWeek[7 + i] = { warmup: [], work: [
      { label: 'Buscar RM', reps: `Encontrar ${rm2[i]}`, kg: 'Según tu esfuerzo de hoy', rest: 180, type: 'work',
        note: 'Igual que en el bloque 1: sube hasta un peso con el que completes justo esas reps con margen.' },
      { label: `${sets2[i]}×${reps2[i]}`, reps: reps2[i], kg: `${pct(pctBlock2[i])} del RM de hoy`, rest: 240, type: 'work',
        note: `A diferencia del bloque 1, el backoff aquí es ${pct(pctBlock2[i])} del Rep Max que acabas de encontrar hoy, no de tu TM fija.` },
    ] };
  }
  byWeek[12] = { warmup: [], work: [
    { label: 'Test final', reps: 'Encontrar 1RM', kg: 'Tu máximo de hoy', rest: 300, type: 'work',
      note: 'Test final del ciclo de 12 semanas. Compáralo con tu test de la semana 6.' },
  ] };
  return byWeek;
}

// T1b del Día 4 — Sling Shot Bench: solo busca el Rep Max de la semana y
// hace Max Rep Sets al mismo peso; no usa % de Training Max.
function t1RmOnly(rmByWeek, setsByWeek) {
  const byWeek = {};
  for (let w = 1; w <= 12; w++) {
    if (w === 6 || w === 12) {
      byWeek[w] = { warmup: [], work: [
        { label: 'Test', reps: 'Encontrar 1RM', kg: 'Tu máximo de hoy', rest: 300, type: 'work',
          note: w === 6 ? 'Test de mitad de ciclo, sin MRS.' : 'Test final del ciclo.' },
      ] };
    } else {
      byWeek[w] = { warmup: [], work: [
        { label: setsByWeek[w], reps: `Encontrar ${rmByWeek[w]}`, kg: 'Tu propio peso de hoy', rest: 180, type: 'work',
          note: `Busca tu ${rmByWeek[w]} de hoy y repite ese peso en ${setsByWeek[w]} adicionales a las máximas reps posibles (dejando 1-2 en reserva).` },
      ] };
    }
  }
  return byWeek;
}

// ── T2a — movimiento secundario con % de Training Max ──────────────────────
function t2aWave(tm, pctBlock1, reps1, sets1, pctBlock2, reps2, sets2, { week12Test = false } = {}) {
  const byWeek = {};
  for (let i = 0; i < 5; i++) {
    const kg = tm ? round25(tm * pctBlock1[i]) : '?';
    byWeek[i + 1] = { setsReps: `${sets1[i]}×${reps1[i]}`, kg, comment: `${pct(pctBlock1[i])} de tu Training Max.` };
  }
  byWeek[6] = { setsReps: 'Descanso', comment: 'T2 descansa en la semana de test de T1.' };
  for (let i = 0; i < 5; i++) {
    const kg = tm ? round25(tm * pctBlock2[i]) : '?';
    byWeek[7 + i] = { setsReps: `${sets2[i]}×${reps2[i]}`, kg, comment: `${pct(pctBlock2[i])} de tu Training Max.` };
  }
  byWeek[12] = week12Test
    ? { setsReps: 'Test', kg: 'Tu máximo de hoy', comment: 'Este día también cierra con test de 1RM en el T2, según el original.' }
    : { setsReps: 'Descanso', comment: 'T2 descansa en la semana de test final.' };
  return byWeek;
}

// ── T2b/T2c y T3 — accesorios "Max Rep Set": sin % fijo, trabajas hasta el
// número de reps indicado con el peso que te lo permita, dejando 1-2 en
// reserva. La progresión es bajar reps semana a semana (misma carga o algo
// más, a tu criterio) hasta el techo del ejercicio.
function mrsWave(repsByWeek) {
  const byWeek = {};
  for (let w = 1; w <= 12; w++) {
    const reps = repsByWeek[w];
    byWeek[w] = reps
      ? { setsReps: `3×${reps} (MRS)`, comment: 'Trabaja hasta ese número de reps con técnica sólida — deja 1-2 en reserva, sin llegar al fallo. El peso lo defines tú cada semana.' }
      : { setsReps: 'Descanso', comment: 'Este accesorio descansa esta semana según el programa original.' };
  }
  return byWeek;
}

const T2B_TAPER = { 1: 15, 2: 12, 3: 10, 4: 8, 5: 6, 6: null, 7: 12, 8: 10, 9: 8, 10: 6, 11: null, 12: null };
const T3_TAPER = { 1: 20, 2: 18, 3: 16, 4: 14, 5: 12, 6: 10, 7: null, 8: 18, 9: 16, 10: 14, 11: 12, 12: null };

const mrsAccessory = (name, taper, rest = 90) => ({ name, rest, byWeek: mrsWave(taper) });

// ── Training Max de Crishern (2RM estimado) ─────────────────────────────────
const TM_SQUAT = 140;
const TM_BENCH = 60;
const TM_DEADLIFT = 140;
const TM_OHP = null; // Desconocido — ajustar en la primera sesión del Día 4.

// ── Día Uno — T1 Sentadilla ─────────────────────────────────────────────────
export const DIA_UNO = {
  name: 'Sentadilla', color: 'lilac', icon: '🦵', dayLabel: 'Día 1',
  note: 'T1 Sentadilla. Busca el Rep Max de la semana, luego el backoff a % de tu Training Max (140 kg).',
  T1: [{ exercise: 'Back Squat (Sentadilla)', byWeek: t1Wave(TM_SQUAT, [0.7, 0.75, 0.8, 0.825, 0.85]) }],
  T2: [
    {
      name: '2" Deficit Deadlift (semanas 1-9) / Peso Muerto (10-11)', rest: 150,
      note: 'Peso muerto con déficit de 2" (una plataforma o disco de 5 cm bajo los pies) en el bloque 1; en el bloque 2 baja a 1" de déficit y termina sin déficit.',
      byWeek: t2aWave(TM_DEADLIFT, [0.5, 0.6, 0.7, 0.75, 0.8], [10, 8, 6, 4, 2], [4, 4, 4, 5, 7], [0.7, 0.75, 0.8, 0.825, 0.85], [6, 5, 4, 3, 2], [5, 5, 5, 6, 7]),
    },
    mrsAccessory('Prensa a una pierna', T2B_TAPER),
    mrsAccessory('Remo con pecho apoyado', T2B_TAPER),
    mrsAccessory('Remo en polea agarre V', T3_TAPER),
    mrsAccessory('Curl femoral', T3_TAPER),
    mrsAccessory('Extensión de cuádriceps', T3_TAPER),
    mrsAccessory('Curl martillo con mancuerna', T3_TAPER),
  ],
};

// ── Día Dos — T1 Press Banca ─────────────────────────────────────────────────
export const DIA_DOS = {
  name: 'Press Banca', color: 'pink', icon: '💪', dayLabel: 'Día 2',
  note: 'T1 Press Banca. Backoff a % de tu Training Max (60 kg).',
  T1: [{ exercise: 'Bench Press (Press Banca)', byWeek: t1Wave(TM_BENCH, [0.65, 0.7, 0.75, 0.775, 0.8]) }],
  T2: [
    {
      name: 'Close Grip Bench (agarre cerrado)', rest: 150,
      note: 'Único día donde el T2 también cierra con test de 1RM en la semana 12.',
      byWeek: t2aWave(TM_BENCH, [0.5, 0.55, 0.6, 0.625, 0.65], [10, 8, 6, 4, 2], [4, 4, 4, 5, 7], [0.7, 0.75, 0.8, 0.825, 0.85], [6, 5, 4, 3, 2], [5, 5, 5, 6, 7], { week12Test: true }),
    },
    mrsAccessory('Press inclinado', T2B_TAPER),
    mrsAccessory('Press de hombro con mancuernas', T2B_TAPER),
    mrsAccessory('Elevación lateral en máquina', T3_TAPER),
    mrsAccessory('Aperturas posteriores (pájaros)', T3_TAPER),
    mrsAccessory('Aperturas de pecho', T3_TAPER),
    mrsAccessory('Extensión de tríceps en polea', T3_TAPER),
  ],
};

// ── Día Tres — T1 Sentadilla Frontal / Peso Muerto ──────────────────────────
export const DIA_TRES = {
  name: 'Frontal / Peso Muerto', color: 'cyan', icon: '⚓', dayLabel: 'Día 3',
  note: 'T1 Sentadilla Frontal en el bloque 1 (semanas 1-6); pasa a Peso Muerto en el bloque 2 (semanas 7-12).',
  T1: [{ exercise: 'Front Squat → Deadlift', byWeek: t1Wave(TM_SQUAT, [0.7, 0.75, 0.8, 0.825, 0.85]) }],
  T2: [
    {
      name: 'Back Squat (1-5) / Front Squat (7-11)', rest: 150,
      note: 'También cierra con test de 1RM (Sentadilla Frontal) en la semana 12.',
      byWeek: t2aWave(TM_SQUAT, [0.5, 0.6, 0.7, 0.75, 0.8], [10, 8, 6, 4, 2], [4, 4, 4, 5, 7], [0.7, 0.75, 0.8, 0.825, 0.85], [6, 5, 4, 3, 2], [5, 5, 5, 6, 7], { week12Test: true }),
    },
    mrsAccessory('Zancada retrocediendo', T2B_TAPER),
    mrsAccessory('Jalón al pecho agarre V', T2B_TAPER),
    mrsAccessory('Extensión de cuádriceps', T3_TAPER),
    mrsAccessory('Curl femoral', T3_TAPER),
    mrsAccessory('Jalón agarre ancho', T3_TAPER),
    mrsAccessory('Curl barra Z', T3_TAPER),
  ],
};

// ── Día Cuatro — T1 Press Militar + Sling Shot Bench ────────────────────────
export const DIA_CUATRO = {
  name: 'Press Militar', color: 'gold', icon: '🎯', dayLabel: 'Día 4',
  note: 'Dos T1: Press Militar (Training Max desconocido — defínelo tu primera sesión) y Sling Shot Bench (press banca con banda de sobrecarga; si no tienes el implemento, avísame y lo cambiamos).',
  T1: [
    { exercise: 'Military Press (Press Militar)', byWeek: t1Wave(TM_OHP, [0.6, 0.65, 0.7, 0.775, 0.8]) },
    {
      exercise: 'Sling Shot Bench',
      byWeek: t1RmOnly(
        { 1: '10RM', 2: '8RM', 3: '6RM', 4: '4RM', 5: '2RM', 7: '7RM', 8: '4RM', 9: '2RM', 10: '5RM', 11: '3RM' },
        { 1: '4MRS', 2: '4MRS', 3: '4MRS', 4: '4MRS', 5: '4MRS', 7: '4MRS', 8: '4MRS', 9: '1MRS', 10: '3MRS', 11: '1MRS' },
      ),
    },
  ],
  T2: [
    {
      name: 'Legs Up Bench (press banca piernas elevadas)', rest: 150,
      note: 'Reps fijas en 10 durante todo el bloque 1 — solo sube el peso.',
      byWeek: t2aWave(TM_BENCH, [0.45, 0.5, 0.55, 0.575, 0.6], [10, 10, 10, 10, 10], [4, 4, 4, 4, 4], [0.65, 0.7, 0.75, 0.775, 0.8], [6, 5, 4, 3, 2], [5, 5, 5, 6, 7]),
    },
    mrsAccessory('Push Press', T2B_TAPER),
    mrsAccessory('Extensión de tríceps polea alta', T3_TAPER),
    mrsAccessory('Elevación lateral en máquina', T3_TAPER),
    mrsAccessory('Aperturas posteriores (pájaros)', T3_TAPER),
    mrsAccessory('Aperturas de pecho', T3_TAPER),
  ],
};

export const SESSIONS = {
  diaUno: DIA_UNO,
  diaDos: DIA_DOS,
  diaTres: DIA_TRES,
  diaCuatro: DIA_CUATRO,
};
