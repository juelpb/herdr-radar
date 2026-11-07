'use strict';

// Pinned agents sit on top of the panel whatever their state or age, first pin
// highest, and a pinned agent's worktrees stay under it.

const test = require('node:test');
const assert = require('node:assert/strict');
const { Frame } = require('../lib/frame');

const desc = (key, ids) => [...ids].sort((x, y) => ((key(x) ?? '') > (key(y) ?? '') ? -1 : 1));

function setup() {
  const frame = new Frame('test');
  frame.lastWorkingAt = new Map([
    ['busy:p1', 900000],
    ['sec:p1', 60000],
    ['coo:p1', 120000],
    ['tree:p1', 600000],
  ]);
  const entries = [
    { pane: 'busy:p1', workspace: 'busy', agentName: 'engine' },
    { pane: 'sec:p1', workspace: 'sec', agentName: 'pam' },
    { pane: 'coo:p1', workspace: 'coo', agentName: 'coo' },
    { pane: 'tree:p1', workspace: 'tree', agentName: 'drover-exit' },
    { pane: 'idle:p1', workspace: 'idle', agentName: 'never-ran' },
  ];
  const displays = new Map([
    ['busy:p1', 'blocked'],
    ['sec:p1', 'idle'],
    ['coo:p1', 'idle'],
    ['tree:p1', 'working'],
  ]);
  const parents = new Map([['tree', 'coo']]);
  return { frame, entries, displays, parents };
}

test('pinned agents outrank a blocked one, first pin on top', () => {
  const { frame, entries, displays, parents } = setup();
  const keys = frame.sortKeys(entries, parents, new Map(), displays, ['pam', 'coo']);
  assert.deepEqual(desc(keys.minuteKey, ['busy:p1', 'sec:p1', 'coo:p1', 'idle:p1']), [
    'sec:p1',
    'coo:p1',
    'busy:p1',
    'idle:p1',
  ]);
});

test("a pinned agent's worktree family rises with it in the grouped view", () => {
  const { frame, entries, displays, parents } = setup();
  const keys = frame.sortKeys(entries, parents, new Map(), displays, ['pam', 'coo']);
  const ws = (id) => keys.wsKeys.get(id);
  assert.deepEqual(desc(ws, ['busy', 'sec', 'coo', 'tree']), ['sec', 'coo', 'tree', 'busy']);
});

test('no pins leaves the order to state and recency', () => {
  const { frame, entries, displays, parents } = setup();
  const keys = frame.sortKeys(entries, parents, new Map(), displays, []);
  assert.equal(desc(keys.minuteKey, ['busy:p1', 'sec:p1', 'coo:p1'])[0], 'busy:p1');
  assert.equal(keys.minuteKey('idle:p1'), null, 'an unpinned pane that never ran still publishes no key');
});
