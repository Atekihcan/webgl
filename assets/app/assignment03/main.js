"use strict";

/* global variables */
var canvas, gl, program;
var shaders = ["shader.vert", "shader.frag"];
var stopRender = false;

var SHAPES = {
    0: ["light", 1],
    1: ["xAxis", 1],
    2: ["yAxis", 1],
    3: ["zAxis", 1],
    4: ["Cube", 1],
    5: ["Cuboid", 0],
};

var AXES = [];
var LIGHTS = [];
var objectsToDraw = [];

var drawNew = true;
var shapeBufs = [];
var currentShape  = 4;
var currentObjectID = null;
var uiShapeSelector, uiObjectCol; 
var uiObjectPos = [], uiObjectPosVal = [];
var uiPointLightPos = [], uiPointLightPosVal = [];
var shiftDown = false;
var isMouseDown = false;

/* uniforms */
var ambientLight       = [0.2, 0.2, 0.2];
var pointLightSpecular = [1.0, 1.0, 1.0];
var pointLightDiffuse  = [1.0, 1.0, 1.0];
var pointLightPos      = [0.0, 0.0, 1.0];
var currentColor       = [1.0, 0.0, 0.0, 1.0];

/* lights UI checkboxes */
var ambientLightOn, pointLightOn;

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
    gl.clearColor(0.3, 0.3, 0.3, 1.0);
    gl.enable(gl.DEPTH_TEST);

    // set projection and model-view matrix
    pMatrix = perspective(45.0, canvas.width / canvas.height, 1.0, -1.0);
    changeCameraPosition();
    
    // create and load object primitive vertex data
    // most other object types can be created by transforming these primitives
    for (var i = 0; i < 6; i++) {
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
        gl.clear( gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
        AXES.forEach(function(object) {
            object.draw();
        });
        LIGHTS.forEach(function(object) {
            object.draw();
        });
        objectsToDraw.forEach(function(object) {
            object.draw();
        });
    }
    window.requestAnimFrame(render);
}

/* start the application */
window.onload = function init() {
    asyncLoadShaders("assignment03", shaders, initWebGL);
    document.addEventListener('keydown', handleKeyDown);
    document.addEventListener('keyup', handleKeyUp);
    pointLightOn = document.getElementById('pointLight');
    ambientLightOn = document.getElementById('ambientLight');
    uiObjectCol    = document.getElementById('objColUI');
    uiShapeSelector = document.getElementById("shapeSelector");
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
    //objectsToDraw.push(new Geometry(5, currentColor, [0.0, 0.0, 0.0], false));
    //objectsToDraw[objectsToDraw.length - 1].modifyShape([0.5, 0.25]);
    //objectsToDraw.push(new Geometry(4, currentColor, [0.0, 0.0, -1.0], true));
    //objectsToDraw[objectsToDraw.length - 1].modifyShape([0.25, 0.25]);
    render();
};

/***************************************************
 *                geometry objects                 *
 ***************************************************/
