"use strict";

/* global variables */
var gl;
var points = [];
var vShaderSource, fShaderSource;

/* function for getting shader code from remote source */
function loadFileAJAX(name) {
    var xhr = new XMLHttpRequest(),
        okStatus = document.location.protocol === "file:" ? 0 : 200;
    xhr.open('GET', name, false);
    xhr.send(null);
    return xhr.status == okStatus ? xhr.responseText : null;
};

/* function for getting compiled shader */
function getShader(gl, type, shaderSource) {
    var shader = gl.createShader(type);
    gl.shaderSource(shader, shaderSource);
    gl.compileShader(shader);

    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
        alert(gl.getShaderInfoLog(shader));
        return null;
    }
    return shader;
};

/* function for getting program object */
function getProgram(gl, vShaderSource, fShaderSource) {
    var vertShader = getShader(gl, gl.VERTEX_SHADER, vShaderSource);
    var fragShader = getShader(gl, gl.FRAGMENT_SHADER, fShaderSource);
    var program = gl.createProgram();

    gl.attachShader(program, vertShader);
    gl.attachShader(program, fragShader);
    gl.linkProgram(program);

    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
        alert("[ERROR] Could not initialise shaders");
        return null;
    }
    return program;
};

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
    // asynchronously load shader code from remote source in parallel
    // and then initialize WebGL
    async.parallel({
        vert: function(callback) {
            callback(null, loadFileAJAX("/webgl/assets/app/triangle/shader.vert"));
        },
        frag: function(callback) {
            callback(null, loadFileAJAX("/webgl/assets/app/triangle/shader.frag"));
        }
    }, function(err, results) {
        if (err) {
            throw err;
        } else {
            initWebGL(results.vert, results.frag);
        }
    });

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