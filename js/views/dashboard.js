// js/views/dashboard.js
import { SESSIONS, PROGRAM_WEEKS, APP_NAME, APP_ICON, APP_TAGLINE } from '../workout-data.js';
import { clampWeek } from '../load-calculator.js';

export function renderDashboard(weekParam) {
  const week = clampWeek(weekParam);

  return `
    <div style="padding:20px 14px;">
      <div class="hero" style="border-radius:14px;margin-bottom:16px;">
        <div class="hero-eyebrow">▸ ${APP_NAME.toUpperCase()} ▸</div>
        <h1>${APP_ICON} Semana ${week}/${PROGRAM_WEEKS}</h1>
        <p class="hero-sub">${APP_TAGLINE}</p>
      </div>

      <div style="display:flex;gap:6px;margin-bottom:18px;">
        ${Array.from({ length: PROGRAM_WEEKS }, (_, i) => i + 1).map(w => `
          <a href="#/dashboard/${w}"
            style="flex:1;text-align:center;padding:10px 0;border-radius:10px;
                   font-weight:800;text-decoration:none;font-family:var(--font-display);
                   ${w === week
                     ? 'background:var(--accent);color:#fff;'
                     : 'background:var(--card);color:var(--dim);border:1px solid var(--border);'}">
            ${w}
          </a>
        `).join('')}
      </div>

      <div style="display:flex;flex-direction:column;gap:10px;">
        ${Object.entries(SESSIONS).map(([key, s]) => `
          <a href="#/workout/${key}/${week}" style="display:block;padding:16px;background:var(--card);border:1px solid var(--${s.color});border-radius:14px;color:var(--${s.color});font-weight:800;text-decoration:none;text-align:center;">
            ${s.icon} ${s.dayLabel} — ${s.name}
          </a>
        `).join('')}
      </div>
    </div>
  `;
}

export function bindDashboard() {
  // Sin estado que enlazar — la semana vive en la URL.
}
