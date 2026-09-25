// js/audio-engine.js
// Generative cyberpunk ambient music — Web Audio API, zero dependencies.
// Synthesises kick, bass, hi-hats and atmospheric pad in real time.

import { BRASIL_BPM } from './brasil-score.js';
import { scheduleBrasil } from './brasil-audio.js';

export class CyberpunkAudio {
  constructor({ voice = 'cyberpunk' } = {}) {
    this.ctx          = null;
    this.master       = null;
    this.comp         = null;
    this.reverb       = null;
    this.reverbSend   = null;
    this.playing      = false;
    this._timer       = null;
    this._nextTime    = 0;
    this._step        = 0;
    this.voice        = voice;
    this.BPM          = voice === 'brasil' ? BRASIL_BPM : voice === 'kawaii' ? 150 : voice === 'matrix' ? 145 : 128;
    this.STEPS        = 16;
    this.volume       = 0.18;
  }

  get _sd() { return 60 / this.BPM / 4; } // 16th-note duration in seconds

  // ── Init audio graph ────────────────────────────────────────────────────────
  _init() {
    if (this.ctx) return;
    this.ctx = new (window.AudioContext || window.webkitAudioContext)();

    // Compressor → master → out
    this.comp = this.ctx.createDynamicsCompressor();
    this.comp.threshold.value = -14;
    this.comp.knee.value      = 6;
    this.comp.ratio.value     = 4;
    this.comp.attack.value    = 0.003;
    this.comp.release.value   = 0.25;

    this.master = this.ctx.createGain();
    this.master.gain.value = 0;

    this.comp.connect(this.master);
    this.master.connect(this.ctx.destination);

    // Reverb (synthetic impulse response)
    const len = this.ctx.sampleRate * 2.8;
    const rb  = this.ctx.createBuffer(2, len, this.ctx.sampleRate);
    for (let c = 0; c < 2; c++) {
      const d = rb.getChannelData(c);
      for (let i = 0; i < len; i++)
        d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, 2.2);
    }
    this.reverb = this.ctx.createConvolver();
    this.reverb.buffer = rb;
    this.reverbSend = this.ctx.createGain();
    this.reverbSend.gain.value = 0.28;
    this.reverb.connect(this.reverbSend);
    this.reverbSend.connect(this.master);
  }

  // ── Instruments ─────────────────────────────────────────────────────────────
  _kick(t) {
    const ctx = this.ctx;
    // Distortion shaper
    const shaper = ctx.createWaveShaper();
    const curve  = new Float32Array(256);
    for (let i = 0; i < 256; i++) {
      const x = (i * 2) / 256 - 1;
      curve[i] = (Math.PI + 180) * x / (Math.PI + 180 * Math.abs(x));
    }
    shaper.curve = curve;

    const osc  = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(190, t);
    osc.frequency.exponentialRampToValueAtTime(32, t + 0.14);
    gain.gain.setValueAtTime(1.8, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.38);
    osc.connect(shaper);
    shaper.connect(gain);
    gain.connect(this.comp);
    osc.start(t); osc.stop(t + 0.38);
  }

  _hihat(t, open = false) {
    const ctx = this.ctx;
    const sz  = ctx.sampleRate * 0.12;
    const buf = ctx.createBuffer(1, sz, ctx.sampleRate);
    const d   = buf.getChannelData(0);
    for (let i = 0; i < sz; i++) d[i] = Math.random() * 2 - 1;

    const src  = ctx.createBufferSource();
    src.buffer = buf;

    const hp = ctx.createBiquadFilter();
    hp.type = 'highpass';
    hp.frequency.value = 7500;

    const dur  = open ? 0.22 : 0.038;
    const gain = ctx.createGain();
    gain.gain.setValueAtTime(open ? 0.22 : 0.16, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + dur);

    src.connect(hp); hp.connect(gain); gain.connect(this.comp);
    src.start(t); src.stop(t + dur);
  }

  _clap(t) {
    const ctx = this.ctx;
    // Two bursts of noise slightly offset for snappy clap texture
    [0, 0.012].forEach(offset => {
      const sz  = ctx.sampleRate * 0.08;
      const buf = ctx.createBuffer(1, sz, ctx.sampleRate);
      const d   = buf.getChannelData(0);
      for (let i = 0; i < sz; i++) d[i] = Math.random() * 2 - 1;
      const src = ctx.createBufferSource();
      src.buffer = buf;
      const bp = ctx.createBiquadFilter();
      bp.type = 'bandpass';
      bp.frequency.value = 1200;
      bp.Q.value = 0.8;
      const gain = ctx.createGain();
      const st = t + offset;
      gain.gain.setValueAtTime(0.35, st);
      gain.gain.exponentialRampToValueAtTime(0.001, st + 0.09);
      src.connect(bp); bp.connect(gain);
      gain.connect(this.comp);
      gain.connect(this.reverb);
      src.start(st); src.stop(st + 0.09);
    });
  }

  _bass(t, freq, dur) {
    const ctx = this.ctx;

    // Sawtooth + sub sine
    const saw = ctx.createOscillator();
    saw.type = 'sawtooth';
    saw.frequency.value = freq;

    const sub = ctx.createOscillator();
    sub.type = 'sine';
    sub.frequency.value = freq / 2;

    // Drive
    const shaper = ctx.createWaveShaper();
    const c2 = new Float32Array(128);
    for (let i = 0; i < 128; i++) {
      const x = (i * 2) / 128 - 1;
      c2[i] = x < 0 ? -Math.pow(-x, 0.7) : Math.pow(x, 0.7);
    }
    shaper.curve = c2;

    const filt = ctx.createBiquadFilter();
    filt.type = 'lowpass';
    filt.frequency.setValueAtTime(700, t);
    filt.frequency.exponentialRampToValueAtTime(180, t + dur * 0.85);
    filt.Q.value = 5;

    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.001, t);
    gain.gain.linearRampToValueAtTime(0.6, t + 0.018);
    gain.gain.setValueAtTime(0.6, t + dur * 0.72);
    gain.gain.exponentialRampToValueAtTime(0.001, t + dur * 0.97);

    const subGain = ctx.createGain();
    subGain.gain.value = 0.45;

    saw.connect(shaper); shaper.connect(filt);
    sub.connect(subGain); subGain.connect(filt);
    filt.connect(gain); gain.connect(this.comp);

    saw.start(t); saw.stop(t + dur);
    sub.start(t); sub.stop(t + dur);
  }

  _pad(t, freq, dur) {
    const ctx  = this.ctx;
    // 4 detuned saws → filter with slow sweep → reverb + direct
    const filt = ctx.createBiquadFilter();
    filt.type = 'lowpass';
    filt.frequency.setValueAtTime(300, t);
    filt.frequency.linearRampToValueAtTime(1100, t + dur * 0.45);
    filt.frequency.linearRampToValueAtTime(350, t + dur);
    filt.Q.value = 2.5;

    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0, t);
    gain.gain.linearRampToValueAtTime(0.14, t + dur * 0.25);
    gain.gain.setValueAtTime(0.14, t + dur * 0.75);
    gain.gain.linearRampToValueAtTime(0, t + dur);

    [-10, -3, 3, 10].forEach(detune => {
      const osc = ctx.createOscillator();
      osc.type = 'sawtooth';
      osc.frequency.value = freq;
      osc.detune.value = detune;
      osc.connect(filt);
      osc.start(t); osc.stop(t + dur);
    });

    filt.connect(gain);
    gain.connect(this.reverb);
    gain.connect(this.comp);
  }

  _arp(t, rootFreq) {
    // Arpeggiated minor triad melody (T1 = root, T3 = minor 3rd, T5 = fifth)
    const RATIOS = [1, 1.189, 1.498, 2, 1.498, 1.189]; // natural minor scale steps
    const SD = this._sd;
    RATIOS.forEach((ratio, i) => {
      const st   = t + i * SD * 0.5;
      const freq = rootFreq * 2 * ratio;  // one octave up
      const dur  = SD * 0.4;
      const ctx  = this.ctx;
      const osc  = ctx.createOscillator();
      osc.type   = 'square';
      osc.frequency.value = freq;
      const filt = ctx.createBiquadFilter();
      filt.type = 'lowpass';
      filt.frequency.value = 2200;
      const gain = ctx.createGain();
      gain.gain.setValueAtTime(0, st);
      gain.gain.linearRampToValueAtTime(0.06, st + 0.008);
      gain.gain.exponentialRampToValueAtTime(0.001, st + dur);
      osc.connect(filt); filt.connect(gain);
      gain.connect(this.reverb);
      gain.connect(this.comp);
      osc.start(st); osc.stop(st + dur);
    });
  }

  // ── Kawaii instruments (soft music-box / vocaloid-pop timbre) ───────────────
  _bell(t, freq, dur) {
    const ctx  = this.ctx;
    const osc  = ctx.createOscillator();
    const harm = ctx.createOscillator();
    osc.type  = 'triangle';  osc.frequency.value  = freq;
    harm.type = 'sine';      harm.frequency.value = freq * 2;
    const harmGain = ctx.createGain(); harmGain.gain.value = 0.18;
    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0, t);
    gain.gain.linearRampToValueAtTime(0.22, t + 0.006);
    gain.gain.exponentialRampToValueAtTime(0.001, t + dur);
    harm.connect(harmGain); harmGain.connect(gain);
    osc.connect(gain);
    gain.connect(this.reverb); gain.connect(this.comp);
    osc.start(t); osc.stop(t + dur);
    harm.start(t); harm.stop(t + dur);
  }

  _pluck(t, freq, dur) {
    const ctx  = this.ctx;
    const osc  = ctx.createOscillator();
    osc.type = 'triangle';
    osc.frequency.value = freq;
    const filt = ctx.createBiquadFilter();
    filt.type = 'lowpass';
    filt.frequency.setValueAtTime(1600, t);
    filt.frequency.exponentialRampToValueAtTime(400, t + dur * 0.9);
    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.001, t);
    gain.gain.linearRampToValueAtTime(0.32, t + 0.012);
    gain.gain.exponentialRampToValueAtTime(0.001, t + dur);
    osc.connect(filt); filt.connect(gain); gain.connect(this.comp);
    osc.start(t); osc.stop(t + dur);
  }

  _shaker(t) {
    const ctx = this.ctx;
    const sz  = ctx.sampleRate * 0.05;
    const buf = ctx.createBuffer(1, sz, ctx.sampleRate);
    const d   = buf.getChannelData(0);
    for (let i = 0; i < sz; i++) d[i] = Math.random() * 2 - 1;
    const src = ctx.createBufferSource();
    src.buffer = buf;
    const bp = ctx.createBiquadFilter();
    bp.type = 'bandpass';
    bp.frequency.value = 10500;
    bp.Q.value = 0.6;
    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.1, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.045);
    src.connect(bp); bp.connect(gain); gain.connect(this.comp);
    src.start(t); src.stop(t + 0.045);
  }

  _softPad(t, freq, dur) {
    const ctx  = this.ctx;
    const filt = ctx.createBiquadFilter();
    filt.type = 'lowpass';
    filt.frequency.value = 2600;
    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0, t);
    gain.gain.linearRampToValueAtTime(0.09, t + dur * 0.3);
    gain.gain.setValueAtTime(0.09, t + dur * 0.7);
    gain.gain.linearRampToValueAtTime(0, t + dur);
    [-4, 4].forEach(detune => {
      const osc = ctx.createOscillator();
      osc.type = 'sine';
      osc.frequency.value = freq;
      osc.detune.value = detune;
      osc.connect(filt);
      osc.start(t); osc.stop(t + dur);
    });
    filt.connect(gain);
    gain.connect(this.reverb);
    gain.connect(this.comp);
  }

  // Chord roots per bar: C, G, Am, F (I–V–vi–IV pop progression)
  _scheduleStepKawaii(t, step) {
    const s   = step % this.STEPS;
    const sd  = this._sd;
    const bar = Math.floor(step / this.STEPS) % 4;
    const BASS_ROOTS = [130.81, 196.00, 220.00, 174.61];   // C3 G3 A3 F3
    const PAD_ROOTS  = [261.63, 392.00, 440.00, 349.23];   // C4 G4 A4 F4
    // C major pentatonic, one octave up: C5 D5 E5 G5 A5
    const SCALE = [523.25, 587.33, 659.25, 783.99, 880.00];
    const MELODY = [
      [0,1,0,2,0,0,3,0, 0,2,0,1,0,0,0,0],
      [3,0,2,0,0,1,0,0, 4,0,3,0,2,0,0,0],
      [0,2,0,3,0,4,0,3, 0,2,0,0,1,0,0,0],
      [1,0,2,0,3,0,2,0, 1,0,0,0,0,0,0,0],
    ][bar];

    if (s === 0 || s === 8) this._pluck(t, BASS_ROOTS[bar], sd * 4);
    if (s === 0) this._softPad(t, PAD_ROOTS[bar], sd * 16);
    if (s % 2 === 1) this._shaker(t);
    const note = MELODY[s];
    if (note > 0) this._bell(t, SCALE[note - 1], sd * 0.9);
  }

  // ── Matrix instruments (hard industrial techno — distinct from cyberpunk) ───
  _acid(t, freq, dur) {
    const ctx  = this.ctx;
    const osc  = ctx.createOscillator();
    osc.type = 'sawtooth';
    osc.frequency.value = freq;
    const filt = ctx.createBiquadFilter();
    filt.type = 'lowpass';
    filt.Q.value = 18;
    filt.frequency.setValueAtTime(2600, t);
    filt.frequency.exponentialRampToValueAtTime(120, t + dur * 0.8);
    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.001, t);
    gain.gain.linearRampToValueAtTime(0.42, t + 0.004);
    gain.gain.exponentialRampToValueAtTime(0.001, t + dur * 0.95);
    osc.connect(filt); filt.connect(gain); gain.connect(this.comp);
    osc.start(t); osc.stop(t + dur);
  }

  // Harder, shorter, more clipped than the cyberpunk kick — a straight machine thump
  _industrialKick(t) {
    const ctx  = this.ctx;
    const shaper = ctx.createWaveShaper();
    const curve  = new Float32Array(256);
    for (let i = 0; i < 256; i++) {
      const x = (i * 2) / 256 - 1;
      curve[i] = Math.tanh(x * 6);
    }
    shaper.curve = curve;
    const osc  = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'square';
    osc.frequency.setValueAtTime(150, t);
    osc.frequency.exponentialRampToValueAtTime(45, t + 0.07);
    gain.gain.setValueAtTime(1.6, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.16);
    osc.connect(shaper); shaper.connect(gain); gain.connect(this.comp);
    osc.start(t); osc.stop(t + 0.16);
  }

  // Metallic, ringing hat — a resonant bandpass ping instead of soft noise
  _metalHat(t, open = false) {
    const ctx = this.ctx;
    const sz  = ctx.sampleRate * (open ? 0.16 : 0.03);
    const buf = ctx.createBuffer(1, sz, ctx.sampleRate);
    const d   = buf.getChannelData(0);
    for (let i = 0; i < sz; i++) d[i] = Math.random() * 2 - 1;
    const src = ctx.createBufferSource();
    src.buffer = buf;
    const bp = ctx.createBiquadFilter();
    bp.type = 'bandpass';
    bp.frequency.value = 5200;
    bp.Q.value = 9;
    const gain = ctx.createGain();
    gain.gain.setValueAtTime(open ? 0.2 : 0.15, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + (open ? 0.16 : 0.03));
    src.connect(bp); bp.connect(gain); gain.connect(this.comp);
    src.start(t); src.stop(t + (open ? 0.16 : 0.03));
  }

  // Distorted stab — an industrial clang punctuating the loop
  _clang(t) {
    const ctx = this.ctx;
    const osc = ctx.createOscillator();
    osc.type = 'square';
    osc.frequency.value = 220;
    const filt = ctx.createBiquadFilter();
    filt.type = 'bandpass';
    filt.frequency.value = 900;
    filt.Q.value = 4;
    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.28, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.1);
    osc.connect(filt); filt.connect(gain); gain.connect(this.comp); gain.connect(this.reverb);
    osc.start(t); osc.stop(t + 0.1);
  }

  // Relentless straight 4/4 industrial techno; acid bassline in E minor over 4 bars
  _scheduleStepMatrix(t, step) {
    const s   = step % this.STEPS;
    const sd  = this._sd;
    const bar = Math.floor(step / this.STEPS) % 4;
    if (s % 4 === 0) this._industrialKick(t);
    if (s % 2 === 1) this._metalHat(t, s === 15);
    if (s % 8 === 4) this._clang(t);
    const ROOTS = [41.2, 49, 36.7, 55]; // E1 G1 D1 A1
    const ACID = [
      [1,0,1,1, 0,1,0,1, 1,0,1,0, 1,0,1,0],
      [1,0,1,0, 1,1,0,1, 0,1,0,1, 1,0,0,1],
      [1,1,0,1, 0,1,0,1, 1,0,1,0, 0,1,0,1],
      [1,0,1,0, 1,0,1,1, 0,1,0,1, 1,0,1,0],
    ][bar];
    if (ACID[s]) this._acid(t, ROOTS[bar] * (s % 8 === 0 ? 2 : 1), sd * 0.9);
  }

  // ── Sequencer ───────────────────────────────────────────────────────────────
  // Bass patterns — 4 bars that loop. Frequencies in Hz (A1=55, G1=49, E1=41.2, D1=36.7, B1=61.7)
  // 0 = rest
  _scheduleStep(t, step) {
    if (this.voice === 'brasil') return scheduleBrasil(this.ctx, this.comp, t, step, this._sd);
    if (this.voice === 'kawaii') return this._scheduleStepKawaii(t, step);
    if (this.voice === 'matrix') return this._scheduleStepMatrix(t, step);
    const s  = step % this.STEPS;
    const sd = this._sd;
    const bar = Math.floor(step / this.STEPS) % 4;

    // ── Kick (4-on-the-floor with variation on bar 3)
    if (s === 0 || s === 4 || s === 8 || s === 12) this._kick(t);
    if (bar === 3 && s === 14) this._kick(t); // extra anticipation

    // ── Hi-hats
    if (s % 2 === 1) this._hihat(t, false);        // all off-beats, closed
    if (s === 10) this._hihat(t, true);              // open hat on step 10

    // ── Clap on beats 2 and 4 (steps 4 and 12)
    if (s === 4 || s === 12) this._clap(t);

    // ── Bass patterns (Hz)
    const BASS = [
      [55,0,0,0,  0,0,55,0,  55,0,0,55,  0,49,0,0 ],
      [55,0,0,0,  0,0,55,0,  55,0,0,55,  0,65.4,0,55],
      [49,0,0,0,  0,0,49,0,  49,0,0,49,  73.4,0,0,0 ],
      [55,0,0,55, 0,0,49,0,  55,0,0,55,  49,0,55,0  ],
    ];
    const bassNote = BASS[bar][s];
    if (bassNote > 0) {
      const pat    = BASS[bar];
      let noteLen  = 1;
      for (let i = s + 1; i < 16; i++) { if (pat[i] > 0) break; noteLen++; }
      this._bass(t, bassNote, sd * Math.min(noteLen, 6));
    }

    // ── Pad: new chord every 16 steps (one bar)
    const PAD_ROOTS = [55, 49, 52, 46.2]; // A1, G1, Ab1, Bb1 (dark, minor-ish)
    if (s === 0) this._pad(t, PAD_ROOTS[bar], sd * 16);

    // ── Arpeggio melody: only on bars 1 and 3, starting on step 8
    if ((bar === 1 || bar === 3) && s === 8) this._arp(t, PAD_ROOTS[bar]);
  }

  _schedule() {
    const LOOKAHEAD = 0.12; // seconds
    // A suspended tab must not schedule a burst of old notes when resumed.
    if (this._nextTime < this.ctx.currentTime - LOOKAHEAD) this._nextTime = this.ctx.currentTime;
    while (this._nextTime < this.ctx.currentTime + LOOKAHEAD) {
      this._scheduleStep(this._nextTime, this._step);
      this._nextTime += this._sd;
      this._step++;
    }
    this._timer = setTimeout(() => this._schedule(), 40);
  }

  // ── Public API ───────────────────────────────────────────────────────────────
  async start() {
    this._init();
    if (this.ctx.state === 'suspended') await this.ctx.resume();
    if (this.playing) return;
    this.playing    = true;
    this._nextTime  = this.ctx.currentTime + 0.05;
    this._step      = 0;
    this.master.gain.cancelScheduledValues(this.ctx.currentTime);
    this.master.gain.setValueAtTime(0, this.ctx.currentTime);
    this.master.gain.linearRampToValueAtTime(this.volume, this.ctx.currentTime + 2);
    this._schedule();
  }

  stop() {
    if (!this.playing) return;
    this.playing = false;
    clearTimeout(this._timer);
    this.master.gain.cancelScheduledValues(this.ctx.currentTime);
    this.master.gain.setValueAtTime(this.master.gain.value, this.ctx.currentTime);
    this.master.gain.linearRampToValueAtTime(0, this.ctx.currentTime + 1.8);
  }

  setVolume(value) {
    this.volume = Math.min(0.4, Math.max(0, Number(value) || 0));
    if (this.playing) this.master.gain.setTargetAtTime(this.volume, this.ctx.currentTime, 0.1);
  }

  dispose() {
    this.stop();
    clearTimeout(this._timer);
    if (this.ctx && this.ctx.state !== 'closed') this.ctx.close().catch(() => {});
    this.ctx = null;
  }

  async toggle() {
    if (this.playing) this.stop(); else await this.start();
    return this.playing;
  }
}
