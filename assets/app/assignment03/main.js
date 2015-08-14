"use strict";

/* global variables */
var canvas, gl, program, pickBuf, browser;
var shaders = ["shader.vert", "shader.frag"];
var stopRender = false;

var SHAPES = {
    // shape id: [shape name, number of vertices]
    0: ["light", 0],
    1: ["xAxis", 0],
    2: ["yAxis", 0],
    3: ["zAxis", 0],
    4: ["Cube", 0],
    5: ["Sphere", 0],
    6: ["Cylinder", 0],
    7: ["Cone", 0]
};

var AXES = [];
var LIGHTS = [];
var shapeBufs = [];
var objectsToDraw = [];
var currentShape  = 5;
var currentObjectID = null;

/* mouse controls */
var mouseMode = "Draw";
var mouseModeInfo;
var lastPosition = [];
var shiftDown = false;
var isMouseDown = false;

/* object properties */
var currentColor       = [1.0, 0.0, 0.0, 1.0];
var currentScale       = [1.0, 1.0, 1.0];
var currentRotate      = [0, 0, 0];
var currentTranslate   = [0.0, 0.0, 0.0];
var currentEnableLight = true;
var currentEnableFill  = true;
var currentEnableWireFrame = false;

/* object ui parameters */
var objectPanel, uiShapeSelector, uiObjectCol;
var uiObjectPos = [], uiObjectPosVal = [];
var uiObjectLight, uiObjectFill, uiObjectWireFrame;

/* lights */
var ambientLight       = [0.2, 0.2, 0.2];
var pointLightSpecular = [1.0, 1.0, 1.0];
var pointLightDiffuse  = [1.0, 1.0, 1.0];
var pointLightPos      = [0.0, 0.0, 1.0];

/* lights UI parameters */
var ambientLightOn, pointLightOn;
var uiPointLightPos = [], uiPointLightPosVal = [];

/* camera/projection matrices */
var cameraMatrix, pMatrix;
const at = [0.0, 0.0, 0.0];
const up = [0.0, 1.0, 0.0];
var zoom = 4.0, theta = 30.0, phi = 30.0;

var VERT_STRIDE  = sizeof['vec3'] + sizeof['vec3'];

/***************************************************
 *                  WebGL functions                *
 ***************************************************/
