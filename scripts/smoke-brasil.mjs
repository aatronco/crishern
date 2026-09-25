import assert from 'node:assert/strict';
import { writeFile } from 'node:fs/promises';
const base = process.argv[2] || 'http://127.0.0.1:8765/';
const kind = process.argv[3] || 'brute';
const targets = await (await fetch('http://127.0.0.1:9223/json')).json();
const target = targets.find(t => t.type === 'page');
const ws = new WebSocket(target.webSocketDebuggerUrl);
await new Promise((r,j) => { ws.addEventListener('open',r,{once:true}); ws.addEventListener('error',j,{once:true}); });
let id = 0;
const pending = new Map(), errors = [];
ws.addEventListener('message', event => {
  const m = JSON.parse(event.data);
  if (m.id) { const p = pending.get(m.id); pending.delete(m.id); m.error ? p?.reject(new Error(JSON.stringify(m.error))) : p?.resolve(m.result); }
  if (m.method === 'Runtime.exceptionThrown') errors.push(m.params.exceptionDetails.text);
});
const send = (method, params = {}) => new Promise((resolve,reject) => { const n = ++id; pending.set(n,{resolve,reject}); ws.send(JSON.stringify({id:n,method,params})); });
const evaluate = async expression => {
  const result = await send('Runtime.evaluate', { expression, returnByValue: true, awaitPromise: true, userGesture: true });
  if (result.exceptionDetails) throw new Error(JSON.stringify(result.exceptionDetails));
  return result.result.value;
};
async function until(expression) {
  for (let i=0;i<100;i++) { if (await evaluate(expression)) return; await new Promise(r=>setTimeout(r,100)); }
  throw new Error(`Timed out: ${expression}`);
}
try {
  await send('Page.enable'); await send('Runtime.enable'); await send('Network.enable');
  await send('Page.navigate', { url: 'about:blank' });
  await until('location.href === "about:blank"');
  await send('Storage.clearDataForOrigin', { origin: new URL(base).origin, storageTypes: 'service_workers,cache_storage,local_storage' });
  await send('Network.setBypassServiceWorker', { bypass: true });
  await send('Emulation.setDeviceMetricsOverride', { width: 390, height: 844, deviceScaleFactor: 1, mobile: true });
  await send('Page.navigate', { url: base });
  await until('document.querySelectorAll("#theme-select option").length > 1');
  assert.equal(await evaluate('document.querySelector("#music-toggle").getAttribute("aria-pressed")'), 'false');
  assert.ok(await evaluate(`fetch(document.querySelector('link[rel="icon"]').href).then(r=>r.text()).then(t=>t.includes('${kind === 'brute' ? '🍆' : '🍑'}'))`));
  await evaluate('document.querySelector("#theme-select").value="brasil"; document.querySelector("#theme-select").dispatchEvent(new Event("change"))');
  assert.equal(await evaluate('document.body.dataset.theme'), 'brasil');
  assert.ok(await evaluate('document.querySelector("#midi-download").href.endsWith("brasil-sol-de-treino.mid")'));
  assert.ok(await evaluate('document.documentElement.scrollWidth <= innerWidth'));
  await writeFile(`/private/tmp/${kind}-brasil-dashboard.png`, Buffer.from((await send('Page.captureScreenshot', { format: 'png' })).data, 'base64'));
  await evaluate('document.querySelector("#music-toggle").click()');
  await until('document.querySelector("#music-toggle").getAttribute("aria-pressed") === "true"');
  await evaluate('document.querySelector("#music-volume").value=9; document.querySelector("#music-volume").dispatchEvent(new Event("input"))');
  await evaluate('document.querySelector("#music-toggle").click()');
  await until('document.querySelector("#music-toggle").getAttribute("aria-pressed") === "false"');
  // Render the actual browser synth offline and measure that it produces bounded audio.
  const audio = await evaluate(`(async()=>{
    const {scheduleBrasil}=await import('./js/brasil-audio.js');
    const ctx=new OfflineAudioContext(1,44100*4,44100);
    const gain=ctx.createGain();gain.gain.value=0.18;gain.connect(ctx.destination);
    for(let s=0;s<24;s++)scheduleBrasil(ctx,gain,s*(60/112/4),s,60/112/4);
    const data=(await ctx.startRendering()).getChannelData(0);
    let peak=0,sum=0;for(const x of data){peak=Math.max(peak,Math.abs(x));sum+=x*x;}
    return {peak,rms:Math.sqrt(sum/data.length)};
  })()`);
  assert.ok(audio.rms > 0.001 && audio.peak < 1, JSON.stringify(audio));
  if (kind === 'crishern') {
    await evaluate('document.querySelector(".maxes-panel").open=true;document.querySelector("[name=block2-bench]").value=65;document.querySelector("#maxes-form").requestSubmit()');
    await until('document.querySelector("#maxes-status").textContent.includes("guardados")');
    await send('Emulation.setDeviceMetricsOverride', { width: 320, height: 844, deviceScaleFactor: 1, mobile: true });
    for (let week=1;week<=12;week++) for (const key of ['diaUno','diaDos','diaTres','diaCuatro']) {
      await evaluate(`location.hash='#/workout/${key}/${week}'`);
      await until(`document.querySelector('.phase-banner')?.textContent.includes('Semana ${week}') && location.hash === '#/workout/${key}/${week}' && document.querySelector('.phase-banner')?.textContent.includes('Día ${['diaUno','diaDos','diaTres','diaCuatro'].indexOf(key)+1}')`);
      assert.ok(await evaluate('document.documentElement.scrollWidth <= innerWidth'), `${key} week ${week} overflows`);
      const cells = await evaluate('[...document.querySelectorAll("[data-source]")].map(el=>el.dataset.source)');
      const expected = await evaluate(`import('./js/load-calculator.js').then(m=>m.getExercises('${key}',${week}).map(row=>row.cell))`);
      assert.deepEqual(cells, expected);
    }
    await evaluate('location.hash="#/workout/diaDos/7"');
    await until('document.querySelector(".phase-banner")?.textContent.includes("Día 2")');
    assert.ok(await evaluate('document.body.innerText.includes("45 kg")'), 'saved block 2 bench TM applies');
    await evaluate('location.hash="#/workout/diaTres/8"');
    await until('document.querySelector(".phase-banner")?.textContent.includes("Día 3")');
  } else {
    await evaluate('location.hash="#/workout/empuje/1"');
    await until('document.querySelector("[data-rest]") !== null');
  }
  assert.ok(await evaluate('document.documentElement.scrollWidth <= innerWidth'));
  await writeFile(`/private/tmp/${kind}-brasil-workout.png`, Buffer.from((await send('Page.captureScreenshot', { format: 'png' })).data, 'base64'));
  await evaluate('document.querySelectorAll(".timer-controls").forEach(el=>el.open=true);document.querySelector("[data-rest]").click()');
  await until('document.getElementById("timer-overlay").style.display === "flex"');
  const position = await evaluate('(()=>{const r=document.getElementById("btn-skip-timer").getBoundingClientRect();return {x:r.x+r.width/2,y:r.y+r.height/2}})()');
  assert.equal(await evaluate(`document.elementFromPoint(${position.x},${position.y}).id`), 'btn-skip-timer');
  await send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [position] });
  await send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
  await until('document.getElementById("timer-overlay").style.display === "none"');
  await evaluate('navigator.serviceWorker.ready');
  await until('navigator.serviceWorker.controller !== null');
  await send('Network.setBypassServiceWorker', { bypass: false });
  await send('Network.emulateNetworkConditions', { offline: true, latency: 0, downloadThroughput: 0, uploadThroughput: 0 });
  await send('Page.reload');
  await until('document.querySelector("#theme-select")?.value === "brasil" && document.querySelector("[data-rest]") !== null');
  assert.equal(await evaluate('document.querySelector("#music-toggle").getAttribute("aria-pressed")'), 'false');
  assert.ok(await evaluate('fetch(document.querySelector("#midi-download").href).then(r=>r.arrayBuffer()).then(b=>new TextDecoder().decode(b.slice(0,4))==="MThd")'));
  await evaluate('document.querySelector("#music-toggle").click()');
  await until('document.querySelector("#music-toggle").getAttribute("aria-pressed") === "true"');
  await evaluate('document.querySelector("#theme-select").value="kawaii";document.querySelector("#theme-select").dispatchEvent(new Event("change"))');
  assert.equal(await evaluate('document.querySelector("#music-toggle").getAttribute("aria-pressed")'), 'false');
  await evaluate('document.querySelector("#theme-select").value="brasil";document.querySelector("#theme-select").dispatchEvent(new Event("change"))');
  assert.equal(errors.length, 0, errors.join('\n'));
  console.log(`PASS ${kind}: Brasil theme, synth RMS ${audio.rms.toFixed(4)}, MIDI, favicon, mobile, timer touch, persistence and offline${kind === 'crishern' ? ', all 48 sessions' : ''}.`);
} finally {
  await send('Network.emulateNetworkConditions', { offline: false, latency: 0, downloadThroughput: -1, uploadThroughput: -1 });
  ws.close();
}
