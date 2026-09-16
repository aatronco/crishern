// Programa J&T 2.0 (Jacked & Tan, método GZCL) — 12 semanas en 2 mesociclos de
// seis. Referencia: GZCL Free Compendium, hoja "J&T2.0" (no existe una hoja
// "J&T 1.0" en la planilla oficial — J&T2.0 es la única versión publicada).
// Los % y estructuras de esta página replican esa planilla oficial; solo
// cambian el Training Max y las variantes de ejercicio por movimiento
// (definidos en workout-data.js).
export const PROGRAM_WEEKS = 12;
export const PROGRAM_TITLE = 'J&T 2.0 · Jacked & Tan — 12 semanas';
export const PROGRAM_ORIGIN = 'J&T 2.0 de GZCL: 4 días/semana rotando Sentadilla, Banca, Sentadilla Frontal/Peso Muerto y Militar. Bloque 1 (semanas 1-6) sube de intensidad con la última serie AMRAP y termina en un test real de 1RM. Bloque 2 (semanas 7-12) trabaja denso al 85-90% de tu Training Max declarado y vuelve a testear el 1RM en la semana 12 — ese resultado es tu Training Max para el próximo ciclo.';
export const STRENGTH_RULE = 'Rep Out Rule: nunca vayas al fallo real en los AMRAP de T1/T2a, deja siempre 1-2 reps en el tanque. Los accesorios T2b/T2c/T3 son MRS (Max Rep Sets) — así los trae la planilla oficial, con "?" en vez de un peso fijo: sube de peso en el calentamiento hasta encontrar el de hoy dentro del rango de reps de la semana, con margen.';
export const MEASUREMENT_RULE = 'El Training Max es un doble cómodo de un día normal, no tu máximo absoluto. Las semanas 6 y 12 sí son test reales: la última serie de T1 va a una repetición máxima real, y ese resultado valida (o corrige) el Training Max del próximo ciclo. Los pesos del Bloque 2 (semanas 7-11) se calculan sobre el Training Max declarado al inicio del ciclo, no sobre el resultado del test de la semana 6 — si el test dio un número muy distinto, ajusta el Training Max antes de empezar el próximo ciclo.';

export const WEEK_PLAN = {
  1: { label: 'Bloque 1 · semana 1', note: 'Primer contacto del ciclo: series de 6 con AMRAP final en T1.' },
  2: { label: 'Bloque 1 · semana 2', note: 'Sube intensidad, baja a series de 5 con AMRAP final.' },
  3: { label: 'Bloque 1 · semana 3', note: 'Series de 4 con AMRAP final — sigue subiendo.' },
  4: { label: 'Bloque 1 · semana 4', note: 'Series de 3 con AMRAP final.' },
  5: { label: 'Bloque 1 · semana 5', note: 'Series de 2 a mayor volumen (4 series) con AMRAP final — última semana antes del test.' },
  6: { label: 'Bloque 1 · test', note: 'Test real de 1RM en T1. T2 se retira esta semana para llegar fresco. Este número valida tu Training Max.' },
  7: { label: 'Bloque 2 · semana 7', note: 'Densidad alta: 5 series de 3 con AMRAP final al 85% de tu Training Max. Tier 3 descansa esta semana para absorber el cambio de bloque.' },
  8: { label: 'Bloque 2 · semana 8', note: 'Mismo 85%, baja a series de 2 con AMRAP final.' },
  9: { label: 'Bloque 2 · semana 9', note: 'Mismo 85%, series de 1 con AMRAP final.' },
  10: { label: 'Bloque 2 · semana 10', note: 'Sube a 90%, series de 2 con AMRAP final — T2b/T2c se retiran para llegar fresco.' },
  11: { label: 'Bloque 2 · semana 11', note: 'Mismo 90%, series de 1 con AMRAP final — última semana antes del cierre.' },
  12: { label: 'Bloque 2 · test', note: 'Cierre del ciclo: nuevo test real de 1RM en T1. Define tu Training Max para el próximo ciclo de J&T.' },
};

const roundTo5 = kg => Math.ceil(kg / 5) * 5;

const T1_BLOCK1 = [
  { week: 1, reps: 6, sets: 3 },
  { week: 2, reps: 5, sets: 3 },
  { week: 3, reps: 4, sets: 3 },
  { week: 4, reps: 3, sets: 3 },
  { week: 5, reps: 2, sets: 4 },
];

