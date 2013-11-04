# Unistroke

This is a port of the [
Washington $1 Unistroke Recognizer
](http://depts.washington.edu/aimgroup/proj/dollar/index.html) to generally make it a little
more Javascripty and potentially optimize the code in a few places.


[![NPM](https://nodei.co/npm/unistroke.png)](https://nodei.co/npm/unistroke/)

[![Build Status](https://travis-ci.org/DamonOehlman/unistroke.png?branch=master)](https://travis-ci.org/DamonOehlman/unistroke)

[![browser support](https://ci.testling.com/DamonOehlman/unistroke.png)](https://ci.testling.com/DamonOehlman/unistroke)


## Example Usage

```
ERROR: could not find: 
```

## Reference

### unistroke(input, opts?)

Create a stroke based on the input points and then match it against
the templates that have been registered previously.

### unistroke.define(template)

Register a new stroke template with unistroke.

### Stroke(points, opts)

Register a new stroke using the input `points` and the specified `opts`.

### Stroke internal helpers

#### init(points)

#### calcBounds(points)

#### centroid(points)

Calculate the center point in the array of points

#### distance(x1, y1, x2, y2)

#### indicativeAngle(points)

#### rotate(points, angle)

#### scale(points, size)

Scale the referenced array by the specified size.

#### translate(points, target)

#### vectorize(points)

## License(s)

### BSD-2-Clause

Copyright (c) 2013, Damon Oehlman <damon.oehlman@gmail.com>
All rights reserved.

Redistribution and use in source and binary forms, with or without modification, are permitted provided that the following conditions are met:

Redistributions of source code must retain the above copyright notice, this list of conditions and the following disclaimer.
Redistributions in binary form must reproduce the above copyright notice, this list of conditions and the following disclaimer in the documentation and/or other materials provided with the distribution.
THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS" AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT HOLDER OR CONTRIBUTORS BE LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES; LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
