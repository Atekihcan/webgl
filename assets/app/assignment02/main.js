"use strict";

/* global variables */
var canvas, gl;
var currentProgram, programs = [];
var posBuf, colBuf, pos = [], col = [];
var index = 0;
var shaders = ["shader.vert", "shader.frag"];
var stopRender = false;

var index       = -2;
var isMouseDown = false;
var isNewShape  = false;
var bSize       = 1;
var bMode       = true;
var bColor      = vec4([1.0, 0.0, 0.0, 1.0]);
var bColorStr   = "#ff0000";
var bgColor     = vec4([1.0, 1.0, 1.0, 1.0]);

/***************************************************
 *                  WebGL functions                *
 ***************************************************/
/* initialize WebGL context */
function initWebGL(shaderSources) {
    canvas = document.getElementById("gl-canvas");
    canvas.addEventListener("mousedown", getMouseDown, false);
    canvas.addEventListener("mousemove", getMouseMove, false);
    canvas.addEventListener("mouseup", getMouseUp, false);
    canvas.addEventListener("touchstart", getTouchStart, false);
    canvas.addEventListener("touchmove", getTouchMove, false);
    canvas.addEventListener("touchend", getTouchEnd, false);

    gl = WebGLUtils.setupWebGL(canvas, {preserveDrawingBuffer: true});
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
    gl.enable(gl.BLEND);
    gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);

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
    if (!stopRender && currentProgram != null && pos.length > 0) {
        gl.clear(gl.COLOR_BUFFER_BIT);
        gl.drawArrays(gl.TRIANGLE_STRIP, 0, (pos.length - 1) * 4);
    }
    window.requestAnimFrame(render);
}

/* setup the second canvas for drawing cursor */
function setupCursor() {
    var cursorCanvas = document.getElementById("cur-canvas");
    var ctx = cursorCanvas.getContext("2d");
    cursorCanvas.addEventListener("mousemove", handleMouseMove, false);

    function handleMouseMove(e){
        e.preventDefault();
        e.stopPropagation();
        var rect = cursorCanvas.getBoundingClientRect();
        var x = e.clientX - rect.left,
            y = e.clientY - rect.top;

        ctx.clearRect(0, 0, cursorCanvas.width, cursorCanvas.height);
        ctx.beginPath();
        if (bMode) {
            ctx.arc(x, y, bSize, 0, 2 * Math.PI, false);
            ctx.fillStyle = bColorStr;
            ctx.fill();
            ctx.lineWidth = 1;
            ctx.strokeStyle = '#003300';
        } else {
            ctx.moveTo(x - 2 * bSize, y - 2 * bSize);
            ctx.lineTo(x - 2 * bSize, y + 2 * bSize);
            ctx.lineTo(x + 2 * bSize, y + 2 * bSize);
            ctx.lineTo(x + 2 * bSize, y - 2 * bSize);
            ctx.lineTo(x - 2 * bSize, y - 2 * bSize);
        }
        ctx.stroke();
    }
}

/* start the application */
window.onload = function init() {
    asyncLoadShaders("assignment02", shaders, initWebGL);
    currentProgram = programs[0];
    prepareVertexData();
    render();
    //setupCursor();
};

/***************************************************
 *                    geometry utils               *
 ***************************************************/
/* calculate thick line coordinates from the mouse position */
function makeThickLine(transparent) {
    setDefault(transparent, false);
    if (pos.length < 2) {
        return;
    }

    var dx = pos[pos.length - 1][0] - pos[pos.length - 2][0];
    var dy = pos[pos.length - 1][1] - pos[pos.length - 2][1];

    var normal = normalize([-dy, dx]);
    var tx = bSize * normal[0] / 200.0,
        ty = bSize * normal[1] / 200.0;
    var a = [pos[pos.length - 2][0] - tx, pos[pos.length - 2][1] - ty],
        b = [pos[pos.length - 2][0] + tx, pos[pos.length - 2][1] + ty],
        c = [pos[pos.length - 1][0] - tx, pos[pos.length - 1][1] - ty],
        d = [pos[pos.length - 1][0] + tx, pos[pos.length - 1][1] + ty];

    gl.bindBuffer(gl.ARRAY_BUFFER, posBuf);
    gl.bufferSubData(gl.ARRAY_BUFFER, 4 * sizeof['vec2'] * index, flatten([a, b, c, d]));
    gl.bindBuffer(gl.ARRAY_BUFFER, colBuf);
    if (transparent) {
        var bTrans = [0.0, 0.0, 0.0, 0.0, 0.0];
        gl.bufferSubData(gl.ARRAY_BUFFER, 4 * sizeof['vec4'] * index, flatten([bTrans, bTrans, bTrans, bTrans]));
    } else {
        if (bMode) {
            gl.bufferSubData(gl.ARRAY_BUFFER, 4 * sizeof['vec4'] * index, flatten([bColor, bColor, bColor, bColor]));
        } else {
            gl.bufferSubData(gl.ARRAY_BUFFER, 4 * sizeof['vec4'] * index, flatten([bgColor, bgColor, bgColor, bgColor]));
        }
    }
}

