// js/views/workout.js
import { SESSIONS } from '../workout-data.js';
import { getT1Sets, clampWeek } from '../load-calculator.js';
import { createTimer } from '../timer.js';

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
  const t1Blocks = (session.T1 || []).map((t1, i) => `
    <h2 class="sh" style="margin-top:18px;">
      <span class="dot" style="background:var(--${session.color})"></span>T1 — ${t1.exercise}
    </h2>
    ${t1.note ? `<div style="font-size:12px;color:var(--note);margin-bottom:8px;">${t1.note}</div>` : ''}
    ${renderT1Table(getT1Sets(sessionKey, week, i))}
  `).join('');

  return `
    ${t1Blocks}

    ${session.T2?.length ? `
      <h2 class="sh" style="margin-top:18px;">
        <span class="dot" style="background:var(--mint)"></span>T2 — Hipertrofia
      </h2>
      ${renderT2List(session.T2, week)}
    ` : ''}

    ${session.kineBlock ? renderKineBlock(session.kineBlock) : ''}

    ${session.T3?.length ? `
      <h2 class="sh" style="margin-top:18px;">
        <span class="dot" style="background:var(--orange)"></span>Accesorios obligatorios
      </h2>
      ${renderFixedList(session.T3)}
    ` : ''}

    ${session.accessories?.length ? `
      <h2 class="sh" style="margin-top:18px;">
        <span class="dot" style="background:var(--orange)"></span>Accesorios
      </h2>
      ${renderAccessoryList(session.accessories, week)}
    ` : ''}

    ${session.chipper ? renderChipperBlock(session.chipper) : ''}

    ${session.cycling ? renderCyclingBlock(session.cycling) : ''}

    ${session.cardio?.length ? `
      <h2 class="sh" style="margin-top:18px;">
        <span class="dot" style="background:var(--gold)"></span>Cardio
      </h2>
      ${renderCardioList(session.cardio)}
    ` : ''}
  `;
}

export function bindWorkout(sessionKey) {
  const backBtn = document.querySelector('[data-back]');
  backBtn?.addEventListener('click', () => {
    location.hash = `#/dashboard/${backBtn.dataset.back}`;
  });
  document.getElementById('btn-print-session')?.addEventListener('click', () => {
    window.print();
  });

  if (!SESSIONS[sessionKey]) return;

  if (activeTimer) { activeTimer.stop(); activeTimer = null; }

  document.querySelectorAll('[data-rest]').forEach(btn => {
    btn.addEventListener('click', () => {
      const secs = parseInt(btn.dataset.rest, 10);
      if (secs > 0) startTimer(secs);
    });
  });

  const skipBtn = document.getElementById('btn-skip-timer');
  if (skipBtn) skipBtn.addEventListener('click', () => { if (activeTimer) activeTimer.skip(); });

  document.querySelectorAll('[data-cycling-tab]').forEach(tab => {
    tab.addEventListener('click', () => {
      const idx = tab.dataset.cyclingTab;
      document.querySelectorAll('[data-cycling-tab]').forEach(t => t.classList.toggle('btn-dim', t.dataset.cyclingTab !== idx));
      document.querySelectorAll('[data-cycling-panel]').forEach(p => {
        p.style.display = p.dataset.cyclingPanel === idx ? '' : 'none';
      });
    });
  });

  document.querySelectorAll('[data-chipper-tab]').forEach(tab => {
    tab.addEventListener('click', () => {
      const idx = tab.dataset.chipperTab;
      document.querySelectorAll('[data-chipper-tab]').forEach(t => t.classList.toggle('btn-dim', t.dataset.chipperTab !== idx));
      document.querySelectorAll('[data-chipper-panel]').forEach(p => {
        p.style.display = p.dataset.chipperPanel === idx ? '' : 'none';
      });
    });
  });
}

// ── Render helpers ──────────────────────────────────────────────────────────

function restButton(rest) {
  return rest > 0
    ? `<button data-rest="${rest}" style="background:var(--accent);border:none;border-radius:8px;padding:3px 10px;color:#fff;font-size:11px;cursor:pointer;margin-left:8px;">▶</button>`
    : '';
}

function renderT1Table(sets) {
  if (!sets.length) return `<p style="color:var(--dim);font-size:13px;padding:8px 0;">Sin sets para esta semana.</p>`;
  return `
    <table class="set-table">
      <thead><tr><th>Serie</th><th>Reps</th><th>Kg</th><th>Desc</th><th></th></tr></thead>
      <tbody>
        ${sets.map(s => `
          <tr class="${s.type === 'work' ? 'set-row--work' : ''}">
            <td>${s.label}</td>
            <td>${s.reps}</td>
            <td>${typeof s.kg === 'number' ? s.kg + ' kg' : s.kg}</td>
            <td>${s.rest ? s.rest + '"' : '—'}</td>
            <td>${s.rest > 0 ? `<button data-rest="${s.rest}" style="background:var(--accent);border:none;border-radius:8px;padding:4px 10px;color:#fff;font-size:11px;cursor:pointer;">▶</button>` : ''}</td>
          </tr>
          ${s.note ? `<tr><td colspan="5" style="font-size:11px;color:var(--cyan);padding-bottom:6px;">${s.note}</td></tr>` : ''}
        `).join('')}
      </tbody>
    </table>
  `;
}

