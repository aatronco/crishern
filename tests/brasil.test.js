import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { BRASIL_SCORE, BRASIL_STEPS, BRASIL_BPM, BRASIL_INSTRUMENTS } from '../js/brasil-score.js';
import { CyberpunkAudio } from '../js/audio-engine.js';

test('Brasil score has bounded notes, syncopation, melody and Brazilian percussion', () => {
  assert.equal(new CyberpunkAudio({ voice: 'brasil' }).BPM, 112);
  assert.equal(BRASIL_STEPS, 512);
  for (const event of BRASIL_SCORE) {
    assert.ok(event.at >= 0 && event.at < BRASIL_STEPS);
    assert.ok(event.duration > 0 && event.at + event.duration <= BRASIL_STEPS);
    assert.ok(Number.isInteger(event.note) && event.note >= 0 && event.note <= 127);
    assert.ok(Number.isInteger(event.velocity) && event.velocity > 0 && event.velocity <= 127);
    assert.ok(BRASIL_INSTRUMENTS[event.instrument]);
  }
  assert.equal(new Set(BRASIL_SCORE.map(event => event.instrument)).size, 4);
  assert.ok(BRASIL_SCORE.some(event => event.instrument === 'guitar' && event.at % 4 !== 0));
  assert.deepEqual(new Set(BRASIL_SCORE.filter(event => event.instrument === 'percussion').map(event => event.note)), new Set([36,70,54,37,67,68,64]));
});

test('downloadable MIDI reproduces every score note, duration, velocity and tempo', () => {
  const file = readFileSync(new URL('../music/brasil-sol-de-treino.mid', import.meta.url));
  assert.equal(file.toString('ascii', 0, 4), 'MThd');
  assert.equal(file.readUInt16BE(8), 1);
  assert.equal(file.readUInt16BE(10), 5);
  assert.equal(file.readUInt16BE(12), 480);
  let offset = 14;
  const notes = [];
  const tempos = [];
  for (let track = 0; track < 5; track++) {
    assert.equal(file.toString('ascii', offset, offset + 4), 'MTrk');
    const end = offset + 8 + file.readUInt32BE(offset + 4);
    offset += 8;
    let time = 0;
    const active = new Map();
    const vlq = () => {
      let value = 0, byte;
      do { byte = file[offset++]; value = (value << 7) | (byte & 127); } while (byte & 128);
      return value;
    };
    while (offset < end) {
      time += vlq();
      const status = file[offset++];
      if (status === 255) {
        const type = file[offset++];
        const length = vlq();
        if (type === 81) tempos.push(file.readUIntBE(offset, 3));
        if (type === 47) assert.equal(time, BRASIL_STEPS * 120);
        offset += length;
      } else if ((status & 240) === 192) {
        offset++;
      } else {
        const note = file[offset++];
        const velocity = file[offset++];
        const channel = status & 15;
        const key = `${channel}:${note}`;
        if ((status & 240) === 144 && velocity) {
          assert.ok(!active.has(key), `overlapping note ${key}`);
          active.set(key, { at: time, channel, note, velocity });
        } else if ((status & 240) === 128 || ((status & 240) === 144 && velocity === 0)) {
          assert.ok(active.has(key), `unmatched note off ${key}`);
          notes.push({ ...active.get(key), end: time });
          active.delete(key);
        } else assert.fail(`Unexpected MIDI event ${status}`);
      }
    }
    assert.equal(active.size, 0, 'No hanging notes');
  }
  assert.equal(offset, file.length);
  assert.deepEqual(tempos, [Math.round(60000000 / BRASIL_BPM)]);
  const expected = BRASIL_SCORE.map(event => ({
    at: Math.round(event.at * 120), channel: BRASIL_INSTRUMENTS[event.instrument].channel,
    note: event.note, velocity: event.velocity, end: Math.round((event.at + event.duration) * 120),
  }));
  const sort = (a, b) => a.at - b.at || a.channel - b.channel || a.note - b.note;
  assert.deepEqual(notes.sort(sort), expected.sort(sort));
});
