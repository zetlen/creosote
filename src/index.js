'use strict';
import Rx from 'rx';
import express from 'express';
import { json, urlencoded, text } from 'body-parser';
import pathMatch from 'path-match';

const parsers = {
  json,
  text,
  urlencoded: urlencoded.bind(null, { extended: true })
};

const methods = ['GET', 'POST', 'PUT', 'DELETE'];
const route = pathMatch();

let routes = {};
function matchRoute (routeSpec, url) {
  let match = routes[routeSpec];
  if (!match) match = routes[routeSpec] = route(routeSpec);
  return match(url);
}

function methodIs (m) {
  return ({ method }) => method === m;
}

export default function ({ port, basePath = '/*', middlewares, expect }) {
  const app = express();
  const everything$ = new Rx.Subject();
  if (expect) {
    if (!parsers[expect]) {
      throw new Error(
        `Bad 'expect' configuration. No builtin parser for '${expect}'.`
      );
    } else {
      app.use(parsers[expect]());
    }
  }
  if (middlewares) {
    app.use(...middlewares);
  }
  app.route(basePath).all(
    (req, res) => everything$.onNext({ method: req.method, req, res })
  );
  const server = app.listen(port);

  function requests (pathspec) {
    return (!pathspec ? everything$ : everything$.map((o) => {
      let params = matchRoute(pathspec, o.req.path);
      o.req.params = params || o.req.params;
      return params && { params, ...o };
    }).filter(Rx.helpers.identity)).share();
  }

  let api = methods.reduce(
    (out, verb) => ({
      [verb.toLowerCase() + 's']: (p) => requests(p).where(methodIs(verb)),
      ...out
    }),
    {
      mounted: true,
      requests,
      unmount: (cb) => {
        if (cb) everything$.subscribeOnCompleted(cb);
        server.close(() => {
          api.mounted = false;
          everything$.onCompleted();
        });
      }
    }
  );
  return api;
}