/* initialize WebGL context */
function initWebGL(shaderSources) {
    canvas = document.getElementById("gl-canvas");
    // for small screen devices use a square canvas
    var canvas_xs = document.getElementById("gl-canvas-xs");
    if (window.innerWidth < 768) {
        canvas.style.display = "none";
        canvas = canvas_xs;
        canvas.style.display = "";
    }
    canvas.addEventListener("mousedown", getMouseDown, false);
    canvas.addEventListener("mousemove", getMouseMove, false);
    canvas.addEventListener("mouseup", getMouseUp, false);
    canvas.addEventListener("wheel", getMouseWheel, false);

    gl = WebGLUtils.setupWebGL(canvas, {preserveDrawingBuffer: true});
    if (!gl) {
        alert("[ERROR] WebGL isn't available");
        return;
    }
    // set the canvas
    gl.viewport(0, 0, canvas.width, canvas.height);
    gl.clearColor(0.1, 0.1, 0.2, 1.0);
    gl.enable(gl.DEPTH_TEST);

    // set projection and model-view matrix
    pMatrix = perspective(45.0, canvas.width / canvas.height, 1.0, -1.0);
    changeCameraPosition();

    // create and load object primitive vertex data
    // most other object types can be created by transforming these primitives
    for (var key in SHAPES) {
        var i = parseInt(key);
        shapeBufs.push(gl.createBuffer());
        gl.bindBuffer(gl.ARRAY_BUFFER, shapeBufs[i]);
        gl.bufferData(gl.ARRAY_BUFFER, flatten(getPrimitiveVertexData(i)), gl.STATIC_DRAW);
    }

    // compile shaders and get the program object
    // all objects will share same shaders, i.e same program object
    program = getProgram(gl, shaderSources[0], shaderSources[1]);
    if (program != null) {
        gl.useProgram(program);
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
    gl.uniform1i(gl.getUniformLocation(program, "u_pointLightOn"), pointLightOn.checked);
    gl.uniform1i(gl.getUniformLocation(program, "u_ambientLightOn"), ambientLightOn.checked);
    gl.uniform3fv(gl.getUniformLocation(program, "u_ambientLight"), flatten(ambientLight));
    gl.uniform3fv(gl.getUniformLocation(program, "u_pointLightSpecular"), flatten(pointLightSpecular));
    gl.uniform3fv(gl.getUniformLocation(program, "u_pointLightDiffuse"), flatten(pointLightDiffuse));
    gl.uniformMatrix4fv(gl.getUniformLocation(program, "u_pMatrix"), false, flatten(pMatrix));
}

/* load object specific uniforms */
function loadObjectUniforms(object) {
    gl.uniform1i(gl.getUniformLocation(program, "u_lightON"), object.lighting);
    gl.uniform4fv(gl.getUniformLocation(program, "u_materialColor"), flatten(object.materialColor));

    if (object.shape == 0) {
        var mvMatrix = mult(cameraMatrix, translate(object.center[0], object.center[1], object.center[2]));
        gl.uniformMatrix4fv( gl.getUniformLocation(program, "u_mvMatrix"), false, flatten(mvMatrix) );
    } else if (object.shape > 3) {
        var mvMatrix = mult(cameraMatrix, translate(object.center[0], object.center[1], object.center[2]));
        mvMatrix = mult(mvMatrix, rotate(object.rotate[0], [1, 0, 0]));
        mvMatrix = mult(mvMatrix, rotate(object.rotate[1], [0, 1, 0]));
        mvMatrix = mult(mvMatrix, rotate(object.rotate[2], [0, 0, 1]));
        mvMatrix = mult(mvMatrix, scale(object.scale[0], object.scale[1], object.scale[2]));
        mvMatrix = mult(mvMatrix, translate(object.translate[0] - object.center[0], object.translate[1] - object.center[1], object.translate[2] - object.center[2]));
        gl.uniformMatrix4fv( gl.getUniformLocation(program, "u_mvMatrix"), false, flatten(mvMatrix) );
        var normMatrix = toInverseMat3(mvMatrix);
        if (normMatrix != null) {
            normMatrix = transpose(normMatrix);
            gl.uniformMatrix3fv( gl.getUniformLocation(program, "u_normMatrix"), false, flatten(normMatrix) );
        }
        var transformedPointLightPos = multMatVect(cameraMatrix, vec4(pointLightPos, 1.0));
        gl.uniform4fv(gl.getUniformLocation(program, "u_pointLightPos"), flatten(transformedPointLightPos));
    } else {
        gl.uniformMatrix4fv( gl.getUniformLocation(program, "u_mvMatrix"), false, flatten(cameraMatrix) );
    }
}

/* upload vertex data to GPU */
function loadVertexAttribs(vbo) {
    gl.bindBuffer(gl.ARRAY_BUFFER, vbo);
    var vPos = gl.getAttribLocation(program, "vPos");
    gl.vertexAttribPointer(vPos, 3, gl.FLOAT, false, sizeof['vec3'] * 2, 0);
    gl.enableVertexAttribArray(vPos);
    var vNorm = gl.getAttribLocation(program, "vNorm");
    gl.vertexAttribPointer(vNorm, 3, gl.FLOAT, false, sizeof['vec3'] * 2, sizeof['vec3']);
    gl.enableVertexAttribArray(vNorm);
}

/* render frames recursively */
function render() {
    if (!stopRender) {
        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
        gl.uniform1i(gl.getUniformLocation(program, "u_offscreen"), 0);
        AXES.forEach(function(object) {
            object.draw(false);
        });
        LIGHTS.forEach(function(object) {
            object.draw(false);
        });
        objectsToDraw.forEach(function(object) {
            object.draw(false);
        });
    }
    window.requestAnimFrame(render);
}

function renderOffline() {
    if (!stopRender) {
        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
        gl.uniform1i(gl.getUniformLocation(program, "u_offscreen"), 1);
        var i = 0;
        objectsToDraw.forEach(function(object) {
            gl.uniform3fv(gl.getUniformLocation(program, "u_color"), flatten(encodeColor(i)));
            object.draw(true);
            i++;
        });
    }
}

/* start the application */
window.onload = function init() {
    browser = checkBrowserType();
    asyncLoadShaders("assignment03", shaders, initWebGL);
    document.addEventListener('keydown', handleKeyDown);
    document.addEventListener('keyup', handleKeyUp);
    mouseModeInfo      = document.getElementById('mouseMode');
    pointLightOn       = document.getElementById('pointLight');
    ambientLightOn     = document.getElementById('ambientLight');
    objectPanel        = document.getElementById('objectPanel');
    uiObjectCol        = document.getElementById('objColUI');
    uiShapeSelector    = document.getElementById('shapeSelector');
    uiObjectLight      = document.getElementById('uiObjectLight');
    uiObjectFill       = document.getElementById('uiObjectFill');
    uiObjectWireFrame  = document.getElementById('uiObjectWireFrame');
    for (var i = 0; i < 3; i++) {
        for (var j = 0; j < 3; j++) {
            uiObjectPos.push(document.getElementById('uiObjectPos_' + i + j));
            uiObjectPosVal.push(document.getElementById('uiObjectPosVal_' + i + j));
        }
    }

    for (var i = 0; i < 3; i++) {
        uiPointLightPos.push(document.getElementById('uiPointLightPos_' + i));
        uiPointLightPosVal.push(document.getElementById('uiPointLightPosVal_' + i));
    }

    //console.log(shapeBufs);
    AXES.push(new Geometry(1, [1.0, 0.0, 0.0, 1.0]));
    AXES.push(new Geometry(2, [0.0, 1.0, 0.0, 1.0]));
    AXES.push(new Geometry(3, [0.0, 0.0, 1.0, 1.0]));
    LIGHTS.push(new Geometry(0, [0.0, 0.0, 0.0, 1.0], pointLightPos));
    //debug
    // objectsToDraw.push(new Geometry(6, currentColor, [0.0, 0.0, 0.0], false));
    // objectsToDraw[objectsToDraw.length - 1].modifyShape([0.5, 0.5]);
    // objectsToDraw[objectsToDraw.length - 1].render = true;
    // objectsToDraw.push(new Geometry(4, currentColor, [0.0, 0.0, -1.0], true));
    // objectsToDraw[objectsToDraw.length - 1].modifyShape([0.25, 0.25]);
    // objectsToDraw[objectsToDraw.length - 1].render = true;
    // rePopulateShapeSelector();
    render();
};

/***************************************************
 *                geometry objects                 *
 ***************************************************/
/* object primitive */
function Geometry(shape, color, start, symmetry) {
    start = setDefault(start, JSON.parse(JSON.stringify(currentTranslate)));
    symmetry = setDefault(symmetry, false);
    this.center            = start;
    this.scale             = JSON.parse(JSON.stringify(currentScale));
    this.rotate            = JSON.parse(JSON.stringify(currentRotate));
    this.translate         = start;
    this.shape             = shape;
    this.materialColor     = color;
    this.lighting          = currentEnableLight;
    this.symmetry          = symmetry;
    this.fill              = currentEnableFill;
    this.wireFrame         = currentEnableWireFrame;
    this.selected          = false;
    this.render            = false;
    this.buffer = {
        vbo: shapeBufs[this.shape],
        numVert: SHAPES[this.shape][2],
    };

    // disable lighting for special shapes(axes, lights) and enable rendering
    switch(this.shape) {
        case 0:
            this.lighting = false;
            this.render = true;
            break;
        case 1:
        case 2:
        case 3:
            this.lighting = false;
            this.render = true;
            break;
        case 4:
        case 5:
        case 6:
        case 7:
            break;
        default:
            console.log("Shape " + SHAPES[this.shape][0] + " is not supported");
            break;
    }

    // dynamically update the shape depending upon the mouse move endpoint
    this.modifyShape = function(end) {
        // hack to make symmetric shape when shift key is down
        if (this.symmetry) {
            if (Math.abs(this.center[0] - end[0]) != Math.abs(this.center[1] - end[1])) {
                end[1] = this.center[1] + sign(end[1] - this.center[1]) * Math.abs(this.center[0] - end[0]);
            }

            this.scale = [Math.abs(end[0] - this.center[0]), Math.abs(end[1] - this.center[1]), Math.abs(end[1] - this.center[1])];
        }
        this.scale = [Math.abs(end[0] - this.center[0]), Math.abs(end[1] - this.center[1]), Math.abs(end[1] - this.center[1])];
    };

    // draw method for objects
    this.draw = function(offline) {
        if (!this.render) {
            return;
        }
        loadGlobalUniforms();
        loadVertexAttribs(this.buffer.vbo);
        loadObjectUniforms(this);
        switch(this.shape) {
            case 0:
                gl.drawArrays(gl.POINTS, 0, this.buffer.numVert);
                break;
            case 1:
            case 2:
            case 3:
                gl.drawArrays(gl.LINES, 0, this.buffer.numVert);
                break;
            case 4:
            case 5:
            case 6:
            case 7:
                if (offline || this.fill) {
                    gl.drawArrays(gl.TRIANGLES, 0, this.buffer.numVert);
                }
                if (!offline && this.selected) {
                    for(var i = 0; i < this.buffer.numVert; i += 3) {
                        gl.uniform4fv(gl.getUniformLocation(program, "u_materialColor"), flatten(getComplement(this.materialColor)));
                        gl.drawArrays(gl.LINE_LOOP, i, 3);
                    }
                }
                if (!offline && this.wireFrame && !this.selected) {
                    for(var i = 0; i < this.buffer.numVert; i += 3) {
                        gl.uniform4fv(gl.getUniformLocation(program, "u_materialColor"), flatten([0.2, 0.7, 0.9, 1.0]));
                        gl.drawArrays(gl.LINE_LOOP, i, 3);
                    }
                }
                break;
            default:
                console.log("Shape " + SHAPES[this.shape][0] + " is not supported");
                break;
        }
    };
}

/* return vertex data for primitive object */
function getPrimitiveVertexData(index) {
    var v = [];
    switch(index) {
        // lights
        case 0:
            v.push([0.0, 0.0, 0.0]);
            v.push([0.0, 0.0, 0.0]);
            break;
        // axes
        case 1:
        case 2:
        case 3:
            var a = -zoom, b = zoom;
            var posEnd = [0.0, 0.0, 0.0];
            posEnd[index - 1] = b;

            // positive axis - solid
            v.push([0.0, 0.0, 0.0]);
            v.push([0.0, 0.0, 0.0]);
            v.push(posEnd);
            v.push([0.0, 0.0, 0.0]);
            // negative axis - dotted
            for (var i = 0; i < 100; i++) {
                var negEnd = [0.0, 0.0, 0.0];
                negEnd[index - 1] = i * a / 100;
                v.push(negEnd);
                v.push([0.0, 0.0, 0.0]);
            }
            break;
        // cube
        case 4:
            v = getCubeVertexData();
            break;
        case 5:
            v = getSphereVertexData();
            break;
        case 6:
            v = getCylinderVertexData();
            break;
        case 7:
            v = getConeVertexData();
            break;
        default:
            console.error("shape " + SHAPES[index][0] + " is not supported");
            break;
    }

    SHAPES[index][2] = v.length / 2;
    return v;
}

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
        (-1 + 2 * click[0] / canvas.scrollWidth) * zoom,
        (-1 + 2 * (canvas.scrollHeight - click[1]) / canvas.scrollHeight) * zoom / 2.0
    );
}