/* object primitive */
function Geometry(shape, color, start, symmetry) {
    start = setDefault(start, [0.0, 0.0, 0.0]);
    symmetry = setDefault(symmetry, false);
    this.center            = start;
    this.scale             = [0.0, 0.0, 0.0];
    this.rotate            = [0.0, 0.0, 0.0];
    this.translate         = start;
    this.shape             = shape;
    this.materialColor     = color;
    this.lighting          = true;
    this.symmetry          = symmetry;
    this.fill              = true;
    this.wireFrame         = false;
    this.selected          = false;
    this.buffer = {
        vbo: shapeBufs[this.shape],
        numVert: 0,
    };
    
    // disable lighting for special shapes(axes, lights) and set number of vertices
    switch(this.shape) {
        case 0:
            this.lighting = false;
            this.buffer.numVert = 1;
            break;
        case 1:
        case 2:
        case 3:
            this.lighting = false;
            this.buffer.numVert = 102;
            break;
        case 4:
        case 5:
            this.buffer.numVert = 36;
            break;
        default:
            console.log("Shape " + SHAPES[this.shape][0] + " is not supported");
            break;
    }

    // dynamically update the shape depending upon the mouse move endpoint
    this.modifyShape = function(end) {
        // hack to make cube from rectangle when shift key is down
        if (this.shape < 6 && this.symmetry) {
            if (Math.abs(this.center[0] - end[0]) != Math.abs(this.center[1] - end[1])) {
                end[1] = this.center[1] + sign(end[1] - this.center[1]) * Math.abs(this.center[0] - end[0]);
            }
            
            this.scale = [Math.abs(end[0] - this.center[0]), Math.abs(end[1] - this.center[1]), Math.abs(end[1] - this.center[1])];
        }
        this.scale = [Math.abs(end[0] - this.center[0]), Math.abs(end[1] - this.center[1]), Math.abs(end[1] - this.center[1])];
    };
    
    // draw method for objects
    this.draw = function() {
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
                if (this.fill) {
                    gl.drawArrays(gl.TRIANGLES, 0, this.buffer.numVert);
                }
                if (this.wireFrame && !this.selected) {
                    for(var i = 0; i < this.buffer.numVert; i += 3) {
                        gl.uniform4fv(gl.getUniformLocation(program, "u_materialColor"), flatten([0.2, 0.7, 0.9, 1.0]));
                        gl.drawArrays(gl.LINE_LOOP, i, 3);
                    }
                }
                if (this.selected) {
                    for(var i = 0; i < this.buffer.numVert; i += 3) {
                        gl.uniform4fv(gl.getUniformLocation(program, "u_materialColor"), flatten(getComplement(this.materialColor)));  gl.drawArrays(gl.LINE_LOOP, i, 3);
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
            var a = -zoom / 2.0, b = zoom / 2.0;
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
        case 5:
            var vert = [
                /* front face */
                [-1.0, -1.0, +1.0],
                [+1.0, -1.0, +1.0],
                [+1.0, +1.0, +1.0],
                [-1.0, +1.0, +1.0],
                /* back face */
                [-1.0, -1.0, -1.0],
                [+1.0, -1.0, -1.0],
                [+1.0, +1.0, -1.0],
                [-1.0, +1.0, -1.0],
            ];
            
            v = [
                // front
                vert[0], [0.0,  0.0,  1.0], vert[1], [0.0,  0.0,  1.0], vert[2], [0.0,  0.0,  1.0],
                vert[0], [0.0,  0.0,  1.0], vert[2], [0.0,  0.0,  1.0], vert[3], [0.0,  0.0,  1.0],
                // back
                vert[4], [0.0,  0.0, -1.0], vert[5], [0.0,  0.0, -1.0], vert[6], [0.0,  0.0, -1.0],
                vert[4], [0.0,  0.0, -1.0], vert[6], [0.0,  0.0, -1.0], vert[7], [0.0,  0.0, -1.0],
                // left
                vert[0], [-1.0,  0.0,  0.0], vert[4], [-1.0,  0.0,  0.0], vert[7], [-1.0,  0.0,  0.0],
                vert[0], [-1.0,  0.0,  0.0], vert[7], [-1.0,  0.0,  0.0], vert[3], [-1.0,  0.0,  0.0],
                // right
                vert[1], [1.0,  0.0,  0.0], vert[5], [1.0,  0.0,  0.0], vert[6], [1.0,  0.0,  0.0],
                vert[1], [1.0,  0.0,  0.0], vert[6], [1.0,  0.0,  0.0], vert[2], [1.0,  0.0,  0.0],
                // top
                vert[2], [0.0,  1.0,  0.0], vert[6], [0.0,  1.0,  0.0], vert[7], [0.0,  1.0,  0.0],
                vert[2], [0.0,  1.0,  0.0], vert[7], [0.0,  1.0,  0.0], vert[3], [0.0,  1.0,  0.0],
                // bottom
                vert[1], [0.0, -1.0,  0.0], vert[5], [0.0, -1.0,  0.0], vert[4], [0.0, -1.0,  0.0],
                vert[1], [0.0, -1.0,  0.0], vert[4], [0.0, -1.0,  0.0], vert[0], [0.0, -1.0,  0.0]
            ];
            break;
        default:
            console.error("shape " + SHAPES[index][0] + " is not supported");
            break;
    }
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

/* return an approximate complimentary color */
function getComplement(c) {
    return [1.0 - c[0], 1.0 - c[1], 1.0 - c[2], c[3]];
}

/***************************************************
 *                    UI handlers                  *
 ***************************************************/
/* get mouse coordinate in terms of clip coordinate */
function mouseToClip(e) {
    var rect = canvas.getBoundingClientRect();
    var x = e.clientX - rect.left,
        y = e.clientY - rect.top;
    return vec2(
        (-1 + 2 * x / canvas.scrollWidth) * zoom / 2.0,
        (-1 + 2 * (canvas.scrollHeight - y) / canvas.scrollHeight) * zoom / 2.0
    );
}

/* mouse down event handler */
function getMouseDown(event) {
    isMouseDown = true;
    stopRender = false;
    var clip = mouseToClip(event);
    if (drawNew) {
        objectsToDraw.push(new Geometry(currentShape, currentColor, [clip[0], clip[1], 0.0], SHAPES[currentShape][1] || shiftDown));
        // add new object to shape select list
        var option = document.createElement("option");
        option.text = "Object_" + objectsToDraw.length + "(" + SHAPES[currentShape][0] + ")";
        option.value = objectsToDraw.length + 10;
        uiShapeSelector.appendChild(option);
        currentObjectID = objectsToDraw.length - 1;
    }
    document.getElementById("info").innerHTML = Math.round(clip[0] * 100) / 100 + ", "+ Math.round(clip[1] * 100) / 100;
}

/* mouse move event handler */
function getMouseMove(event) {
    if (isMouseDown) {
        var clip = mouseToClip(event);
        if (drawNew) {
            objectsToDraw[currentObjectID].modifyShape(clip);
        }
        document.getElementById("info").innerHTML = Math.round(clip[0] * 100) / 100 + ", "+ Math.round(clip[1] * 100) / 100;
    }
}

/* mouse up event handler */
function getMouseUp(event) {
    isMouseDown = false;
    if ((objectsToDraw[currentObjectID].scale[0] + objectsToDraw[currentObjectID].scale[1] + objectsToDraw[currentObjectID].scale[2]) === 0.0) {
        uiShapeSelector.remove(3 + currentObjectID);
        objectsToDraw.pop();
    }
    //var clip = mouseToClip(event);
    //document.getElementById("info").innerHTML = Math.round(clip[0] * 100) / 100 + ", "+ Math.round(clip[1] * 100) / 100;
}

/* mouse up event handler */
function getMouseWheel(event) {
    if (event.deltaY > 0) {
        zoom += 0.1;
        canvas.style.cursor = "zoom-out";
    } else {
        zoom -= 0.1;
        canvas.style.cursor = "zoom-in";
    }
    changeCameraPosition();
    event.preventDefault();
    setTimeout(function() {
        if (drawNew) {
            canvas.style.cursor = "crosshair";
        } else {
            canvas.style.cursor = "default";
        }
    }, 500);
}

/* set shape */
function setShape(value) {
    if (value > 3 && value < 10) {
        drawNew = true;
        currentShape = parseInt(value);
        objectsToDraw[currentObjectID].selected = false;
        canvas.style.cursor = "crosshair";
    } else if (value >= 10) {
        var temp;
        drawNew = false;
        objectsToDraw[currentObjectID].selected = false;
        currentObjectID = value - 11;
        uiObjectCol.value = nrgbToHex(objectsToDraw[currentObjectID].materialColor);
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
        console.log("Drawing " + value + " is not supported");
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
    if (currentObjectID != null) {
        objectsToDraw[currentObjectID].scale[index] = value;
    }
    uiObjectPosVal[index * 3].innerHTML = value;
}

/* set rotation */
function setRotation(index, value) {
    if (currentObjectID != null) {
        objectsToDraw[currentObjectID].rotate[index] = value;
    }
    uiObjectPosVal[index * 3 + 1].innerHTML = value;
}

/* set translation */
function setTranslation(index, value) {
    if (currentObjectID != null) {
        objectsToDraw[currentObjectID].translate[index] = value;
    }
    uiObjectPosVal[index * 3 + 2].innerHTML = value;
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
}

/* save canvas as image */
function saveImage() {
    var dataURL = canvas.toDataURL('image/png');
    window.open(dataURL, "_blank");
}

/* capture shift key press */
function handleKeyDown(event){
    switch (event.keyCode) {
        case 16:
            shiftDown = true;
            break;
        case 82:
            resetAxes();
            break;
    }
    
    if (event.keyCode > 32 && event.keyCode < 41) {
        switch (event.keyCode) {
            case 33:
                zoom -= 0.1;
                break;
            case 34:
                zoom += 0.1;
                break;
            case 37:
                theta -= 1.0;
                break;
            case 39:
                theta += 1.0;
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