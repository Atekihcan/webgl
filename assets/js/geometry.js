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

/* function for getting sphere vertex data */
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