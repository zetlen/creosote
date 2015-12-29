var test = require('tape');
var portfinder = require('portfinder');

module.exports = function testWithOpenPort(desc, cb) {
  test(desc, (t) => {
    portfinder.getPort((e, port) => {
      if (e) t.fail('getting port failed: ' + e);
      cb(t, port);
    });
  });
}
