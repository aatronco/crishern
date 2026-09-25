import { mkdir, writeFile } from 'node:fs/promises';
import { BRASIL_BPM, BRASIL_STEPS, BRASIL_SCORE, BRASIL_INSTRUMENTS } from '../js/brasil-score.js';

const ppq = 480;
const end = BRASIL_STEPS * ppq / 4;
const u32 = n => { const b = Buffer.alloc(4); b.writeUInt32BE(n); return b; };
const vlq = n => { const bytes = [n & 127]; while ((n >>= 7)) bytes.unshift((n & 127) | 128); return bytes; };
const textEvent = (type, text) => { const bytes = [...Buffer.from(text)]; return [255, type, ...vlq(bytes.length), ...bytes]; };
function track(events) {
  events.push({ at: end, order: 9, bytes: [255, 47, 0] });
  events.sort((a, b) => a.at - b.at || a.order - b.order);
  let previous = 0;
  const bytes = events.flatMap(event => {
    const delta = event.at - previous;
    previous = event.at;
    return [...vlq(delta), ...event.bytes];
  });
  return Buffer.concat([Buffer.from('MTrk'), u32(bytes.length), Buffer.from(bytes)]);
}
const tempo = Math.round(60000000 / BRASIL_BPM);
const tracks = [track([
  { at: 0, order: 0, bytes: textEvent(3, 'Sol de treino - original samba-inspired composition') },
  { at: 0, order: 0, bytes: [255, 81, 3, tempo >> 16 & 255, tempo >> 8 & 255, tempo & 255] },
  { at: 0, order: 0, bytes: [255, 88, 4, 4, 2, 24, 8] },
  { at: 0, order: 0, bytes: [255, 89, 2, 0, 0] },
])];
for (const [instrument, config] of Object.entries(BRASIL_INSTRUMENTS)) {
  const { channel, program, label } = config;
  const events = [{ at: 0, order: 0, bytes: textEvent(3, label) }];
  if (program !== undefined) events.push({ at: 0, order: 0, bytes: [192 | channel, program] });
  for (const event of BRASIL_SCORE.filter(event => event.instrument === instrument)) {
    events.push({ at: Math.round(event.at * ppq / 4), order: 2, bytes: [144 | channel, event.note, event.velocity] });
    events.push({ at: Math.round((event.at + event.duration) * ppq / 4), order: 1, bytes: [128 | channel, event.note, 0] });
  }
  tracks.push(track(events));
}
const output = new URL('../music/brasil-sol-de-treino.mid', import.meta.url);
await mkdir(new URL('../music/', import.meta.url), { recursive: true });
await writeFile(output, Buffer.concat([Buffer.from('MThd'), u32(6), Buffer.from([0, 1, 0, tracks.length, ppq >> 8, ppq & 255]), ...tracks]));
console.log(`MIDI original generado: ${output.pathname}`);
