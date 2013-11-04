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
var unistroke = module.exports = require('./match');


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