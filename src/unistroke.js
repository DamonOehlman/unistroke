//= includes/header
var strokes = [];

function Stroke(points, opts) {
    var pathlen = 0, 
        ii, 
        count1d = points.length,
        segmentCount = count1d/2 - 1,
        accumulatedDist = 0;
    
    // ensure we have options
    opts = opts || {};
    
    // calculate the path length
    for (ii = 2; ii < count1d; ii += 2) {
        pathlen += distance(points[ii - 2], points[ii - 1], points[ii], points[ii + 1]);
    }
    
    // initialise members
    this.name = opts.name;
    this.squareSize = opts.squareSize || 250;
    this.origin = opts.origin || [0, 0];
    
    // calculate the interval length
    this.interval = pathlen / segmentCount;
    
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
    if (this.points.length === segmentCount) {
        this.points[this.points.length] = points.slice(-2);
    }
    
    // rotate the points
    rotatePoints(this.points, -indicativeAngle(this.points));
    
    // scale the points
    scalePoints(this.points, this.squareSize);
    
    console.log(this);
}

function unistroke() {
}

// expose the defined strokes
unistroke.strokes = strokes;

// define a template
unistroke.define = function(name, points) {
    var stroke = strokes[strokes.length] = new Stroke(points, {
        name: name
    });
    
    return stroke;
};

function calcBounds(points) {
    var minX = +Infinity, maxX = -Infinity, minY = +Infinity, maxY = -Infinity;
    
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

function pathdist() {
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

//= templates