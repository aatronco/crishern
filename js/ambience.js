import { CyberpunkAudio } from './audio-engine.js';
import { getTheme } from './theme.js';

const LABELS = {
  kawaii:    { playing: 'Ⅱ Pausar música', idle: '▶ Música kawaii ✨', online: '♪ ONLINE ♪', standby: '♪ STANDBY ♪' },
  brasil:    { playing: 'Ⅱ Pausar música', idle: '▶ Música Brasil', online: 'Sol de treino · Samba', standby: 'Brasil · Sol de treino' },
};
const MIDI_FILES = { kawaii: 'music/brute-kawaii.mid', brasil: 'music/brasil-sol-de-treino.mid' };

export function initAmbience() {
  const button = document.getElementById('music-toggle');
  const volume = document.getElementById('music-volume');
  const status = document.getElementById('music-status');
  const midiLink = document.getElementById('midi-download');
  let player = new CyberpunkAudio({ voice: getTheme() });
  function update() {
    const labels = LABELS[player.voice] || LABELS.kawaii;
    button.setAttribute('aria-pressed', String(player.playing));
    button.textContent = player.playing ? labels.playing : labels.idle;
    document.getElementById('ambience').classList.toggle('is-playing', player.playing);
    status.textContent = player.playing ? labels.online : labels.standby;
  }
  button.addEventListener('click', async () => {
    button.disabled = true;
    try {
      await player.toggle();
      if (document.hidden) player.stop();
      update();
    } catch {
      player.stop();
      update();
      status.textContent = 'Audio no disponible. Intenta nuevamente.';
    } finally {
      button.disabled = false;
    }
  });
  volume.addEventListener('input', () => player.setVolume(Number(volume.value) / 100));
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) { player.stop(); update(); }
  });
  window.addEventListener('pagehide', () => { player.stop(); update(); });
  document.addEventListener('brute-theme-change', e => {
    const theme = e.detail.theme;
    player.dispose();
    player = new CyberpunkAudio({ voice: theme });
    player.setVolume(Number(volume.value) / 100);
    if (midiLink) midiLink.href = MIDI_FILES[theme] || MIDI_FILES.kawaii;
    update();
  });
  if (midiLink) midiLink.href = MIDI_FILES[player.voice] || MIDI_FILES.kawaii;
  update();
}
