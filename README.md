## creosote is a [Reactive](http://reactivex.org) interface for an [express](http://expressjs.com) server

#### i hope, probably in vain, that this test is good enough documentation for now

```js
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
```
