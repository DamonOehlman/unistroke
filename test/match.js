var unistroke = require('../pkg/cjs/unistroke'),
    expect = require('expect.js'),
    strokes = [
        'left-square-bracket', 
        'right-square-bracket',
        'triangle',
        'x'
    ];

describe('exact match tests', function() {
    strokes.forEach(function(stroke) {
        it('should be able to recognize an ' + stroke, function() {
            var match = unistroke.match(unistroke.get(stroke));
            
            expect(match.stroke.name).to.equal(stroke);
        });
    });
});