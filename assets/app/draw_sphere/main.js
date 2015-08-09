"use strict";

/* global variables */
var canvas, gl;
var currentProgram, programs = [];
var posBuf, pos = [];
var index = 0;
var shaders = ["shader.vert", "shader.frag"];

/*88888888888888888888888888*/
var pointsArray = [];
var normalsArray = [];
var X = 0.525731112119133606 
var Z = 0.850650808352039932

var vdata = [    
    [-X, 0.0, Z], [X, 0.0, Z], [-X, 0.0, -Z], [X, 0.0, -Z],    
    [0.0, Z, X], [0.0, Z, -X], [0.0, -Z, X], [0.0, -Z, -X],    
    [Z, X, 0.0], [-Z, X, 0.0], [Z, -X, 0.0], [-Z, -X, 0.0] 
];

var idata = [ 
    [0,4,1], [0,9,4], [9,5,4], [4,5,8], [4,8,1],    
    [8,10,1], [8,3,10], [5,3,8], [5,2,3], [2,7,3],    
    [7,10,3], [7,6,10], [7,11,6], [11,0,6], [0,1,6], 
    [6,1,10], [9,0,11], [9,11,2], [9,2,5], [7,2,11]
];

function normalize(a) {
    var d = Math.sqrt(a[0]*a[0]+a[1]*a[1]+a[2]*a[2]);
    a[0]/=d; a[1]/=d; a[2]/=d;
}

function drawtri(a, b, c, div, r) {
    if (div<=0) {
        normalsArray.push(a); pointsArray.push(a[0]*r, a[1]*r, a[2]*r);
        normalsArray.push(b); pointsArray.push(b[0]*r, b[1]*r, b[2]*r);
        normalsArray.push(c); pointsArray.push(c[0]*r, c[1]*r, c[2]*r);
    } else {
        var ab, ac, bc;
        for (var i=0;i<3;i++) {
            ab[i]=(a[i]+b[i])/2;
            ac[i]=(a[i]+c[i])/2;
            bc[i]=(b[i]+c[i])/2;
        }
        normalize(ab); normalize(ac); normalize(bc);
        drawtri(a, ab, ac, div-1, r);
        drawtri(b, bc, ab, div-1, r);
        drawtri(c, ac, bc, div-1, r);
        drawtri(ab, bc, ac, div-1, r);  //<--Comment this line and sphere looks really cool!
    }  
}
/*88888888888888888888888888*/

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
    for (var i=0;i<20;i++) {
        drawtri(vdata[tindices[i][0]], vdata[tindices[i][1]], vdata[tindices[i][2]], ndiv, radius);
    }
    posBuf = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, posBuf);
    gl.bufferData(gl.ARRAY_BUFFER, pointsArray, gl.STATIC_DRAW);
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
        gl.vertexAttribPointer(vPos, 3, gl.FLOAT, false, 0, 0);
        gl.enableVertexAttribArray(vPos);
    }
}

/* render frames recursively */
function render() {
    if (currentProgram != null) {
        gl.clear(gl.COLOR_BUFFER_BIT);
        gl.drawArrays(gl.POINTS, 0, pointsArray.length);
        window.requestAnimFrame(render);
    }
}

/* start the application */
window.onload = function init()
{
    asyncLoadShaders("draw_sphere", shaders, initWebGL);
    currentProgram = programs[0];
    prepareVertexData();
    render();
};