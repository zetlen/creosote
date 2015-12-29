'use strict';
const Creosote = require('../');
const fetch = require('node-fetch');
const test = require('./helpers/with-open-port');

test('parses JSON from a post body', (t, port) => {
  t.plan(1);
  let creosote = Creosote({ port });
  creosote.posts('/repos/:name/:tag')
  .do(o => o.res.status(200).end())
  .reduce(
    (acc, c) => {
      let name = c.params.name;
      let tag = c.params.tag;
      let out = Object.assign({}, acc);
      out[name] = Object.assign({}, out[name]);
      out[name][tag] = c.req.body;
      return out;
    },
    {}
  ).subscribe((statuses) => {
    t.same(
      statuses,
      {
        sam: {
          '1.0.0': {
            buildStatus: 'failed'
          }
        },
        diane: {
          '1.2.1': {
            buildStatus: 'succeeded'
          }
        }
      },
      'json was parsed'
    );
  });
  fetch(`http://localhost:${port}/repos/sam/1.0.0`, {
    method: 'post',
    headers: {
      'Accept': 'application/json',
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      buildStatus: 'failed'
    })
  })
  .then(() => fetch(`http://localhost:${port}/repos/diane/1.2.1`, {
    method: 'post',
    headers: {
      'Accept': 'application/json',
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      buildStatus: 'succeeded'
    })
  }))
  .then(() => creosote.unmount())
  .catch(t.fail);
});

test('parses form data from a post body', (t, port) => {
  t.plan(1);
  let creosote = Creosote({ port });
  creosote.posts('/repos/:name/:tag')
  .do(o => o.res.status(200).end())
  .reduce(
    (acc, c) => {
      let name = c.params.name;
      let tag = c.params.tag;
      let out = Object.assign({}, acc);
      out[name] = Object.assign({}, out[name]);
      out[name][tag] = c.req.body;
      return out;
    },
    {}
  ).subscribe((statuses) => {
    t.same(
      statuses,
      {
        sam: {
          '1.0.0': {
            buildStatus: 'red',
            commit: '12345'
          },
          '1.2.1': {
            buildStatus: 'green',
            commit: '67890'
          }
        }
      },
      'form data was parsed'
    );
  });
  fetch(`http://localhost:${port}/repos/sam/1.0.0`, {
    method: 'post',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: 'buildStatus=red&commit=12345'
  })
  .then(() => fetch(`http://localhost:${port}/repos/sam/1.2.1`, {
    method: 'post',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: 'buildStatus=green&commit=67890'
  }))
  .then(() => creosote.unmount())
  .catch(t.fail);
});
