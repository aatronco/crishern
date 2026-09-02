// js/workout-data.js
// Full Body x3 — 6 semanas, sin fases. Generado una sola vez a partir del
// cuestionario de Cristobal (ver docs/superpowers/specs/2026-09-02-crishern-adonain-design.md
// en el repo de Brute). Objetivo único: Hipertrofia — a 3 días/semana, Full
// Body le gana a un split Piernas/Tirón/Empuje porque cada músculo se
// estimula 2-3 veces por semana en vez de 1 sola (frecuencia es de las
// variables con más soporte en la literatura de hipertrofia). Cada día rota
// cuál SBD es el T1 principal. Press Banca (PR 60 kg, muy por debajo de
// Sentadilla/Peso Muerto en 140 kg) recibe volumen extra de empuje en los
// otros dos días por ser el punto débil declarado.

export const PROGRAM_WEEKS = 6;

export const APP_NAME = 'Crishern';
export const APP_ICON = '🏴‍☠️';
export const APP_TAGLINE = 'Full Body × 3 — rotando Sentadilla / Banca / Peso Muerto';

// ── T1 — olas por levantamiento (idéntico esquema de Brute) ────────────────
const T1_SCHEME = [
  { week: 1, label: '2×4',  reps: 4, amrap: true,  rest: 180, comment: 'Volumen moderado con techo alto — el AMRAP mide si la base 2RM sigue siendo válida.' },
  { week: 2, label: '4×2',  reps: 2, amrap: false, rest: 180, comment: 'Sube intensidad, baja reps, sin AMRAP — consolida técnica bajo carga alta sin arriesgar fallo.' },
  { week: 3, label: '3×3',  reps: 3, amrap: false, rest: 180, comment: 'Retroceso leve de intensidad — acumula volumen técnico antes del bloque de picos.' },
  { week: 4, label: '8×1',  reps: 1, amrap: true,  rest: 240, comment: 'Mayor densidad de series pesadas — acondiciona el sistema nervioso para los máximos.' },
  { week: 5, label: '2×2',  reps: 2, amrap: true,  rest: 240, comment: 'Mini-descarga de volumen manteniendo intensidad — último test antes del máximo.' },
  { week: 6, label: '1×1',  reps: 1, amrap: false, rest: 300, comment: 'Single de cierre del bloque — referencia para la base 2RM del siguiente ciclo.' },
];

const ceil5 = kg => Math.ceil(kg / 5) * 5;

function barbellByWeek(base2RM, kgByWeek, { warmupReps = [8, 5, 2], warmupRest = [90, 90, 120] } = {}) {
  const warmupKg = [0.5, 0.7, 0.85].map(pct => ceil5(base2RM * pct));
  const byWeek = {};
  for (const s of T1_SCHEME) {
    const kg = kgByWeek[s.week];
    const warmup = warmupKg.map((kg, i) => ({
      label: `C${i + 1}`, reps: warmupReps[i], kg, rest: warmupRest[i], type: 'warmup',
    }));
    const work = [{ label: s.label, reps: s.reps, kg, rest: s.rest, type: 'work', note: s.comment }];
    if (s.amrap) work.push({ label: 'AMRAP', reps: `${s.reps}+`, kg, rest: 0, type: 'work', note: 'Serie extra a máximas reps con técnica sólida — no al fallo.' });
    byWeek[s.week] = { warmup, work };
  }
  return byWeek;
}

// ── Accesorios — escalón fijo cada 2 semanas, rep-range de Hipertrofia (8-15) ──
function stepByWeek(w12, w34, w56) {
  return { 1: w12, 2: w12, 3: w34, 4: w34, 5: w56, 6: w56 };
}