/* pick object */
function pick(x, y) {
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
            uiShapeSelector.selectedIndex = id + 1;
            selectObject(id + 1);
            objectPanel.style.display = "";
        } else {
            uiShapeSelector.selectedIndex = 0;
            currentObjectID = null;
            objectPanel.style.display = "none";
        }
    }
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
}

/* mouse down event handler */
function getMouseDown(event) {
    isMouseDown = true;
    stopRender = false;
    var clip = mouseToClip(event);
    if (mouseMode == "Select") {
        var clik = mousePos(event);
        pick(clik[0], clik[1]);
    }
    if (mouseMode == "Move") {
        lastPosition = mousePos(event);
        if (browser.chrome || browser.safari) {
            canvas.style.cursor = "-webkit-grabbing";
        } else {
            canvas.style.cursor = "grabbing";
        }
    }
    if (mouseMode == "Draw") {
        objectsToDraw.push(new Geometry(currentShape, currentColor, [clip[0], clip[1], 0.0], SHAPES[currentShape][1] || shiftDown));
        // add new object to shape select list
        rePopulateShapeSelector();
        currentObjectID = objectsToDraw.length - 1;
    }
}

/* mouse move event handler */
function getMouseMove(event) {
    var clip = mouseToClip(event);
    if (isMouseDown) {
        if (mouseMode == "Draw") {
            if (!objectsToDraw[currentObjectID].render) {
                objectsToDraw[currentObjectID].render = true;
            }
            objectsToDraw[currentObjectID].modifyShape(clip);
        } else if (mouseMode == "Move" && typeof(lastPosition[0]) != 'undefined') {
            var newPosition = mousePos(event);
            var d = moveDirection(newPosition, lastPosition);
            theta -= 1.0 * d[0];
            phi -= 1.0 * d[1];
            changeCameraPosition();
            lastPosition = newPosition;
        }
    }
    document.getElementById("info").innerHTML = Math.round(clip[0] * 100) / 100 + ", " + Math.round(clip[1] * 100) / 100;
}

