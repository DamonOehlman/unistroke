/* jshint node: true */
'use strict';

module.exports = function(input, opts) {
  var best = Infinity;
  var selected = -1;
  var d;
  var result;

  // if we have an array as input, convert to a stroke
  if (Array.isArray(input)) {
    input = new Stroke(input, opts);
  }

  // if we don't have a stroke, then complain
  if (! (input instanceof Stroke)) {
    return;
  }

  // compare the with the registered templates
  for (var ii = templates.length; input && ii--; ) {
    var diff = optimalCosineDistance(templates[ii].vector, input.vector);

    // if this is a better match then the current match,
    // then update the best template index
    if (diff < best) {
      best = diff;
      selected = ii;
    }
  }

  // if we found a match, return a cloned instance of the stroke
  if (selected >= 0) {
    result = templates[selected].createResult(1 / best);
  }

  return result;
};

function optimalCosineDistance(v1, v2) {
  var a = 0;
  var b = 0;
  var angle;
  var ii = 0;
  var count = v1.length;

  for (ii = 0; ii < count; ii += 2) {
    a += v1[ii] * v2[ii] + v1[ii + 1] * v2[ii + 1];
    b += v1[ii] * v2[ii + 1] - v1[ii + 1] * v2[ii];
  }

  angle = Math.atan(b / a);
  return b === 0 ? b : Math.acos(a * Math.cos(angle) + b * Math.sin(angle));
}