// ── Día 1 — Full Body A (T1 Sentadilla) ─────────────────────────────────────
export const FULL_BODY_A = {
  name: 'Full Body — Sentadilla',
  color: 'lilac',
  icon: '🦵',
  dayLabel: 'Día 1',

  T1: [
    {
      exercise: 'Sentadilla',
      note: 'Base 2RM 140 kg.',
      byWeek: barbellByWeek(140, { 1: 110, 2: 120, 3: 115, 4: 130, 5: 125, 6: 135 }),
    },
  ],

  T2: [
    { name: 'Press banca mancuerna inclinado', setsReps: '4×8-12', rest: 90, note: 'Volumen extra de empuje — punto débil declarado (PR banca 60 kg vs 140 kg de Sentadilla/Peso Muerto).', byWeek: stepByWeek(18, 20, 22) },
    { name: 'Remo con barra', setsReps: '3×8-12', rest: 90, byWeek: stepByWeek(45, 50, 55) },
  ],

  accessories: [
    { name: 'Curl femoral tumbado', sets: 3, repRange: [10, 15], rest: 60, byWeek: stepByWeek(25, 30, 30) },
    { name: 'Elevación de talones de pie', sets: 3, repRange: [12, 15], rest: 45, byWeek: stepByWeek(40, 45, 50) },
  ],
};

// ── Día 2 — Full Body B (T1 Press Banca) ────────────────────────────────────
export const FULL_BODY_B = {
  name: 'Full Body — Press Banca',
  color: 'pink',
  icon: '💪',
  dayLabel: 'Día 2',

  T1: [
    {
      exercise: 'Press Banca',
      note: 'Base 2RM 60 kg. Punto débil declarado — este es el día donde recibe el mayor estímulo directo.',
      byWeek: barbellByWeek(60, { 1: 50, 2: 55, 3: 50, 4: 55, 5: 55, 6: 60 }),
    },
  ],

  T2: [
    { name: 'Peso muerto rumano con barra', setsReps: '4×8-12', rest: 90, note: 'Cadena posterior — no compite con el T1 de Sentadilla/Peso Muerto de los otros días.', byWeek: stepByWeek(60, 65, 70) },
    { name: 'Dominadas o jalón al pecho', setsReps: '3×8-12', rest: 90, note: 'Carga relativa al peso corporal (PC 96 kg) o con asistencia según nivel.', byWeek: stepByWeek('Peso corporal', 'Peso corporal', 'Peso corporal') },
  ],

  accessories: [
    { name: 'Elevación lateral mancuerna', sets: 3, repRange: [12, 15], rest: 60, byWeek: stepByWeek(8, 10, 10) },
    { name: 'Extensión tríceps en polea', sets: 3, repRange: [10, 15], rest: 60, note: 'Segundo estímulo de tríceps de la semana — apoya el punto débil de empuje.', byWeek: stepByWeek(20, 22, 25) },
  ],
};

// ── Día 3 — Full Body C (T1 Peso Muerto) ────────────────────────────────────
export const FULL_BODY_C = {
  name: 'Full Body — Peso Muerto',
  color: 'cyan',
  icon: '⚓',
  dayLabel: 'Día 3',

  T1: [
    {
      exercise: 'Peso Muerto',
      note: 'Base 2RM 140 kg.',
      technicalCues: [
        'Pies a ancho de cadera, barra sobre mediopiés',
        'Caderas atrás, espalda neutra',
        'Empuja el suelo — no jales la barra',
      ],
      byWeek: barbellByWeek(140, { 1: 110, 2: 120, 3: 115, 4: 130, 5: 125, 6: 135 }, { warmupReps: [5, 3, 2] }),
    },
  ],

  T2: [
    { name: 'Prensa', setsReps: '4×8-12', rest: 90, note: 'Segundo estímulo de cuádriceps sin repetir Sentadilla pesada.', byWeek: stepByWeek(120, 130, 140) },
    { name: 'Press militar barra', setsReps: '3×8-12', rest: 90, note: 'Tercer estímulo de empuje de la semana — cierre del volumen extra de Banca.', byWeek: stepByWeek(30, 32, 35) },
  ],

  accessories: [
    { name: 'Face pull en polea', sets: 3, repRange: [12, 15], rest: 60, byWeek: stepByWeek(18, 20, 22) },
    { name: 'Curl bíceps barra Z', sets: 3, repRange: [10, 15], rest: 60, byWeek: stepByWeek(20, 22, 25) },
  ],
};

export const SESSIONS = {
  fullBodyA: FULL_BODY_A,
  fullBodyB: FULL_BODY_B,
  fullBodyC: FULL_BODY_C,
};
