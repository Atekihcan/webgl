"use strict";

/* global variables */
var gl, currentProgram, programs = [];
var points = [];
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

    //  Configure WebGL context
    gl.viewport(0, 0, canvas.width, canvas.height);
    gl.clearColor(1.0, 1.0, 1.0, 1.0);

    // compile shaders and get the program object
    programs.push(getProgram(gl, shaderSources[0], shaderSources[1]));
};

/* declare vertex data and upload it to GPU */
function prepareVertexData() {
    // declare vertex data
    var vertices = [vec2(-1, -1), vec2(0, 1), vec2(1, -1)];
    divideTriangle(vertices[0], vertices[1], vertices[2], 5);

    // load data into GPU and associate shader variables with vertex data
    // vertex positions
    gl.useProgram(currentProgram);
    var posBuf = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, posBuf);
    gl.bufferData(gl.ARRAY_BUFFER, flatten(points), gl.STATIC_DRAW);
    var vPos = gl.getAttribLocation(currentProgram, "vPos");
    gl.vertexAttribPointer(vPos, points[0].length, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(vPos);
}

// initialize application
window.onload = function init()
{
    asyncLoadShaders("triangle", shaders, initWebGL);
    currentProgram = programs[0];
    prepareVertexData();
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