/***************************************************
 *                    UI handlers                  *
 ***************************************************/
/* mouse down event handler */
function getMouseDown(event) {
    isMouseDown = true;
    stopRender = false;
    var rect = canvas.getBoundingClientRect();
    var x = event.clientX - rect.left,
        y = event.clientY - rect.top;
    var clip = vec2(-1 + 2 * x / canvas.scrollWidth, -1 + 2 * (canvas.scrollHeight - y) / canvas.scrollHeight);

    pos.push(clip);
    index++;
    makeThickLine(true);
    //document.getElementById("info").innerHTML = Math.round(clip[0] * 100) / 100 + ", "+ Math.round(clip[1] * 100) / 100;
}

/* mouse move event handler */
function getMouseMove(event) {
    var rect = canvas.getBoundingClientRect();
    var x = event.clientX - rect.left,
        y = event.clientY - rect.top;
    if (isMouseDown) {
        var clip = vec2(-1 + 2 * x / canvas.scrollWidth, -1 + 2 * (canvas.scrollHeight - y) / canvas.scrollHeight);

        pos.push(clip);
        index++;
        makeThickLine();
    }
    document.getElementById("info").innerHTML = Math.round(x) + ", " + Math.round(y);
}

/* mouse up event handler */
function getMouseUp(event) {
    isMouseDown = false;
    var rect = canvas.getBoundingClientRect();
    var x = event.clientX - rect.left,
        y = event.clientY - rect.top;
    var clip = vec2(-1 + 2 * x / canvas.scrollWidth, -1 + 2 * (canvas.scrollHeight - y) / canvas.scrollHeight);

    pos.push(clip);
    index++;
    makeThickLine(true);
    //document.getElementById("info").innerHTML = Math.round(clip[0] * 100) / 100 + ", "+ Math.round(clip[1] * 100) / 100;
}

/* touch start event handler */
function getTouchStart(event) {
    stopRender = false;
    var rect = canvas.getBoundingClientRect();
    var x = event.touches[0].pageX - rect.left,
        y = event.touches[0].pageY - rect.top;
    var clip = vec2(-1 + 2 * x / canvas.scrollWidth, -1 + 2 * (canvas.scrollHeight - y) / canvas.scrollHeight);

    pos.push(clip);
    index++;
    makeThickLine(true);
}

/* touch move event handler */
function getTouchMove(event) {
    var rect = canvas.getBoundingClientRect();
    var x = event.touches[0].pageX - rect.left,
        y = event.touches[0].pageY - rect.top;
    var clip = vec2(-1 + 2 * x / canvas.scrollWidth, -1 + 2 * (canvas.scrollHeight - y) / canvas.scrollHeight);

    pos.push(clip);
    index++;
    makeThickLine();

    document.getElementById("info").innerHTML = Math.round(x) + ", " + Math.round(y);
    event.preventDefault();
}

/* touch end event handler */
function getTouchEnd(event) {
    var rect = canvas.getBoundingClientRect();
    var x = event.changedTouches[0].pageX - rect.left,
        y = event.changedTouches[0].pageY - rect.top;
    var clip = vec2(-1 + 2 * x / canvas.scrollWidth, -1 + 2 * (canvas.scrollHeight - y) / canvas.scrollHeight);

    pos.push(clip);
    index++;
    makeThickLine(true);
}

/* clear canvas */
function resetCanvas() {
    pos = [];
    index = -2;
    stopRender = true;
    gl.clear(gl.COLOR_BUFFER_BIT);
}

/* save canvas as image */
function saveImage() {
    var dataURL = canvas.toDataURL('image/png');
    window.open(dataURL, "_blank");
}

/* set canvas color */
function setBGColor(value) {
    var rgb = hexToRGB(value);
    bgColor = vec4([rgb.r / 255.0, rgb.g / 255.0, rgb.b / 255.0, 1.0]);
    gl.clearColor(rgb.r / 255.0, rgb.g / 255.0, rgb.b / 255.0, 1.0);
    gl.clear(gl.COLOR_BUFFER_BIT);
}

/* set brush color */
function setColor(value) {
    bColorStr = value;
    var rgb = hexToRGB(value);
    bColor = vec4([rgb.r / 255.0, rgb.g / 255.0, rgb.b / 255.0, 1.0]);
}

/* set brush size */
function setSize(value) {
    bSize = value;
}

/* set brush mode */
function setMode(value) {
    if (value == "Paint") {
        bMode = true;
    } else {
        bMode = false;
    }
}