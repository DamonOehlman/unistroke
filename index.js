/* jshint node: true */
'use strict';

var Stroke = require('./stroke');
var templates = [];

/**
  # Unistroke

  This is a port of the [
  Washington $1 Unistroke Recognizer
  ](http://depts.washington.edu/aimgroup/proj/dollar/index.html) to generally make it a little
  more Javascripty and potentially optimize the code in a few places.

  ## Example Usage

  <<< examples/capture.js

  ## Reference

**/

/**
  ### unistroke(input, opts?)

  Create a stroke based on the input points and then match it against
  the templates that have been registered previously.

**/
var unistroke = module.exports = function(input, opts) {
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

/**
  ### unistroke.define(template)

  Register a new stroke template with unistroke.

**/
var define = unistroke.define = function(template) {
  // if no template, complain
  if (! template) {
    throw new Error('No template supplied');
  }

  // if we do not have points, throw an error
  if (! Array.isArray(template.points)) {
    throw new Error('A template must expose a valid points array');
  }

  templates[templates.length] = new Stroke(template.points, template);
};

/* register the default templates */

define(require('./templates/lsb'));
define(require('./templates/rsb'));
define(require('./templates/triangle'));
define(require('./templates/x'));

/* internal helper functions */

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