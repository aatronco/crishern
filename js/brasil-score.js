// Original composition: "Sol de treino" — samba-inspired groove, 32 bars.
// One score drives both the browser synthesizer and the downloadable MIDI.
export const BRASIL_BPM = 112;
export const BRASIL_BARS = 32;
export const BRASIL_STEPS = BRASIL_BARS * 16;
export const BRASIL_INSTRUMENTS = {
  guitar: { channel: 0, program: 24, label: 'Violao - nylon guitar' },
  bass: { channel: 1, program: 32, label: 'Acoustic bass' },
  flute: { channel: 2, program: 73, label: 'Flute' },
  percussion: { channel: 9, label: 'Surdo, pandeiro, agogo, shaker' },
};

const chords = [
  [64, 67, 71, 74], [60, 64, 67, 71], [65, 69, 72, 76], [65, 69, 71, 76],
  [62, 67, 71, 74], [61, 64, 67, 71], [60, 65, 69, 76], [59, 65, 69, 74],
]; // Cmaj9 / Am9 / Dm9 / G13 / Em7 / A9 / Dm9 / G9
const roots = [36, 33, 38, 31, 40, 33, 38, 31];
// Each pair is [sixteenth-note position, pitch]; rests are intentional.
const melody = [
  [[2,76],[5,79],[7,81],[10,79],[14,74]],
  [[1,76],[4,72],[7,71],[11,72],[14,76]],
  [[2,77],[5,76],[8,74],[11,72],[14,69]],
  [[0,71],[3,74],[6,76],[10,74]],
  [[2,79],[5,78],[7,76],[11,74],[14,71]],
  [[1,73],[4,76],[7,79],[10,76],[14,73]],
  [[2,74],[5,77],[8,76],[11,74],[14,72]],
  [[0,71],[3,69],[6,67],[10,74],[14,76]],
];

export function buildBrasilScore() {
  const notes = [];
  const add = (instrument, at, note, duration, velocity) => {
    notes.push({ instrument, at, note, duration: Math.min(duration, BRASIL_STEPS - at), velocity });
  };
  for (let bar = 0; bar < BRASIL_BARS; bar++) {
    const start = bar * 16;
    const b = bar % 8;
    const section = Math.floor(bar / 8);
    const strums = bar % 2 ? [0, 3, 7, 10, 14] : [0, 3, 6, 10, 12, 15];
    for (const step of strums) chords[b].forEach((note, string) => {
      add('guitar', start + step + string * 0.04, note, step === 15 ? 0.7 : 1.6, 47 + (step % 4 ? 8 : 0) - string * 2);
    });
    for (const [step, interval, length] of [[0,0,2.8],[6,7,1.4],[8,0,2.8],[14,7,1.4]]) {
      add('bass', start + step, roots[b] + interval, length, step === 8 ? 81 : 70);
    }
    // Eight-bar phrases, with a higher answering phrase in the third section.
    for (const [i, [step, note]] of melody[b].entries()) {
      if (section === 0 && bar < 2) continue; // instrumental introduction
      const pitch = note + (section === 2 && i % 2 === 0 ? 12 : 0);
      add('flute', start + step, pitch, i === melody[b].length - 1 ? 1.7 : 1.3, 65 + (i % 3) * 5);
    }
    // Strong second beat, quiet first beat, continuous shaker and syncopated rim.
    for (const step of [0,4,8,12]) add('percussion', start + step, 36, 1.3, step % 8 === 4 ? 100 : 61);
    for (let step = 0; step < 16; step++) add('percussion', start + step, 70, 0.35, step % 2 ? 49 : 31);
    for (const step of [2,5,8,11,14]) add('percussion', start + step, 54, 0.5, step % 2 ? 49 : 39);
    for (const step of (bar % 2 ? [1,4,7,10,14] : [0,3,6,10,13])) add('percussion', start + step, 37, 0.3, 64);
    if (section !== 0 || bar >= 4) for (const [step,note] of [[2,67],[6,68],[11,67],[14,68]]) add('percussion', start + step, note, 0.7, 48);
    if (bar % 8 === 7) for (const step of [12,13,14,15]) add('percussion', start + step, 64, 0.6, 50 + (step - 12) * 8);
  }
  return notes.sort((a, b) => a.at - b.at);
}

export const BRASIL_SCORE = buildBrasilScore();
export const BRASIL_BY_STEP = Array.from({ length: BRASIL_STEPS }, () => []);
for (const event of BRASIL_SCORE) BRASIL_BY_STEP[Math.floor(event.at)].push(event);
