/* jshint node: true */
'use strict';

var Stroke = require('./stroke');
var templates = [];

/*
 * Unistroke.js
 * Adapted from the washington unistroke recognizer and optimized for speed
 *
 * ORIGINAL LICENSE:
 * The $1 Unistroke Recognizer (C# version)
 *
 *      Jacob O. Wobbrock, Ph.D.
 *      The Information School
 *      University of Washington
 *      Mary Gates Hall, Box 352840
 *      Seattle, WA 98195-2840
 *      wobbrock@uw.edu
 *
 *      Andrew D. Wilson, Ph.D.
 *      Microsoft Research
 *      One Microsoft Way
 *      Redmond, WA 98052
 *      awilson@microsoft.com
 *
 *      Yang Li, Ph.D.
 *      Department of Computer Science and Engineering
 *      University of Washington
 *      The Allen Center, Box 352350
 *      Seattle, WA 98195-2840
 *      yangli@cs.washington.edu
 *
 * The Protractor enhancement was published by Yang Li and programmed here by
 * Jacob O. Wobbrock.
 *
 *  Li, Y. (2010). Protractor: A fast and accurate gesture
 *    recognizer. Proceedings of the ACM Conference on Human
 *    Factors in Computing Systems (CHI '10). Atlanta, Georgia
 *    (April 10-15, 2010). New York: ACM Press, pp. 2169-2172.
 *
 * This software is distributed under the "New BSD License" agreement:
 *
 * Copyright (c) 2007-2011, Jacob O. Wobbrock, Andrew D. Wilson and Yang Li.
 * All rights reserved.
 *
 * Redistribution and use in source and binary forms, with or without
 * modification, are permitted provided that the following conditions are met:
 *    * Redistributions of source code must retain the above copyright
 *      notice, this list of conditions and the following disclaimer.
 *    * Redistributions in binary form must reproduce the above copyright
 *      notice, this list of conditions and the following disclaimer in the
 *      documentation and/or other materials provided with the distribution.
 *    * Neither the names of the University of Washington nor Microsoft,
 *      nor the names of its contributors may be used to endorse or promote
 *      products derived from this software without specific prior written
 *      permission.
 *
 * THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS
 * IS" AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO,
 * THE IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR
 * PURPOSE ARE DISCLAIMED. IN NO EVENT SHALL Jacob O. Wobbrock OR
 * Andrew D. Wilson OR Yang Li BE LIABLE FOR ANY DIRECT, INDIRECT,
 * INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING, BUT
 * NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES; LOSS OF USE,
 * DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON ANY
 * THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT
 * (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF
 * THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
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