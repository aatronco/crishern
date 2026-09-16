// js/views/workout.js
import { SESSIONS } from '../workout-data.js';
import { getT1Sets, clampWeek } from '../load-calculator.js';
import { createTimer } from '../timer.js';
import { WEEK_PLAN, PROGRAM_ORIGIN, STRENGTH_RULE, MEASUREMENT_RULE } from '../strength-plan.js';
import { logSet } from '../log-storage.js';

let activeTimer = null;

export function renderWorkout(sessionKey, weekParam) {
  const session = SESSIONS[sessionKey];
  if (!session) return `<p style="padding:20px;color:var(--dim)">Sesión no encontrada.</p>`;

  const week = clampWeek(weekParam);

  return `
    <div style="padding:14px 14px 20px;" id="workout-view">
      <button class="btn btn-dim" data-back="${week}" style="margin-bottom:12px;padding:8px 16px;">← Volver</button>

      <div class="phase-banner phase-banner--${session.color}">
        ◈ ${session.name} — Semana ${week}
      </div>

      <div class="program-note">
        <span class="system-label">${WEEK_PLAN[week].label}</span>
        <p>${WEEK_PLAN[week].note}</p>
        <p>Pesos y repeticiones son objetivos: avanza solo si completaste el paso anterior con el margen indicado. Si no, repítelo.</p>
        <details><summary>Referencia del programa y registro</summary><p>${PROGRAM_ORIGIN}</p><p>${STRENGTH_RULE}</p><p>${MEASUREMENT_RULE}</p></details>
      </div>

      ${renderSession(sessionKey, session, week)}

      <div style="display:flex;gap:10px;margin-top:24px;">
        <button id="btn-print-session"
          style="flex:1;padding:16px;border-radius:14px;
                 border:1px solid var(--border);background:transparent;color:var(--dim);
                 font-size:16px;font-weight:800;cursor:pointer;">
          🖶 Imprimir
        </button>
      </div>
    </div>
    <div id="timer-overlay" class="timer-overlay" style="display:none;">
      <div class="timer-overlay__label">Descanso</div>
      <div class="timer-overlay__time" id="timer-display">0:00</div>
      <button class="timer-overlay__skip" id="btn-skip-timer">Saltar</button>
    </div>
  `;
}

function renderSession(sessionKey, session, week) {
  const t1Blocks = (session.T1 || []).map((t1, i) => {
    const exerciseName = t1.exerciseByWeek?.[week] || t1.exercise;
    return `
    <h2 class="sh" style="margin-top:18px;">
      <span class="dot" style="background:var(--${session.color})"></span>T1 — ${exerciseName}
    </h2>
    ${t1.note ? `<div style="font-size:12px;color:var(--note);margin-bottom:8px;">${t1.note}</div>` : ''}
    ${renderT1Table(getT1Sets(sessionKey, week, i), sessionKey, week, exerciseName)}
    ${renderProgression(t1.byWeek, week)}
  `;
  }).join('');

  return `
    ${t1Blocks}

    ${session.T2?.length ? `
      <h2 class="sh" style="margin-top:18px;">
        <span class="dot" style="background:var(--role-t2)"></span>T2 — Asistencia primaria
      </h2>
      ${renderT2List(session.T2, week, sessionKey, 'T2')}
    ` : ''}

    ${session.T3?.length ? `
      <h2 class="sh" style="margin-top:18px;">
        <span class="dot" style="background:var(--role-t3)"></span>T3 — Asistencia secundaria
      </h2>
      ${renderT2List(session.T3, week, sessionKey, 'T3')}
    ` : ''}

    ${session.accessories?.length ? `
      <h2 class="sh" style="margin-top:18px;">
        <span class="dot" style="background:var(--role-t3)"></span>Accesorios
      </h2>
      ${renderT2List(session.accessories, week, sessionKey, 'accessory')}
    ` : ''}

    ${session.cardio?.length ? `
      <h2 class="sh" style="margin-top:18px;">
        <span class="dot" style="background:var(--role-cardio)"></span>Cardio
      </h2>
      ${renderCardioList(session.cardio)}
    ` : ''}
  `;
}

