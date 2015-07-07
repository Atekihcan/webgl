"use strict";

/* global variables */
var gl;
var pos = [], col = [];
var numDivision = 1;
var theta = 0.0, twist = 0;
var thetaLocation, twistLocation;
var vShaderSource, fShaderSource;

/***************************************************
 *              WebGL context functions            *
 ***************************************************/
/* initialize WebGL context */
function initWebGL(vString, fString) {
    vShaderSource = vString;
    fShaderSource = fString;
    var canvas = document.getElementById("gl-canvas");

    gl = WebGLUtils.setupWebGL( canvas );
    if (!gl) {
        alert("[ERROR] WebGL isn't available");
        return;
    }
    // initialize WebGL context
    gl.viewport(0, 0, canvas.width, canvas.height);
    gl.clearColor(1.0, 1.0, 1.0, 1.0);
};

/* declare vertex data and upload it to GPU */
function prepareVertexData() {
    // declare vertex data
    var vertices = createPolygon(0.8, 3);
    divideTriangle(vertices[0], vertices[1], vertices[2], numDivision);

    // compile shaders and get the program object
    var program = getProgram(gl, vShaderSource, fShaderSource);
    if (program === null) {
        return;
    }
    gl.useProgram(program);

    // load data into GPU and associate shader variables with vertex data
    // vertex positions
    var posBuf = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, posBuf);
    gl.bufferData(gl.ARRAY_BUFFER, flatten(pos), gl.STATIC_DRAW);
    var vPos = gl.getAttribLocation(program, "vPos");
    gl.vertexAttribPointer(vPos, pos[0].length, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(vPos);
    // vertex colors
    var colBuf = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, colBuf);
    gl.bufferData(gl.ARRAY_BUFFER, flatten(col), gl.STATIC_DRAW);
    var vCol = gl.getAttribLocation(program, "vCol");
    gl.vertexAttribPointer(vCol, col[0].length, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(vCol);
    // uniform variables for rotation and twist
    thetaLocation = gl.getUniformLocation(program, "theta");
    twistLocation = gl.getUniformLocation(program, "twist");
}

/* render a frames recursively */
function render() {
    gl.clear(gl.COLOR_BUFFER_BIT);
    gl.uniform1f(thetaLocation, theta);
    gl.uniform1i(twistLocation, twist);
    gl.drawArrays(gl.TRIANGLES, 0, pos.length);
    window.requestAnimFrame(render);
}

/* start the application */
window.onload = function init()
{
    asyncLoadShaders("assignment01", initWebGL);
    prepareVertexData();
    render();
};

/***************************************************
 *              utility functions                  *
 ***************************************************/
/* generate position and color of vertices for a triangle */
function triangle(a, b, c) {
    var color = [Math.random(), Math.random(), Math.random()];
    col.push(color, color, color);
    pos.push(a, b, c);
}

/* generate smaller sub-triangles recursively */
function divideTriangle(a, b, c, iterCount)
{
    if (iterCount > 0) {
        var ab = mix(a, b, 0.5);
        var bc = mix(b, c, 0.5);
        var ac = mix(a, c, 0.5);
        divideTriangle(a, ab, ac, iterCount - 1);
        divideTriangle(b, bc, ab, iterCount - 1);
        divideTriangle(c, ac, bc, iterCount - 1);
        divideTriangle(ab, bc, ac, iterCount - 1);
    } else {
        triangle(a, b, c);
    }
}

/* create n-sided polygon */
function createPolygon(radius, numPoints) {
    var i, nVert = [];
    for (i = 0; i < numPoints; i++) {
            nVert.push([radius * Math.sin(i * 2 * Math.PI / numPoints), radius * Math.cos(i * 2 * Math.PI / numPoints)]);
    }
    return nVert;
}

/* reinitialize vertex data */
function reInit() {
    pos = [];
    prepareVertexData();
}

/***************************************************
 *                    UI handlers                  *
 ***************************************************/
/* set rotation */
function setTheta(value, id) {
    theta = value * Math.PI / 180;
    if (id) {
        document.getElementById(id).innerHTML = value;
    }
}

/* set subdivision level */
function setSubdivisionLevel(value, id) {
    if (numDivision != value) {
        numDivision = value;
        if (id) {
            document.getElementById(id).innerHTML = value;
        }
        reInit();
    }
}

/* enable/disable twist */
function setTwist(flag) {
    twist = flag;
}