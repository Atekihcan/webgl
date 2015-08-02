"use strict";

/* global variables */
var canvas, gl, program;
var shaders = ["shader.vert", "shader.frag"];
var stopRender = false;

var SHAPES = {
    'xAxis' : [0, 1],
    'yAxis' : [1, 1],
    'zAxis' : [2, 1],
    'Cube'  : [3, 1],
    'Cuboid': [4, 0],
    'Circle': [5, 1],
};

var AXES = [];

var objectsToDraw = [];
var currentShape  = "Cube";
var start = [0, 0], end = [0, 0];
var isMouseDown = false;
var shiftDown = false;

/* uniforms */
var ambientLight       = vec4(0.2, 0.2, 0.2, 1.0);
var pointLightSpecular = vec4(1.0, 1.0, 1.0, 1.0);
var pointLightDiffuse  = vec4(1.0, 1.0, 1.0, 1.0);
var pointLightPos      = vec4(0.0, 0.0, 0.0, 0.0);
var materialColor      = [1.0, 0.0, 0.0, 1.0];

var cameraMatrix, pMatrix;
const at = vec3(0.0, 0.0, 0.0);
const up = vec3(0.0, 1.0, 0.0);
var zoom = 4.0;
var theta = 30.0;
var phi = 30.0;

var VERT_STRIDE  = sizeof['vec3'] + sizeof['vec3'];

/***************************************************
 *                  WebGL functions                *
 ***************************************************/
/* initialize WebGL context */
function initWebGL(shaderSources) {
    canvas = document.getElementById("gl-canvas");
    canvas.addEventListener("mousedown", getMouseDown, false);
    canvas.addEventListener("mousemove", getMouseMove, false);
    canvas.addEventListener("mouseup", getMouseUp, false);

    gl = WebGLUtils.setupWebGL(canvas, {preserveDrawingBuffer: true});
    if (!gl) {
        alert("[ERROR] WebGL isn't available");
        return;
    }
    // set the canvas
    gl.viewport(0, 0, canvas.width, canvas.height);
    gl.clearColor(0.3, 0.3, 0.3, 1.0);
    gl.enable(gl.DEPTH_TEST);

    //pMatrix = ortho(-1, 1, -1, 1, -100, 100);
    pMatrix = perspective(45.0, 1.0, 1.0, -1.0);
    changeCameraPosition();
    //console.log(pMatrix);

    // compile shaders and get the program objects
    program = getProgram(gl, shaderSources[0], shaderSources[1]);
    if (program != null) {
        gl.useProgram(program);
    }
};

/* load global uniforms */
function loadGlobalUniforms() {
    gl.uniform4fv(gl.getUniformLocation(program, "u_ambientLight"), flatten(ambientLight));
    gl.uniform4fv(gl.getUniformLocation(program, "u_pointLightSpecular"), flatten(pointLightSpecular));
    gl.uniform4fv(gl.getUniformLocation(program, "u_pointLightDiffuse"), flatten(pointLightDiffuse));
    gl.uniform4fv(gl.getUniformLocation(program, "u_pointLightPos"), flatten(pointLightPos));
    gl.uniformMatrix4fv(gl.getUniformLocation(program, "u_pMatrix"), false, flatten(pMatrix));
}

/* load buffer objects with vertex data for objects */
function loadBuffer(buffer, data) {
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer.vbo);
    gl.bufferData(gl.ARRAY_BUFFER, flatten(data), gl.STATIC_DRAW);
}
/* upload vertex data to GPU */
function loadVertexAttribs(object) {
    // associate vertex data with shader variables
    gl.bindBuffer(gl.ARRAY_BUFFER, object.buffer.vbo);
    var vPos = gl.getAttribLocation(program, "vPos");
    gl.vertexAttribPointer(vPos, 3, gl.FLOAT, false, sizeof['vec3'] * 2, 0);
    gl.enableVertexAttribArray(vPos);
    var vNorm = gl.getAttribLocation(program, "vNorm");
    gl.vertexAttribPointer(vNorm, 3, gl.FLOAT, false, sizeof['vec3'] * 2, sizeof['vec3']);
    gl.enableVertexAttribArray(vNorm);
}

