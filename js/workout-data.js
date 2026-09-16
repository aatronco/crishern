// js/workout-data.js
// J&T 2.0 (Jacked & Tan, método GZCL) — planilla oficial "GZCL Free Compendium",
// hoja "J&T2.0". Reemplaza el bloque anterior de Full Body × 3 (6 semanas).
// Referencia del cuestionario original de Cristobal: docs/superpowers/specs/
// 2026-09-02-crishern-adonain-design.md en el repo de Brute.
//
// Estructura fiel a la planilla oficial: 4 días/semana, 12 semanas en 2
// mesociclos de 6 (Bloque 1 semanas 1-6, Bloque 2 semanas 7-12).
//   T1 — el patrón pesado del día. Bloque 1: series ascendentes de % de tu
//        Training Max (TM) declarado, terminando en AMRAP; semana 6 es test
//        real de 1RM. Bloque 2: densidad alta (85-90%) sobre el 1RM que
//        encuentres en la semana 6; semana 12 vuelve a testear el 1RM — ese
//        resultado es tu nuevo TM para el próximo ciclo.
//   T2 — variante cercana al T1 del día (T2a, % de la TM del movimiento
//        relacionado) más dos accesorios de patrón MRS (T2b/T2c, series a
//        reps máximas con el peso que tú elijas en el calentamiento).
//   T3 — accesorios de alto volumen (MRS), reps bajando cada semana.
//
// Igual que el resto de Crishern, la app NO calcula ni redondea kg: muestra
// el % o el rango de reps objetivo, y tú anotas el peso real cada semana a
// partir de tu propio TM/1RM — así lo pidió el dueño de la app para este
// programa en particular, porque el Bloque 1 y el Bloque 2 dependen de un
// número (tu 1RM real) que no existe hasta que lo levantas.
//
// Un solo cambio de equipo respecto de la planilla oficial: el día 4 en la
// planilla usa "Sling Shot Bench" como segundo T1 (sin Training Max propio,
// se testea en vivo cada semana). Sin ese implemento, se reemplaza por Press
// Banca con Pausa — mismo criterio que ya usa Brute en su propio día 4.

export const PROGRAM_WEEKS = 12;

export const APP_NAME = 'Crishern';
export const APP_ICON = '🏴‍☠️';
export const APP_TAGLINE = 'J&T 2.0 (GZCL) — 4 días · 2 bloques de 6 semanas';

// ── T1 — patrón pesado del día ──────────────────────────────────────────────
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

function t1TestSet(movement, label) {
  return {
    warmup: [],
    work: [{
      label: '1RM', reps: 1, kg: 'Tú decides — test real', rest: 300, type: 'work',
      note: `${label} sube de peso en el calentamiento y busca tu 1RM real de ${movement} con buena técnica.`,
    }],
  };
}

function t1ByWeek(movementBlock1, pctBlock1, movementBlock2 = movementBlock1) {
  const byWeek = {};
  T1_BLOCK1.forEach(({ week, reps, sets }) => {
    const pctTxt = `${Math.round(pctBlock1[week] * 100)}%`;
    byWeek[week] = {
      warmup: [],
      work: Array.from({ length: sets }, (_, i) => {
        const isAmrap = i === sets - 1;
        return {
          label: `${reps}${isAmrap ? '+' : ''}`, reps, kg: `${pctTxt} TM`, rest: 180, type: 'work',
          note: isAmrap
            ? `AMRAP a ${pctTxt} de tu Training Max de ${movementBlock1}. Deja 1-2 reps en el tanque, nunca al fallo real.`
            : undefined,
        };
      }),
    };
  });
  byWeek[6] = t1TestSet(movementBlock1, 'Semana de test del Bloque 1:');
  T1_BLOCK2.forEach(({ week, pct, reps, sets }) => {
    const pctTxt = `${Math.round(pct * 100)}%`;
    byWeek[week] = {
      warmup: [],
      work: Array.from({ length: sets }, (_, i) => {
        const isAmrap = i === sets - 1;
        return {
          label: `${reps}${isAmrap ? '+' : ''}`, reps, kg: `${pctTxt} de tu 1RM (semana 6)`, rest: 240, type: 'work',
          note: isAmrap
            ? `AMRAP a ${pctTxt} del 1RM de ${movementBlock2} que encontraste en la semana 6. Deja 1-2 reps en el tanque.`
            : undefined,
        };
      }),
    };
  });
  byWeek[12] = t1TestSet(movementBlock2, 'Cierre del bloque:');
  byWeek[12].work[0].note += ' Ese número es tu nuevo Training Max para el próximo ciclo de J&T.';
  return byWeek;
}

