// js/load-calculator.js
// Lookup puro sobre la tabla estática de workout-data.js — sin cálculo en
// runtime, sin fecha, sin persistencia. La semana la elige el usuario.
import { SESSIONS, PROGRAM_WEEKS } from './workout-data.js';

export function clampWeek(week) {
  return Math.min(Math.max(parseInt(week, 10) || 1, 1), PROGRAM_WEEKS);
}

export function getT1Sets(sessionKey, week, t1Index = 0) {
  const s = SESSIONS[sessionKey];
  if (!s || !Array.isArray(s.T1) || !s.T1[t1Index]?.byWeek) return [];
  const weekData = s.T1[t1Index].byWeek[week];
  if (!weekData) return [];
  return [...(weekData.warmup || []), ...(weekData.work || [])];
}

export function getAccessoryWeight(accessory, week) {
  const kg = accessory.byWeek?.[week];
  return kg === undefined ? undefined : kg;
}