/* load object specific uniforms */
function loadObjectUniforms(object) {
    gl.uniform1i(gl.getUniformLocation(program, "u_lightON"), object.lighting);
    gl.uniform4fv(gl.getUniformLocation(program, "u_materialColor"), flatten(object.materialColor));

    if (object.shape > 2) {
        var mvMatrix = mult(cameraMatrix, translate(object.center[0], object.center[1], object.center[2]));
        mvMatrix = mult(mvMatrix, scale(object.scale[0], object.scale[1], object.scale[2]));
        mvMatrix = mult(mvMatrix, rotate(object.rotate[0], [1, 0, 0]));
        mvMatrix = mult(mvMatrix, rotate(object.rotate[1], [0, 1, 0]));
        mvMatrix = mult(mvMatrix, rotate(object.rotate[2], [0, 0, 1]));
        mvMatrix = mult(mvMatrix, translate(object.translate[0] - object.center[0], object.translate[1] - object.center[1], object.translate[2] - object.center[2]));
        gl.uniformMatrix4fv( gl.getUniformLocation(program, "u_mvMatrix"), false, flatten(mvMatrix) );
    } else {
        gl.uniformMatrix4fv( gl.getUniformLocation(program, "u_mvMatrix"), false, flatten(cameraMatrix) );
    }
}