// Segundo T1 del día 4 (sustituto de Sling Shot Bench): sin Training Max
// propio en la planilla — se testea en vivo cada semana, con el esquema de
// reps exacto de la hoja oficial (incluye el ida y vuelta irregular del
// Bloque 2: 7RM → 4RM → 2RM → 5RM → 3RM → 1RM).
const LIVE_TEST_REPS = { 1: 10, 2: 8, 3: 6, 4: 4, 5: 2, 6: 1, 7: 7, 8: 4, 9: 2, 10: 5, 11: 3, 12: 1 };

function liveTestByWeek(movement) {
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

// ── T2a — variante cercana al T1, % de la TM del movimiento relacionado ─────
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

function t2aByWeek(relatedBlock1, pctBlock1, pctBlock2, relatedBlock2 = relatedBlock1) {
  const byWeek = {};
  T2A_BLOCK1.forEach(({ week, reps, sets }) => {
    const pctTxt = `${Math.round(pctBlock1[week] * 100)}%`;
    byWeek[week] = { setsReps: `${sets}×${reps}`, kg: `${pctTxt} TM`, comment: `${pctTxt} de tu Training Max de ${relatedBlock1}.` };
  });
  byWeek[6] = T2_REST;
  T2A_BLOCK2.forEach(({ week, reps, sets }) => {
    const pctTxt = `${Math.round(pctBlock2[week] * 100)}%`;
    byWeek[week] = { setsReps: `${sets}×${reps}`, kg: `${pctTxt} TM`, comment: `${pctTxt} de tu Training Max de ${relatedBlock2}.` };
  });
  byWeek[12] = T2_REST;
  return byWeek;
}

// ── T2b / T2c — accesorios MRS (mismo patrón de reps para los 4 días) ───────
const T2BC_BLOCK1_REPS = { 1: 15, 2: 12, 3: 10, 4: 8, 5: 6 };
const T2BC_BLOCK2_REPS = { 7: 12, 8: 10, 9: 8, 10: 6 };

function mrsSet(reps, sets, comment) {
  return {
    setsReps: `${sets}MRS×${reps}`, kg: 'Tú decides (MRS)',
    comment: comment || `Sube de peso en el calentamiento hasta encontrar el de hoy para ${reps} reps con 1-2 en el tanque — esa es tu primera serie. Repite ese mismo peso ${sets - 1} serie(s) más a reps máximas.`,
  };
}

function t2mrsByWeek(sets = 3) {
  const byWeek = {};
  Object.entries(T2BC_BLOCK1_REPS).forEach(([week, reps]) => { byWeek[Number(week)] = mrsSet(reps, sets); });
  byWeek[6] = T2_REST;
  Object.entries(T2BC_BLOCK2_REPS).forEach(([week, reps]) => { byWeek[Number(week)] = mrsSet(reps, sets); });
  byWeek[11] = { setsReps: 'Descanso', kg: '—', comment: 'Semana de intensidad alta en T1: T2 se retira para llegar fresco.' };
  byWeek[12] = T2_REST;
  return byWeek;
}

// ── T3 — accesorios de alto volumen (MRS, reps bajando cada semana) ────────
const T3_BLOCK1_REPS = { 1: 20, 2: 18, 3: 16, 4: 14, 5: 12, 6: 10 };
const T3_BLOCK2_REPS = { 8: 18, 9: 16, 10: 14, 11: 12 };

function t3ByWeek(sets = 3) {
  const byWeek = {};
  Object.entries(T3_BLOCK1_REPS).forEach(([week, reps]) => { byWeek[Number(week)] = mrsSet(reps, sets); });
  byWeek[7] = { setsReps: 'Descanso', kg: '—', comment: 'Reset de Tier 3 al iniciar el Bloque 2 — llega fresco al T1.' };
  Object.entries(T3_BLOCK2_REPS).forEach(([week, reps]) => { byWeek[Number(week)] = mrsSet(reps, sets); });
  byWeek[12] = { setsReps: 'Descanso', kg: '—', comment: 'Semana de test de T1: Tier 3 se retira para llegar fresco.' };
  return byWeek;
}

const t2a = (name, relatedBlock1, pctBlock1, pctBlock2, relatedBlock2, rest = 150) => ({
  name, rest, byWeek: t2aByWeek(relatedBlock1, pctBlock1, pctBlock2, relatedBlock2),
});
const t2mrs = (name, rest = 90, sets = 3) => ({ name, rest, byWeek: t2mrsByWeek(sets) });
const t3 = (name, rest = 75, sets = 3) => ({ name, rest, byWeek: t3ByWeek(sets) });

// ── Día 1 — T1 Sentadilla ────────────────────────────────────────────────────
export const DIA1_SENTADILLA = {
  name: 'Sentadilla', color: 'lilac', icon: '🦵', dayLabel: 'Día 1',
  T1: [{
    exercise: 'Sentadilla',
    note: 'Declara tu Training Max de Sentadilla antes de empezar (doble cómodo de un día normal, no tu máximo absoluto). Semana 6 y semana 12 son test reales de 1RM.',
    byWeek: t1ByWeek('Sentadilla', { 1: 0.70, 2: 0.75, 3: 0.80, 4: 0.825, 5: 0.85 }),
  }],
  T2: [
    t2a('Peso Muerto con Déficit', 'Peso Muerto', { 1: 0.5, 2: 0.6, 3: 0.7, 4: 0.75, 5: 0.8 }, { 7: 0.7, 8: 0.75, 9: 0.8, 10: 0.825, 11: 0.85 }),
    t2mrs('Prensa a una pierna', 90),
    t2mrs('Remo con pecho apoyado', 90),
  ],
  T3: [
    t3('Remo en polea agarre V'),
    t3('Curl femoral tumbado'),
    t3('Extensión de cuádriceps'),
    t3('Curl martillo con mancuerna', 60),
  ],
};

// ── Día 2 — T1 Press Banca ───────────────────────────────────────────────────
export const DIA2_BANCA = {
  name: 'Press Banca', color: 'pink', icon: '💪', dayLabel: 'Día 2',
  T1: [{
    exercise: 'Press Banca',
    note: 'Declara tu Training Max de Press Banca antes de empezar. Punto débil declarado (PR 60 kg vs 140 kg de Sentadilla/Peso Muerto) — este día lleva el mayor volumen de empuje de la semana.',
    byWeek: t1ByWeek('Press Banca', { 1: 0.65, 2: 0.70, 3: 0.75, 4: 0.775, 5: 0.80 }),
  }],
  T2: [
    t2a('Press Banca Agarre Cerrado', 'Press Banca', { 1: 0.5, 2: 0.55, 3: 0.6, 4: 0.625, 5: 0.65 }, { 7: 0.7, 8: 0.75, 9: 0.8, 10: 0.825, 11: 0.85 }),
    t2mrs('Press Banca Inclinado', 90),
    t2mrs('Press militar sentado con mancuerna', 90),
  ],
  T3: [
    t3('Elevación lateral con mancuerna', 60),
    t3('Vuelos posteriores (deltoides posterior)', 60),
    t3('Pec deck', 60),
    t3('Extensión de tríceps en polea', 60),
  ],
};

// ── Día 3 — T1 Sentadilla Frontal (Bloque 1) → Peso Muerto (Bloque 2) ───────
export const DIA3_FRONTAL_PESO_MUERTO = {
  name: 'Sentadilla Frontal / Peso Muerto', color: 'cyan', icon: '⚓', dayLabel: 'Día 3',
  T1: [{
    exercise: 'Sentadilla Frontal (semanas 1-6) → Peso Muerto (semanas 7-12)',
    note: 'Declara tu Training Max de Sentadilla Frontal para el Bloque 1 y de Peso Muerto para el Bloque 2 — la planilla oficial cambia de movimiento entre bloques en este día.',
    byWeek: t1ByWeek('Sentadilla Frontal', { 1: 0.70, 2: 0.75, 3: 0.80, 4: 0.825, 5: 0.85 }, 'Peso Muerto'),
  }],
  T2: [
    t2a('Sentadilla', 'Sentadilla', { 1: 0.5, 2: 0.6, 3: 0.7, 4: 0.75, 5: 0.8 }, { 7: 0.7, 8: 0.75, 9: 0.8, 10: 0.825, 11: 0.85 }, 'Sentadilla Frontal'),
    t2mrs('Zancada hacia atrás', 90),
    t2mrs('Jalón al pecho agarre V', 90),
  ],
  T3: [
    t3('Extensión de cuádriceps'),
    t3('Curl femoral tumbado'),
    t3('Jalón al pecho agarre ancho'),
    t3('Curl barra Z', 60),
  ],
};

// ── Día 4 — T1 Press Militar + Press Banca con Pausa (sustituye Sling Shot) ─
export const DIA4_MILITAR = {
  name: 'Press Militar', color: 'gold', icon: '🎯', dayLabel: 'Día 4',
  T1: [
    {
      exercise: 'Press Militar',
      note: 'Declara tu Training Max de Press Militar antes de empezar. Sin dato previo en tu programa actual: proyecta uno desde el peso que ya usas de accesorio (~30-35 kg × 8-12, fórmula Epley ≈ peso × (1 + reps/30)) y ajústalo la primera semana según cómo se sienta.',
      byWeek: t1ByWeek('Press Militar', { 1: 0.60, 2: 0.65, 3: 0.70, 4: 0.775, 5: 0.80 }),
    },
    {
      exercise: 'Press Banca con Pausa',
      note: 'Reemplaza a Sling Shot Bench de la planilla oficial (sin ese implemento) — mismo criterio que usa Brute en su propio día 4. Sin Training Max: se testea en vivo cada semana, pausa de 1-2 s en el pecho.',
      byWeek: liveTestByWeek('Press Banca con Pausa'),
    },
  ],
  T2: [
    { name: 'Press Banca con piernas elevadas', rest: 150, byWeek: (() => {
      const byWeek = {};
      for (let week = 1; week <= 12; week++) {
        if ([6, 11, 12].includes(week)) { byWeek[week] = T2_REST; continue; }
        byWeek[week] = { setsReps: '4×10', kg: 'Tú decides', comment: 'Sin % de Training Max en la planilla oficial para este movimiento: sube de peso semana a semana manteniendo 4×10 con 1-2 reps en reserva.' };
      }
      return byWeek;
    })() },
    t2mrs('Push Press', 90),
  ],
  T3: [
    t3('Extensión de tríceps en polea sobre cabeza', 60),
    t3('Elevación lateral con mancuerna', 60),
    t3('Vuelos posteriores (deltoides posterior)', 60),
    t3('Pec deck', 60),
  ],
};

export const SESSIONS = {
  dia1: DIA1_SENTADILLA,
  dia2: DIA2_BANCA,
  dia3: DIA3_FRONTAL_PESO_MUERTO,
  dia4: DIA4_MILITAR,
};