/* mouse up event handler */
function getMouseUp(event) {
    isMouseDown = false;
    if (mouseMode == "Draw") {
        // delete the last object created just by click
        if (currentObjectID != null && !objectsToDraw[currentObjectID].render) {
            currentObjectID--;
            objectsToDraw.pop();
            rePopulateShapeSelector();
        } else {
            uiShapeSelector.selectedIndex = 0;
            currentObjectID = null;
        }
    } else if (mouseMode == "Move") {
        lastPosition = [];
        if (browser.chrome || browser.safari) {
            canvas.style.cursor = "-webkit-grab";
        } else {
            canvas.style.cursor = "grab";
        }
    }
}

/* mouse up event handler */
function getMouseWheel(event) {
    if (event.deltaY > 0) {
        zoomin(false);
    } else {
        zoomin(true);
    }
    changeCameraPosition();
    event.preventDefault();
}

/* set shape */
function selectObject(value) {
    if (value > 0 && value <= objectsToDraw.length) {
        var temp;
        if (currentObjectID != null) {
            objectsToDraw[currentObjectID].selected = false;
        }
        currentObjectID = value - 1;
        uiObjectCol.style.backgroundColor = nrgbToHex(objectsToDraw[currentObjectID].materialColor);
        uiObjectLight.checked     = objectsToDraw[currentObjectID].lighting;
        uiObjectFill.checked      = objectsToDraw[currentObjectID].fill;
        uiObjectWireFrame.checked = objectsToDraw[currentObjectID].wireFrame;
        for (var i = 0; i < 9; i++) {
            if (i % 3 == 0) {
                temp = roundDown(objectsToDraw[currentObjectID].scale[Math.floor(i / 3)]);
                uiObjectPos[i].value = temp;
                uiObjectPosVal[i].innerHTML = temp;
            } else if (i % 3 == 1) {
                temp = roundDown(objectsToDraw[currentObjectID].rotate[Math.floor(i / 3)]);
                uiObjectPos[i].value = temp;
                uiObjectPosVal[i].innerHTML = temp;
            } else {
                temp = roundDown(objectsToDraw[currentObjectID].translate[Math.floor(i / 3)]);
                uiObjectPos[i].value = temp;
                uiObjectPosVal[i].innerHTML = temp;
            }
        }
        objectsToDraw[currentObjectID].selected = true;
        canvas.style.cursor = "default";
    } else {
        console.log("There is no object at index " + value);
    }
}

