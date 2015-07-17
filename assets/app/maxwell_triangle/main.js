"use strict";

/* global variables */
var canvas, gl;
var currentProgram, programs = [];
var posBuf, colBuf, pos = [], col = [], vertices = [];
var fragShaderType = 0;
var shaders = ["shader.vert", "simple.frag", "interpol.frag", "luminance.frag"];

/***************************************************
 *              WebGL context functions            *
 ***************************************************/
/* initialize WebGL context */
function initWebGL(shaderSources) {
    canvas = document.getElementById("gl-canvas");

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
    programs.push(getProgram(gl, shaderSources[0], shaderSources[2]));
    programs.push(getProgram(gl, shaderSources[0], shaderSources[3]));
};

/* declare vertex data and upload it to GPU */
function prepareVertexData() {
    // declare vertex data
    pos = [vec2(1.0, -1.0), vec2(0.0, 1.0), vec2(-1.0, -1.0)];
    col = [vec3(1.0, 0.0, 0.0), vec3(0.0, 1.0, 0.0), vec3(0.0, 0.0, 1.0)];

    // load data into GPU and associate shader variables with vertex data
    if (currentProgram != null) {
        // vertex positions
        gl.useProgram(currentProgram);
        gl.bindBuffer(gl.ARRAY_BUFFER, posBuf);
        gl.bufferData(gl.ARRAY_BUFFER, flatten(pos), gl.STATIC_DRAW);
        var vPos = gl.getAttribLocation(currentProgram, "vPos");
        gl.vertexAttribPointer(vPos, pos[0].length, gl.FLOAT, false, 0, 0);
        gl.enableVertexAttribArray(vPos);
        // vertex colors
        if (!fragShaderType) {
            gl.bindBuffer(gl.ARRAY_BUFFER, colBuf);
            gl.bufferData(gl.ARRAY_BUFFER, flatten(col), gl.STATIC_DRAW);
            var vCol = gl.getAttribLocation(currentProgram, "vCol");
            gl.vertexAttribPointer(vCol, col[0].length, gl.FLOAT, false, 0, 0);
            gl.enableVertexAttribArray(vCol);
        }
    }
}

/* render frames recursively */
function render() {
    if (currentProgram != null) {
        gl.clear(gl.COLOR_BUFFER_BIT);
        gl.drawArrays(gl.TRIANGLES, 0, pos.length);
        window.requestAnimFrame(render);
    }
}

/* start the application */
window.onload = function init()
{
    asyncLoadShaders("maxwell_triangle", shaders, initWebGL);
    currentProgram = programs[0];
    prepareVertexData();
    render();
};

/***************************************************
 *                    UI handlers                  *
 ***************************************************/
/* set fragment shader */
function setFragmentShader(value, id) {
    fragShaderType = value;
    //pos = [];
    //col = [];
    currentProgram = programs[value];
    prepareVertexData();
    document.getElementById(id).innerHTML = shaders[value + 1].replace(".frag", "");
}