/***************************************************
 *           primitive vertex positions            *
 ***************************************************/
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

var sphereVert = [
    [+0.0,      +0.0,      -1.0,    ],
    [+0.0,      +0.942809, +0.333333],
    [-0.816497, -0.471405, +0.333333],
    [+0.816497, -0.471405, +0.333333],
];

var pointsArray = [];

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
    tetrahedron(sphereVert[0], sphereVert[1], sphereVert[2], sphereVert[3], 5);
    return pointsArray;
}

/***************************************************
 *         geometry utility functions              *
 ***************************************************/
function triangle(a, b, c) {
    pointsArray.push(a);
    pointsArray.push(a);
    pointsArray.push(b);
    pointsArray.push(b);
    pointsArray.push(c);
    pointsArray.push(c);
}

function divideTriangle(a, b, c, count) {
    if ( count > 0 ) {
        var ab = mix( a, b, 0.5);
        var ac = mix( a, c, 0.5);
        var bc = mix( b, c, 0.5);

        ab = normalize(ab, true);
        ac = normalize(ac, true);
        bc = normalize(bc, true);

        divideTriangle( a, ab, ac, count - 1 );
        divideTriangle( ab, b, bc, count - 1 );
        divideTriangle( bc, c, ac, count - 1 );
        divideTriangle( ab, bc, ac, count - 1 );
    }
    else {
        triangle( a, b, c );
    }
}

function tetrahedron(a, b, c, d, n) {
    divideTriangle(a, b, c, n);
    divideTriangle(d, c, b, n);
    divideTriangle(a, d, b, n);
    divideTriangle(a, c, d, n);
}