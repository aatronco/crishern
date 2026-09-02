export function createTimer(seconds, onTick, onComplete) {
  let remaining = seconds;
  let interval  = null;
  let active    = false;

  function stop() {
    active = false;
    if (interval) { clearInterval(interval); interval = null; }
  }

  function skip() {
    stop();
    onComplete();
  }

  function start() {
    active = true;
    if (remaining <= 0) {
      setTimeout(() => { if (active) { onComplete(); } }, 0);
      return;
    }
    onTick(remaining);
    interval = setInterval(() => {
      if (!active) return;
      remaining--;
      onTick(remaining);
      if (remaining <= 0) { stop(); onComplete(); }
    }, 1000);
  }

  return { start, stop, skip };
}
