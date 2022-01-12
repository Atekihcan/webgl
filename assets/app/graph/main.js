"use strict";

/* global variables */
var canvas, gl, program, pickBuf, browser;
var shaders = ["shader.vert", "shader.frag"];
var stopRender = false;

var SHAPES = {
    // shape name: {id, details}
    "Point": { id: 0, details: 0},
    "Axis": { id: 1, details: 100}
};

var AXES = [];
var objectsToDraw = [];
var currentObjectID = null;

/* mouse controls */
var lastPosition = [];
var shiftDown = false;
var isMouseDown = false, addNew = false, doAnimation = false;

/* camera/projection matrices */
var cameraMatrix, pMatrix;
const at = [0.0, 0.0, 0.0];
const up = [0.0, 1.0, 0.0];
var zoom = 1.0, theta = 0.0, phi = 0.0, time = 0.0, dt = 0.1;

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
    gl.clearColor(1.0, 1.0, 1.0, 1.0);
    gl.enable(gl.DEPTH_TEST);

    // set projection and model-view matrix
    pMatrix = ortho(-1.0, 1.0, -1.0, 1.0, 1.0, -1.0);
    changeCameraPosition();

    // compile shaders and get the program object
    // all objects will share same shaders, i.e same program object
    program = getProgram(gl, shaderSources[0], shaderSources[1]);
    if (program != null) {
        gl.useProgram(program);
    }

    // create and load object primitive vertex data
    // most other object types can be created by transforming these primitives
    var jsonData = loadFileAJAX("/webgl/assets/models/point.json", false),
        vertData = JSON.parse(jsonData);
    for (var key in SHAPES) {
        SHAPES[key].vbo = gl.createBuffer();
        SHAPES[key].program = program;
        gl.bindBuffer(gl.ARRAY_BUFFER, SHAPES[key].vbo);
        gl.bufferData(gl.ARRAY_BUFFER, flatten(vertData.v), gl.STATIC_DRAW);
        SHAPES[key].numVert = vertData.v.length;
    }

    // texture and framebuffer for offscreen rendering for object picking
    var texture = gl.createTexture();
    gl.bindTexture( gl.TEXTURE_2D, texture );
    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, canvas.width, canvas.height, 0, gl.RGBA, gl.UNSIGNED_BYTE, null);
    gl.generateMipmap(gl.TEXTURE_2D);
    var renderbuffer = gl.createRenderbuffer();
    gl.bindRenderbuffer(gl.RENDERBUFFER, renderbuffer);
    gl.renderbufferStorage(gl.RENDERBUFFER, gl.DEPTH_COMPONENT16, canvas.width, canvas.height);
    // Allocate a frame buffer object
    pickBuf = gl.createFramebuffer();
    gl.bindFramebuffer( gl.FRAMEBUFFER, pickBuf);
    // Attach color buffer
    gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, texture, 0);
    gl.framebufferRenderbuffer(gl.FRAMEBUFFER, gl.DEPTH_ATTACHMENT, gl.RENDERBUFFER, renderbuffer);
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
}

/* load global uniforms */
function loadGlobalUniforms() {
    gl.uniformMatrix4fv(gl.getUniformLocation(program, "u_pMatrix"), false, flatten(pMatrix));
}

/* load object specific uniforms */
function loadObjectUniforms(object) {
    if (object.selected) {
        gl.uniform4fv(gl.getUniformLocation(object._gl.program, "u_matDiffuse"), flatten(getComplement(object.matDiffuse)));
    }else {
        gl.uniform4fv(gl.getUniformLocation(program, "u_matDiffuse"), flatten(object.matDiffuse));
    }

    if (object.shape == 0) {
        var mvMatrix = mult(cameraMatrix, translate(object.translate[0], object.translate[1], object.translate[2]));
        gl.uniformMatrix4fv(gl.getUniformLocation(program, "u_mvMatrix"), false, flatten(mvMatrix));
    } else {
        var mvMatrix = mult(cameraMatrix, translate(object.translate[0], object.translate[1], object.translate[2]));
        mvMatrix = mult(mvMatrix, rotate(object.rotate[2], [0, 0, 1]));
        mvMatrix = mult(mvMatrix, rotate(object.rotate[1], [0, 1, 0]));
        mvMatrix = mult(mvMatrix, rotate(object.rotate[0], [1, 0, 0]));
        mvMatrix = mult(mvMatrix, scale(object.scale[0], object.scale[1], object.scale[2]));
        gl.uniformMatrix4fv(gl.getUniformLocation(program, "u_mvMatrix"), false, flatten(mvMatrix));
    }
}

