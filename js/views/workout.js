import { SESSIONS, MAX_LABELS, TM_CELLS, sessionName } from '../workout-data.js';
import { clampWeek, getExercises, getSessionRows, calculateLoad, readMaxes } from '../load-calculator.js';
import { createTimer } from '../timer.js';

let activeTimer = null;
const escape = value => String(value ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);
const percent = value => `${Math.round(value * 1000) / 10}%`;
const number = value => String(value).replace('.', ',');

function loadLabel(row, maxes) {
  if (row.load) {
    const kg = calculateLoad(row, maxes);
    const [block, lift] = TM_CELLS[row.load.tmCell];
    return `<strong>${number(kg)} kg</strong> <span class="program-note">(${percent(row.load.percent)} del TM de ${MAX_LABELS[lift].toLowerCase()}: ${number(maxes[block][lift])} kg)</span>`;
  }
  if (typeof row.weight === 'number' && row.weight > 0 && row.weight < 1) {
    return `<strong>${percent(row.weight)} del RM encontrado hoy</strong>`;
  }
  return escape(row.weight);
}

function setPrescription(row, maxes) {
  const amrap = String(row.sets).endsWith('+');
  const sets = parseInt(row.sets, 10);
  return `<p class="prescription"><strong>${sets} series × ${row.reps} rep${row.reps === 1 ? '' : 's'}</strong> · ${loadLabel(row, maxes)}</p>
    ${amrap ? '<p class="program-note">+ La última de esas series es AMRAP opcional (máximas repeticiones), dejando 1–2 en reserva. No es una serie adicional.</p>' : ''}`;
}

function renderExercise(row, maxes) {
  const mrs = typeof row.sets === 'string' && row.sets.endsWith('MRS');
  const rm = typeof row.weight === 'string' && /^Find \d+RM$/.test(row.weight);
  const target = rm ? Number(row.weight.match(/\d+/)[0]) : row.reps;
  let content;
  if (mrs) {
    content = `<p class="prescription"><strong>Buscar ${target}RM</strong> · carga elegida en la sesión.</p>
      <p class="prescription">Después: <strong>${parseInt(row.sets, 10)} series MRS adicionales</strong> con ese mismo peso.</p>
      <p class="program-note">Máximas repeticiones dejando 1–2 en reserva. Las reps pueden bajar entre series; no son ${parseInt(row.sets, 10)} series fijas de ${target}.</p>`;
  } else if (rm) {
    content = `<p class="prescription"><strong>${target === 1 ? 'Test: buscar 1RM' : `Buscar ${target}RM`}</strong> · carga elegida en la sesión.</p>`;
  } else {
    content = setPrescription(row, maxes);
  }
  if (row.backoff) content += `<div class="backoff"><span class="tier-label">Series posteriores</span>${setPrescription(row.backoff, maxes)}</div>`;
  return `<article class="session-card exercise-card" data-exercise="${escape(row.exercise)}" data-source="${row.cell}" data-tier="${row.tier}">
    <h3 class="session-card__title"><span class="tier-label">T${row.tier}</span> ${escape(row.exercise)}</h3>
    ${content}
  </article>`;
}

