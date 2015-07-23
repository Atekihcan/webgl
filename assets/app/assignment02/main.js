"use strict";

/* global variables */
var canvas, gl;
var currentProgram, programs = [];
var posBuf, colBuf, pos = [], col = [];
var index = 0;
var shaders = ["shader.vert", "shader.frag"];

var isMouseDown = false;
var bSize = 0.01;
var bColor = vec4([1.0, 0.0, 0.0, 1.0]);

/***************************************************
 *                  WebGL functions                *
 ***************************************************/
/* initialize WebGL context */
function initWebGL(shaderSources) {
    canvas = document.getElementById("gl-canvas");
    canvas.addEventListener("mousedown", getMouseDown, false);
    canvas.addEventListener("mousemove", getMouseMove, false);
    canvas.addEventListener("mouseup", getMouseUp, false);

    gl = WebGLUtils.setupWebGL( canvas );
    if (!gl) {
        alert("[ERROR] WebGL isn't available");
        return;
    }
    // initialize the buffer objects and set the canvas
    posBuf = gl.createBuffer();
    colBuf = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, posBuf);
    gl.bufferData(gl.ARRAY_BUFFER, canvas.width * canvas.height * 4 * sizeof['vec2'], gl.STATIC_DRAW);
    gl.bindBuffer(gl.ARRAY_BUFFER, colBuf);
    gl.bufferData(gl.ARRAY_BUFFER, canvas.width * canvas.height * 4 * sizeof['vec4'], gl.STATIC_DRAW);
    gl.viewport(0, 0, canvas.width, canvas.height);
    gl.clearColor(1.0, 1.0, 1.0, 1.0);

    // compile shaders and get the program object
    programs.push(getProgram(gl, shaderSources[0], shaderSources[1]));
};

/* declare vertex data and upload it to GPU */
function prepareVertexData() {
    // associate vertex data with shader variables
    if (currentProgram != null) {
        gl.useProgram(currentProgram);
        gl.bindBuffer(gl.ARRAY_BUFFER, posBuf);
        var vPos = gl.getAttribLocation(currentProgram, "vPos");
        gl.vertexAttribPointer(vPos, 2, gl.FLOAT, false, 0, 0);
        gl.enableVertexAttribArray(vPos);
        gl.bindBuffer(gl.ARRAY_BUFFER, colBuf);
        var vCol = gl.getAttribLocation(currentProgram, "vCol");
        gl.vertexAttribPointer(vCol, 4, gl.FLOAT, false, 0, 0);
        gl.enableVertexAttribArray(vCol);
    }
}

/* render frames recursively */
function render() {
    if (currentProgram != null && pos.length > 0) {
        gl.clear(gl.COLOR_BUFFER_BIT);
        gl.drawArrays(gl.TRIANGLE_STRIP, 0, (pos.length - 1) * 4);
    }
    window.requestAnimFrame(render);
}

/* start the application */
window.onload = function init() {
    asyncLoadShaders("assignment02", shaders, initWebGL);
    currentProgram = programs[0];
    prepareVertexData();
    render();
};

/***************************************************
 *                    geometry utils               *
 ***************************************************/
/* calculate thick line coordinates from the mouse position */
function makeThickLine() {
    if (pos.length < 2) {
        return;
    }
    
    var dx = pos[pos.length - 1][0] - pos[pos.length - 2][0];
    var dy = pos[pos.length - 1][1] - pos[pos.length - 2][1];

    var normal = normalize([-dy, dx]);
    var tx = bSize * normal[0],
        ty = bSize * normal[1];
    var a = [pos[pos.length - 2][0] - tx, pos[pos.length - 2][1] - ty], 
        b = [pos[pos.length - 2][0] + tx, pos[pos.length - 2][1] + ty], 
        c = [pos[pos.length - 1][0] - tx, pos[pos.length - 1][1] - ty], 
        d = [pos[pos.length - 1][0] + tx, pos[pos.length - 1][1] + ty];

    gl.bindBuffer(gl.ARRAY_BUFFER, posBuf);
    gl.bufferSubData(gl.ARRAY_BUFFER, 4 * sizeof['vec2'] * (index - 1), flatten([a, b, c, d]));
    gl.bindBuffer(gl.ARRAY_BUFFER, colBuf);
    gl.bufferSubData(gl.ARRAY_BUFFER, 4 * sizeof['vec4'] * (index - 1), flatten([bColor, bColor, bColor, bColor]));
}

/***************************************************
 *                    UI handlers                  *
 ***************************************************/
/* set fragment shader */
function getMouseClick(event) {
    var rect = canvas.getBoundingClientRect();
    var x = event.clientX - rect.left,
        y = event.clientY - rect.top;
    var clip = vec2(-1 + 2 * x / canvas.scrollWidth, -1 + 2 * (canvas.scrollHeight - y) / canvas.scrollHeight);
    
    gl.bindBuffer(gl.ARRAY_BUFFER, posBuf);
    gl.bufferSubData(gl.ARRAY_BUFFER, sizeof['vec2'] * index, flatten(clip));
    document.getElementById("info").innerHTML = Math.round(clip[0] * 100) / 100 + ", "+ Math.round(clip[1] * 100) / 100;
}

/* mouse down event handler */
function getMouseDown(event) {
    isMouseDown = true;
    var rect = canvas.getBoundingClientRect();
    var x = event.clientX - rect.left,
        y = event.clientY - rect.top;
    var clip = vec2(-1 + 2 * x / canvas.scrollWidth, -1 + 2 * (canvas.scrollHeight - y) / canvas.scrollHeight);
    document.getElementById("info").innerHTML = Math.round(clip[0] * 100) / 100 + ", "+ Math.round(clip[1] * 100) / 100;
}

/* mouse move event handler */
function getMouseMove(event) {
    if (isMouseDown) {
        var rect = canvas.getBoundingClientRect();
        var x = event.clientX - rect.left,
            y = event.clientY - rect.top;
        var clip = vec2(-1 + 2 * x / canvas.scrollWidth, -1 + 2 * (canvas.scrollHeight - y) / canvas.scrollHeight);
        
        pos.push(clip);
        makeThickLine();
        index++;
        
        document.getElementById("info").innerHTML = Math.round(clip[0] * 100) / 100 + ", "+ Math.round(clip[1] * 100) / 100;
    }
}

/* mouse up event handler */
function getMouseUp(event) {
    isMouseDown = false;
    var rect = canvas.getBoundingClientRect();
    var x = event.clientX - rect.left,
        y = event.clientY - rect.top;
    var clip = vec2(-1 + 2 * x / canvas.scrollWidth, -1 + 2 * (canvas.scrollHeight - y) / canvas.scrollHeight);
    //pos.push(clip);
    //makeThickLine()
    document.getElementById("info").innerHTML = Math.round(clip[0] * 100) / 100 + ", "+ Math.round(clip[1] * 100) / 100;
}

/* set brush color */
function setColor(value) {
    var rgb = hexToRGB(value);
    bColor = vec4([rgb.r / 255.0, rgb.g / 255.0, rgb.b / 255.0, 1.0]);
}

/* set brush size */
function setThickness(value) {
    bSize = value / 200.0;
}

/* convert hex color string to normalized rgb */
function hexToRGB(hex) {
    var result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16)
    } : null;
}