'use strict';
const Creosote = require('../');
const fetch = require('node-fetch');
const test = require('./helpers/with-open-port');

test('receives request stream', (t, port) => {
  t.plan(9);
  let creosote = Creosote({ port });
  let seen = [];
  creosote.requests().subscribe(o => {
    seen.push(o);
    t.ok(o, 'observable produced a value');
    t.ok(o.res, 'value had a `res`');
    o.res.status(200).end();
  });
  Promise.all([
    fetch(`http://localhost:${port}`),
    fetch(`http://localhost:${port}`, { method: 'post' })
  ])
  .then((coll) => {
    let res = coll[0];
    t.is(res.status, 200, 'status 200');
    t.is(seen.length, 2, 'two requests seen');
    let seen1 = seen[0];
    t.is(seen1.method, 'GET', 'method is GET');
    t.is(seen1.req.path, '/', 'path is /');
    let seen2 = seen[1];
    t.is(seen2.method, 'POST', 'method is POST');
    creosote.unmount();
  })
  .catch(t.fail);
});

test('filters requests on route', (t, port) => {
  t.plan(5);
  let creosote = Creosote({ port });
  let seen = [];
  creosote.requests().subscribe((o) => {
    o.res.status(200).end();
  });
  creosote.requests('/ham/:flavor').subscribe((o) => {
    seen.push(o);
  });
  Promise.all([
    fetch(`http://localhost:${port}`),
    fetch(`http://localhost:${port}/hom`),
    fetch(`http://localhost:${port}/ham/2`),
    fetch(`http://localhost:${port}/ham/black-forest`),
    fetch(`http://localhost:${port}/ham/honey-maple`),
  ])
  .then((coll) => {
    t.is(coll.length, 5, 'made 5 requests');
    t.is(seen.length, 3, 'filtered to 3 requests');
    let flavors = seen.map((r) => r.params.flavor).sort();
    t.is(flavors[0], '2', 'param correct');
    t.is(flavors[1], 'black-forest', 'param correct');
    t.is(flavors[2], 'honey-maple', 'param correct');
    creosote.unmount();
  });
});

test('takes an alternate basepath', (t, port) => {
  t.plan(3);
  let creosote = Creosote({ port, basePath: '/snacks/*' });
  creosote.requests().subscribe((o) => {
    o.res.status(201).end();
    t.ok(o.req.path.match(/^\/snacks/), 'base path present');
  });
  Promise.all([
    fetch(`http://localhost:${port}`),
    fetch(`http://localhost:${port}/snacks/gagh`)
  ])
  .then((coll) => {
    t.is(coll[0].status, 404, 'request without base path 404ed'),
    t.is(coll[1].status, 201, 'request with base path 201ed'),
    creosote.unmount();
  }).catch(t.fail);
})

test('HTTP verb methods filter request stream', (t, port) => {
  t.plan(5);
  let creosote = Creosote({ port });
  creosote.requests().subscribe((o) => o.res.status(200).end());
  creosote.gets().do((o) => {
    t.is(o.method, 'GET', 'only gets came through');
  })
  .map((o) => o.req.query.shape)
  .filter((x) => x)
  .toArray()
  .subscribe((getset) => {
    t.is(getset.length, 2, 'two gets');
    t.same(getset, ['rhombus', 'kite'], 'both accessible');
  });
  Promise.all([
    fetch(`http://localhost:${port}`),
    fetch(`http://localhost:${port}/?shape=rhombus`),
    fetch(`http://localhost:${port}/?shape=ovoid`, { method: 'post' }),
    fetch(`http://localhost:${port}/?shape=scalene`, { method: 'put' }),
    fetch(`http://localhost:${port}/?shape=kite`),
  ])
  .then((coll) => {
    creosote.unmount();
  }).catch(t.fail);
});


