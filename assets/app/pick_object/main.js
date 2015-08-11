"use strict";

/* global variables */
var canvas, gl;
var currentProgram, programs = [];
var index = 0;
var shaders = ["shader.vert", "shader.frag"];

var posBuf;
var pos = [
    [0.3, 0.3], [0.5, 0.5], [0.7, 0.3],
    [0.3, -0.3], [0.5, -0.5], [0.7, -0.3],
    [-0.3, -0.3], [-0.5, -0.5], [-0.7, -0.3],
    [-0.3, 0.3], [-0.5, 0.5], [-0.7, 0.3],
];
var frameBuf;
var color = new Uint8Array(4);

/* camera/projection matrices */
var cameraMatrix, pMatrix, mvMatrix;
const at = [0.0, 0.0, 0.0];
const up = [0.0, 1.0, 0.0];
var dr = 30.0;
var zoom = 4.0, theta = 30.0, phi = 30.0;

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
    
    /*8888888888888888888888888*/
    var texture = gl.createTexture();
    gl.bindTexture( gl.TEXTURE_2D, texture );
    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, canvas.width, canvas.height, 0, gl.RGBA, gl.UNSIGNED_BYTE, null);
    gl.generateMipmap(gl.TEXTURE_2D);
    // Allocate a frame buffer object
    frameBuf = gl.createFramebuffer();
    gl.bindFramebuffer( gl.FRAMEBUFFER, frameBuf);
    // Attach color buffer
    gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, texture, 0);
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    /*8888888888888888888888888*/
    pMatrix = perspective(45.0, canvas.width / canvas.height, 1.0, -1.0);
    
    var eye = vec3(
        zoom * Math.sin(radians(theta)) * Math.cos(radians(phi)),
        zoom * Math.sin(radians(theta)) * Math.sin(radians(phi)),
        zoom * Math.cos(radians(theta))
    );
    cameraMatrix = lookAt(eye, at , up);
};

/* declare vertex data and upload it to GPU */
function prepareVertexData() {
    // associate vertex data with shader variables
    if (currentProgram != null) {
        gl.useProgram(currentProgram);
        var vPos = gl.getAttribLocation(currentProgram, "vPos");
        gl.vertexAttribPointer(vPos, 2, gl.FLOAT, false, 0, 0);
        gl.enableVertexAttribArray(vPos);
        gl.uniformMatrix4fv(gl.getUniformLocation(currentProgram, "u_pMatrix"), false, flatten(pMatrix));
    }
}

/* render frames recursively */
function render() {
    if (currentProgram != null) {
        dr += 0.25;
        mvMatrix = mult(cameraMatrix, rotate(dr, [0, 1, 0]));
        gl.uniformMatrix4fv( gl.getUniformLocation(currentProgram, "u_mvMatrix"), false, flatten(mvMatrix) );
        gl.clear(gl.COLOR_BUFFER_BIT);
        gl.uniform1i(gl.getUniformLocation(currentProgram, "u_offscreen"), 0);
        gl.drawArrays(gl.TRIANGLES, 0, pos.length);
        window.requestAnimFrame(render);
    }
}

function renderOffline() {
    if (currentProgram != null) {
        gl.clear( gl.COLOR_BUFFER_BIT);
        gl.uniform1i(gl.getUniformLocation(currentProgram, "u_offscreen"), 1);
        for (var i = 0; i < 4; i++) {
            gl.uniform3fv(gl.getUniformLocation(currentProgram, "u_color"), flatten(encodeColor(i + 1)));
            gl.drawArrays( gl.TRIANGLES, i * 3, 3 );
        }
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
    pick(x, y);
    /*888888888888888888*/
    
    //document.getElementById("info").innerHTML = Math.round(clip[0] * 100) / 100 + ", "+ Math.round(clip[1] * 100) / 100;
    document.getElementById("info").innerHTML = Math.round(decodeColor(color));
}

function pick(x, y) {
    var stretch = [canvas.width / canvas.scrollWidth, canvas.height / canvas.scrollHeight];
    gl.bindFramebuffer(gl.FRAMEBUFFER, frameBuf);
    renderOffline();

    gl.readPixels(parseInt(x * stretch[0]), parseInt(canvas.height - y * stretch[1]), 1, 1, gl.RGBA, gl.UNSIGNED_BYTE, color);

    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    gl.clear( gl.COLOR_BUFFER_BIT);
}