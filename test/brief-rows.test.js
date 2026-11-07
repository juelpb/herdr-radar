'use strict';

// The Drover look: `row_style = "brief"` rows (heading, work in bold behind one
// state mark, the close label and where it stands beneath, one line per Space),
// a close label asking for Juel ranking with an unseen finish, a tab bar
// command of your own, and theme colours per appearance.

const test = require('node:test');
const assert = require('node:assert/strict');

const config = require('../lib/config');
const managed = require('../lib/managed-config');
const { Frame } = require('../lib/frame');

function withStyle(t, style) {
  const before = config.rowStyle;
  config.rowStyle = style;
  t.after(() => (config.rowStyle = before));
}

test('the brief rows carry work, brief and close, and no logo', (t) => {
  withStyle(t, 'brief');
  for (const variant of ['light', 'dark']) {
    const block = managed.sidebarBlock(variant);
    assert.match(block, /\$brief/);
    assert.match(block, /token = "\$close"[^\n]*❓/);
    assert.doesNotMatch(block, /token = "\$logo"/);
    assert.equal(managed.blockOverLimit(block), false, 'a row over Herdr’s token limit rejects the whole config');
  }
});

test('the compact rows are unchanged by default', (t) => {
  withStyle(t, 'compact');
  const block = managed.sidebarBlock('light');
  assert.match(block, /token = "\$logo"/);
  assert.doesNotMatch(block, /\$brief/);
});

test('a close label that asks for Juel ranks with an unseen finish', () => {
  const frame = new Frame('test');
  frame.lastWorkingAt = new Map([
    ['ask:p1', 60000],
    ['done:p1', 120000],
    ['wait:p1', 180000],
    ['busy:p1', 900000],
  ]);
  const entries = [
    { pane: 'ask:p1', workspace: 'ask', close: '👀 Review' },
    { pane: 'done:p1', workspace: 'done' },
    { pane: 'wait:p1', workspace: 'wait', close: '⏳ Waiting' },
    { pane: 'busy:p1', workspace: 'busy', close: '❓ Decision needed' },
  ];
  const displays = new Map([
    ['ask:p1', 'idle'],
    ['done:p1', 'done'],
    ['wait:p1', 'idle'],
    ['busy:p1', 'working'],
  ]);
  const keys = frame.sortKeys(entries, new Map(), new Map(), displays, []);
  const order = ['ask:p1', 'done:p1', 'wait:p1', 'busy:p1'].sort((a, b) =>
    keys.minuteKey(a) > keys.minuteKey(b) ? -1 : 1,
  );
  // Both waiting on Juel, newest first; then the working one; ⏳ waits on someone else.
  assert.deepEqual(order, ['done:p1', 'ask:p1', 'busy:p1', 'wait:p1']);
});

test('a tab bar command of your own replaces the directory line', (t) => {
  const before = config.tabBarCommand;
  t.after(() => (config.tabBarCommand = before));
  config.tabBarCommand = '/home/u/.local/bin/herdr-status';
  assert.match(managed.block(), /command = '\/home\/u\/\.local\/bin\/herdr-status'/);
  config.tabBarCommand = '';
  assert.match(managed.block(), /command = 'cat /);
});

test('brief rows give each Space one line', (t) => {
  withStyle(t, 'brief');
  const spaces = managed.sidebarBlock('dark').split('[ui.sidebar.spaces]')[1];
  assert.doesNotMatch(spaces, /\$space_logo_/);
});

test('theme colours per appearance land in the theme block', (t) => {
  const before = config.themeColors;
  t.after(() => (config.themeColors = before));
  config.themeColors = { light: { sidebar_bg: '#f5f5f7' }, dark: { sidebar_bg: '#181818' } };
  assert.match(managed.themeBlock('light'), /sidebar_bg = "#f5f5f7"/);
  assert.match(managed.themeBlock('dark'), /sidebar_bg = "#181818"/);
});
