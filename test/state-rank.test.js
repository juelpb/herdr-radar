'use strict';

// A finished or asking agent ranks above one still working, whatever the clock says.

const test = require('node:test');
const assert = require('node:assert/strict');
const { Frame } = require('../lib/frame');

test('state outranks recency in the sort keys', () => {
  const frame = new Frame('test');
  frame.lastWorkingAt = new Map([
    ['a:p1', 120000],
    ['b:p1', 60000],
    ['c:p1', 0],
  ]);
  const entries = [
    { pane: 'a:p1', workspace: 'a' },
    { pane: 'b:p1', workspace: 'b' },
    { pane: 'c:p1', workspace: 'c' },
  ];
  const displays = new Map([
    ['a:p1', 'working'],
    ['b:p1', 'done'],
    ['c:p1', 'blocked'],
  ]);
  const keys = frame.sortKeys(entries, new Map(), new Map(), displays);
  const byKey = (map, ids) => [...ids].sort((x, y) => (map(x) > map(y) ? -1 : 1));
  assert.deepEqual(byKey(keys.minuteKey, ['a:p1', 'b:p1', 'c:p1']), ['c:p1', 'b:p1', 'a:p1']);
  assert.deepEqual(
    byKey((ws) => keys.wsKeys.get(ws), ['a', 'b', 'c']),
    ['c', 'b', 'a'],
  );
});
