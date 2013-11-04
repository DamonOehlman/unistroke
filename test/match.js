var stroke = require('..');
var test = require('tape');

test('left-square-bracket', function(t) {
  var match;

  t.plan(2);
  match = stroke(require('../templates/lsb').points);

  t.ok(match, 'got match');
  t.equal(match.name, 'left-square-bracket', 'is a left-square-bracket');
});

test('right-square-bracket', function(t) {
  var match;

  t.plan(2);
  match = stroke(require('../templates/rsb').points);

  t.ok(match, 'got match');
  t.equal(match.name, 'right-square-bracket', 'is a right-square-bracket');
});

test('triangle', function(t) {
  var match;

  t.plan(2);
  match = stroke(require('../templates/triangle').points);

  t.ok(match, 'got match');
  t.equal(match.name, 'triangle', 'is a triangle');
});

test('x', function(t) {
  var match;

  t.plan(2);
  match = stroke(require('../templates/x').points);

  t.ok(match, 'got match');
  t.equal(match.name, 'x', 'is x');
});
