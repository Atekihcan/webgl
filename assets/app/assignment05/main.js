"use strict";

/* global variables */
var canvas, gl, program, imgTex, normalTex, bumpTex, browser;
var shaders = ["shader.vert", "shader.frag"];
var stopRender = false;

var SHAPES = {
    // shape name: {id, vbo, number of vertices, details}
    "Point": { id: 0, details: 0},
    "Sphere": { id: 7, details: 50 },
};

var TEXTURES = [
    "brick",
    "rock_wall",
    "wood",
    "earth",
    "moon",
    "mars"
];

var light = null;
var currentObject = null;
var currentTexture = 3, lightON = true, bumpON = true, bump = 5.0;

/* mouse controls */
var lastPosition = [];
var isMouseDown = false;

/* texture ui parameters */
var uiCheckerSizeVal, uiBumpAmountVal;

/* lights */
var ambientLight = [0.2, 0.2, 0.2, 1.0];
var lightThetaX = 30.0, lightThetaY = 60.0;

/* camera/projection matrices */
var cameraMatrix, pMatrix;
const at = [0.0, 0.0, 0.0];
const up = [0.0, 1.0, 0.0];
var zoom = 4.0, angleX = 0.0, angleY = 0.0;


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
    canvas.oncontextmenu = function () {
        return false;     // cancel default menu
    };
    if (browser.chrome || browser.safari) {
        canvas.style.cursor = "-webkit-grab";
    } else {
        canvas.style.cursor = "grab";
    }

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

    // compile shaders and get the program object
    // all objects will share same shaders, i.e same program object
    program = getProgram(gl, shaderSources[0], shaderSources[1]);
    if (program != null) {
        gl.useProgram(program);
    }

    // create and load object primitive vertex data
    // most other object types can be created by transforming these primitives
    for (var key in SHAPES) {
        var data = getPrimitiveData(SHAPES[key].id, SHAPES[key].details, { pos: true, index: true, normal: true, texture: true });
        SHAPES[key].vbo = gl.createBuffer();
        SHAPES[key].ibo = gl.createBuffer();
        SHAPES[key].nbo = gl.createBuffer();
        SHAPES[key].tbo = gl.createBuffer();
        SHAPES[key].program = program;
        gl.bindBuffer(gl.ARRAY_BUFFER, SHAPES[key].vbo);
        gl.bufferData(gl.ARRAY_BUFFER, flatten(data.v), gl.STATIC_DRAW);
        SHAPES[key].numVert = data.v.length;
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, SHAPES[key].ibo);
        gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(data.i), gl.STATIC_DRAW);
        SHAPES[key].numIndx = data.i.length;
        gl.bindBuffer(gl.ARRAY_BUFFER, SHAPES[key].nbo);
        gl.bufferData(gl.ARRAY_BUFFER, flatten(data.n), gl.STATIC_DRAW);
        gl.bindBuffer(gl.ARRAY_BUFFER, SHAPES[key].tbo);
        gl.bufferData(gl.ARRAY_BUFFER, flatten(data.t), gl.STATIC_DRAW);
    }

    // Create a texture.
    imgTex    = gl.createTexture();
    bumpTex   = gl.createTexture();
    normalTex = gl.createTexture();
}

/* load texture */
function loadTexture(id) {
    var image = new Image();
    image.src = "assets/tex/" + TEXTURES[id] + ".jpg";
    image.addEventListener('load', function() {
        // Now that the image has loaded make copy it to the texture.
        gl.activeTexture(gl.TEXTURE0);
        gl.bindTexture(gl.TEXTURE_2D, imgTex);
        gl.uniform1i(gl.getUniformLocation(program, "u_texture"), 0);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, image);
    });

    var bImage = new Image();
    bImage.src = "assets/tex/" + TEXTURES[id] + "_bump.jpg";
    bImage.addEventListener('load', function() {
        // Now that the image has loaded make copy it to the texture.
        // Bind bump texture in Texture Unit 1
        gl.activeTexture(gl.TEXTURE1);
        gl.bindTexture(gl.TEXTURE_2D, bumpTex);
        gl.uniform1i(gl.getUniformLocation(program, "u_bump"), 1);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, bImage);
    });

    var nImage = new Image();
    nImage.src = "assets/tex/" + TEXTURES[id] + "_normal.jpg";
    nImage.addEventListener('load', function() {
        // Now that the image has loaded make copy it to the texture.
        // Bind normal texture in Texture Unit 2
        gl.activeTexture(gl.TEXTURE2);
        gl.bindTexture(gl.TEXTURE_2D, normalTex);
        gl.uniform1i(gl.getUniformLocation(program, "u_normal"), 2);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, nImage);
    });
}