/* upload vertex data to GPU */
function loadVertexAttribs(ctx) {
    gl.bindBuffer(gl.ARRAY_BUFFER, ctx.vbo);
    var vPos = gl.getAttribLocation(program, "vPos");
    gl.vertexAttribPointer(vPos, 3, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(vPos);
}

/* render frames recursively */
function render() {
    if (!stopRender) {
        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
        gl.uniform1i(gl.getUniformLocation(program, "u_offscreen"), 0);
        loadGlobalUniforms();
        AXES.forEach(function(object) {
            loadVertexAttribs(object._gl);
            loadObjectUniforms(object);
            object.draw(gl, false);
        });
        objectsToDraw.forEach(function(object) {
            loadVertexAttribs(object._gl);
            loadObjectUniforms(object);
            object.draw(gl, false);
        });
    }
    if (doAnimation) {
        animate();
    }
    window.requestAnimFrame(render);
}

function renderOffline() {
    if (!stopRender) {
        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
        gl.uniform1i(gl.getUniformLocation(program, "u_offscreen"), 1);
        loadGlobalUniforms();
        var i = 0;
        objectsToDraw.forEach(function(object) {
            gl.uniform3fv(gl.getUniformLocation(program, "u_color"), flatten(encodeColor(i)));
            loadVertexAttribs(object._gl);
            loadObjectUniforms(object);
            object.draw(gl, true);
            i++;
        });
    }
}

/* start the application */
window.onload = function init() {
    browser = checkBrowserType();
    asyncLoadShaders("assignment04", shaders, initWebGL);
    document.addEventListener('keydown', handleKeyDown);
    document.addEventListener('keyup', handleKeyUp);

    AXES.push(new Geometry(SHAPES["Axis"], { matDiffuse: [1.0, 0.0, 0.0, 1.0], scale: [zoom, 0, 0] }));
    AXES.push(new Geometry(SHAPES["Axis"], { matDiffuse: [0.0, 1.0, 0.0, 1.0], rotate: [0, 0, 90], scale: [zoom, 0, 0] }));
    //objectsToDraw.push(new Geometry(SHAPES["Point"], { translate: [0.5, 0.3, 0.0] }));
    render();
};

/***************************************************
 *                geometry utils                   *
 ***************************************************/
/* make model-view matrix depending upon eye position */
function changeCameraPosition() {
    var eye = vec3(
        zoom * Math.sin(radians(theta)) * Math.cos(radians(phi)),
        zoom * Math.sin(radians(theta)) * Math.sin(radians(phi)),
        zoom * Math.cos(radians(theta))
    );
    cameraMatrix = lookAt(eye, at , up);
}

/***************************************************
 *                    UI handlers                  *
 ***************************************************/
/* get mouse coordinate */
function mousePos(e) {
    var rect = canvas.getBoundingClientRect();
    var x = e.clientX - rect.left,
        y = e.clientY - rect.top;
    return [x, y];
}

/* get mouse coordinate in terms of clip coordinate */
function mouseToClip(e) {
    var click = mousePos(e);
    return vec2(
        (-1 + 2 * click[0] / canvas.scrollWidth),
        (-1 + 2 * (canvas.scrollHeight - click[1]) / canvas.scrollHeight)
    );
}

/* pick object */
function pick(x, y) {
    var ret = false;
    var color = new Uint8Array(4);
    var stretch = [canvas.width / canvas.scrollWidth, canvas.height / canvas.scrollHeight];
    gl.bindFramebuffer(gl.FRAMEBUFFER, pickBuf);
    renderOffline();
    gl.readPixels(parseInt(x * stretch[0]), parseInt(canvas.height - y * stretch[1]), 1, 1, gl.RGBA, gl.UNSIGNED_BYTE, color);
    //console.log(parseInt(x * stretch[0]), parseInt(y * stretch[1]), color);
    if (currentObjectID != null) {
        objectsToDraw[currentObjectID].selected = false;
    }
    if (color[3] > 0) {
        var id = decodeColor(color);
        if (id >= 0 && id < objectsToDraw.length) {
            selectObject(id + 1);
            ret = true;
        } else {
            currentObjectID = null;
        }
    }
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    return ret;
}

/* mouse down event handler */
function getMouseDown(event) {
    isMouseDown = true;
    var clip = mouseToClip(event);
    var clik = mousePos(event);
    addNew = !pick(clik[0], clik[1]);
    if (addNew) {
        objectsToDraw.push(new Geometry(SHAPES["Point"], { matDiffuse: [0.2, 0.2, 0.8, 1.0], translate: [clip[0], clip[1], 0.0] }));
    }
}

/* mouse move event handler */
function getMouseMove(event) {
    var clip = mouseToClip(event);
    if (isMouseDown) {
        if (!addNew) {
            objectsToDraw[currentObjectID].translate[0] = clip[0];
            objectsToDraw[currentObjectID].translate[1] = clip[1];
        }
    }
    document.getElementById("info").innerHTML = Math.round(clip[0] * 100) / 100 + ", " + Math.round(clip[1] * 100) / 100;
}

/* mouse up event handler */
function getMouseUp(event) {
    isMouseDown = false;
}

/* set shape */
function selectObject(value) {
    if (value > 0 && value <= objectsToDraw.length) {
        var temp;
        if (currentObjectID != null) {
            objectsToDraw[currentObjectID].selected = false;
        }
        currentObjectID = value - 1;
        objectsToDraw[currentObjectID].selected = true;
    } else {
        console.log("There is no object at index " + value);
    }
}

/* delete object */
function deleteObject() {
    objectsToDraw.splice(currentObjectID, 1);
    currentObjectID = null;
}

/* clear canvas */
function resetCanvas() {
    objectsToDraw = [];
    currentObjectID = null;
}

/* capture key press */
function handleKeyDown(event){
    switch (event.keyCode) {
        case 82: // R key to reset canvas
            resetCanvas();
            break;
        case 83: // S key to start/stop animation
            doAnimation = !doAnimation;
            break;
        case 46: // delete key to delete object
            deleteObject();
            event.preventDefault();
            break;
    }
};

function handleKeyUp(event){
}

/* animate points */
function animate() {
    objectsToDraw.forEach(function(object) {
        object.translate[1] += 0.1 * Math.sin(time) * Math.cos(time);
    });
    time += dt;
}
