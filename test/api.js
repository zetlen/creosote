'use strict';
const Creosote = require('../');
const test = require('./helpers/with-open-port');

test('methods all present', (t, port) => {
  t.plan(6);
  let creosote = Creosote({ port });
  [
    'unmount',
    'requests',
    'gets',
    'posts',
    'puts',
    'deletes'
  ].forEach(
    (n) => t.is(typeof creosote[n], 'function', `${n} is a function`)
  );
  creosote.unmount();
});

test('unmount completes observable and marks unmounted', (t, port) => {
  t.plan(4);
  let creosote = Creosote({ port });
  t.is(creosote.mounted, true, 'mounted');
  creosote.requests().subscribeOnCompleted(() => {
    t.pass('sequence complete');
    t.is(creosote.mounted, false, 'unmounted');
  });
  creosote.unmount(() => t.pass('unmount callback called'));
});
