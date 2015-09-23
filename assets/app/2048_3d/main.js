"use strict";

/* global variables */
var canvas, gl, program, browser, tex_2048;
var shaders = ["shader.vert", "shader.frag"];
var stopRender = false, D_down = false, E_down = false;

var SHAPES = {
    // shape name: {id, details}
    "0":        { id: 5 },
    "2":        { id: 5 },
    "4":        { id: 5 },
    "8":        { id: 5 },
    "16":       { id: 5 },
    "32":       { id: 5 },
    "64":       { id: 5 },
    "128":      { id: 5 },
    "256":      { id: 5 },
    "512":      { id: 5 },
    "1024":     { id: 5 },
    "2048":     { id: 5 },
    "4096":     { id: 5 },
    "8192":     { id: 5 },
    "1048576":  { id: 5 },
    "Guide":    { id: 5 }
};

var LEVELS = [
    { name: "Youngling", best: 0 },
    { name: "Padawan",   best: 0 },
    { name: "Knight",    best: 0 },
    { name: "Master",    best: 0 },
    { name: "Yoda",      best: 0 },
];

var GUIDE, GAME, BOARD = [], currentLevel = 1;

/* UI elements */
var info_panel, big_info, small_info, score_info, move_info, best_info;

/* mouse controls */
var lastPosition = [];
var isMouseDown = false;

/* camera/projection matrices */
var cameraMatrix, pMatrix;
const at = [0.0, 0.0, 0.0];
const up = [0.0, 1.0, 0.0];
var zoom = 4.0, angleX = 30.0, angleY = -30.0;


/***************************************************
 *                  WebGL functions                *
 ***************************************************/
/* initialize WebGL context */
function initWebGL(shaderSources) {
    canvas = document.getElementById("gl-canvas");
    canvas.addEventListener("mousedown", getMouseDown, false);
    canvas.addEventListener("mousemove", getMouseMove, false);
    canvas.addEventListener("mouseup", getMouseUp, false);
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
    gl.enable(gl.BLEND);
    gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);

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
        var tCoord = [];
        if (key != "Guide") {
            tCoord = getTiledTexCoords(Math.log(parseInt(key)) / Math.log(2));
        } else {
            tCoord = [
                        [18 / 21, 0], [19 / 21, 0], [19 / 21, 1], [18 / 21, 0], [19 / 21, 1], [18 / 21, 1], // front
                        [20 / 21, 0], [20 / 21, 1], [19 / 21, 1], [20 / 21, 0], [19 / 21, 1], [19 / 21, 0], // back
                        [14 / 21, 0], [15 / 21, 0], [15 / 21, 1], [14 / 21, 0], [15 / 21, 1], [14 / 21, 1], // left
                        [16 / 21, 0], [16 / 21, 1], [15 / 21, 1], [16 / 21, 0], [15 / 21, 1], [15 / 21, 0], // right
                        [16 / 21, 1], [16 / 21, 0], [17 / 21, 0], [16 / 21, 1], [17 / 21, 0], [17 / 21, 1], // top
                        [17 / 21, 0], [18 / 21, 0], [18 / 21, 1], [17 / 21, 0], [18 / 21, 1], [17 / 21, 1], // bottom
                     ];
        }
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
        if (D_down) {
            loadVertexAttribs(GUIDE._gl);
            loadObjectUniforms(GUIDE);
            GUIDE.draw(gl, false);
        }
    }
    window.requestAnimFrame(render);
}