/* load global uniforms */
function loadGlobalUniforms() {
    gl.uniform4fv(gl.getUniformLocation(program, "u_ambientLight"), flatten(ambientLight));
    gl.uniform4fv(gl.getUniformLocation(program, "u_pointLightSpecular"), flatten([light.matSpecular]));
    gl.uniform4fv(gl.getUniformLocation(program, "u_pointLightDiffuse"), flatten([light.matDiffuse]));
    gl.uniformMatrix4fv(gl.getUniformLocation(program, "u_pMatrix"), false, flatten(pMatrix));
}

/* load object specific uniforms */
function loadObjectUniforms(object) {
    gl.uniform1f(gl.getUniformLocation(program, "u_matShininess"), object.matShininess);

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
        var normMatrix = toInverseMat3(mvMatrix);
        if (normMatrix != null) {
            normMatrix = transpose(normMatrix);
            gl.uniformMatrix3fv(gl.getUniformLocation(program, "u_normMatrix"), false, flatten(normMatrix));
        }
        var transformedPointLightPos = [];
        transformedPointLightPos.push(multMatVect(cameraMatrix, vec4(light.translate, 1.0)));
        gl.uniform4fv(gl.getUniformLocation(program, "u_pointLightPos"), flatten(transformedPointLightPos));
    }
}

