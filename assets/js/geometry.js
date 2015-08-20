/***************************************************
 *           primitive vertex positions            *
 ***************************************************/
/* cube vertex positions */
var cubeVert = [
    /* front face */
    [-1.0, -1.0, +1.0],
    [+1.0, -1.0, +1.0],
    [+1.0, +1.0, +1.0],
    [-1.0, +1.0, +1.0],
    /* back face */
    [-1.0, -1.0, -1.0],
    [+1.0, -1.0, -1.0],
    [+1.0, +1.0, -1.0],
    [-1.0, +1.0, -1.0],
];

/* sphere data generator */
var X = 0.525731112119133606;
var Z = 0.850650808352039932;

var icosahedronVert = [    
    [-X, 0.0, Z], [X, 0.0, Z], [-X, 0.0, -Z], [X, 0.0, -Z],    
    [0.0, Z, X], [0.0, Z, -X], [0.0, -Z, X], [0.0, -Z, -X],    
    [Z, X, 0.0], [-Z, X, 0.0], [Z, -X, 0.0], [-Z, -X, 0.0] 
];

var icosahedronIndx = [ 
    [0,4,1], [0,9,4], [9,5,4], [4,5,8], [4,8,1],    
    [8,10,1], [8,3,10], [5,3,8], [5,2,3], [2,7,3],    
    [7,10,3], [7,6,10], [7,11,6], [11,0,6], [0,1,6], 
    [6,1,10], [9,0,11], [9,11,2], [9,2,5], [7,2,11]
];

function drawtri(a, b, c, numDivision, r) {
    if (numDivision <= 0) {
        pointsArray.push(scaleBy(a, r));
        pointsArray.push(a);
        pointsArray.push(scaleBy(b, r));
        pointsArray.push(b);
        pointsArray.push(scaleBy(c, r));
        pointsArray.push(c);
    } else {
        var ab = mix(a, b, 0.5);
        var ac = mix(a, c, 0.5);
        var bc = mix(b, c, 0.5);
        
        normalize(ab);
        normalize(ac);
        normalize(bc);
        drawtri(a, ab, ac, numDivision - 1, r);
        drawtri(b, bc, ab, numDivision - 1, r);
        drawtri(c, ac, bc, numDivision - 1, r);
        drawtri(ab, bc, ac, numDivision - 1, r);
    }  
}

function drawSphere(numDivision, radius) {
    for (var i = 0; i < 20; i++) {
        drawtri(icosahedronVert[icosahedronIndx[i][0]], 
                icosahedronVert[icosahedronIndx[i][1]], 
                icosahedronVert[icosahedronIndx[i][2]], 
                numDivision , radius);
    }
}

/***************************************************
 *         functions to create vertex data         *
 ***************************************************/
/* axis vertex data */
function getAxesVertexData(index, start, end) {
    var posEnd = [0.0, 0.0, 0.0];
    posEnd[index - 1] = end;

    var pointsArray = [];

    // positive axis - solid
    pointsArray.push([0.0, 0.0, 0.0]);
    pointsArray.push([0.0, 0.0, 0.0]);
    pointsArray.push(posEnd);
    pointsArray.push([0.0, 0.0, 0.0]);
    // negative axis - dotted
    for (var i = 0; i < 100; i++) {
        var negEnd = [0.0, 0.0, 0.0];
        negEnd[index - 1] = i * start / 100;
        pointsArray.push(negEnd);
        pointsArray.push([0.0, 0.0, 0.0]);
    }
    return pointsArray;
}

/* grid vertex data */
function getGridVertexData(plane, start, end, divs) {
    var pointsArray = [];
    var a = [parseInt(start[0] * divs), parseInt(start[1] * divs)],
        b = [parseInt(end[0] * divs), parseInt(end[1] * divs)],
        axis_1, axis_2;
    
    if (plane[0]) {
        axis_1 = 0;
        if (plane[1]) {
            axis_2 = 1;
        } else {
            axis_2 = 2;
        }
    } else {
        axis_1 = 1;
        axis_2 = 2;
    }
    
    for (var i = a[0]; i <= b[0]; i++) {
        var tmp_1 = [0.0, 0.0, 0.0];
        tmp_1[axis_1] = i / divs;
        tmp_1[axis_2] = start[1];
        pointsArray.push(tmp_1);
        pointsArray.push([0.0, 0.0, 0.0]);
        var tmp_2 = [0.0, 0.0, 0.0];
        tmp_2[axis_1] = i / divs;
        tmp_2[axis_2] = end[1];
        pointsArray.push(tmp_2);
        pointsArray.push([0.0, 0.0, 0.0]);
    }
    for (var i = a[1]; i <= b[1]; i++) {
        var tmp_1 = [0.0, 0.0, 0.0];
        tmp_1[axis_1] = start[0];
        tmp_1[axis_2] = i / divs;
        pointsArray.push(tmp_1);
        pointsArray.push([0.0, 0.0, 0.0]);
        var tmp_2 = [0.0, 0.0, 0.0];
        tmp_2[axis_1] = end[0];
        tmp_2[axis_2] = i / divs;
        pointsArray.push(tmp_2);
        pointsArray.push([0.0, 0.0, 0.0]);
    }
    return pointsArray;
}

