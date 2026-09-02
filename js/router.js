// js/router.js
import { renderDashboard, bindDashboard } from './views/dashboard.js';
import { renderWorkout, bindWorkout }     from './views/workout.js';

function main() { return document.getElementById('main'); }

async function route() {
  const hash  = location.hash || '#/dashboard';
  const parts = hash.replace('#/', '').split('/');
  const root  = parts[0];

  if (root === 'workout' && parts[1]) {
    const week = parts[2];
    main().innerHTML = renderWorkout(parts[1], week);
    bindWorkout(parts[1], week);
    return;
  }

  // Default — dashboard, optionally with a selected week: #/dashboard/3
  const week = root === 'dashboard' ? parts[1] : undefined;
  main().innerHTML = renderDashboard(week);
  bindDashboard(week);
}

export function initRouter() {
  window.addEventListener('hashchange', route);
  route();
}
