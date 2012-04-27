//= includes/header
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

//= templates