/* plane vertex data */
function getPlaneVertexData(plane, start, end) {
    var pointsArray = [];
    var axis_1, axis_2;
    
    if (plane[0]) {
        axis_1 = 0;
        if (plane[1]) {
            axis_2 = 1;
        } else {
            axis_2 = 2;
        }
    } else {
        axis_1 = 1;
        axis_2 = 2;
    }

    var tmp_1 = [0.0, 0.0, 0.0],
        tmp_2 = [0.0, 0.0, 0.0],
        tmp_3 = [0.0, 0.0, 0.0],
        tmp_4 = [0.0, 0.0, 0.0];

    tmp_1[axis_1] = start[0];
    tmp_1[axis_2] = start[1];
    pointsArray.push(tmp_1);
    pointsArray.push([0.0, 0.0, 0.0]);
    tmp_2[axis_1] = start[0];
    tmp_2[axis_2] = end[1];
    pointsArray.push(tmp_2);
    pointsArray.push([0.0, 0.0, 0.0]);
    tmp_3[axis_1] = end[0];
    tmp_3[axis_2] = end[1];
    pointsArray.push(tmp_3);
    pointsArray.push([0.0, 0.0, 0.0]);
    pointsArray.push(tmp_1);
    pointsArray.push([0.0, 0.0, 0.0]);
    pointsArray.push(tmp_3);
    pointsArray.push([0.0, 0.0, 0.0]);
    tmp_4[axis_1] = end[0];
    tmp_4[axis_2] = start[1];
    pointsArray.push(tmp_4);
    pointsArray.push([0.0, 0.0, 0.0]);

    return pointsArray;
}

/* function for getting cube vertex data */
function getCubeVertexData() {
    return [
        // front
        cubeVert[0], [0.0,  0.0,  1.0], cubeVert[1], [0.0,  0.0,  1.0], cubeVert[2], [0.0,  0.0,  1.0],
        cubeVert[0], [0.0,  0.0,  1.0], cubeVert[2], [0.0,  0.0,  1.0], cubeVert[3], [0.0,  0.0,  1.0],
        // back
        cubeVert[4], [0.0,  0.0, -1.0], cubeVert[5], [0.0,  0.0, -1.0], cubeVert[6], [0.0,  0.0, -1.0],
        cubeVert[4], [0.0,  0.0, -1.0], cubeVert[6], [0.0,  0.0, -1.0], cubeVert[7], [0.0,  0.0, -1.0],
        // left
        cubeVert[0], [-1.0,  0.0,  0.0], cubeVert[4], [-1.0,  0.0,  0.0], cubeVert[7], [-1.0,  0.0,  0.0],
        cubeVert[0], [-1.0,  0.0,  0.0], cubeVert[7], [-1.0,  0.0,  0.0], cubeVert[3], [-1.0,  0.0,  0.0],
        // right
        cubeVert[1], [1.0,  0.0,  0.0], cubeVert[5], [1.0,  0.0,  0.0], cubeVert[6], [1.0,  0.0,  0.0],
        cubeVert[1], [1.0,  0.0,  0.0], cubeVert[6], [1.0,  0.0,  0.0], cubeVert[2], [1.0,  0.0,  0.0],
        // top
        cubeVert[2], [0.0,  1.0,  0.0], cubeVert[6], [0.0,  1.0,  0.0], cubeVert[7], [0.0,  1.0,  0.0],
        cubeVert[2], [0.0,  1.0,  0.0], cubeVert[7], [0.0,  1.0,  0.0], cubeVert[3], [0.0,  1.0,  0.0],
        // bottom
        cubeVert[1], [0.0, -1.0,  0.0], cubeVert[5], [0.0, -1.0,  0.0], cubeVert[4], [0.0, -1.0,  0.0],
        cubeVert[1], [0.0, -1.0,  0.0], cubeVert[4], [0.0, -1.0,  0.0], cubeVert[0], [0.0, -1.0,  0.0]
    ];
}

