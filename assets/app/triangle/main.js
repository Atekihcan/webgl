"use strict";

var gl;
var points;

var vShaderSource, fShaderSource;

function loadFileAJAX(name) {
    var xhr = new XMLHttpRequest(),
        okStatus = document.location.protocol === "file:" ? 0 : 200;
    xhr.open('GET', name, false);
    xhr.send(null);
    console.log(xhr.responseText);
    return xhr.status == okStatus ? xhr.responseText : null;
};

function getShader(gl, type, shaderSource) {
    var shader = gl.createShader(type);
    gl.shaderSource(shader, shaderSource);
    gl.compileShader(shader);

    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
        alert(gl.getShaderInfoLog(shader));
        return null;
    }    
    return shader;
}

function initShaders(gl, vShaderSource, fShaderSource) {
    var vertShader = getShader(gl, gl.VERTEX_SHADER, vShaderSource),
        fragShader = getShader(gl, gl.FRAGMENT_SHADER, fShaderSource),
        program = gl.createProgram();

    gl.attachShader(program, vertShader);
    gl.attachShader(program, fragShader);
    gl.linkProgram(program);

    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
        alert("Could not initialise shaders");
        return null;
    }    
    return program;
};

function initWebGL(vString, fString) {
    vShaderSource = vString;
    fShaderSource = fString;
    var canvas = document.getElementById( "gl-canvas" );

    gl = WebGLUtils.setupWebGL( canvas );
    if ( !gl ) { alert( "WebGL isn't available" ); }
    

    //  Configure WebGL

    gl.viewport( 0, 0, canvas.width, canvas.height );
    gl.clearColor( 1.0, 1.0, 1.0, 1.0 );
};

window.onload = function init()
{
    async.parallel({
        vert: function(callback) {
            callback(null, loadFileAJAX("/assets/app/triangle/shader.vert"));
        },
        frag: function(callback) {
            callback(null, loadFileAJAX("/assets/app/triangle/shader.frag"));
        }
    }, function(err, results) {
        if (err) {
            throw err;
        } else {
            console.log(results.vert);
            initWebGL(results.vert, results.frag);
        }
    });
    
    var vertices = new Float32Array([-1, -1, 0, 1, 1, -1]);

    //  Load shaders and initialize attribute buffers
    var program = initShaders( gl, vShaderSource, fShaderSource );
    gl.useProgram( program );

    // Load the data into the GPU

    var bufferId = gl.createBuffer();
    gl.bindBuffer( gl.ARRAY_BUFFER, bufferId );
    gl.bufferData( gl.ARRAY_BUFFER, vertices, gl.STATIC_DRAW );

    // Associate out shader variables with our data buffer

    var vPosition = gl.getAttribLocation( program, "vPosition" );
    gl.vertexAttribPointer( vPosition, 2, gl.FLOAT, false, 0, 0 );
    gl.enableVertexAttribArray( vPosition );

    render();
};


function render() {
    gl.clear( gl.COLOR_BUFFER_BIT );
    gl.drawArrays( gl.TRIANGLES, 0, 3 );
}