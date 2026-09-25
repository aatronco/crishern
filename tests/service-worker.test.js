import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { runInNewContext } from 'node:vm';

const source = await readFile(new URL('../sw.js', import.meta.url), 'utf8');
const currentCache = source.match(/const CACHE = '([^']+)'/)[1];

function worker(keys, windows = []) {
  const events = {};
  const deleted = [];
  const navigated = [];
  const requests = [];
  let claimed = false;
  runInNewContext(source, {
    Request: class { constructor(url, options) { this.url = url; this.cache = options.cache; } },
    caches: {
      keys: async () => keys,
      delete: async key => deleted.push(key),
      open: async () => ({ addAll: async items => requests.push(...items) }),
    },
    self: {
      registration: { scope: 'https://example.com/crishern/' },
      skipWaiting: async () => {},
      addEventListener: (name, handler) => { events[name] = handler; },
      clients: {
        claim: async () => { claimed = true; },
        matchAll: async () => windows.map(client => ({
          frameType: 'top-level', ...client,
          navigate: async url => {
            assert.ok(claimed, 'claim the new worker before reloading');
            navigated.push(url);
            if (client.closed) throw new Error('Window closed during update');
          },
        })),
      },
    },
  });
  return {
    deleted, navigated, requests,
    dispatch: name => new Promise((resolve, reject) => {
      events[name]({ waitUntil: promise => promise.then(resolve, reject) });
    }),
  };
}

test('upgrade refreshes existing app windows at their selected route and preserves unrelated caches', async () => {
  const url = 'https://example.com/crishern/#/workout/fullBody2/6';
  const sw = worker(['crishern-v17', currentCache, 'other-app-v1'], [
    { url },
    { url: 'https://example.com/other/' },
    { url: 'https://example.com/crishern/#/dashboard', frameType: 'nested' },
  ]);
  await sw.dispatch('activate');
  assert.deepEqual(sw.deleted, ['crishern-v17']);
  assert.deepEqual(sw.navigated, [url]);
});

test('first installation does not reload and closed windows do not prevent activation', async () => {
  const url = 'https://example.com/crishern/';
  const fresh = worker([currentCache], [{ url }]);
  await fresh.dispatch('activate');
  assert.deepEqual(fresh.navigated, []);
  const upgrade = worker(['crishern-v16', currentCache], [{ url, closed: true }]);
  await upgrade.dispatch('activate');
  assert.deepEqual(upgrade.deleted, ['crishern-v16']);
});

test('installation fetches fresh app resources instead of reusing the HTTP cache', async () => {
  const sw = worker([]);
  await sw.dispatch('install');
  assert.ok(sw.requests.some(request => request.url === './js/workout-data.js'));
  assert.ok(sw.requests.every(request => request.cache === 'reload'));
});