export function bindWorkout(sessionKey, weekParam) {
  const backBtn = document.querySelector('[data-back]');
  backBtn?.addEventListener('click', () => {
    location.hash = `#/dashboard/${backBtn.dataset.back}`;
  });
  document.getElementById('btn-print-session')?.addEventListener('click', () => {
    window.print();
  });

  if (!SESSIONS[sessionKey]) return;

  if (activeTimer) { activeTimer.stop(); activeTimer = null; }

  document.querySelectorAll('.btn-log-set').forEach(btn => {
    btn.addEventListener('click', () => {
      const row = btn.closest('tr') || btn.closest('.log-row');
      if (!row) return;
      const kgInput = row.querySelector('.log-input--kg');
      const repsInput = row.querySelector('.log-input--reps');
      const kg = kgInput?.value !== '' && kgInput?.value !== undefined ? Number(kgInput.value) : undefined;
      const reps = repsInput?.value !== '' && repsInput?.value !== undefined ? Number(repsInput.value) : undefined;
      if (kg === undefined && reps === undefined) return;
      logSet({
        sessionKey: btn.dataset.logSession,
        week: Number(btn.dataset.logWeek),
        tier: btn.dataset.logTier,
        exercise: btn.dataset.logExercise,
        setLabel: btn.dataset.logLabel || '',
        kg, reps,
      });
      const original = btn.textContent;
      btn.textContent = '✓';
      btn.disabled = true;
      setTimeout(() => { btn.textContent = original; btn.disabled = false; }, 1200);
    });
  });

  document.querySelectorAll('[data-rest]').forEach(btn => {
    btn.addEventListener('click', () => {
      const secs = parseInt(btn.dataset.rest, 10);
      if (secs > 0) startTimer(secs);
    });
  });

  const skipBtn = document.getElementById('btn-skip-timer');
  if (skipBtn) skipBtn.addEventListener('click', () => { if (activeTimer) activeTimer.skip(); });
}

// ── Render helpers ──────────────────────────────────────────────────────────

function restButton(rest) {
  return rest > 0
    ? `<button data-rest="${rest}" style="background:var(--accent);border:none;border-radius:8px;padding:3px 10px;color:#fff;font-size:11px;cursor:pointer;margin-left:8px;">▶</button>`
    : '';
}

function logCell(sessionKey, week, tier, exercise, label) {
  return `
    <td><input type="number" step="0.5" inputmode="decimal" class="log-input log-input--kg" placeholder="kg" style="width:52px;" aria-label="Kg real"></td>
    <td><input type="number" inputmode="numeric" class="log-input log-input--reps" placeholder="reps" style="width:42px;" aria-label="Reps reales"></td>
    <td><button class="btn-log-set" data-log-session="${sessionKey}" data-log-week="${week}" data-log-tier="${tier}" data-log-exercise="${exercise}" data-log-label="${label}" style="background:var(--accent);border:none;border-radius:8px;padding:4px 8px;color:#fff;font-size:11px;cursor:pointer;">💾</button></td>
  `;
}

function renderT1Table(sets, sessionKey, week, exerciseName) {
  if (!sets.length) return `<p style="color:var(--dim);font-size:13px;padding:8px 0;">Sin sets para esta semana.</p>`;
  return `
    <table class="set-table">
      <thead><tr><th>Serie</th><th>Reps</th><th>Kg objetivo</th><th>Desc</th><th></th><th>Kg real</th><th>Reps</th><th></th></tr></thead>
      <tbody>
        ${sets.map(s => `
          <tr class="${s.type === 'work' ? 'set-row--work' : ''}">
            <td>${s.label}</td>
            <td>${s.reps}</td>
            <td>${typeof s.kg === 'number' ? s.kg + ' kg' : s.kg}</td>
            <td>${s.rest ? s.rest + '"' : '—'}</td>
            <td>${s.rest > 0 ? `<button data-rest="${s.rest}" style="background:var(--accent);border:none;border-radius:8px;padding:4px 10px;color:#fff;font-size:11px;cursor:pointer;">▶</button>` : ''}</td>
            ${logCell(sessionKey, week, 'T1', exerciseName, s.label)}
          </tr>
          ${s.note ? `<tr><td colspan="8" style="font-size:11px;color:var(--role-comment);padding-bottom:6px;">${s.note}</td></tr>` : ''}
        `).join('')}
      </tbody>
    </table>
  `;
}

