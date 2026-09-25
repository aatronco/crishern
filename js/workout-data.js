import { SPREADSHEET_WEEKS, SPREADSHEET_SOURCE } from './spreadsheet-data.js';

export { SPREADSHEET_SOURCE };
export const PROGRAM_WEEKS = 12;
export const APP_NAME = 'Crishern';
export const APP_ICON = '🏴‍☠️';
export const APP_TAGLINE = 'Jacked & Tan 2.0 — 4 días, 12 semanas (GZCL)';

// Confirmed for Cristóbal. TM = estimated daily 2RM.
// Front squat is 70% of back squat, not an exercise substitution.
export const DEFAULT_MAXES = Object.freeze({ squat: 140, bench: 60, deadlift: 140, ohp: 30, frontSquat: 98 });
export const MAX_LABELS = Object.freeze({
  squat: 'Sentadilla', bench: 'Press banca', deadlift: 'Peso muerto',
  ohp: 'Press militar', frontSquat: 'Sentadilla frontal',
});

// Actual source cells distinguish front/back squat and the six-week blocks.
export const TM_CELLS = Object.freeze({
  E4: ['block1', 'squat'], E5: ['block1', 'bench'], E6: ['block1', 'deadlift'],
  E7: ['block1', 'ohp'], O5: ['block1', 'frontSquat'],
  AI4: ['block2', 'squat'], AI5: ['block2', 'bench'], AI6: ['block2', 'deadlift'],
  AI7: ['block2', 'ohp'], AS5: ['block2', 'frontSquat'],
});

const descriptions = [
  { key: 'diaUno', name: 'Sentadilla', color: 'lilac', icon: '🦵' },
  { key: 'diaDos', name: 'Press banca', color: 'pink', icon: '💪' },
  { key: 'diaTres', name: 'Sentadilla frontal / Peso muerto', color: 'cyan', icon: '⚓' },
  { key: 'diaCuatro', name: 'Press militar + Sling Shot Bench', color: 'gold', icon: '🎯' },
];

export const SESSIONS = Object.fromEntries(descriptions.map((session, day) => [session.key, {
  ...session,
  dayLabel: `Día ${day + 1}`,
  byWeek: Object.fromEntries(Object.entries(SPREADSHEET_WEEKS).map(([week, days]) => [week, days[day]])),
}]));

export function sessionName(key, week) {
  return key === 'diaTres' ? (week <= 6 ? 'Sentadilla frontal' : 'Peso muerto') : SESSIONS[key]?.name;
}