/* set color */
function setColor(value) {
    var rgb = hexToRGB(value);
    currentColor = [rgb.r / 255.0, rgb.g / 255.0, rgb.b / 255.0, 1.0];
    if (currentObjectID != null) {
        objectsToDraw[currentObjectID].materialColor = currentColor;
    }
}

/* set scale */
function setScale(index, value) {
    currentScale[index] = value;
    uiObjectPosVal[index * 3].innerHTML = value;
    if (currentObjectID != null) {
        objectsToDraw[currentObjectID].scale[index] = value;
    }
}

/* set rotation */
function setRotation(index, value) {
    currentRotate[index] = value;
    uiObjectPosVal[index * 3 + 1].innerHTML = value;
    if (currentObjectID != null) {
        objectsToDraw[currentObjectID].rotate[index] = value;
    }
}

/* set translation */
function setTranslation(index, value) {
    currentTranslate[index] = value;
    uiObjectPosVal[index * 3 + 2].innerHTML = value;
    if (currentObjectID != null) {
        objectsToDraw[currentObjectID].translate[index] = value;
    }
}

/* lighting/fill/wireframe checkboxes */
function enableLight(value) {
    currentEnableLight = value;
    if (currentObjectID != null) {
        objectsToDraw[currentObjectID].lighting = value;
    }
}