function renderT2List(exercises, week, sessionKey, tier) {
  return exercises.map(e => {
    const weekly = e.byWeek?.[week];
    const isWaveT2 = weekly && typeof weekly === 'object';
    const setsReps = isWaveT2 ? weekly.setsReps : e.setsReps;
    const kg       = isWaveT2 ? weekly.kg       : weekly;
    const kgLabel  = kg === undefined ? '' : (typeof kg === 'number' ? ` @ ${kg} kg` : ` @ ${kg}`);
    const comment  = isWaveT2 ? weekly.comment : undefined;
    return `
      <div class="session-card">
        <div class="session-card__title">${e.name}</div>
        <div class="ex-meta" style="font-size:13px;color:var(--dim);">
          <b style="color:var(--text)">${setsReps}${kgLabel}</b>
          ${e.rest ? `· ${e.rest}"` : ''}
          ${restButton(e.rest)}
        </div>
        ${comment ? `<div style="font-size:11px;color:var(--role-comment);margin-top:5px;">${comment}</div>` : ''}
        ${e.note ? `<div style="font-size:12px;color:var(--note);margin-top:5px;">${e.note}</div>` : ''}
        ${e.byWeek ? renderProgression(e.byWeek, week) : ''}
        <div class="log-row" style="display:flex;gap:6px;align-items:center;margin-top:8px;">
          <input type="number" step="0.5" inputmode="decimal" class="log-input log-input--kg" placeholder="kg" style="width:56px;" aria-label="Kg real">
          <input type="number" inputmode="numeric" class="log-input log-input--reps" placeholder="reps" style="width:48px;" aria-label="Reps reales">
          <button class="btn-log-set" data-log-session="${sessionKey}" data-log-week="${week}" data-log-tier="${tier}" data-log-exercise="${e.name}" data-log-label="" style="background:var(--accent);border:none;border-radius:8px;padding:5px 10px;color:#fff;font-size:11px;cursor:pointer;">💾 Guardar</button>
        </div>
      </div>
    `;
  }).join('');
}

function renderProgression(byWeek, currentWeek) {
  const rows = Object.entries(byWeek).flatMap(([week, data]) => {
    const work = data.work || [{ label: data.setsReps, kg: data.kg }];
    return work.map(set => `<tr${Number(week) === currentWeek ? ' class="set-row--work"' : ''}><td>${week}</td><td>${set.label}</td><td>${typeof set.kg === 'number' ? `${set.kg} kg` : set.kg}</td></tr>`);
  });
  return `<details class="progression-table"><summary>Ver progresión de las 12 semanas</summary><p class="block-note">Objetivos desde la base declarada. Si un paso cuesta más de lo indicado, repítelo antes de avanzar.</p><table class="set-table"><thead><tr><th>Semana</th><th>Series × reps</th><th>Carga objetivo</th></tr></thead><tbody>${rows.join('')}</tbody></table></details>`;
}

function renderCardioList(items) {
  return items.map(c => `
    <div class="session-card">
      <div class="session-card__title">${c.name}</div>
      <div class="ex-meta" style="font-size:13px;color:var(--dim);"><b style="color:var(--text)">${c.duration}</b></div>
      ${c.note ? `<div style="font-size:12px;color:var(--note);margin-top:5px;">${c.note}</div>` : ''}
    </div>
  `).join('');
}

// ── Timer ───────────────────────────────────────────────────────────────────
function startTimer(seconds) {
  const overlay  = document.getElementById('timer-overlay');
  const display  = document.getElementById('timer-display');
  if (!overlay || !display) return;

  overlay.style.display = 'flex';

  if (activeTimer) activeTimer.stop();

  activeTimer = createTimer(
    seconds,
    remaining => { display.textContent = formatTime(remaining); },
    () => {
      overlay.style.display = 'none';
      activeTimer = null;
      if (navigator.vibrate) navigator.vibrate([200, 100, 200]);
    }
  );
  activeTimer.start();
}

function formatTime(s) {
  const m = Math.floor(s / 60);
  const r = s % 60;
  return `${m}:${String(r).padStart(2, '0')}`;
}