/* start the application */
window.onload = function init() {
    browser = checkBrowserType();
    asyncLoadShaders("2048_3d", shaders, initWebGL);
    document.addEventListener('keydown', handleKeyDown);
    document.addEventListener('keyup', handleKeyUp);
    info_panel = document.getElementById("infoPanel");
    big_info   = document.getElementById("lgInfo");
    small_info = document.getElementById("smInfo");
    score_info = document.getElementById("scoreInfo");
    best_info  = document.getElementById("bestInfo");
    // Guide
    GUIDE = new Geometry(SHAPES["Guide"], { scale: [0.81, 0.81, 0.81], translate: [0.0, 0.0, 0.0] });
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

/* reset axes rotation */
function resetAxes() {
    zoom = 4.0, angleX = 30.0, angleY = -30.0;
    changeCameraPosition();
}

/* capture key press */
function handleKeyDown(event){
    switch (event.keyCode) {
        case 66: // B key fo routwards screen
            GAME.move("OUT");
            break;
        case 71: // G key for inwards screen
            GAME.move("IN");
            break;
        case 68: // E key to explode board
            D_down = true;
            break;
        case 69: // E key to explode board
            if (!E_down) {
                explodeBoard();
            }
            E_down = true;
            break;
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
}

/* capture key press */
function handleKeyUp(event){
    switch (event.keyCode) {
        case 68: // D key to show direction
            D_down = false;
        break;
        case 69: // E key to explode board
            E_down = false;
            GAME.updateGUI();
        break;
    }
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
    var a = id / 21.0,
        b = (id + 1) / 21.0;
    
    ret.push([a, 0], [b, 0], [b, 1], [a, 0], [b, 1], [a, 1]); // front
    ret.push([b, 0], [b, 1], [a, 1], [b, 0], [a, 1], [a, 0]); // back
    ret.push([a, 0], [b, 0], [b, 1], [a, 0], [b, 1], [a, 1]); // left
    ret.push([b, 0], [b, 1], [a, 1], [b, 0], [a, 1], [a, 0]); // right
    ret.push([a, 1], [a, 0], [b, 0], [a, 1], [b, 0], [b, 1]); // top
    ret.push([a, 0], [b, 0], [b, 1], [a, 0], [b, 1], [a, 1]); // bottom
    
    return ret;
}

/* explode cubes away from center */
function explodeBoard() {
    BOARD.forEach(function(object) {
        for (var i = 0; i < 3; i++) {
            object.translate[i] += 0.5 * object.translate[i];
        }
    });
}

/* info panel animation */
function showInfoPanel(msg, small_msg, t) {
    info_panel.style.display = "";
    big_info.innerHTML = msg;
    small_info.innerHTML = small_msg;
    if (t > 0) {
        fadeInfoPanel(t);
    }
}

function fadeInfoPanel(t) {
    setTimeout(function() {
        info_panel.style.display = "none";
    }, t);
}

/* set level and start a new game */
function setLevel(value) {
    currentLevel = parseInt(value);
    GAME.reset();
}

/* populate level selector */
$(function(){
    var $select = $("#levelSelector");
    for (var i = 1; i <= 5; i++){
        $select.append($('<option></option>').val(i).html(LEVELS[i - 1].name));
    }
});

/*****************************************************
 * Game logic
 * **************************************************/

var tile_values = [2, 2, 2, 2, 2, 2, 2, 2, 2, 4];
//var tile_values = [512, 512, 512, 512, 512, 512, 512];
var flag_2048 = false, flag_4096 = false;
// Offsets for computing tile indices in each direction.
// DO NOT MODIFY this dictionary.
var OFFSETS = {
    "LEFT":     [1,  0, 0],
    "RIGHT":    [-1, 0, 0],
    "UP":       [0, -1, 0],
    "DOWN":     [0,  1, 0],
    "IN":       [0,  0, 1],
    "OUT":      [0,  0, -1]
};

function merge(line) {
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
            if (ret[idx] <= 8192) {
                GAME.score += ret[idx];
            }
            if (ret[idx] == 1024) {
                showInfoPanel("Cool", "You've got 1024", 500);
            } else if (ret[idx] == 2048) {
                if (!flag_2048) {
                    showInfoPanel("You Win", "Continue playing or start a new game by pressing 'N'.", 1000);
                    flag_2048 = true;
                } else {
                    showInfoPanel("Awesome", "Another 2048", 500);
                }
            } else if (ret[idx] == 4096) {
                if (!flag_4096) {
                    showInfoPanel("(⊙_◎)", "Continue playing or start a new game by pressing 'N'.", 1000);
                    flag_4096 = true;
                } else {
                    showInfoPanel("Excellent", "Another 4096", 500);
                }
            } else if (ret[idx] == 8192) {
                showInfoPanel("(╯°□°）╯︵ ┻━┻ ", "Game Over because you're genius!<br/>Press 'N' to start a new game.", 0);
                GAME.over = true;
            } else if (ret[idx] > 1048576) {
                ret[idx] = 1048576;
            }
        } else {
            ret[idx] = tmp[i];
            i += 1;
        }
        idx += 1;
    }
    return ret;
}

