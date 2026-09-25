import { SESSIONS, PROGRAM_WEEKS, APP_NAME, APP_ICON, APP_TAGLINE, MAX_LABELS, sessionName } from '../workout-data.js';
import { clampWeek, readMaxes, saveMaxes } from '../load-calculator.js';

export function renderDashboard(weekParam) {
  const week = clampWeek(weekParam);
  const maxes = readMaxes();
  return `
    <div class="page">
      <div class="hero">
        <div class="hero-eyebrow">▸ ${APP_NAME.toUpperCase()} ▸</div>
        <h1>${APP_ICON} Semana ${week}/${PROGRAM_WEEKS}</h1>
        <p>${APP_TAGLINE}</p>
      </div>
      <nav class="week-picker" aria-label="Semana del programa">
        ${Array.from({ length: PROGRAM_WEEKS }, (_, i) => i + 1).map(w => `
          <a href="#/dashboard/${w}" ${w === week ? 'aria-current="page"' : ''}>${w}</a>
        `).join('')}
      </nav>
      <p class="program-note">Bloque ${week <= 6 ? '1 · Semanas 1–6' : '2 · Semanas 7–12'} · Mesociclo ${['A', 'B', 'C', 'D'][Math.floor((week - 1) / 3)]}</p>
      <div class="day-list">
        ${Object.entries(SESSIONS).map(([key, s]) => `
          <a class="day-link phase-banner--${s.color}" href="#/workout/${key}/${week}">
            ${s.icon} ${s.dayLabel} — ${sessionName(key, week)}
          </a>
        `).join('')}
      </div>
      <details class="session-card maxes-panel">
        <summary>Máximos de Cristóbal (kg)</summary>
        <p class="program-note">Training Max (TM): 2RM diario estimado. Frontal inicial: 98 kg, estimada al 70% de la sentadilla de 140 kg. Cada bloque tiene su propia tabla; ambos comienzan con tus máximos actuales.</p>
        <form id="maxes-form">
          ${['block1', 'block2'].map((block, i) => `
            <fieldset><legend>Bloque ${i + 1} · Semanas ${i ? '7–12' : '1–6'}</legend>
              <div class="maxes-grid">${Object.entries(MAX_LABELS).map(([lift, label]) => `
                <label>${label}<input name="${block}-${lift}" type="number" inputmode="decimal" min="0.1" step="any" required value="${maxes[block][lift]}"></label>
              `).join('')}</div>
            </fieldset>
          `).join('')}
          <button class="btn" type="submit">Guardar máximos</button>
          <p id="maxes-status" role="status"></p>
        </form>
      </details>
      <p class="program-note">Programa de la hoja J&amp;T2.0 KGS. Los nombres y cambios de ejercicios se mantienen como en el Excel; los kilos se calculan con tus máximos y se redondean a 2,5 kg.</p>
    </div>`;
}

export function bindDashboard() {
  document.getElementById('maxes-form')?.addEventListener('submit', event => {
    event.preventDefault();
    const values = new FormData(event.currentTarget);
    const maxes = Object.fromEntries(['block1', 'block2'].map(block => [block,
      Object.fromEntries(Object.keys(MAX_LABELS).map(lift => [lift, Number(values.get(`${block}-${lift}`))])),
    ]));
    const status = document.getElementById('maxes-status');
    try {
      saveMaxes(maxes);
      status.textContent = 'Máximos guardados en este dispositivo.';
    } catch {
      status.textContent = 'No se pudieron guardar. Revisa los valores y el almacenamiento del navegador.';
    }
  });
}
