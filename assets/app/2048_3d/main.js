"use strict";

/* global variables */
var canvas, gl, program, browser, tex_2048;
var shaders = ["shader.vert", "shader.frag"];
var stopRender = false;

var SHAPES = {
    // shape name: {id, details}
    "0":    { id: 5},
    "2":    { id: 5},
    "4":    { id: 5},
    "8":    { id: 5},
    "16":   { id: 5},
    "32":   { id: 5},
    "64":   { id: 5},
    "128":  { id: 5},
    "256":  { id: 5},
    "512":  { id: 5},
    "1024": { id: 5},
    "2048": { id: 5},
    "4096": { id: 5},
    "8192": { id: 5}
};

var GAME, BOARD = [];

/* mouse controls */
var lastPosition = [];
var isMouseDown = false;

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
    var jsonData = loadFileAJAX("/webgl/assets/models/cube.json", false),
        vertData = JSON.parse(jsonData);
    for (var key in SHAPES) {
        var tCoord = getTiledTexCoords(Math.log(parseInt(key)) / Math.log(2));
        //console.log(tCoord);
        SHAPES[key].vbo = gl.createBuffer();
        SHAPES[key].tbo = gl.createBuffer();
        SHAPES[key].program = program;
        gl.bindBuffer(gl.ARRAY_BUFFER, SHAPES[key].vbo);
        gl.bufferData(gl.ARRAY_BUFFER, flatten(vertData.v), gl.STATIC_DRAW);
        SHAPES[key].numVert = vertData.v.length;
        gl.bindBuffer(gl.ARRAY_BUFFER, SHAPES[key].tbo);
        gl.bufferData(gl.ARRAY_BUFFER, flatten(tCoord), gl.STATIC_DRAW);
    }
    loadTexture();
}

/* load texture */
function loadTexture() {
    tex_2048 = gl.createTexture();
    var image = new Image();
    image.src = "assets/tex/2048.png";
    image.addEventListener('load', function() {
        // Now that the image has loaded make copy it to the texture.
        gl.bindTexture(gl.TEXTURE_2D, tex_2048);
        gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, image);
    });
}

/* load global uniforms */
function loadGlobalUniforms() {
    gl.uniformMatrix4fv(gl.getUniformLocation(program, "u_pMatrix"), false, flatten(pMatrix));
}

/* load object specific uniforms */
function loadObjectUniforms(object) {
    var mvMatrix = mult(cameraMatrix, translate(object.translate[0], object.translate[1], object.translate[2]));
    mvMatrix = mult(mvMatrix, rotate(object.rotate[2], [0, 0, 1]));
    mvMatrix = mult(mvMatrix, rotate(object.rotate[1], [0, 1, 0]));
    mvMatrix = mult(mvMatrix, rotate(object.rotate[0], [1, 0, 0]));
    mvMatrix = mult(mvMatrix, scale(object.scale[0], object.scale[1], object.scale[2]));
    gl.uniformMatrix4fv(gl.getUniformLocation(program, "u_mvMatrix"), false, flatten(mvMatrix));
}

/* upload vertex data to GPU */
function loadVertexAttribs(ctx) {
    gl.bindBuffer(gl.ARRAY_BUFFER, ctx.vbo);
    var vPos = gl.getAttribLocation(program, "vPos");
    gl.vertexAttribPointer(vPos, 3, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(vPos);
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
        BOARD.forEach(function(object) {
            loadVertexAttribs(object._gl);
            loadObjectUniforms(object);
            object.draw(gl, false);
        });
    }
    window.requestAnimFrame(render);
}

