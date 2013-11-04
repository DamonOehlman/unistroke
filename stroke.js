/* jshint node: true */
'use strict';

/**
  ### Stroke(points, opts)

  Register a new stroke using the input `points` and the specified `opts`.
**/
function Stroke(points, opts) {
  var pathlen = 0;
  var ii;
  var count = points.length;
  var accumulatedDist = 0;
  var points2d = [];
  var key;

  // if the array is a 1d array, then convert to 2d
  if (points.length && typeof points[0] == 'number') {
    // reset the points2d array
    points2d = [];

    // copy 1d array elements across to the 2d array
    for (ii = 0; ii < count; ii += 2) {
      points2d[points2d.length] = [points[ii], points[ii + 1]];
    }

    points = points2d;
    count = points.length;
  }

  // ensure points are numeric
  for (ii = points.length; ii--; ) {
    points[ii] = [parseFloat(points[ii][0]), parseFloat(points[ii][1])];
  }

  // ensure we have options
  opts = opts || {};

  // calculate the path length
  for (ii = 1; ii < count; ii++) {
    pathlen += distance(points[ii - 1][0], points[ii - 1][1], points[ii][0], points[ii][1]);
  }

  // initialise members
  this.segments = (opts || {}).segments || 63;
  this.squareSize = (opts || {}).squareSize || 250;
  this.origin = (opts || {}).origin || [0, 0];

  // calculated properties
  this.diagonal = Math.sqrt(this.squareSize * this.squareSize +
    this.squareSize * this.squareSize);
  this.halfDiag = this.diagonal * 0.5;
  this.angleRange = deg2rad(45);
  this.anglePrecision = deg2rad(2);
  this.phi = 0.5 * (-1.0 + Math.sqrt(5)); // Golden Ratio

  // calculate the interval length
 //  this.interval = pathlen / this.segments;

  // copy any other owned properties from the opts to this object
  this.createResult = function(score) {
    var result = {
      score: score,
      stroke: this
    };

    if (opts) {
      for (key in opts) {
        if (opts.hasOwnProperty(key)) {
          result[key] = opts[key];
        }
      }
    }

    return result;
  };

  // create the points array
  this.points = init(points, pathlen / this.segments);

  // somtimes we fall a rounding-error short of adding the last point,
  // so add it if so
  if (this.points.length === this.segments) {
    this.points[this.points.length] = points[points.length - 1];
  }

  // rotate the points
  rotate(this.points, -indicativeAngle(this.points));

  // scale the points
  scale(this.points, this.squareSize);

  // translate
  translate(this.points, this.origin);

  // vectorize
  this.vector = vectorize(this.points);
}

module.exports = Stroke;

/**
  ### Stroke internal helpers
**/

/**
  #### init(points)
**/
function init(points, interval) {
  var output = [points[0]];
  var accumulatedDist = 0;

  // copy from the 1d source array into a 2d array
  // and resample as per the original implementation
  for (var ii = 1, len = points.length; ii < len; ii++) {
    var x1 = points[ii - 1][0];
    var y1 = points[ii - 1][1];
    var x2 = points[ii][0];
    var y2 = points[ii][1];
    var dist = distance(x1, y1, x2, y2);

    // if the accumlated distance is greater than the interval length
    if (accumulatedDist + dist > interval) {
      var qx = x1 + ((interval - accumulatedDist) / dist) * (x2 - x1);
      var qy = y1 + ((interval - accumulatedDist) / dist) * (y2 - y1);
      var q = [qx, qy];

      // add the next point
      output[output.length] = q;
      points.splice(ii, 0, q); // insert 'q' at position i in points s.t. 'q' will be the next i

      // reset the accumulated dist
      accumulatedDist = 0;
    }
    else {
      accumulatedDist += dist;
    }
  }

  return output;
}

/**
  #### calcBounds(points)
**/
function calcBounds(points) {
  var minX = Infinity;
  var maxX = -Infinity;
  var minY = Infinity;
  var maxY = -Infinity;

  // iterate through the points and determine
  for (var ii = 0, count = points.length; ii < count; ii++) {
    var x = points[ii][0];
    var y = points[ii][1];

    if (x < minX) minX = x;
    if (x > maxX) maxX = x;
    if (y < minY) minY = y;
    if (y > maxY) maxY = y;
  }

  return {
    x:      minX,
    y:      minY,
    width:  maxX - minX,
    height: maxY - minY
  };
}

/**
  #### centroid(points)

  Calculate the center point in the array of points
**/
function centroid(points) {
  var x = 0;
  var y = 0;
  var count = points.length;

  for (var ii = 0; ii < count; ii++) {
    x += points[ii][0];
    y += points[ii][1];
  }

  return [x / count, y / count];
}

/**
  #### distance(x1, y1, x2, y2)
**/
function distance(x1, y1, x2, y2) {
  var dx = x2 - x1;
  var dy = y2 - y1;

  // TODO: look at memoizing the result
  return Math.sqrt(dx * dx + dy * dy);
}

/**
  #### indicativeAngle(points)
**/
function indicativeAngle(points) {
  var c = centroid(points);

  return Math.atan2(c[1] - points[0][1], c[0] - points[0][0]);
}

/**
  #### rotate(points, angle)
**/
function rotate(points, angle) {
  var c = centroid(points);
  var cx = c[0];
  var cy = c[1];
  var cos = Math.cos(angle);
  var sin = Math.sin(angle);

  // update the points
  for (var ii = 0, count = points.length; ii < count; ii++) {
    var dx = points[ii][0] - cx;
    var dy = points[ii][1] - cy;

    points[ii] = [
      dx * cos - dy * sin + cx,
      dx * sin + dy * cos + cy
    ];
  }
}

/**
  #### scale(points, size)

  Scale the referenced array by the specified size.
**/
function scale(points, size) {
  // calculate the bounds
  var bounds = calcBounds(points);
  var scaleX = size / bounds.width;
  var scaleY = size / bounds.height;

  // update the points
  for (var ii = 0, count = points.length; ii < count; ii++) {
    points[ii] = [
      points[ii][0] * scaleX,
      points[ii][1] * scaleY
    ];
  }
}

/**
  #### translate(points, target)
**/
function translate(points, target) {
  var c = centroid(points);

  // iterate through the points and
  for (var ii = 0, count = points.length; ii < count; ii++) {
    points[ii] = [
      points[ii][0] + target[0] - c[0],
      points[ii][1] + target[1] - c[1]
    ];
  }
}

/**
  #### vectorize(points)

**/
function vectorize(points) {
  var sum = 0;
  var vector = [];
  var ii;
  var count;
  var magnitude;

  // calculate the sum
  for (ii = 0, count = points.length; ii < count; ii++) {
    var x = vector[vector.length] = points[ii][0];
    var y = vector[vector.length] = points[ii][1];

    sum += x * x + y * y;
  }

  // calculate the magnitude of the vector
  magnitude = Math.sqrt(sum);

  // adjust the vector by the magnitude
  for (ii = vector.length; ii--; ) {
    vector[ii] /= magnitude;
  }

  return vector;
}

function deg2rad(d) { return (d * Math.PI / 180.0); }
function rad2deg(r) { return (r * 180.0 / Math.PI); }
