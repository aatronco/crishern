// js/theme.js
const KEY = 'crishern-theme';
export const THEMES = [
  { id: 'kawaii', label: '🎀 Kawaii' },
  { id: 'brasil', label: '🇧🇷 Brasil' },
];
const IDS = THEMES.map(t => t.id);

export function getTheme() {
  try {
    const saved = localStorage.getItem(KEY);
    return IDS.includes(saved) ? saved : 'kawaii';
  } catch { return 'kawaii'; }
}

function applyTheme(theme) {
  document.body.dataset.theme = theme;
  document.dispatchEvent(new CustomEvent('brute-theme-change', { detail: { theme } }));
}

export function initTheme() {
  const select = document.getElementById('theme-select');
  const theme = getTheme();
  applyTheme(theme);
  if (select) {
    select.innerHTML = THEMES.map(t => `<option value="${t.id}">${t.label}</option>`).join('');
    select.value = theme;
    select.addEventListener('change', () => {
      try { localStorage.setItem(KEY, select.value); } catch {}
      applyTheme(select.value);
    });
  }
}