/* start the application */
window.onload = function init() {
    browser = checkBrowserType();
    asyncLoadShaders("2048_3d", shaders, initWebGL);
    document.addEventListener('keydown', handleKeyDown);
    // sphere
    //BOARD.push(new Geometry(SHAPES["2"], { scale: [0.5, 0.5, 0.5] }));
    //BOARD.push(new Geometry(SHAPES["0"], { scale: [0.2, 0.2, 0.2], translate: [0.0, 1.0, 0.0] }));
    //BOARD.push(new Geometry(SHAPES["2"], { scale: [0.2, 0.2, 0.2], translate: [-1.0, 0.5, 0.0] }));
    //BOARD.push(new Geometry(SHAPES["4"], { scale: [0.2, 0.2, 0.2], translate: [-0.5, 0.5, 0.0] }));
    //BOARD.push(new Geometry(SHAPES["8"], { scale: [0.2, 0.2, 0.2], translate: [0.0, 0.5, 0.0] }));
    //BOARD.push(new Geometry(SHAPES["16"], { scale: [0.2, 0.2, 0.2], translate: [0.5, 0.5, 0.0] }));
    //BOARD.push(new Geometry(SHAPES["32"], { scale: [0.2, 0.2, 0.2], translate: [1.0, 0.5, 0.0] }));
    GAME = new TwentyFortyEight();
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

/* capture key press */
function handleKeyDown(event){
    switch (event.keyCode) {
        case 72: // H key show/hide help
            toggleControls('helpPanel');
            break;
        case 78: // N key to start a new game
            GAME.reset();
            break;
        case 82: // R key to reset the axes rotation
            resetAxes();
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
                GAME.move("LEFT");
                break;
            case 39: // right
                GAME.move("RIGHT");
                break;
            case 38: // up
                GAME.move("UP");
                break;
            case 40: // down
                GAME.move("DOWN");
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

/* texture coor for tiled 2048 texture */
function getTiledTexCoords(id) {
    id = id < 0 ? 0 : id;
    var ret = [];
    var a = id / 14.0,
        b = (id + 1) / 14.0;
    
    ret.push([a, 0], [b, 0], [b, 1], [a, 0], [b, 1], [a, 1]); // front
    ret.push([b, 0], [a, 0], [a, 1], [b, 0], [a, 1], [b, 1]); // back
    ret.push([b, 0], [a, 0], [a, 1], [b, 0], [a, 1], [b, 1]); // left
    ret.push([a, 0], [b, 0], [b, 1], [a, 0], [b, 1], [a, 1]); // right
    ret.push([b, 0], [b, 1], [a, 1], [b, 0], [a, 1], [a, 0]); // top
    ret.push([b, 1], [b, 0], [a, 0], [b, 1], [a, 0], [a, 1]); // bottom
    
    return ret;
}

/*****************************************************
 * ported from python code
 * **************************************************/
// Offsets for computing tile indices in each direction.
// DO NOT MODIFY this dictionary.
var OFFSETS = {"UP": [1, 0],
           "DOWN": [-1, 0],
           "LEFT": [0, 1],
           "RIGHT": [0, -1]};

function merge(line) {
    console.log(line);
    var tmp = [0, 0, 0, 0];
    var ret = [0, 0, 0, 0];
    var idx = 0;
    
    for (var i = 0; i < line.length; i++ ) {
        if (line[i]) {
            tmp[idx] = line[i];
            idx += 1;
        }
    }
    
    i = 0;
    idx = 0;
    
    while (i < line.length) {
        if (i == line.length - 1) {
            ret[idx] = tmp[i];
            break;
        } else if (tmp[i] == tmp[i + 1]) {
            ret[idx] = 2 * tmp[i];
            i += 2;
        } else {
            ret[idx] = tmp[i];
            i += 1;
        }
        idx += 1;
    }
    console.log(ret);
    return ret;
}

function TwentyFortyEight() {
    this.initial = {
                        "UP": [[0, 0], [0, 1], [0, 2], [0, 3]],
                        "DOWN": [[3, 0], [3, 1], [3, 2], [3, 3]],
                        "LEFT": [[0, 0], [1, 0], [2, 0], [3, 0]],
                        "RIGHT": [[0, 3], [1, 3], [2, 3], [3, 3]]
                    };
    
    this.updateGUI = function() {
        BOARD = [];
        for (var i = 0; i < 4; i++) {
            for (var j = 0; j < 4; j++) {
                var val = this.grid[i][j];
                BOARD.push(new Geometry(SHAPES[val.toString()], { scale: [0.2, 0.2, 0.2], translate: [-0.6 + i * 0.4, -0.6 + j * 0.4, 0.0] }));
            }
        }
    };

    this.new_tile = function() {
        var tile_values = [2, 2, 2, 2, 2, 2, 2, 2, 2, 4];
        var x = Math.floor(Math.random() * 4);
        var y = Math.floor(Math.random() * 4);
        
        while(this.grid[x][y]) {
            x = Math.floor(Math.random() * 4);
            y = Math.floor(Math.random() * 4);
        }
        this.grid[x][y] = tile_values[Math.floor(Math.random() * tile_values.length)];
        this.updateGUI();
    };

    this.reset = function() {
        console.log("!!! New Game !!!")
        this.grid = [
                        [0, 0, 0, 0],
                        [0, 0, 0, 0],
                        [0, 0, 0, 0],
                        [0, 0, 0, 0]
                    ];
        this.lost = false;
        this.new_tile();
        this.new_tile();
    };

    this.move = function(direction) {
        var moved = false;
        if (direction == "UP" || direction == "DOWN") {
            console.log(direction);
            var temp = [0, 0, 0, 0];
            for (var i = 0; i < this.initial[direction].length; i++) {
                var row = this.initial[direction][i][0];
                var col = this.initial[direction][i][1];
                for (var i = 0; i < 4; i++) {
                    temp[i] = this.grid[row][col];
                    row += OFFSETS[direction][0];
                    col += OFFSETS[direction][1];
                }
                temp = merge(temp);
                for (var i = 0; i < 4; i++) {
                    if (this.grid[OFFSETS[direction][0] * i + 3 * (1 - OFFSETS[direction][0]) / 2][col] != temp[i]) {
                        moved = true;
                    }
                    this.grid[OFFSETS[direction][0] * i + 3 * (1 - OFFSETS[direction][0]) / 2][col] = temp[i];
                }
            }
        } else {
            console.log(direction);
            var temp = [0, 0, 0, 0];
            for (var i = 0; i < this.initial[direction].length; i++) {
                var row = this.initial[direction][i][0];
                var col = this.initial[direction][i][1];
                for (var i = 0; i < 4; i++) {
                    temp[i] = this.grid[row][col];
                    row += OFFSETS[direction][0];
                    col += OFFSETS[direction][1];
                }
                temp = merge(temp);
                for (var i = 0; i < 4; i++) {
                    if (this.grid[row][OFFSETS[direction][1] * i + 3 * (1 - OFFSETS[direction][1]) / 2] != temp[i]) {
                        moved = true;
                    }
                    this.grid[row][OFFSETS[direction][1] * i + 3 * (1 - OFFSETS[direction][1]) / 2] = temp[i];
                }
            }
        }
        if (moved)
            this.new_tile();
    };

    this.reset();
}