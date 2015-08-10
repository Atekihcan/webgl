"use strict";

/* global variables */
var canvas, gl;
var currentProgram, programs = [];
var index = 0;
var shaders = ["shader.vert", "shader.frag"];

var posBuf;
var pos = [
    [0.4, 0.4], [0.5, 0.5], [0.6, 0.4],
    [-0.4, 0.4], [-0.5, 0.5], [-0.6, 0.4],
    [0.4, -0.4], [0.5, -0.5], [0.6, -0.4],
    [-0.4, -0.4], [-0.5, -0.5], [-0.6, -0.4],
];

var names = ["++", "-+", "+-", "--"];

/***************************************************
 *                  WebGL functions                *
 ***************************************************/
/* initialize WebGL context */
function initWebGL(shaderSources) {
    canvas = document.getElementById("gl-canvas");
    canvas.addEventListener("click", getMouseClick, false);

    gl = WebGLUtils.setupWebGL( canvas );
    if (!gl) {
        alert("[ERROR] WebGL isn't available");
        return;
    }
    // initialize the buffer objects and set the canvas
    posBuf = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, posBuf);
    gl.bufferData(gl.ARRAY_BUFFER, flatten(pos), gl.STATIC_DRAW);
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
        var vPos = gl.getAttribLocation(currentProgram, "vPos");
        gl.vertexAttribPointer(vPos, 2, gl.FLOAT, false, 0, 0);
        gl.enableVertexAttribArray(vPos);
    }
}

/* render frames recursively */
function render() {
    if (currentProgram != null) {
        gl.clear(gl.COLOR_BUFFER_BIT);
        gl.drawArrays(gl.POINTS, 0, pos.length);
        window.requestAnimFrame(render);
    }
}

/* start the application */
window.onload = function init()
{
    asyncLoadShaders("pick_object", shaders, initWebGL);
    currentProgram = programs[0];
    prepareVertexData();
    render();
};

/***************************************************
 *                    UI handlers                  *
 ***************************************************/
/* set fragment shader */
function getMouseClick(event) {
    var rect = canvas.getBoundingClientRect();
    var x = event.clientX - rect.left,
        y = event.clientY - rect.top;
    var clip = vec2(-1 + 2 * x / canvas.scrollWidth, -1 + 2 * (canvas.scrollHeight - y) / canvas.scrollHeight);
    /*888888888888888888*/
    gl.bindFramebuffer(gl.FRAMEBUFFER, framebuffer);
    gl.clear( gl.COLOR_BUFFER_BIT);
    gl.uniform3fv(thetaLoc, theta);
    for(var i=0; i<6; i++) {
        gl.uniform1i(gl.getUniformLocation(program, "i"), i+1);
        gl.drawArrays( gl.TRIANGLES, 6*i, 6 );
    }
    var x = event.clientX;
    var y = canvas.height -event.clientY;

    gl.readPixels(x, y, 1, 1, gl.RGBA, gl.UNSIGNED_BYTE, color);

    if(color[0]==255)
    if(color[1]==255) elt.innerHTML = "<div> front </div>";
    else if(color[2]==255) elt.innerHTML = "<div> back </div>";
    else elt.innerHTML = "<div> right </div>";
    else if(color[1]==255)
    if(color[2]==255) elt.innerHTML = "<div> left </div>";
    else elt.innerHTML = "<div> top </div>";
    else if(color[2]==255) elt.innerHTML = "<div> bottom </div>";
    else elt.innerHTML = "<div> background </div>";

    gl.bindFramebuffer(gl.FRAMEBUFFER, null);

    gl.uniform1i(gl.getUniformLocation(program, "i"), 0);
    gl.clear( gl.COLOR_BUFFER_BIT );
    gl.uniform3fv(thetaLoc, theta);
    gl.drawArrays(gl.TRIANGLES, 0, 36);
    /*888888888888888888*/
    
    document.getElementById("info").innerHTML = Math.round(clip[0] * 100) / 100 + ", "+ Math.round(clip[1] * 100) / 100;
}