// Idéntico para los 4 días — así lo trae la planilla oficial.
const T1_BLOCK2 = [
  { week: 7, pct: 0.85, reps: 3, sets: 5 },
  { week: 8, pct: 0.85, reps: 2, sets: 5 },
  { week: 9, pct: 0.85, reps: 1, sets: 5 },
  { week: 10, pct: 0.90, reps: 2, sets: 3 },
  { week: 11, pct: 0.90, reps: 1, sets: 3 },
];

function t1TestSet(note) {
  return { warmup: [], work: [{ label: '1RM', reps: 1, kg: 'Test real', rest: 300, type: 'work', note }] };
}

// trainingMax: tu doble cómodo de un día normal (no tu máximo absoluto).
// opts.movementBlock2 / opts.trainingMaxBlock2: para el día que cambia de
// movimiento entre bloques (Sentadilla Frontal → Peso Muerto).
export function jntT1Plan(trainingMax, movement, pctBlock1, opts = {}) {
  const { movementBlock2 = movement, trainingMaxBlock2 = trainingMax } = opts;
  const byWeek = {};
  T1_BLOCK1.forEach(({ week, reps, sets }) => {
    const pct = pctBlock1[week];
    const kg = roundTo5(trainingMax * pct);
    byWeek[week] = {
      warmup: [],
      work: Array.from({ length: sets }, (_, i) => {
        const isAmrap = i === sets - 1;
        return {
          label: `${reps}${isAmrap ? '+' : ''}`, reps, kg, rest: 180, type: 'work',
          note: isAmrap ? `AMRAP a ${Math.round(pct * 100)}% de tu Training Max de ${movement} (${trainingMax} kg). Deja 1-2 reps en el tanque, nunca al fallo real.` : undefined,
        };
      }),
    };
  });
  byWeek[6] = t1TestSet(`Semana de test del Bloque 1: sube de peso en el calentamiento y busca tu 1RM real de ${movement} con buena técnica. Este número valida tu Training Max de ${trainingMax} kg.`);
  T1_BLOCK2.forEach(({ week, pct, reps, sets }) => {
    const kg = roundTo5(trainingMaxBlock2 * pct);
    byWeek[week] = {
      warmup: [],
      work: Array.from({ length: sets }, (_, i) => {
        const isAmrap = i === sets - 1;
        return {
          label: `${reps}${isAmrap ? '+' : ''}`, reps, kg, rest: 240, type: 'work',
          note: isAmrap ? `AMRAP a ${Math.round(pct * 100)}% de tu Training Max de ${movementBlock2} (${trainingMaxBlock2} kg). Deja 1-2 reps en el tanque.` : undefined,
        };
      }),
    };
  });
  byWeek[12] = t1TestSet(`Cierre del bloque: vuelve a testear tu 1RM real de ${movementBlock2}. Ese número es tu nuevo Training Max para el próximo ciclo de J&T (partías de ${trainingMaxBlock2} kg).`);
  return byWeek;
}

// Segundo T1 del día 4 (sustituto de Sling Shot Bench): sin Training Max
// propio en la planilla oficial — se testea en vivo cada semana, con el
// esquema de reps exacto de la hoja oficial (incluye el ida y vuelta del
// Bloque 2: 7RM → 4RM → 2RM → 5RM → 3RM → 1RM).
const LIVE_TEST_REPS = { 1: 10, 2: 8, 3: 6, 4: 4, 5: 2, 6: 1, 7: 7, 8: 4, 9: 2, 10: 5, 11: 3, 12: 1 };

export function jntLiveTestPlan(movement) {
  const byWeek = {};
  Object.entries(LIVE_TEST_REPS).forEach(([week, reps]) => {
    byWeek[Number(week)] = {
      warmup: [],
      work: [{
        label: `${reps}RM`, reps, kg: 'Tú decides — test en vivo', rest: 240, type: 'work',
        note: `Sin Training Max de referencia para ${movement}: sube de peso en el calentamiento hasta encontrar hoy tu ${reps} rep max real.`,
      }],
    };
  });
  return byWeek;
}

const T2A_BLOCK1 = [
  { week: 1, reps: 10, sets: 4 },
  { week: 2, reps: 8, sets: 4 },
  { week: 3, reps: 6, sets: 4 },
  { week: 4, reps: 4, sets: 5 },
  { week: 5, reps: 2, sets: 7 },
];

// Idéntico para los días 1-3 — así lo trae la planilla oficial.
const T2A_BLOCK2 = [
  { week: 7, reps: 6, sets: 5 },
  { week: 8, reps: 5, sets: 5 },
  { week: 9, reps: 4, sets: 5 },
  { week: 10, reps: 3, sets: 6 },
  { week: 11, reps: 2, sets: 7 },
];