function enableFill(value) {
    currentEnableFill = value;
    if (currentObjectID != null) {
        objectsToDraw[currentObjectID].fill = value;
    }
}

function enableWireFrame(value) {
    currentEnableWireFrame = value;
    if (currentObjectID != null) {
        objectsToDraw[currentObjectID].wireFrame = value;
    }
}

/* delete object */
function deleteObject() {
    objectsToDraw.splice(currentObjectID, 1);
    rePopulateShapeSelector();
    uiShapeSelector.selectedIndex = 0;
    currentObjectID = null;
}

/* select shape for new object */
function selectShape(shapeType) {
    mouseMode = "Draw";
    mouseModeInfo.innerHTML = "DRAW";
    if (currentObjectID != null) {
        objectsToDraw[currentObjectID].selected = false;
    }
    currentShape = shapeType;
    canvas.style.cursor = "crosshair";
    uiShapeSelector.selectedIndex = 0;
    currentObjectID = null;
    /*
    // disable drawing new object.. may be later?
    var center = [uiObjectPos[2].value, uiObjectPos[5].value, uiObjectPos[8].value];
    var newObject = new Geometry(shapeType, currentColor, center);
    newObject.scale = [uiObjectPos[0].value, uiObjectPos[3].value, uiObjectPos[6].value];
    newObject.rotate = [uiObjectPos[1].value, uiObjectPos[4].value, uiObjectPos[7].value];
    newObject.render = true;
    objectsToDraw.push(newObject);
    rePopulateShapeSelector();
    currentObjectID = objectsToDraw.length - 1;
    */
}

