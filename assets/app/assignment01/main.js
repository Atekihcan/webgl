"use strict";

/* global variables */
var gl, currentProgram, program = [];
var posBuf, colBuf;
var pos = [], col = [], vertices = [];
var numDivision = 4;
var polygonSides = 3;
var stopRender = false;
var drawWireFrame = true;
var theta = Math.PI, twist = 1;
var thetaLocation, twistLocation;
var shaders = ["shader.vert", "shader.frag"]

/***************************************************
 *              WebGL context functions            *
 ***************************************************/
/* initialize WebGL context */
function initWebGL(shaderSources) {
    var canvas = document.getElementById("gl-canvas");

    gl = WebGLUtils.setupWebGL( canvas );
    if (!gl) {
        alert("[ERROR] WebGL isn't available");
        return;
    }
    // initialize WebGL context
    posBuf = gl.createBuffer();
    colBuf = gl.createBuffer();
    gl.viewport(0, 0, canvas.width, canvas.height);
    gl.clearColor(1.0, 1.0, 1.0, 1.0);

    // compile shaders and get the program object
    programs.push(getProgram(gl, shaderSources[0], shaderSources[1]));
};

/* declare vertex data and upload it to GPU */
function prepareVertexData() {
    // declare vertex data
    vertices = createPolygon(0.8, polygonSides);
    if (vertices.length == 3) {
        divideTriangle(vertices[0], vertices[1], vertices[2], numDivision);
    } else {
        for (var i = 0; i < vertices.length; i++) {
            divideTriangle([0, 0], vertices[i], vertices[(i + 1) % vertices.length], numDivision);
        }
    }

    // load data into GPU and associate shader variables with vertex data
    // vertex positions
    gl.useProgram(currentProgram);
    gl.bindBuffer(gl.ARRAY_BUFFER, posBuf);
    gl.bufferData(gl.ARRAY_BUFFER, flatten(pos), gl.STATIC_DRAW);
    var vPos = gl.getAttribLocation(currentProgram, "vPos");
    gl.vertexAttribPointer(vPos, pos[0].length, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(vPos);
    // vertex colors
    gl.bindBuffer(gl.ARRAY_BUFFER, colBuf);
    gl.bufferData(gl.ARRAY_BUFFER, flatten(col), gl.STATIC_DRAW);
    var vCol = gl.getAttribLocation(currentProgram, "vCol");
    gl.vertexAttribPointer(vCol, col[0].length, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(vCol);
    // uniform variables for rotation and twist
    thetaLocation = gl.getUniformLocation(currentProgram, "theta");
    twistLocation = gl.getUniformLocation(currentProgram, "twist");
}

/* render a frames recursively */
function render() {
    if (!stopRender) {
        gl.clear(gl.COLOR_BUFFER_BIT);
        gl.uniform1f(thetaLocation, theta);
        gl.uniform1i(twistLocation, twist);
        if (drawWireFrame) {
            for (var i = 0; i < pos.length; i += 3) {
                gl.drawArrays(gl.LINE_LOOP, i, 3);
            }
        } else {
            gl.drawArrays(gl.TRIANGLES, 0, pos.length);
        }
        window.requestAnimFrame(render);
    }
}

/* start the application */
window.onload = function init()
{
    
    asyncLoadShaders("assignment01", shaders, initWebGL);
    currentProgram = programs[0];
    prepareVertexData();
    render();
};

/***************************************************
 *              utility functions                  *
 ***************************************************/
/* generate position and color of vertices for a triangle */
function triangle(a, b, c) {
    if (drawWireFrame) {
        var color = [0.2, 0.7, 0.89];
    } else {
        var color = [Math.random(), Math.random(), Math.random()];
    }

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
    col = [];
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

/* set base polygon type */
function setPolygon(numSides, id) {
    var names = ["Triangle", "Square", "Pentagon", "Hexagon", "Heptagon", "Octagon"];
    polygonSides = numSides;
    if (id) {
        document.getElementById(id).innerHTML = names[numSides - 3];
    }
    reInit();
}

/* enable/disable twist */
function setTwist(doTwist, id) {
    twist = doTwist;
    if (id) {
        if (doTwist) {
            document.getElementById(id).innerHTML = "enabled";
        } else {
            document.getElementById(id).innerHTML = "disabled";
        }
    }
}

/* set drawing type */
function setDrawType(doWire) {
    drawWireFrame = doWire;
    reInit();
}