import test from 'node:test';
import assert from 'node:assert/strict';
import { SESSIONS, DEFAULT_MAXES, TM_CELLS } from '../js/workout-data.js';
import { SPREADSHEET_WEEKS } from '../js/spreadsheet-data.js';
import { calculateLoad, defaultMaxes, getExercises, round25, readMaxes, saveMaxes } from '../js/load-calculator.js';
import { renderWorkout } from '../js/views/workout.js';
import { renderDashboard } from '../js/views/dashboard.js';

const keys = Object.keys(SESSIONS);
const names = (key, week) => getExercises(key, week).map(row => row.exercise);

test('all 48 sessions render every assigned exercise in workbook order', () => {
  for (let week = 1; week <= 12; week++) {
    for (const [day, key] of keys.entries()) {
      const html = renderWorkout(key, week);
      assert.doesNotMatch(html, /undefined|NaN/);
      const sourceCells = [...html.matchAll(/data-source="([A-Z]+\d+)"/g)].map(m => m[1]);
      // Independent selection from raw source, including standalone MRS and 1RM tests.
      const expected = SPREADSHEET_WEEKS[week][day].filter(row =>
        (typeof row.weight === 'string' && /^(Find \d+RM|\?)$/.test(row.weight) && row.exercise) || row.load && row.exercise !== 'RM:'
      ).map(row => row.cell);
      assert.deepEqual(sourceCells, expected, `${key}, week ${week}`);
    }
  }
});

test('all source formula references use personal maxima, never cached sample weights', () => {
  const maxes = defaultMaxes();
  const personal = { E4: 140, E5: 60, E6: 140, E7: 30, O5: 98, AI4: 140, AI5: 60, AI6: 140, AI7: 30, AS5: 98 };
  let formulas = 0;
  for (const days of Object.values(SPREADSHEET_WEEKS)) for (const rows of days) for (const row of rows) {
    if (!row.load) continue;
    formulas++;
    assert.ok(TM_CELLS[row.load.tmCell]);
    assert.equal(calculateLoad(row, maxes), Math.floor(personal[row.load.tmCell] * row.load.percent / 2.5 + 0.5) * 2.5);
  }
  assert.equal(formulas, 60);
  assert.equal(DEFAULT_MAXES.frontSquat, 98);
  assert.equal(round25(31.25), 32.5);
  assert.equal(round25(68.6), 67.5);
});

test('front squat and military press use their own TM; block 2 is independently editable', () => {
  const maxes = defaultMaxes();
  assert.equal(calculateLoad(getExercises('diaTres', 1)[0].backoff, maxes), 67.5);
  assert.equal(calculateLoad(getExercises('diaCuatro', 1)[0].backoff, maxes), 17.5);
  assert.equal(calculateLoad(getExercises('diaTres', 7)[1], maxes), 67.5);
  maxes.block2.frontSquat = 110;
  assert.equal(calculateLoad(getExercises('diaTres', 7)[1], maxes), 77.5);
  assert.equal(calculateLoad(getExercises('diaTres', 1)[0].backoff, maxes), 67.5);
});

test('block 2 T1 backoff is a percentage of the daily RM, not TM', () => {
  for (const key of keys) for (const week of [7, 8, 9, 10, 11]) {
    const row = getExercises(key, week)[0].backoff;
    assert.equal(row.weight, week < 10 ? 0.85 : 0.9);
    assert.equal(calculateLoad(row, defaultMaxes()), undefined);
    assert.match(renderWorkout(key, week), /del RM encontrado hoy/);
  }
});

test('exercise swaps, removals and order follow the supplied workbook', () => {
  assert.deepEqual(names('diaTres', 8), ['Deadlift', 'Front Squat', 'Stiff Leg Deadlift', 'Lat Pull Down', 'Wide Grip Cable Row', 'Hammer Curl', 'EZ Bar Curl']);
  assert.deepEqual(names('diaDos', 8), ['Bench Press', 'Close Grip Bench', 'Incline Bench', 'DB Shoulder Press', 'Machine Lateral Raise', 'Pec Flye', 'Rear Delt Flye']);
  assert.deepEqual(names('diaCuatro', 8), ['Military Press', 'Sling Shot Bench', 'Legs Up Bench', 'DB Bench Press', 'Cable OH Tricep Ext', 'Rear Delt Fly', 'Pec Flye']);
  assert.deepEqual(names('diaCuatro', 11), ['Military Press', 'Sling Shot Bench', 'Legs Up Bench', 'Rear Delt Fly', 'Pec Flye']);
  assert.equal(names('diaUno', 8).includes('DB Hammer Curl'), false);
  assert.equal(names('diaUno', 7)[1], '1" Deficit Deadlift');
  assert.equal(names('diaUno', 10)[1], 'Deadlift');
});

test('test and rest weeks retain only the work actually prescribed', () => {
  for (const key of keys) {
    assert.ok(getExercises(key, 6).some(row => row.tier.startsWith('3')));
    assert.ok(!getExercises(key, 6).some(row => row.tier.startsWith('2')));
    assert.ok(!getExercises(key, 7).some(row => row.tier.startsWith('3')));
    assert.ok(!getExercises(key, 11).some(row => ['2b', '2c'].includes(row.tier)));
    for (const row of getExercises(key, 12)) {
      assert.equal(row.weight, 'Find 1RM');
      assert.equal(row.backoff, null);
    }
  }
  assert.deepEqual(names('diaUno', 12), ['Back Squat']);
  assert.deepEqual(names('diaDos', 12), ['Bench Press', 'Close Grip Bench']);
  assert.deepEqual(names('diaTres', 12), ['Deadlift', 'Front Squat']);
  assert.deepEqual(names('diaCuatro', 12), ['Military Press', 'Sling Shot Bench']);
});

test('MRS and AMRAP instructions preserve initial RM and last-set meaning', () => {
  const html = renderWorkout('diaUno', 1);
  assert.match(html, /Buscar 20RM/);
  assert.match(html, /3 series MRS adicionales/);
  assert.match(html, /3 series × 6 reps/);
  assert.match(html, /No es una serie adicional/);
  const sling = getExercises('diaCuatro', 7)[1];
  assert.equal(sling.weight, 'Find 7RM');
  assert.equal(sling.sets, '4MRS');
  assert.equal(getExercises('diaCuatro', 9)[1].sets, '1MRS');
});

test('maxes persist per block, invalid storage falls back to personal defaults', () => {
  let saved;
  const storage = { getItem: () => saved, setItem: (_, value) => { saved = value; } };
  const maxes = defaultMaxes();
  maxes.block2.bench = 65;
  saveMaxes(maxes, storage);
  assert.equal(readMaxes(storage).block2.bench, 65);
  assert.equal(readMaxes(storage).block1.bench, 60);
  saved = '{broken';
  assert.deepEqual(readMaxes(storage), defaultMaxes());
  saved = JSON.stringify({ block1: { squat: -1, bench: 'bad', ohp: null } });
  assert.deepEqual(readMaxes(storage), defaultMaxes());
  maxes.block1.ohp = 0;
  assert.throws(() => saveMaxes(maxes, storage));
  assert.match(renderDashboard(7), /Día 3 — Peso muerto/);
});
