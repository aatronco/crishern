// js/views/log.js — registro local de resultados: exportar/importar entre dispositivos.
import { getEntries, exportJSON, importJSON, clearAll, deleteEntry } from '../log-storage.js';

function formatDate(iso) {
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? iso : d.toLocaleString('es-CL', { dateStyle: 'short', timeStyle: 'short' });
}

export function renderLog() {
  const entries = getEntries().slice().reverse();

  return `
    <div style="padding:20px 14px;" id="log-view">
      <button class="btn btn-dim" data-back style="margin-bottom:12px;padding:8px 16px;">← Volver</button>

      <div class="hero" style="border-radius:14px;margin-bottom:16px;">
        <div class="hero-eyebrow">▸ REGISTRO ▸</div>
        <h1>📒 Tus resultados</h1>
        <p class="hero-sub">Se guardan solo en este dispositivo (localStorage). Nada sale de tu teléfono salvo que exportes.</p>
      </div>

      <div class="program-note" style="margin-bottom:16px;">
        <p>Usa <b>Exportar</b> antes de cambiar de teléfono o de borrar datos del navegador. Usa <b>Importar</b> para traer un archivo exportado desde otro dispositivo — se suma a lo que ya tengas, sin duplicar.</p>
        <div style="display:flex;gap:10px;flex-wrap:wrap;margin-top:12px;">
          <button id="btn-export-log" class="btn" style="padding:10px 16px;">⬇ Exportar registro (.json)</button>
          <label class="btn btn-dim" style="padding:10px 16px;cursor:pointer;">
            ⬆ Importar registro
            <input id="input-import-log" type="file" accept="application/json" style="display:none;">
          </label>
          <button id="btn-clear-log" class="btn btn-dim" style="padding:10px 16px;">🗑 Borrar todo</button>
        </div>
        <p id="log-io-status" role="status" style="font-size:12px;color:var(--dim);margin-top:8px;"></p>
      </div>

      <h2 class="sh">Entradas guardadas (${entries.length})</h2>
      ${entries.length ? `
        <table class="set-table">
          <thead><tr><th>Fecha</th><th>Sesión</th><th>Ejercicio</th><th>Serie</th><th>Kg</th><th>Reps</th><th></th></tr></thead>
          <tbody>
            ${entries.map(e => `
              <tr data-entry-id="${e.id}">
                <td>${formatDate(e.date)}</td>
                <td>${e.sessionKey}${e.week ? ` · S${e.week}` : ''}</td>
                <td>${e.exercise}</td>
                <td>${e.setLabel || '—'}</td>
                <td>${e.kg ?? '—'}</td>
                <td>${e.reps ?? '—'}</td>
                <td><button class="btn-delete-entry" data-delete-id="${e.id}" style="background:none;border:none;color:var(--dim);cursor:pointer;">✕</button></td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      ` : `<p style="color:var(--dim);font-size:13px;">Todavía no registras ninguna serie. Vuelve a una sesión y usa "Guardar" junto a un ejercicio.</p>`}
    </div>
  `;
}

export function bindLog() {
  const view = document.getElementById('log-view');
  if (!view) return;

  document.querySelector('[data-back]')?.addEventListener('click', () => {
    location.hash = '#/dashboard';
  });

  const status = document.getElementById('log-io-status');
  const setStatus = msg => { if (status) status.textContent = msg; };

  document.getElementById('btn-export-log')?.addEventListener('click', () => {
    const json = exportJSON();
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `crishern-registro-${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
    setStatus('Registro exportado.');
  });

  document.getElementById('input-import-log')?.addEventListener('change', async event => {
    const file = event.target.files?.[0];
    if (!file) return;
    try {
      const text = await file.text();
      const added = importJSON(text, 'merge');
      setStatus(`Importado: ${added} entrada(s) nueva(s).`);
      location.hash = '#/registro';
      location.reload();
    } catch (error) {
      setStatus(`No se pudo importar: ${error.message}`);
    }
    event.target.value = '';
  });

  document.getElementById('btn-clear-log')?.addEventListener('click', () => {
    if (!confirm('¿Borrar todo el registro guardado en este dispositivo? Exporta primero si quieres conservarlo.')) return;
    clearAll();
    location.reload();
  });

  view.querySelectorAll('[data-delete-id]').forEach(btn => {
    btn.addEventListener('click', () => {
      deleteEntry(btn.dataset.deleteId);
      btn.closest('tr')?.remove();
    });
  });
}