function TwentyFortyEight() {
    this.initial = {
        "LEFT":     [
                        [[0, 0, 0], [0, 1, 0], [0, 2, 0], [0, 3, 0]], 
                        [[0, 0, 1], [0, 1, 1], [0, 2, 1], [0, 3, 1]], 
                        [[0, 0, 2], [0, 1, 2], [0, 2, 2], [0, 3, 2]], 
                        [[0, 0, 3], [0, 1, 3], [0, 2, 3], [0, 3, 3]]
                    ],
        "RIGHT":    [
                        [[3, 0, 0], [3, 1, 0], [3, 2, 0], [3, 3, 0]], 
                        [[3, 0, 1], [3, 1, 1], [3, 2, 1], [3, 3, 1]], 
                        [[3, 0, 2], [3, 1, 2], [3, 2, 2], [3, 3, 2]], 
                        [[3, 0, 3], [3, 1, 3], [3, 2, 3], [3, 3, 3]]
                    ],
        "UP":       [
                        [[0, 3, 0], [1, 3, 0], [2, 3, 0], [3, 3, 0]], 
                        [[0, 3, 1], [1, 3, 1], [2, 3, 1], [3, 3, 1]], 
                        [[0, 3, 2], [1, 3, 2], [2, 3, 2], [3, 3, 2]], 
                        [[0, 3, 3], [1, 3, 3], [2, 3, 3], [3, 3, 3]]
                    ], 
        "DOWN":     [
                        [[0, 0, 0], [1, 0, 0], [2, 0, 0], [3, 0, 0]], 
                        [[0, 0, 1], [1, 0, 1], [2, 0, 1], [3, 0, 1]], 
                        [[0, 0, 2], [1, 0, 2], [2, 0, 2], [3, 0, 2]], 
                        [[0, 0, 3], [1, 0, 3], [2, 0, 3], [3, 0, 3]]
                    ], 
        "IN":       [
                        [[0, 0, 0], [0, 1, 0], [0, 2, 0], [0, 3, 0]], 
                        [[1, 0, 0], [1, 1, 0], [1, 2, 0], [1, 3, 0]], 
                        [[2, 0, 0], [2, 1, 0], [2, 2, 0], [2, 3, 0]], 
                        [[3, 0, 0], [3, 1, 0], [3, 2, 0], [3, 3, 0]]
                    ], 
        "OUT":      [
                        [[0, 0, 3], [0, 1, 3], [0, 2, 3], [0, 3, 3]], 
                        [[1, 0, 3], [1, 1, 3], [1, 2, 3], [1, 3, 3]], 
                        [[2, 0, 3], [2, 1, 3], [2, 2, 3], [2, 3, 3]], 
                        [[3, 0, 3], [3, 1, 3], [3, 2, 3], [3, 3, 3]]
                    ]
    };
    
    this.updateGUI = function() {
        if (this.lost) {
            showInfoPanel("Game Over", 0);
        }
        BOARD = [];
        for (var k = 0; k < 4; k++) {
            for (var i = 0; i < 4; i++) {
                for (var j = 0; j < 4; j++) {
                    var val = this.grid[k][i][j];
                    //console.log(val.toString());
                    BOARD.push(new Geometry(SHAPES[val.toString()], { scale: [0.2, 0.2, 0.2], translate: [-0.6 + i * 0.4, -0.6 + j * 0.4, -0.6 + k * 0.4] }));
                }
            }
        }
        LEVELS[currentLevel - 1].best = LEVELS[currentLevel - 1].best > this.score ? LEVELS[currentLevel - 1].best : this.score;
        score_info.innerHTML = this.score;
        best_info.innerHTML  = LEVELS[currentLevel - 1].best;
    };

    this.new_tile = function() {
        var x = Math.floor(Math.random() * 4);
        var y = Math.floor(Math.random() * 4);
        var z = Math.floor(Math.random() * 4);
        
        while(this.grid[z][x][y]) {
            x = Math.floor(Math.random() * 4);
            y = Math.floor(Math.random() * 4);
            z = Math.floor(Math.random() * 4);
        }
        this.grid[z][x][y] = tile_values[Math.floor(Math.random() * tile_values.length)];

        // check for feasible moves
        var feasible = false;
        for (var i = 0; i < 4; i++) {
            for (var j = 0; j < 4; j++) {
                for (var k = 0; k < 4; k++) {
                    var val = this.grid[i][j][k];
                    if(val == 0) {
                        feasible = true;
                    } else {
                        if (i != 0 && j != 0 && k != 0) {
                            if (val == this.grid[i - 1][j][k] || val == this.grid[i][j - 1][k] || val == this.grid[i][j][k - 1]) {
                                feasible = true;
                            }
                        } else if  (i != 3 && j != 3 && k != 3) {
                            if (val == this.grid[i + 1][j][k] || val == this.grid[i][j + 1][k] || val == this.grid[i][j][k + 1]) {
                                feasible = true;
                            }
                        }
                    }
                }
            }
        }
        if (!feasible) {
            this.lost = true;
            this.over = true;
        }
    };

    this.reset = function() {
        showInfoPanel("New Game", "", 500);
        this.grid = [
                    [
                        [0, 0, 0, 0],
                        [0, 0, 0, 0],
                        [0, 0, 0, 0],
                        [0, 0, 0, 0]
                    ],
                    [
                        [0, 0, 0, 0],
                        [0, 0, 0, 0],
                        [0, 0, 0, 0],
                        [0, 0, 0, 0]
                    ],
                    [
                        [0, 0, 0, 0],
                        [0, 0, 0, 0],
                        [0, 0, 0, 0],
                        [0, 0, 0, 0]
                    ],
                    [
                        [0, 0, 0, 0],
                        [0, 0, 0, 0],
                        [0, 0, 0, 0],
                        [0, 0, 0, 0]
                    ]
                    ];
        this.level = currentLevel;
        this.lost  = false;
        this.over  = false;
        this.score = 0;
        this.numMoves = 0;
        this.new_tile();
        this.new_tile();
        this.updateGUI();
    };

    this.move = function(direction) {
        if (this.over) {
            return;
        }
        var moved = false;
        var zzz, row, col, temp = [0, 0, 0, 0];
        for (var i1 = 0; i1 < 4; i1++) {
            for (var i2 = 0; i2 < 4; i2++) {
                zzz = this.initial[direction][i1][i2][2];
                row = this.initial[direction][i1][i2][0];
                col = this.initial[direction][i1][i2][1];
                for (var j = 0; j < 4; j++) {
                    temp[j] = this.grid[zzz][row][col];
                    zzz += OFFSETS[direction][2];
                    row += OFFSETS[direction][0];
                    col += OFFSETS[direction][1];
                }
                temp = merge(temp);
                if (direction == "LEFT" || direction == "RIGHT") {
                    for (var k = 0; k < 4; k++) {
                        if (this.grid[zzz][OFFSETS[direction][0] * k + 3 * (1 - OFFSETS[direction][0]) / 2][col] != temp[k]) {
                            moved = true;
                        }
                        this.grid[zzz][OFFSETS[direction][0] * k + 3 * (1 - OFFSETS[direction][0]) / 2][col] = temp[k];
                    }
                } else if (direction == "UP" || direction == "DOWN") {
                    for (var k = 0; k < 4; k++) {
                        if (this.grid[zzz][row][OFFSETS[direction][1] * k + 3 * (1 - OFFSETS[direction][1]) / 2] != temp[k]) {
                            moved = true;
                        }
                        this.grid[zzz][row][OFFSETS[direction][1] * k + 3 * (1 - OFFSETS[direction][1]) / 2] = temp[k];
                    }
                } else {
                    for (var k = 0; k < 4; k++) {
                        if (this.grid[OFFSETS[direction][2] * k + 3 * (1 - OFFSETS[direction][2]) / 2][row][col] != temp[k]) {
                            moved = true;
                        }
                        this.grid[OFFSETS[direction][2] * k + 3 * (1 - OFFSETS[direction][2]) / 2][row][col] = temp[k];
                    }
                }
            }
        }
        if (moved) {
            this.new_tile();
        }
        
        this.numMoves++;
        // add blocking tiles every 5*level moves
        if (this.numMoves && this.numMoves % ((6 - this.level) * 5) == 0) {
            var x = Math.floor(Math.random() * 4);
            var y = Math.floor(Math.random() * 4);
            var z = Math.floor(Math.random() * 4);
            
            while(this.grid[z][x][y]) {
                x = Math.floor(Math.random() * 4);
                y = Math.floor(Math.random() * 4);
                z = Math.floor(Math.random() * 4);
            }
            this.grid[z][x][y] = 1048576;
        }
        this.updateGUI();
    };

    this.reset();
}