/* function for getting sphere vertex data */
function getSphereVertexData() {
    pointsArray = [];
    drawSphere(3, 1.0);
    return pointsArray;
}

/* function for getting cylinder vertex data */
function getCylinderVertexData() {
    pointsArray = [];
    var n = 50;
    var v_front = createPolygonFan([0.0, 0.0, +1.0], 1.0, n);
    var v_back  = createPolygonFan([0.0, 0.0, -1.0], 1.0, n);
    // front face
    for (var i = 1; i <= n; i++) {
        pointsArray.push(v_front[0]);
        pointsArray.push([0.0, 0.0, +1.0]);
        pointsArray.push(v_front[i]);
        pointsArray.push([0.0, 0.0, +1.0]);
        pointsArray.push(v_front[i + 1]);
        pointsArray.push([0.0, 0.0, +1.0]);
    }

    // body
    for (var i = 1; i <= n; i++) {
        // triangle strip 1
        pointsArray.push(v_front[i]);
        pointsArray.push(v_front[i]);
        pointsArray.push(v_back[i]);
        pointsArray.push(v_back[i]);
        pointsArray.push(v_front[i + 1]);
        pointsArray.push(v_front[i + 1]);
        // triangle strip 2
        pointsArray.push(v_front[i + 1]);
        pointsArray.push(v_front[i + 1]);
        pointsArray.push(v_back[i]);
        pointsArray.push(v_back[i]);
        pointsArray.push(v_back[i + 1]);
        pointsArray.push(v_back[i + 1]);
    }

    // back face
    for (var i = 1; i <= n; i++) {
        pointsArray.push(v_back[0]);
        pointsArray.push([0.0, 0.0, -1.0]);
        pointsArray.push(v_back[i]);
        pointsArray.push([0.0, 0.0, -1.0]);
        pointsArray.push(v_back[i + 1]);
        pointsArray.push([0.0, 0.0, -1.0]);
    }
    return pointsArray;
}

/* function for getting cone vertex data */
function getConeVertexData() {
    pointsArray = [];
    var n = 50;
    var tip = [0.0, 0.0, +1.0];
    var v_base = createPolygonFan([0.0, 0.0, -1.0], 1.0, n);
    // base
    for (var i = 1; i <= n; i++) {
        pointsArray.push(v_base[0]);
        pointsArray.push([0.0, 0.0, -1.0]);
        pointsArray.push(v_base[i]);
        pointsArray.push([0.0, 0.0, -1.0]);
        pointsArray.push(v_base[i + 1]);
        pointsArray.push([0.0, 0.0, -1.0]);
    }

    // body
    for (var i = 1; i <= n; i++) {
        // triangle strip 1
        var normal = getSurfaceNormal(tip, v_base[i], v_base[i + 1]);
        pointsArray.push(tip);
        pointsArray.push(normal);
        pointsArray.push(v_base[i]);
        pointsArray.push(normal);
        pointsArray.push(v_base[i + 1]);
        pointsArray.push(normal);
    }
    return pointsArray;
}


/***************************************************
 *         geometry utility functions              *
 ***************************************************/
/* create n-sided polygon to be used with TRIANGLE_FAN */
function createPolygonFan(center, radius, numPoints, normal) {
    var v = [];
    var withZ = false;
    var pushNormals = false;
    if (center.length == 3) {
        withZ = true;
    }
    if (typeof normal != 'undefined') {
        pushNormals = true;
    }

    v.push(center);
    if (pushNormals) {
        v.push(normal);
    }
    for (var i = 0; i <= numPoints; i++) {
        if (withZ) {
            v.push([center[0] + radius * Math.sin(i * 2 * Math.PI / numPoints), center[1] + radius * Math.cos(i * 2 * Math.PI / numPoints), center[2]]);
            if (pushNormals) {
                v.push(normal);
            }
        } else {
            v.push([center[0] + radius * Math.sin(i * 2 * Math.PI / numPoints), center[1] + radius * Math.cos(i * 2 * Math.PI / numPoints)]);
            if (pushNormals) {
                v.push(normal);
            }
        }
    }
    return v;
}

/* calculate surface normal for a triangle strip */
function getSurfaceNormal(a, b, c) {
    return normalize(cross(subtract(c, a), subtract(b, a)));
}