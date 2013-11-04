var stroke = require('..');
var test = require('tape');

test('left-square-bracket', function(t) {
  var match;

  t.plan(2);
  match = stroke(require('../templates/lsb').points);

  t.ok(match, 'got match');
  t.equal(match.name, 'left-square-bracket', 'is a left-square-bracket');
});

// var unistroke = require('../unistroke'),
//     expect = require('expect.js'),
//     strokes = [
//         'left-square-bracket', 
//         'right-square-bracket',
//         'triangle',
//         'x'
//     ];

// describe('exact match tests', function() {
//     strokes.forEach(function(stroke) {
//         it('should be able to recognize an ' + stroke, function() {
//             var match = unistroke.match(unistroke.get(stroke));
            
//             expect(match.stroke.name).to.equal(stroke);
//         });
//     });
// });