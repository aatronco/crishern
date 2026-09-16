// Programa J&T 2.0 (GZCL) — 12 semanas, hoja "J&T2.0" del GZCL Free
// Compendium (no existe una hoja "J&T 1.0" en la planilla oficial — 2.0 es
// la única versión publicada). Reemplaza al bloque anterior de Full Body ×
// 3. Referencia del cuestionario original de Cristobal: docs/superpowers/
// specs/2026-09-02-crishern-adonain-design.md en el repo de Brute.
import { jntT1Plan, jntLiveTestPlan, jntT2aPlan, jntT2mrsPlan, jntT3Plan, jntSelfProgressPlan } from './strength-plan.js';
export { PROGRAM_WEEKS } from './strength-plan.js';

export const APP_NAME = 'Crishern';
export const APP_ICON = '🏴‍☠️';
export const APP_TAGLINE = 'J&T 2.0 · GZCL · 12 semanas · 4 días';

// Training Max de cada patrón (doble cómodo de un día normal, no el máximo
// absoluto). Sentadilla/Banca/Peso Muerto: 2RM declarados en el cuestionario
// original de Cristobal. Sentadilla Frontal y Militar no tenían dato propio
// — estimados (marcados abajo), a validar en las primeras semanas.
const TM = {
  sentadilla: 140,
  banca: 60,              // punto débil declarado
  pesoMuerto: 140,
  sentadillaFrontal: 115, // Estimado: 82.5% de la TM de sentadilla — mismo ratio Squat→Front Squat del ejemplo de la planilla oficial (165/200).
  militar: 45,             // Estimado con Epley desde su accesorio actual (~35 kg × 8-10 reps). Ajusta en las primeras 2 semanas según cómo se sienta.
};

function t1(movement, trainingMax, pctBlock1, note, opts = {}) {
  const { movementBlock2 = movement } = opts;
  const exerciseByWeek = movementBlock2 !== movement
    ? Object.fromEntries([1, 2, 3, 4, 5, 6].map(w => [w, movement]).concat([7, 8, 9, 10, 11, 12].map(w => [w, movementBlock2])))
    : undefined;
  return { exercise: movement, exerciseByWeek, note, byWeek: jntT1Plan(trainingMax, movement, pctBlock1, opts) };
}
const t1Live = (movement, note) => ({ exercise: movement, note, byWeek: jntLiveTestPlan(movement) });
const t2a = (name, relatedTM, relatedMovement, pctBlock1, pctBlock2, opts = {}, rest = 150) => ({
  name, rest, byWeek: jntT2aPlan(relatedTM, relatedMovement, pctBlock1, pctBlock2, opts),
});
const t2mrs = (name, rest = 90, sets = 3) => ({ name, rest, byWeek: jntT2mrsPlan(sets) });
const t3 = (name, rest = 75, sets = 3) => ({ name, rest, byWeek: jntT3Plan(sets) });

// ── Día 1 — T1 Sentadilla ────────────────────────────────────────────────────
export const DIA1_SENTADILLA = {
  name: 'Sentadilla', color: 'lilac', icon: '🦵', dayLabel: 'Día 1',
  T1: [t1('Sentadilla', TM.sentadilla, { 1: 0.70, 2: 0.75, 3: 0.80, 4: 0.825, 5: 0.85 },
    `Training Max ${TM.sentadilla} kg (2RM declarado). Semanas 6 y 12 son test reales de 1RM.`)],
  T2: [
    t2a('Peso Muerto con Déficit', TM.pesoMuerto, 'Peso Muerto', { 1: 0.5, 2: 0.6, 3: 0.7, 4: 0.75, 5: 0.8 }, { 7: 0.7, 8: 0.75, 9: 0.8, 10: 0.825, 11: 0.85 }),
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
  T1: [t1('Press Banca', TM.banca, { 1: 0.65, 2: 0.70, 3: 0.75, 4: 0.775, 5: 0.80 },
    `Training Max ${TM.banca} kg (2RM declarado). Punto débil declarado (vs ${TM.sentadilla} kg de Sentadilla/Peso Muerto) — este día lleva el mayor volumen de empuje de la semana.`)],
  T2: [
    t2a('Press Banca Agarre Cerrado', TM.banca, 'Press Banca', { 1: 0.5, 2: 0.55, 3: 0.6, 4: 0.625, 5: 0.65 }, { 7: 0.7, 8: 0.75, 9: 0.8, 10: 0.825, 11: 0.85 }),
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
  T1: [t1('Sentadilla Frontal', TM.sentadillaFrontal, { 1: 0.70, 2: 0.75, 3: 0.80, 4: 0.825, 5: 0.85 },
    `Training Max Sentadilla Frontal ${TM.sentadillaFrontal} kg (estimado). Bloque 2 (semanas 7-12) cambia a Peso Muerto, Training Max ${TM.pesoMuerto} kg — la planilla oficial cambia de movimiento entre bloques en este día.`,
    { movementBlock2: 'Peso Muerto', trainingMaxBlock2: TM.pesoMuerto })],
  T2: [
    t2a('Sentadilla', TM.sentadilla, 'Sentadilla', { 1: 0.5, 2: 0.6, 3: 0.7, 4: 0.75, 5: 0.8 }, { 7: 0.7, 8: 0.75, 9: 0.8, 10: 0.825, 11: 0.85 },
      { relatedMovementBlock2: 'Sentadilla Frontal', relatedTMBlock2: TM.sentadillaFrontal }),
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
    t1('Press Militar', TM.militar, { 1: 0.60, 2: 0.65, 3: 0.70, 4: 0.775, 5: 0.80 },
      `Training Max ${TM.militar} kg (estimado con Epley desde tu accesorio actual, ~35 kg × 8-10 — ajusta según cómo se sienta la primera semana).`),
    t1Live('Press Banca con Pausa',
      'Reemplaza a Sling Shot Bench de la planilla oficial (sin ese implemento) — mismo criterio que usa Brute en su propio día 4. Sin Training Max: se testea en vivo cada semana, pausa de 1-2 s en el pecho.'),
  ],
  T2: [
    {
      name: 'Press Banca con piernas elevadas', rest: 150,
      byWeek: jntSelfProgressPlan('4×10', 'Sin % de Training Max en la planilla oficial para este movimiento: sube de peso semana a semana manteniendo 4×10 con 1-2 reps en reserva.'),
    },
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