const T2_REST = { setsReps: 'Descanso', kg: '—', comment: 'Semana de test de T1: T2 se retira para llegar fresco.' };

// opts.relatedMovementBlock2 / opts.relatedTMBlock2: para el T2a del día que
// cambia de movimiento relacionado entre bloques (Sentadilla → Sentadilla
// Frontal, siguiendo al T1 de ese mismo día).
export function jntT2aPlan(relatedTM, relatedMovement, pctBlock1, pctBlock2, opts = {}) {
  const { relatedMovementBlock2 = relatedMovement, relatedTMBlock2 = relatedTM } = opts;
  const byWeek = {};
  T2A_BLOCK1.forEach(({ week, reps, sets }) => {
    const pct = pctBlock1[week];
    byWeek[week] = { setsReps: `${sets}×${reps}`, kg: roundTo5(relatedTM * pct), comment: `${Math.round(pct * 100)}% de tu Training Max de ${relatedMovement} (${relatedTM} kg).` };
  });
  byWeek[6] = T2_REST;
  T2A_BLOCK2.forEach(({ week, reps, sets }) => {
    const pct = pctBlock2[week];
    byWeek[week] = { setsReps: `${sets}×${reps}`, kg: roundTo5(relatedTMBlock2 * pct), comment: `${Math.round(pct * 100)}% de tu Training Max de ${relatedMovementBlock2} (${relatedTMBlock2} kg).` };
  });
  byWeek[12] = T2_REST;
  return byWeek;
}

const T2BC_BLOCK1_REPS = { 1: 15, 2: 12, 3: 10, 4: 8, 5: 6 };
const T2BC_BLOCK2_REPS = { 7: 12, 8: 10, 9: 8, 10: 6 };

function mrsSet(reps, sets) {
  return {
    setsReps: `${sets}MRS×${reps}`, kg: 'Tú decides (MRS)',
    comment: `Sube de peso en el calentamiento hasta encontrar el de hoy para ${reps} reps con 1-2 en el tanque — esa es tu primera serie. Repite ese mismo peso ${sets - 1} serie(s) más a reps máximas.`,
  };
}

// T2b/T2c: la planilla oficial marca el peso de estos accesorios con "?" —
// nunca lleva número fijo, ni siquiera en el ejemplo de la hoja oficial.
export function jntT2mrsPlan(sets = 3) {
  const byWeek = {};
  Object.entries(T2BC_BLOCK1_REPS).forEach(([week, reps]) => { byWeek[Number(week)] = mrsSet(reps, sets); });
  byWeek[6] = T2_REST;
  Object.entries(T2BC_BLOCK2_REPS).forEach(([week, reps]) => { byWeek[Number(week)] = mrsSet(reps, sets); });
  byWeek[11] = { setsReps: 'Descanso', kg: '—', comment: 'Semana de intensidad alta en T1: T2 se retira para llegar fresco.' };
  byWeek[12] = T2_REST;
  return byWeek;
}

const T3_BLOCK1_REPS = { 1: 20, 2: 18, 3: 16, 4: 14, 5: 12, 6: 10 };
const T3_BLOCK2_REPS = { 8: 18, 9: 16, 10: 14, 11: 12 };

// T3: mismo criterio "?" que T2b/T2c — accesorios de alto volumen, MRS.
export function jntT3Plan(sets = 3) {
  const byWeek = {};
  Object.entries(T3_BLOCK1_REPS).forEach(([week, reps]) => { byWeek[Number(week)] = mrsSet(reps, sets); });
  byWeek[7] = { setsReps: 'Descanso', kg: '—', comment: 'Reset de Tier 3 al iniciar el Bloque 2 — llega fresco al T1.' };
  Object.entries(T3_BLOCK2_REPS).forEach(([week, reps]) => { byWeek[Number(week)] = mrsSet(reps, sets); });
  byWeek[12] = { setsReps: 'Descanso', kg: '—', comment: 'Semana de test de T1: Tier 3 se retira para llegar fresco.' };
  return byWeek;
}

// Día 4, T2a (Legs Up Bench Press): la planilla oficial no da un % de
// Training Max para este movimiento en ningún bloque — solo los números
// fijos del ejemplo de otro lifter, sin fórmula detrás. Se mantiene
// autoseleccionado, igual que T2b/T2c/T3.
export function jntSelfProgressPlan(setsReps, comment) {
  const byWeek = {};
  for (let week = 1; week <= 12; week++) {
    byWeek[week] = [6, 11, 12].includes(week) ? T2_REST : { setsReps, kg: 'Tú decides', comment };
  }
  return byWeek;
}
