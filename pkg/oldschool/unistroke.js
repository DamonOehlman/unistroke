(function (glob) {
  /**
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
   * PURPOSE ARE DISCLAIMED. IN NO EVENT SHALL Jacob O. Wobbrock OR Andrew D. Wilson
   * OR Yang Li BE LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, 
   * OR CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF 
   * SUBSTITUTE GOODS OR SERVICES; LOSS OF USE, DATA, OR PROFITS; OR BUSINESS 
   * INTERRUPTION) HOWEVER CAUSED AND ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, 
   * STRICT LIABILITY, OR TORT (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY
   * OUT OF THE USE OF THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
  **/
  var templates = [];
  
  function Stroke(points, opts) {
      var pathlen = 0, 
          ii, 
          count1d = points.length,
          accumulatedDist = 0;
      
      // ensure we have options
      opts = opts || {};
      
      // calculate the path length
      for (ii = 2; ii < count1d; ii += 2) {
          pathlen += distance(points[ii - 2], points[ii - 1], points[ii], points[ii + 1]);
      }
      
      // initialise members
      this.segments = opts.segments || 63;
      this.name = opts.name;
      this.squareSize = opts.squareSize || 250;
      this.origin = opts.origin || [0, 0];
      
      // calculated properties
      this.diagonal = Math.sqrt(this.squareSize * this.squareSize + this.squareSize * this.squareSize);
      this.halfDiag = this.diagonal * 0.5;
      this.angleRange = deg2rad(45);
      this.anglePrecision = deg2rad(2);
      this.phi = 0.5 * (-1.0 + Math.sqrt(5)); // Golden Ratio
      
      // calculate the interval length
      this.interval = pathlen / this.segments;
      
      // create the points array
      this.points = [[points[0], points[1]]];
      
      // vectorize
      this.vector = vectorize(points);
      
      // copy from the 1d source array into a 2d array
      // and resample as per the original implementation
      for (ii = 2; ii < count1d; ii += 2) {
          var x1 = points[ii - 2], y1 = points[ii - 1],
              x2 = points[ii],     y2 = points[ii + 1],
              dist = distance(x1, y1, x2, y2);
          
          // if the accumlated distance is greater than the interval length
          if (accumulatedDist + dist > this.interval) {
              var qx = x1 + ((this.interval - accumulatedDist) / dist) * (x2 - x1),
                  qy = y1 + ((this.interval - accumulatedDist) / dist) * (y2 - y1);
                  
              // add the next point
              this.points[this.points.length] = [qx, qy];
              
              // points.splice(i, 0, q); // insert 'q' at position i in points s.t. 'q' will be the next i
              // reset the accumulated dist
              accumulatedDist = 0;
          }
          else {
              accumulatedDist += dist;
          }
      }
      
      // somtimes we fall a rounding-error short of adding the last point, so add it if so
      if (this.points.length === this.segments) {
          this.points[this.points.length] = points.slice(-2);
      }
      
      // rotate the points
      rotatePoints(this.points, -indicativeAngle(this.points));
      
      // scale the points
      scalePoints(this.points, this.squareSize);
  }
  
  function get(name) {
      // iterate through the templates and find the best match
      for (var ii = templates.length; ii--; ) {
          if (templates[ii].name === name) {
              return templates[ii];
          }
      }
  }
  
  function match(stroke) {
      // create a new stroke from the points
      var best = Infinity,
          selected = 0, d;
      
      // compare the with the registered templates
      for (var ii = templates.length; stroke && ii--; ) {
          var diff = optimalCosineDistance(templates[ii].vector, stroke.vector);
          
          // if this is a better match then the current match, then update the best template index
          if (diff < best) {
              best = diff;
              selected = ii;
          }
      }
      
      // return the best result
      return {
          stroke: templates[selected],
          score:  1 / best
      };
  }
  
  function unistroke(points) {
      return match(new Stroke(points));
  }
  
  // expose the defined templates
  unistroke.templates = templates;
  unistroke.match = match;
  unistroke.get = get;
  
  // define a template
  unistroke.define = function(name, points) {
      var template = templates[templates.length] = new Stroke(points, {
          name: name
      });
      
      return template;
  };
  
  function calcBounds(points) {
      var minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
      
      // iterate through the points and determine 
      for (var ii = 0, count = points.length; ii < count; ii++) {
          var x = points[ii][0],
              y = points[ii][1];
              
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
  
  function centroid(points) {
      var x = 0, y = 0, count = points.length;
      
      for (var ii = 0; ii < count; ii++) {
          x += points[ii][0];
          y += points[ii][1];
      }
      
      return [x / count, y / count];
  }
  
  function distance(x1, y1, x2, y2) {
      var dx = x2 - x1,
          dy = y2 - y1;
  
      // TODO: look at memoizing the result
      return Math.sqrt(dx * dx + dy * dy);
  }
  
  function indicativeAngle(points) {
      var c = centroid(points);
      
      return Math.atan2(c[1] - points[0][1], c[0] - points[0][0]);
  }
  
  function optimalCosineDistance(v1, v2) {
      var a = 0, b = 0, angle;
      
      for (var ii = 0, count = Math.min(v1.length, v2.length); ii < count; ii += 2) {
          a += v1[ii] * v2[ii] + v1[ii + 1] * v2[ii + 1];
          b += v1[ii] * v2[ii + 1] - v1[ii + 1] * v2[ii];
      }
      
      angle = Math.atan(b / a);
      return b !== 0 ? Math.acos(a * Math.cos(angle) + b * Math.sin(angle)) : 0;
  }
  
  function rotatePoints(points, angle, createNew) {
      var c = centroid(points),
          cx = c[0],
          cy = c[1],
          cos = Math.cos(angle),
          sin = Math.sin(angle);
      
      if (createNew) {
          points = [].concat(points);
      }
      
      // update the points
      for (var ii = 0, count = points.length; ii < count; ii++) {
          var dx = points[ii][0] - cx, 
              dy = points[ii][1] - cy;
          
          points[ii] = [
              dx * cos - dy * sin + cx,
              dx * sin + dy * cos + cy
          ];
      }
      
      return points;
  }
  
  function scalePoints(points, size, createNew) {
      // calculate the bounds
      var bounds = calcBounds(points),
          scaleX = size / bounds.width,
          scaleY = size / bounds.height;
      
      if (createNew) {
          points = [].concat(points);
      }
      
      // update the points
      for (var ii = 0, count = points.length; ii < count; ii++) {
          points[ii] = [
              points[ii][0] * scaleX,
              points[ii][1] * scaleY
          ];
      }
      
      return points;
  }
  
  function translatePoints(points, target, createNew) {
      var c = centroid(points);
      
      if (createNew) {
          points = [].concat(points);
      }
      
      // iterate through the points and 
      for (var ii = 0, count = points.length; ii < count; ii++) {
          points[ii] = [
              points[ii][0] + target[0] - c[0],
              points[ii][1] + target[1] - c[1]
          ];
      }
      
      return points;
  }
  
  function vectorize(points) {
      var sum = 0,
          vector = [].concat(points),
          ii, magnitude;
          
      // calculate the sum
      for (ii = vector.length; ii--; ) {
          sum += vector[ii] * vector[ii];
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
  
  unistroke.define('left-square-bracket', [
      140, 124,
      138, 123,
      135, 122,
      133, 123,
      130, 123,
      128, 124,
      125, 125,
      122, 124,
      120, 124,
      118, 124,
      116, 125,
      113, 125,
      111, 125,
      108, 124,
      106, 125,
      104, 125,
      102, 124,
      100, 123,
       98, 123,
       95, 124,
       93, 123,
       90, 124,
       88, 124,
       85, 125,
       83, 126,
       81, 127,
       81, 129,
       82, 131,
       82, 134,
       83, 138,
       84, 141,
       84, 144,
       85, 148,
       85, 151,
       86, 156,
       86, 160,
       86, 164,
       86, 168,
       87, 171,
       87, 175,
       87, 179,
       87, 182,
       87, 186,
       88, 188,
       88, 195,
       88, 198,
       88, 201,
       88, 207,
       89, 211,
       89, 213,
       89, 217,
       89, 222,
       88, 225,
       88, 229,
       88, 231,
       88, 233,
       88, 235,
       89, 237,
       89, 240,
       89, 242,
       91, 241,
       94, 241,
       96, 240,
       98, 239,
      105, 240,
      109, 240,
      113, 239,
      116, 240,
      121, 239,
      130, 240,
      136, 237,
      139, 237,
      144, 238,
      151, 237,
      157, 236,
      159, 237
  ]);
  unistroke.define('right-square-bracket', [
      112, 138,
      112, 136,
      115, 136,
      118, 137,
      120, 136,
      123, 136,
      125, 136,
      128, 136,
      131, 136,
      134, 135,
      137, 135,
      140, 134,
      143, 133,
      145, 132,
      147, 132,
      149, 132,
      152, 132,
      153, 134,
      154, 137,
      155, 141,
      156, 144,
      157, 152,
      158, 161,
      160, 170,
      162, 182,
      164, 192,
      166, 200,
      167, 209,
      168, 214,
      168, 216,
      169, 221,
      169, 223,
      169, 228,
      169, 231,
      166, 233,
      164, 234,
      161, 235,
      155, 236,
      147, 235,
      140, 233,
      131, 233,
      124, 233,
      117, 235,
      114, 238,
      112, 238
  ]);
  unistroke.define('triangle', [
      137, 139,
      135, 141,
      133, 144,
      132, 146,
      130, 149,
      128, 151,
      126, 155,
      123, 160,
      120, 166,
      116, 171,
      112, 177,
      107, 183,
      102, 188,
      100, 191,
       95, 195,
       90, 199,
       86, 203,
       82, 206,
       80, 209,
       75, 213,
       73, 213,
       70, 216,
       67, 219,
       64, 221,
       61, 223,
       60, 225,
       62, 226,
       65, 225,
       67, 226,
       74, 226,
       77, 227,
       85, 229,
       91, 230,
       99, 231,
      108, 232,
      116, 233,
      125, 233,
      134, 234,
      145, 233,
      153, 232,
      160, 233,
      170, 234,
      177, 235,
      179, 236,
      186, 237,
      193, 238,
      198, 239,
      200, 237,
      202, 239,
      204, 238,
      206, 234,
      205, 230,
      202, 222,
      197, 216,
      192, 207,
      186, 198,
      179, 189,
      174, 183,
      170, 178,
      164, 171,
      161, 168,
      154, 160,
      148, 155,
      143, 150,
      138, 148,
      136, 148
  ]);
  unistroke.define('x', [
       87, 142,
       89, 145,
       91, 148,
       93, 151,
       96, 155,
       98, 157,
      100, 160,
      102, 162,
      106, 167,
      108, 169,
      110, 171,
      115, 177,
      119, 183,
      123, 189,
      127, 193,
      129, 196,
      133, 200,
      137, 206,
      140, 209,
      143, 212,
      146, 215,
      151, 220,
      153, 222,
      155, 223,
      157, 225,
      158, 223,
      157, 218,
      155, 211,
      154, 208,
      152, 200,
      150, 189,
      148, 179,
      147, 170,
      147, 158,
      147, 148,
      147, 141,
      147, 136,
      144, 135,
      142, 137,
      140, 139,
      135, 145,
      131, 152,
      124, 163,
      116, 177,
      108, 191,
      100, 206,
       94, 217,
       91, 222,
       89, 225,
       87, 226,
       87, 224
  ]);
  
  glob.unistroke = unistroke;
  
})(this);