/* set canvas color */
function setBGColor(value) {
    var rgb = hexToRGB(value);
    gl.clearColor(rgb.r / 255.0, rgb.g / 255.0, rgb.b / 255.0, 1.0);
    gl.clear(gl.COLOR_BUFFER_BIT);
}

/* reset axes rotation */
function resetAxes() {
    zoom = 4.0, theta = 30.0, phi = 30.0;
    changeCameraPosition();
}

/* clear canvas */
function resetCanvas() {
    objectsToDraw = [];
    uiShapeSelector.selectedIndex = 0;
    currentObjectID = null;
    rePopulateShapeSelector();
}

/* save canvas as image */
function saveImage() {
    var dataURL = canvas.toDataURL('image/png');
    window.open(dataURL, "_blank");
}

/* capture key press */
function handleKeyDown(event){
    switch (event.keyCode) {
        case 16: // SHIFT key for drawing symmetrical shape
            shiftDown = true;
            break;
        case 82: // R key to reset the axes rotation
            resetAxes();
            break;
        case 72: // H key show/hide help
            toggleControls('helpPanel');
            break;
        case 46: // delete key to delete object
            deleteObject();
            event.preventDefault();
            break;
    }

    if (event.keyCode > 32 && event.keyCode < 41) {
        switch (event.keyCode) {
            case 33: // page up to zoom in
                zoomin(true);
                break;
            case 34: // page down to zoom out
                zoomin(false);
                break;
            case 37: // left
                theta -= 1.0;
                break;
            case 39: // right
                theta += 1.0;
                break;
            case 38: // up
                phi += 1.0;
                break;
            case 40: // down
                phi -= 1.0;
                break;
        }
        changeCameraPosition();
        event.preventDefault();
    }
};

function handleKeyUp(event){
    if (event.keyCode === 16){
        shiftDown = false;
    }
}

/* light options UI */
function setAmbientLightColor(value) {
    var rgb = hexToRGB(value);
    ambientLight = [rgb.r / 255.0, rgb.g / 255.0, rgb.b / 255.0];
}

function setPointLightColor(value) {
    var rgb = hexToRGB(value);
    pointLightSpecular = [rgb.r / 255.0, rgb.g / 255.0, rgb.b / 255.0];
    pointLightDiffuse  = [rgb.r / 255.0, rgb.g / 255.0, rgb.b / 255.0];
}

function setPointLightPos(index, value) {
    pointLightPos[index] = value;
    uiPointLightPosVal[index].innerHTML = value;
}

/* populate shape selector */
function rePopulateShapeSelector() {
    uiShapeSelector.options.length = 0;
    var i = 1;
    var option = document.createElement("option");
    option.text = "Select Object";
    option.value = 0;
    uiShapeSelector.appendChild(option);
    objectsToDraw.forEach(function(object) {
        var option = document.createElement("option");
        option.text = "Object_" + i + " (" + SHAPES[object.shape][0] + ")";
        option.value = i;
        uiShapeSelector.appendChild(option);
        i++;
    });
}

/**/
function enablePicking() {
    mouseMode = "Select";
    mouseModeInfo.innerHTML = "SELECT";
    canvas.style.cursor = "default";
}

function enableCameraMove() {
    mouseMode = "Move";
    mouseModeInfo.innerHTML = "CAMERA";
    if (browser.chrome || browser.safari) {
        canvas.style.cursor = "-webkit-grab";
    } else {
        canvas.style.cursor = "grab";
    }
}

/* camera movements */
function zoomin(flag) {
    if (flag) {
        if (zoom > 1.5) {
            zoom -= 0.1;
        }
        canvas.style.cursor = "zoom-in";
    } else {
        if (zoom < 5.0) {
            zoom += 0.1;
        }
        canvas.style.cursor = "zoom-out";
    }
    setTimeout(function() {
        if (mouseMode == "Draw") {
            canvas.style.cursor = "crosshair";
        } else {
            canvas.style.cursor = "default";
        }
    }, 500);
}