import { BRASIL_BY_STEP, BRASIL_STEPS } from './brasil-score.js';

function tone(ctx, output, t, frequency, duration, level, type, brightness) {
  const oscillator = ctx.createOscillator();
  const gain = ctx.createGain();
  const filter = ctx.createBiquadFilter();
  oscillator.type = type;
  oscillator.frequency.value = frequency;
  filter.type = 'lowpass';
  filter.frequency.setValueAtTime(brightness, t);
  filter.frequency.exponentialRampToValueAtTime(Math.max(frequency, brightness * 0.3), t + duration);
  gain.gain.setValueAtTime(0, t);
  gain.gain.linearRampToValueAtTime(level, t + Math.min(0.012, duration / 4));
  gain.gain.exponentialRampToValueAtTime(0.0001, t + duration);
  oscillator.connect(filter); filter.connect(gain); gain.connect(output);
  oscillator.start(t); oscillator.stop(t + duration);
}

function noise(ctx, output, t, duration, level, highpass) {
  const buffer = ctx.createBuffer(1, Math.ceil(ctx.sampleRate * duration), ctx.sampleRate);
  const samples = buffer.getChannelData(0);
  for (let i = 0; i < samples.length; i++) samples[i] = Math.random() * 2 - 1;
  const source = ctx.createBufferSource();
  source.buffer = buffer;
  const filter = ctx.createBiquadFilter();
  filter.type = 'highpass'; filter.frequency.value = highpass;
  const gain = ctx.createGain();
  gain.gain.setValueAtTime(level, t);
  gain.gain.exponentialRampToValueAtTime(0.0001, t + duration);
  source.connect(filter); filter.connect(gain); gain.connect(output);
  source.start(t); source.stop(t + duration);
}

export function scheduleBrasil(ctx, output, t, step, stepDuration) {
  const position = step % BRASIL_STEPS;
  for (const event of BRASIL_BY_STEP[position]) {
    const start = t + (event.at - position) * stepDuration;
    const duration = Math.max(0.03, event.duration * stepDuration);
    const velocity = event.velocity / 127;
    const frequency = 440 * 2 ** ((event.note - 69) / 12);
    if (event.instrument === 'guitar') {
      tone(ctx, output, start, frequency, duration, velocity * 0.15, 'triangle', 3800);
      tone(ctx, output, start, frequency * 2, duration * 0.6, velocity * 0.03, 'sine', 4500);
    } else if (event.instrument === 'bass') {
      tone(ctx, output, start, frequency, duration, velocity * 0.45, 'triangle', 650);
    } else if (event.instrument === 'flute') {
      tone(ctx, output, start, frequency, duration, velocity * 0.2, 'sine', 4000);
      tone(ctx, output, start, frequency * 2, duration, velocity * 0.018, 'sine', 6000);
    } else if (event.note === 36) {
      // Rounded low drum body, with a short pitch fall rather than a techno kick.
      const oscillator = ctx.createOscillator();
      const gain = ctx.createGain();
      oscillator.frequency.setValueAtTime(110, start);
      oscillator.frequency.exponentialRampToValueAtTime(52, start + duration);
      gain.gain.setValueAtTime(velocity * 0.55, start);
      gain.gain.exponentialRampToValueAtTime(0.0001, start + duration);
      oscillator.connect(gain); gain.connect(output);
      oscillator.start(start); oscillator.stop(start + duration);
    } else if ([67, 68].includes(event.note)) {
      tone(ctx, output, start, event.note === 67 ? 990 : 740, duration, velocity * 0.12, 'square', 4300);
    } else if (event.note === 64) {
      tone(ctx, output, start, 210, duration, velocity * 0.28, 'sine', 1600);
    } else if (event.note === 37) {
      tone(ctx, output, start, 1550, 0.025, velocity * 0.16, 'triangle', 5000);
    } else {
      noise(ctx, output, start, event.note === 54 ? 0.075 : 0.04, velocity * 0.2, event.note === 54 ? 5500 : 7500);
    }
  }
}
