"use strict";

/* global variables */
var gl;
var points = [];
var vShaderSource, fShaderSource;

/* function for initializing WebGL context */
function initWebGL(vString, fString) {
    vShaderSource = vString;
    fShaderSource = fString;
    var canvas = document.getElementById("gl-canvas");

    gl = WebGLUtils.setupWebGL( canvas );
    if (!gl) {
        alert("[ERROR] WebGL isn't available");
        return;
    }

    //  Configure WebGL context
    gl.viewport(0, 0, canvas.width, canvas.height);
    gl.clearColor(1.0, 1.0, 1.0, 1.0);
};

// initialize application
window.onload = function init()
{
    asyncLoadShaders("triangle", initWebGL);

    // declare vertex data
    //var vertices = new Float32Array([-1, -1, 0, 1, 1, -1]);
    var vertices = [vec2(-1, -1), vec2(0, 1), vec2(1, -1)];
    divideTriangle(vertices[0], vertices[1], vertices[2], 5);

    // compile shaders and get the program object
    var program = getProgram(gl, vShaderSource, fShaderSource);
    if (program === null) {
        alert("[ERROR] Program object is null. Exiting...");
        return;
    }
    gl.useProgram(program);

    // load the data into the GPU
    var bufferId = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, bufferId);
    gl.bufferData(gl.ARRAY_BUFFER, flatten(points), gl.STATIC_DRAW);

    // associate shader variables with vertex data
    var vPosition = gl.getAttribLocation(program, "vPosition");
    gl.vertexAttribPointer(vPosition, 2, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(vPosition);

    // render the frame
    render();
};

/* function for rendering the frame */
function render() {
    gl.clear(gl.COLOR_BUFFER_BIT);
    gl.drawArrays(gl.TRIANGLES, 0, points.length);
}

/* utility functions */
function divideTriangle(a, b, c, iterCount)
{
    if (iterCount === 0) {
        points.push(a, b, c);
    } else {
        var ab = mix(a, b, 0.5);
        var bc = mix(b, c, 0.5);
        var ac = mix(a, c, 0.5);
        divideTriangle(a, ab, ac, iterCount - 1);
        divideTriangle(b, bc, ab, iterCount - 1);
        divideTriangle(c, ac, bc, iterCount - 1);
    }
}