export function renderWorkout(sessionKey, weekParam) {
  const session = SESSIONS[sessionKey];
  if (!session) return '<p class="page">Sesión no encontrada.</p>';
  const week = clampWeek(weekParam);
  const exercises = getExercises(sessionKey, week);
  const rows = getSessionRows(sessionKey, week);
  const maxes = readMaxes();
  const restMarkers = [...new Set(rows.filter(row => typeof row.exercise === 'string' && /Rest/.test(row.exercise)).map(row => row.exercise))];
  const rests = restMarkers.map(value => ({
    'T2 Rest': 'Descanso de T2 (salvo un test indicado arriba).',
    'T3 Rest': 'Descanso de T3.',
    'T2b & T2c Rest': 'Descanso de T2b y T2c.',
    'Week 7 T3 Rest All Days': 'Semana 7: descanso de T3 todos los días.',
  })[value] || value);
  return `<div class="page" id="workout-view">
    <a class="btn btn-dim" data-back href="#/dashboard/${week}">← Volver</a>
    <h1 class="phase-banner phase-banner--${session.color}">${session.dayLabel} · ${sessionName(sessionKey, week)} — Semana ${week}</h1>
    <p class="program-note">${week <= 6 ? 'Bloque 1: series posteriores al RM calculadas sobre el Training Max.' : 'Bloque 2: series posteriores de T1 al 85% o 90% del RM de hoy; T2 usa el Training Max del bloque 2.'}</p>
    ${['1', '2', '3'].map(tier => {
      const group = exercises.filter(row => row.tier.startsWith(tier));
      return group.length ? `<section data-tier-section="${tier}"><h2>T${tier}${tier === '1' ? ' · Principales' : tier === '2' ? ' · Secundarios' : ' · Accesorios'}</h2>${group.map(row => renderExercise(row, maxes)).join('')}</section>` : '';
    }).join('')}
    ${rests.length ? `<aside class="tip-box"><h2>Descansos del programa</h2>${rests.map(rest => `<p>${escape(rest)}</p>`).join('')}</aside>` : ''}
    <details class="session-card guide">
      <summary>Cómo leer el programa</summary>
      <p>RM: peso para el número de repeticiones indicado. MRS: series de máximas repeticiones con el mismo peso después de buscar el RM. Deja 1–2 repeticiones en reserva en MRS y AMRAP.</p>
      <p>El signo + indica AMRAP en la última serie, si te sientes bien. En el bloque 1, el Excel propone intentar el doble de las repeticiones escritas como objetivo del AMRAP.</p>
      <p>Descanso entre series: T1, 3–5 minutos; T2, 2–3 minutos.</p>
      <p>Los ejercicios mostrados son los asignados en esta semana del Excel. Las celdas sin ejercicio no agregan trabajo.</p>
    </details>
    <details class="session-card no-print timer-controls">
      <summary>Temporizador de descanso</summary>
      <div class="timer-buttons">${[60, 90, 120, 180, 240, 300].map(s => `<button class="btn" data-rest="${s}">${s / 60} min</button>`).join('')}</div>
    </details>
    <button class="btn" id="btn-print-session">Imprimir sesión</button>
    <div id="timer-overlay" class="timer-overlay" style="display:none;" role="dialog" aria-label="Temporizador de descanso" aria-modal="true">
      <div class="timer-overlay__label">Descanso</div>
      <div class="timer-overlay__time" id="timer-display">0:00</div>
      <button class="timer-overlay__skip" id="btn-skip-timer">Saltar</button>
    </div>
  </div>`;
}

export function stopWorkoutTimer() {
  activeTimer?.stop();
  activeTimer = null;
}

export function bindWorkout() {
  document.getElementById('btn-print-session')?.addEventListener('click', () => window.print());
  document.querySelectorAll('[data-rest]').forEach(button => {
    button.addEventListener('click', () => startTimer(Number(button.dataset.rest)));
  });
  document.getElementById('btn-skip-timer')?.addEventListener('click', () => activeTimer?.skip());
}

function startTimer(seconds) {
  stopWorkoutTimer();
  const overlay = document.getElementById('timer-overlay');
  const display = document.getElementById('timer-display');
  if (!overlay || !display) return;
  const trigger = document.activeElement;
  overlay.style.display = 'flex';
  document.getElementById('btn-skip-timer').focus();
  activeTimer = createTimer(seconds,
    remaining => { display.textContent = `${Math.floor(remaining / 60)}:${String(remaining % 60).padStart(2, '0')}`; },
    () => { overlay.style.display = 'none'; activeTimer = null; trigger?.focus(); }
  );
  activeTimer.start();
}
