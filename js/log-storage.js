// Registro de resultados reales, guardado solo en este dispositivo (localStorage).
// Nada se sube a ningún servidor. Usa exportJSON/importJSON para mover datos entre dispositivos.
const STORAGE_KEY = 'crishern-log-v1';

function hasLocalStorage() {
  try { return typeof localStorage !== 'undefined'; }
  catch { return false; }
}

function readAll() {
  if (!hasLocalStorage()) return { entries: [] };
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    const parsed = raw ? JSON.parse(raw) : null;
    return parsed && Array.isArray(parsed.entries) ? parsed : { entries: [] };
  } catch {
    return { entries: [] };
  }
}

function writeAll(data) {
  if (!hasLocalStorage()) return false;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    return true;
  } catch {
    return false;
  }
}

function makeId() {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

// tier: 'T1' | 'T2' | 'T3' | 'accessory'
export function logSet({ sessionKey, week, tier, exercise, setLabel = '', kg, reps, note = '' }) {
  const data = readAll();
  const entry = {
    id: makeId(),
    date: new Date().toISOString(),
    sessionKey, week, tier, exercise, setLabel, kg, reps, note,
  };
  data.entries.push(entry);
  writeAll(data);
  return entry;
}

export function getEntries() {
  return readAll().entries;
}

export function getEntriesFor(sessionKey, week) {
  return getEntries().filter(e => e.sessionKey === sessionKey && (week === undefined || e.week === week));
}

export function lastEntryForExercise(sessionKey, week, exercise) {
  const matches = getEntriesFor(sessionKey, week).filter(e => e.exercise === exercise);
  return matches.length ? matches[matches.length - 1] : null;
}

export function deleteEntry(id) {
  const data = readAll();
  const before = data.entries.length;
  data.entries = data.entries.filter(e => e.id !== id);
  writeAll(data);
  return before !== data.entries.length;
}

export function clearAll() {
  return writeAll({ entries: [] });
}

export function exportJSON() {
  return JSON.stringify(readAll(), null, 2);
}

// mode 'merge' (default) mantiene lo que ya había y agrega solo entradas nuevas (por id).
// mode 'replace' descarta el registro actual y deja solo lo importado.
export function importJSON(json, mode = 'merge') {
  const incoming = JSON.parse(json);
  if (!incoming || !Array.isArray(incoming.entries)) throw new Error('Archivo de registro inválido.');
  if (mode === 'replace') {
    writeAll(incoming);
    return incoming.entries.length;
  }
  const current = readAll();
  const existingIds = new Set(current.entries.map(e => e.id));
  const added = incoming.entries.filter(e => e && e.id && !existingIds.has(e.id));
  writeAll({ entries: current.entries.concat(added) });
  return added.length;
}
