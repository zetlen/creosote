'use strict';

var _extends = Object.assign || function (target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i]; for (var key in source) { if (Object.prototype.hasOwnProperty.call(source, key)) { target[key] = source[key]; } } } return target; };

Object.defineProperty(exports, "__esModule", {
  value: true
});

exports.default = function (_ref2) {
  let port = _ref2.port;
  var _ref2$basePath = _ref2.basePath;
  let basePath = _ref2$basePath === undefined ? '/*' : _ref2$basePath;
  var _ref2$middlewares = _ref2.middlewares;
  let middlewares = _ref2$middlewares === undefined ? [] : _ref2$middlewares;

  const app = (0, _express2.default)();
  const everything$ = new _rx2.default.Subject();
  app.use.apply(app, [(0, _bodyParser.json)(), (0, _bodyParser.urlencoded)({ extended: true }), (0, _bodyParser.text)()].concat(_toConsumableArray(middlewares)));
  app.route(basePath).all((req, res) => everything$.onNext({ method: req.method, req, res }));
  const server = app.listen(port);

  function requests(pathspec) {
    return (!pathspec ? everything$ : everything$.map(o => {
      let params = matchRoute(pathspec, o.req.path);
      o.req.params = params || o.req.params;
      return params && _extends({ params }, o);
    }).filter(_rx2.default.helpers.identity)).share();
  }

  let api = methods.reduce((out, verb) => _extends({
    [verb.toLowerCase() + 's']: p => requests(p).where(methodIs(verb))
  }, out), {
    mounted: true,
    requests,
    unmount: cb => {
      if (cb) everything$.subscribeOnCompleted(cb);
      server.close(() => {
        api.mounted = false;
        everything$.onCompleted();
      });
    }
  });
  return api;
};

var _rx = require('rx');

var _rx2 = _interopRequireDefault(_rx);

var _express = require('express');

var _express2 = _interopRequireDefault(_express);

var _bodyParser = require('body-parser');

var _pathMatch = require('path-match');

var _pathMatch2 = _interopRequireDefault(_pathMatch);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _toConsumableArray(arr) { if (Array.isArray(arr)) { for (var i = 0, arr2 = Array(arr.length); i < arr.length; i++) arr2[i] = arr[i]; return arr2; } else { return Array.from(arr); } }

const methods = ['GET', 'POST', 'PUT', 'DELETE'];
const route = (0, _pathMatch2.default)();

let routes = {};
function matchRoute(routeSpec, url) {
  let match = routes[routeSpec];
  if (!match) match = routes[routeSpec] = route(routeSpec);
  return match(url);
}

function methodIs(m) {
  return _ref => {
    let method = _ref.method;
    return method === m;
  };
}

module.exports = exports['default'];