/* upload vertex data to GPU */
function loadVertexAttribs(ctx) {
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, ctx.ibo);
    gl.bindBuffer(gl.ARRAY_BUFFER, ctx.vbo);
    var vPos = gl.getAttribLocation(program, "vPos");
    gl.vertexAttribPointer(vPos, 3, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(vPos);
    gl.bindBuffer(gl.ARRAY_BUFFER, ctx.nbo);
    var vNorm = gl.getAttribLocation(program, "vNorm");
    gl.vertexAttribPointer(vNorm, 3, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(vNorm);
    gl.bindBuffer(gl.ARRAY_BUFFER, ctx.tbo);
    var vTexCoord = gl.getAttribLocation(program, "vTexCoord");
    gl.vertexAttribPointer(vTexCoord, 2, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(vTexCoord);
}

/* render frames recursively */
function render() {
    if (!stopRender) {
        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
        loadGlobalUniforms();
        animate();
        loadVertexAttribs(currentObject._gl);
        loadObjectUniforms(currentObject);
        currentObject.draw(gl, false);
    }
    window.requestAnimFrame(render);
}

/* start the application */
window.onload = function init() {
    browser = checkBrowserType();
    asyncLoadShaders("assignment05", shaders, initWebGL);
    document.addEventListener('keydown', handleKeyDown);
    uiCheckerSizeVal = document.getElementById("uiCheckerSizeVal");
    uiBumpAmountVal  = document.getElementById("uiBumpAmountVal");


    light = new Geometry(SHAPES["Point"], { matDiffuse: [1.0, 1.0, 1.0, 1.0], matSpecular: [1.0, 1.0, 1.0, 1.0], translate: [-2.0, 0.0, 1.0], animate: true });
    // sphere
    currentObject = new Geometry(SHAPES["Sphere"]);
    loadTexture(3);
    setTexType(1);
    setTexMapType(0);
    setCheckerSize(4.0);
    setCheckerColor(1, "#ffffff");
    setCheckerColor(2, "#000000");
    setBumpAmount(bump);
    enableLight(lightON);
    render();
};

/***************************************************
 *                geometry utils                   *
 ***************************************************/
/* make model-view matrix depending upon eye position */
function changeCameraPosition() {
    var eye = vec3(
        zoom * Math.sin(radians(angleY)) * Math.cos(radians(angleX)),
        zoom * Math.sin(radians(angleX)),
        zoom * Math.cos(radians(angleY)) * Math.cos(radians(angleX))
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

/* mouse down event handler */
function getMouseDown(event) {
    isMouseDown = true;
    lastPosition = mousePos(event);
    if (browser.chrome || browser.safari) {
        canvas.style.cursor = "-webkit-grabbing";
    } else {
        canvas.style.cursor = "grabbing";
    }
}

/* mouse move event handler */
function getMouseMove(event) {
    if (isMouseDown && typeof(lastPosition[0]) != 'undefined') {
        var newPosition = mousePos(event),
            d = moveDirection(newPosition, lastPosition);
        changeCameraAngle(-5.0 * d[0], -5.0 * d[1]);
        changeCameraPosition();
        lastPosition = newPosition;
    }
}

/* mouse up event handler */
function getMouseUp(event) {
    isMouseDown = false;
    lastPosition = [];
    if (browser.chrome || browser.safari) {
        canvas.style.cursor = "-webkit-grab";
    } else {
        canvas.style.cursor = "grab";
    }
}

/* mouse wheel event handler */
function getMouseWheel(event) {
    if (event.deltaY > 0) {
        changeCameraZoom(false);
    } else {
        changeCameraZoom(true);
    }
    changeCameraPosition();
    event.preventDefault();
}

/* reset axes rotation */
function resetAxes() {
    zoom = 4.0, angleX = 0.0, angleY = 0.0;
    changeCameraPosition();
}

/* set texture type */
function setTexType(type) {
    gl.uniform1i(gl.getUniformLocation(program, "u_vtextureType"), parseInt(type));
    gl.uniform1i(gl.getUniformLocation(program, "u_ftextureType"), parseInt(type));
}

/* set texture mapping type */
function setTexMapType(type) {
    gl.uniform1i(gl.getUniformLocation(program, "u_textureMapType"), parseInt(type));
}

/* set checker-board color */
function setCheckerColor(id, value) {
    var rgb = hexToRGB(value);
    gl.uniform4fv(gl.getUniformLocation(program, "u_checkerColor_" + id), flatten([rgb.r / 255.0, rgb.g / 255.0, rgb.b / 255.0, 1.0]));
}

/* set checker-board size */
function setCheckerSize(value) {
    gl.uniform1f(gl.getUniformLocation(program, "u_vcheckerSize"), parseFloat(value));
    gl.uniform1f(gl.getUniformLocation(program, "u_fcheckerSize"), parseFloat(value));
    uiCheckerSizeVal.innerHTML = value;
}

/* enable/disable bump */
function toggleBump() {
    if (bumpON) {
        gl.uniform1f(gl.getUniformLocation(program, "u_bumpAmount"), 0.0);
    } else {
        gl.uniform1f(gl.getUniformLocation(program, "u_bumpAmount"), parseFloat(bump / 100.0));
    }
    bumpON = !bumpON;
}

/* set bump amount */
function setBumpAmount(value) {
    gl.uniform1f(gl.getUniformLocation(program, "u_bumpAmount"), parseFloat(value / 100.0));
    uiBumpAmountVal.innerHTML = value;
    bump = value;
}
}

/* enable/disable light */
function enableLight(flag) {
    if (flag) {
        gl.uniform1i(gl.getUniformLocation(program, "u_pointLightOn"), 1);
        lightON = true;
    } else {
        gl.uniform1i(gl.getUniformLocation(program, "u_pointLightOn"), 0);
        lightON = false;
    }
}

/* capture key press */
function handleKeyDown(event){
    switch (event.keyCode) {
        case 66: // B key on/off bump
            toggleBump();
            break;
        case 72: // H key show/hide help
            toggleControls('helpPanel');
            break;
        case 76: // L key on/off light
            enableLight(!lightON);
            break;
        case 82: // R key to reset the axes rotation
            resetAxes();
            break;
        case 84: // T key to toggle texture
            loadTexture(++currentTexture % 7);
            break;
        case 88: // X key to increase bump
            if (bump < 50) { setBumpAmount(++bump); }
            break;
        case 90: // Z key to decrease bump
            if (bump > 0) { setBumpAmount(--bump); }
            break;
    }

    if (event.keyCode > 32 && event.keyCode < 41) {
        switch (event.keyCode) {
            case 33: // page up to zoom in
                changeCameraZoom(true);
                break;
            case 34: // page down to zoom out
                changeCameraZoom(false);
                break;
            case 37: // left
                changeCameraAngle(-1.0, 0);
                break;
            case 39: // right
                changeCameraAngle(+1.0, 0);
                break;
            case 38: // up
                changeCameraAngle(0, +1.0);
                break;
            case 40: // down
                changeCameraAngle(0, -1.0);
                break;
        }
        changeCameraPosition();
        event.preventDefault();
    }
};

/* camera movements */
function changeCameraZoom(flag) {
    if (flag) {
        if (zoom > 3.0) {
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
        if (browser.chrome || browser.safari) {
            canvas.style.cursor = "-webkit-grab";
        } else {
            canvas.style.cursor = "grab";
        }
    }, 500);
}

function changeCameraAngle(dx, dy) {
    angleY += dx;
    angleX += dy;
    // don't go upside down
    angleX = Math.max(angleX, -89.9);
    angleX = Math.min(angleX, +89.9);
}

/* animate light */
function animate() {
    //currentObject.rotate[1] += 0.5;
    var x = 10.0 * Math.sin(radians(lightThetaY)) * Math.cos(radians(lightThetaX)),
        y = 10.0 * Math.sin(radians(lightThetaX)),
        z = 10.0 * Math.cos(radians(lightThetaY)) * Math.cos(radians(lightThetaX));
    
    light.translate = [x, y, z];
    lightThetaY += 0.5;
}