var stroke = require('..');
var test = require('tape');

test('left-square-bracket', function(t) {
  var match;

  t.plan(2);
  match = stroke(require('../templates/lsb').points);

  t.ok(match, 'got match');
  t.equal(match.name, 'left-square-bracket', 'is a left-square-bracket');
});