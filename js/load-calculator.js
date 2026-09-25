import { SESSIONS, PROGRAM_WEEKS, DEFAULT_MAXES, TM_CELLS } from './workout-data.js';

export function clampWeek(week) {
  return Math.min(Math.max(parseInt(week, 10) || 1, 1), PROGRAM_WEEKS);
}

export const round25 = value => Math.round((value + Number.EPSILON * value) / 2.5) * 2.5;

export function calculateLoad(row, maxes) {
  if (!row.load) return undefined;
  const mapping = TM_CELLS[row.load.tmCell];
  if (!mapping) throw new Error(`Unknown TM reference: ${row.load.tmCell}`);
  const [block, lift] = mapping;
  const tm = maxes[block][lift];
  return Number.isFinite(tm) && tm > 0 ? round25(tm * row.load.percent) : undefined;
}

export function defaultMaxes() {
  // Start both blocks with Cristóbal's maxes, editable independently as in Excel.
  return { block1: { ...DEFAULT_MAXES }, block2: { ...DEFAULT_MAXES } };
}

export function getSessionRows(key, week) {
  return SESSIONS[key]?.byWeek[clampWeek(week)] || [];
}

export function isExercise(row) {
  return typeof row.exercise === 'string' && row.tier !== null &&
    !['RM:', '1RM:', 'AMRAP:', 'MRS:'].includes(row.exercise) &&
    !/Rest|Variety Option/.test(row.exercise);
}

export function getExercises(key, week) {
  const rows = getSessionRows(key, week);
  return rows.flatMap((row, i) => {
    if (!isExercise(row)) return [];
    const next = rows[i + 1];
    const backoff = next && /^(?:1)?RM:$/.test(next.exercise) && next.reps !== null ? next : null;
    return [{ ...row, backoff }];
  });
}

const STORAGE_KEY = 'crishern-training-maxes-v1';

export function readMaxes(storage) {
  const maxes = defaultMaxes();
  try {
    storage ??= globalThis.localStorage;
    const saved = JSON.parse(storage?.getItem(STORAGE_KEY) || 'null');
    for (const block of ['block1', 'block2']) {
      for (const lift of Object.keys(DEFAULT_MAXES)) {
        const value = saved?.[block]?.[lift];
        if (Number.isFinite(value) && value > 0) maxes[block][lift] = value;
      }
    }
  } catch { /* Defaults remain usable when storage is unavailable. */ }
  return maxes;
}

export function saveMaxes(maxes, storage = globalThis.localStorage) {
  for (const block of ['block1', 'block2']) {
    for (const lift of Object.keys(DEFAULT_MAXES)) {
      if (!Number.isFinite(maxes?.[block]?.[lift]) || maxes[block][lift] <= 0) {
        throw new Error('Completa todos los máximos con números mayores que cero.');
      }
    }
  }
  storage.setItem(STORAGE_KEY, JSON.stringify(maxes));
}