/* render frames recursively */
function render() {
    if (!stopRender) {
        gl.clear( gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
        AXES.forEach(function(object) {
            // if (objectsToDraw.length > 3) {
                // console.log(objectsToDraw);
                // stopRender = true;
            // }
            loadVertexAttribs(object);
            loadObjectUniforms(object);
            gl.drawArrays(gl.LINES, 0, object.buffer.numVert);
        });
        objectsToDraw.forEach(function(object) {
            // if (objectsToDraw.length > 3) {
                // console.log(objectsToDraw);
                // stopRender = true;
            // }
            loadVertexAttribs(object);
            loadObjectUniforms(object);
            gl.drawArrays(gl.TRIANGLES, 0, object.buffer.numVert);
            if (object.wireFrame) {
                for(var i = 0; i < object.buffer.numVert; i += 3) {
                    gl.uniform4fv(gl.getUniformLocation(program, "u_materialColor"), flatten([0.0, 0.0, 0.0, 1.0]));
                    gl.drawArrays(gl.LINE_LOOP, i, 3);
                }
            }
        });
    }
    window.requestAnimFrame(render);
}

/* start the application */
window.onload = function init() {
    asyncLoadShaders("assignment03", shaders, initWebGL);
    document.addEventListener('keydown', handleKeyDown);
    document.addEventListener('keyup', handleKeyUp);
    loadGlobalUniforms();
    AXES.push(new Geometry('xAxis', [1.0, 0.0, 0.0, 1.0]));
    AXES.push(new Geometry('yAxis', [0.0, 1.0, 0.0, 1.0]));
    AXES.push(new Geometry('zAxis', [0.0, 0.0, 1.0, 1.0]));
    //debug
    //objectsToDraw.push(new Geometry("Cube", materialColor, [0.25, 0.25], true));
    //objectsToDraw[objectsToDraw.length - 1].populateBuffer([0.750, 0.750]);
    render();
};

/***************************************************
 *                geometry objects                 *
 ***************************************************/
/* object primitive */
function Geometry(shape, materialColor, center, symmetry) {
    this.buffer = {
        vbo: gl.createBuffer(),
        numVert: 0,
    };
    setDefault(center, [0.0, 0.0]);
    setDefault(symmetry, false);
    this.scale             = [1.0, 1.0, 1.0];
    this.rotate            = [0.0, 0.0, 0.0];
    this.translate         = [0.0, 0.0, 0.0];
    this.shape             = SHAPES[shape][0];
    this.materialColor     = materialColor;
    this.lighting          = true;
    this.symmetry          = symmetry;
    this.center            = vec3(center, 0.0);
    this.wireFrame         = false;
    
    if (this.shape < 3) {
        this.lighting = false;
        var vertData = getAxisVertData(this.shape);
        this.buffer.numVert = vertData.length / 2;
        loadBuffer(this.buffer, vertData);
    }

    this.populateBuffer = function(end) {
        var vertData = [];
        switch(this.shape) {
            case 3:
            case 4:
                vertData = cuboidVertData(center, end, this.symmetry);
                break;
            case 5:
                vertData = circleVertData(center, end, 50);
                break;
            default:
                console.error("shape " + this.shape + " is not supported");
                break;
        }
        //this.buffer.vert = vertData;
        this.buffer.numVert = vertData.length / 2;
        loadBuffer(this.buffer, vertData);
    };
}


/* axes */
function getAxisVertData(index) {
    var v = [];
    var a = -zoom / 2.0, b = zoom / 2.0;
    var posEnd = [0.0, 0.0, 0.0];
    posEnd[index] = b;
    
    // positive axis - solid
    v.push([0.0, 0.0, 0.0]);
    v.push([0.0, 0.0, 0.0]);
    v.push(posEnd);
    v.push([0.0, 0.0, 0.0]);
    // negative axis - dotted
    for (var i = 0; i < 100; i++) {
        var negEnd = [0.0, 0.0, 0.0];
        negEnd[index] = i * a / 100;
        v.push(negEnd);
        v.push([0.0, 0.0, 0.0]);
    }
    return v;
}

/* cube */
function cuboidVertData(a, b, cube) {
    var z = 0.5, back_z = -0.5;
    if (cube) {
        if (Math.abs(a[0] - b[0]) != Math.abs(a[1] - b[1])) {
            b[1] = a[1] + sign(b[1] - a[1]) * Math.abs(a[0] - b[0]);
        }
        var halfSide = Math.abs(a[0] - b[0]);
        z = halfSide;
        back_z = - halfSide;
    }

    var v = [
        /* front face */
        [2 * a[0] - b[0], 2* a[1] - b[1], z],
        [b[0], 2 * a[1] - b[1], z],
        [b[0], b[1], z],
        [2 * a[0] - b[0], b[1], z],
        /* back face */
        [2 * a[0] - b[0], 2* a[1] - b[1], back_z],
        [b[0], 2 * a[1] - b[1], back_z],
        [b[0], b[1], back_z],
        [2 * a[0] - b[0], b[1], back_z],
    ];

    return [
        // front
        v[0], [0.0,  0.0,  1.0], v[1], [0.0,  0.0,  1.0], v[2], [0.0,  0.0,  1.0],
        v[0], [0.0,  0.0,  1.0], v[2], [0.0,  0.0,  1.0], v[3], [0.0,  0.0,  1.0],
        // back
        v[4], [0.0,  0.0, -1.0], v[5], [0.0,  0.0, -1.0], v[6], [0.0,  0.0, -1.0],
        v[4], [0.0,  0.0, -1.0], v[6], [0.0,  0.0, -1.0], v[7], [0.0,  0.0, -1.0],
        // left
        v[0], [-1.0,  0.0,  0.0], v[3], [-1.0,  0.0,  0.0], v[7], [-1.0,  0.0,  0.0],
        v[0], [-1.0,  0.0,  0.0], v[7], [-1.0,  0.0,  0.0], v[4], [-1.0,  0.0,  0.0],
        // right
        v[1], [1.0,  0.0,  0.0], v[2], [1.0,  0.0,  0.0], v[6], [1.0,  0.0,  0.0],
        v[1], [1.0,  0.0,  0.0], v[6], [1.0,  0.0,  0.0], v[5], [1.0,  0.0,  0.0],
        // top
        v[2], [0.0,  1.0,  0.0], v[3], [0.0,  1.0,  0.0], v[7], [0.0,  1.0,  0.0],
        v[2], [0.0,  1.0,  0.0], v[7], [0.0,  1.0,  0.0], v[6], [0.0,  1.0,  0.0],
        // bottom
        v[1], [0.0, -1.0,  0.0], v[0], [0.0, -1.0,  0.0], v[4], [0.0, -1.0,  0.0],
        v[1], [0.0, -1.0,  0.0], v[4], [0.0, -1.0,  0.0], v[5], [0.0, -1.0,  0.0]
    ];
}

/* circle */
function circleVertData(a, b, numPoints) {
    return createPolygon(a, dist(a, b), numPoints, true);
}

function circleIndxData(numPoints) {
    var indices = [];
    for (var i = 0; i < numPoints; i++) {
        indices.push(i, (i + 1) % numPoints);
    }
    return indices;
}

/***************************************************
 *                geometry utils                   *
 ***************************************************/
/* make perspective model-view matrix */
function changeCameraPosition() {
    var eye = vec3(zoom * Math.sin(radians(theta)) * Math.cos(radians(phi)), zoom * Math.sin(radians(theta)) * Math.sin(radians(phi)), zoom * Math.cos(radians(theta)));
    cameraMatrix = lookAt(eye, at , up);
}

/***************************************************
 *                    UI handlers                  *
 ***************************************************/
/* get mouse coordinate in terms of clip coordinate */
function mouseToClip(e) {
    var rect = canvas.getBoundingClientRect();
    var x = e.clientX - rect.left,
        y = e.clientY - rect.top;
    return vec2((-1 + 2 * x / canvas.scrollWidth) * zoom / 2.0, (-1 + 2 * (canvas.scrollHeight - y) / canvas.scrollHeight) * zoom / 2.0);
}

/* mouse down event handler */
function getMouseDown(event) {
    isMouseDown = true;
    stopRender = false;
    var clip = mouseToClip(event);

    start = clip;
    objectsToDraw.push(new Geometry(currentShape, materialColor, start, SHAPES[currentShape][1] || shiftDown));
    document.getElementById("info").innerHTML = Math.round(clip[0] * 100) / 100 + ", "+ Math.round(clip[1] * 100) / 100;
}

/* mouse move event handler */
function getMouseMove(event) {
    if (isMouseDown) {
        var clip = mouseToClip(event);
        end = clip;
        objectsToDraw[objectsToDraw.length - 1].populateBuffer(end);
        document.getElementById("info").innerHTML = Math.round(clip[0] * 100) / 100 + ", "+ Math.round(clip[1] * 100) / 100;
    }
}

/* mouse up event handler */
function getMouseUp(event) {
    isMouseDown = false;
    var clip = mouseToClip(event);
    document.getElementById("info").innerHTML = Math.round(clip[0] * 100) / 100 + ", "+ Math.round(clip[1] * 100) / 100;
}

/* set shape */
function setShape(value) {
    currentShape = value;
}

/* set color */
function setColor(value) {
    var rgb = hexToRGB(value);
    materialColor = [rgb.r / 255.0, rgb.g / 255.0, rgb.b / 255.0, 1.0];
}

/* set scale */
function setScale(index, value) {
    objectsToDraw[objectsToDraw.length - 1].scale[index] = value;
}

/* set rotation */
function setRotation(index, value) {
    objectsToDraw[objectsToDraw.length - 1].rotate[index] = value;
}

/* set translation */
function setTranslation(index, value) {
    objectsToDraw[objectsToDraw.length - 1].translate[index] = value;
}

/* clear canvas */
function resetCanvas() {
    objectsToDraw = [];
}

/* save canvas as image */
function saveImage() {
    var dataURL = canvas.toDataURL('image/png');
    window.open(dataURL, "_blank");
}

/* capture shift key press */
function handleKeyDown(event){
    if (event.keyCode === 16 || event.charCode === 16){
        shiftDown = true;
    }
    
    if (event.keyCode > 32 && event.keyCode < 41) {
        switch (event.keyCode) {
            case 33:
                zoom += 0.1;
                break;
            case 34:
                zoom -= 0.1;
                break;
            case 37:
                theta += 1.0;
                break;
            case 39:
                theta -= 1.0;
                break;
            case 38:
                phi += 1.0;
                break;
            case 40:
                phi -= 1.0;
                break;
        }
        changeCameraPosition();
        event.preventDefault();
    }
};

function handleKeyUp(event){
    if (event.keyCode === 16 || event.charCode === 16){
        shiftDown = false;
    }
};
