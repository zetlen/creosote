'use strict';
import Rx from 'rx';
import express from 'express';
import { json, urlencoded, text } from 'body-parser';
import pathMatch from 'path-match';

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

export default function ({ port, basePath = '/*', middlewares = [] }) {
  const app = express();
  const everything$ = new Rx.Subject();
  app.use(json(), urlencoded({ extended: true }), text(), ...middlewares);
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