function renderT2List(exercises, week) {
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
        ${comment ? `<div style="font-size:11px;color:var(--cyan);margin-top:5px;">${comment}</div>` : ''}
        ${e.note ? `<div style="font-size:12px;color:var(--note);margin-top:5px;">${e.note}</div>` : ''}
      </div>
    `;
  }).join('');
}

function renderFixedList(exercises) {
  return exercises.map(e => `
    <div class="session-card">
      <div class="session-card__title">
        ${e.name}
        ${e.obligatorio ? '<span class="pill-obligatorio">OBLIGATORIO</span>' : ''}
      </div>
      <div class="ex-meta" style="font-size:13px;color:var(--dim);">
        <b style="color:var(--text)">${e.setsReps}</b>
        ${e.rest ? `· ${e.rest}"` : ''}
        ${restButton(e.rest)}
      </div>
      ${e.note ? `<div style="font-size:12px;color:var(--note);margin-top:5px;">${e.note}</div>` : ''}
    </div>
  `).join('');
}

function renderAccessoryList(accessories, week) {
  return accessories.map(a => {
    const kg = a.byWeek?.[week];
    const kgLabel = kg === undefined ? '' : (typeof kg === 'number' ? `${kg} kg · ` : `${kg} · `);
    const unit = a.repUnit || '';
    return `
      <div class="session-card">
        <div class="session-card__title">${a.name}</div>
        <div class="ex-meta" style="font-size:13px;color:var(--dim);">
          <b style="color:var(--text)">${kgLabel}${a.sets}×${a.repRange[0]}-${a.repRange[1]}${unit}</b>
          ${a.rest ? `· ${a.rest}"` : ''}
          ${restButton(a.rest)}
        </div>
        ${a.note ? `<div style="font-size:12px;color:var(--note);margin-top:5px;">${a.note}</div>` : ''}
      </div>
    `;
  }).join('');
}

function renderCyclingBlock(cycling) {
  return `
    <div style="margin:16px 0 8px;font-size:12px;font-weight:700;color:var(--gold);text-transform:uppercase;letter-spacing:1px;">
      ${cycling.label}
    </div>
    <div style="font-size:12px;color:var(--dim);margin-bottom:10px;">${cycling.note}</div>
    <div class="cycling-tabs" style="display:flex;gap:8px;flex-wrap:wrap;margin-bottom:10px;">
      ${cycling.options.map((o, i) => `
        <button class="btn ${i === 0 ? '' : 'btn-dim'}" data-cycling-tab="${i}"
          style="padding:8px 14px;font-size:13px;">${o.name}</button>
      `).join('')}
    </div>
    ${cycling.options.map((o, i) => `
      <div class="cycling-panel" data-cycling-panel="${i}" style="${i === 0 ? '' : 'display:none;'}">
        <div class="session-card">
          <div class="session-card__title">${o.rounds} rondas for time</div>
          ${o.movements.map(m => `
            <div class="ex-meta" style="font-size:13px;color:var(--dim);margin-top:4px;">
              <b style="color:var(--text)">${m.reps}${m.repUnit || ''} ${m.name}</b>
              ${m.kg ? ` @ ${m.kg} kg` : ''}
            </div>
            ${m.note ? `<div style="font-size:11px;color:var(--note);margin:2px 0 4px;">${m.note}</div>` : ''}
          `).join('')}
        </div>
      </div>
    `).join('')}
  `;
}

function renderChipperSteps(steps) {
  return steps.map(s => s.burpees ? `
    <div class="ex-meta" style="font-size:13px;color:var(--orange);margin-top:6px;font-weight:700;">
      ${s.burpees} Burpees
    </div>
  ` : `
    <div class="ex-meta" style="font-size:13px;color:var(--dim);margin-top:6px;">
      <b style="color:var(--text)">${s.reps}${s.repUnit || ''} ${s.name}</b>
      ${s.kg ? ` @ ${s.kg} kg` : ''}
    </div>
    ${s.note ? `<div style="font-size:11px;color:var(--note);margin:2px 0 4px;">${s.note}</div>` : ''}
  `).join('');
}

function renderChipperBlock(chipper) {
  return `
    <div style="margin:16px 0 8px;font-size:12px;font-weight:700;color:var(--gold);text-transform:uppercase;letter-spacing:1px;">
      ${chipper.label}
    </div>
    <div style="font-size:12px;color:var(--dim);margin-bottom:10px;">${chipper.note}</div>
    <div class="chipper-tabs" style="display:flex;gap:8px;flex-wrap:wrap;margin-bottom:10px;">
      ${chipper.options.map((o, i) => `
        <button class="btn ${i === 0 ? '' : 'btn-dim'}" data-chipper-tab="${i}"
          style="padding:8px 14px;font-size:13px;">${o.name}</button>
      `).join('')}
    </div>
    ${chipper.options.map((o, i) => `
      <div class="chipper-panel" data-chipper-panel="${i}" style="${i === 0 ? '' : 'display:none;'}">
        <div class="session-card">
          ${o.note ? `<div style="font-size:11px;color:var(--note);margin-bottom:6px;">${o.note}</div>` : ''}
          ${renderChipperSteps(o.steps)}
        </div>
      </div>
    `).join('')}
  `;
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

function renderKineBlock(bloque) {
  return `
    <div style="margin:16px 0 8px;font-size:12px;font-weight:700;color:var(--cyan);text-transform:uppercase;letter-spacing:1px;">
      ${bloque.label}
    </div>
    <div style="font-size:12px;color:var(--dim);margin-bottom:8px;">${bloque.note}</div>
    ${bloque.exercises.map(e => `
      <div class="session-card">
        <div class="session-card__title">${e.name}</div>
        <div class="ex-meta" style="font-size:13px;color:var(--dim);">
          <b style="color:var(--text)">${e.load}</b> · ${e.setsReps}
          ${restButton(e.rest)}
        </div>
        ${e.note ? `<div style="font-size:12px;color:var(--note);margin-top:5px;">${e.note}</div>` : ''}
      </div>
    `).join('')}
  `;
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
