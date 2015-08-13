/***************************************************
 *         shader/program utility functions        *
 ***************************************************/
/* function for getting shader code from remote source */
function loadFileAJAX(name, cache) {
    var xhr = new XMLHttpRequest(),
        okStatus = document.location.protocol === "file:" ? 0 : 200;
    if (cache) {
        xhr.open('GET', name, false);
    } else {
        var time_stamp = Date.now();
        xhr.open('GET', name + "?t=" + time_stamp, false);
    }
    xhr.send(null);
    return xhr.status == okStatus ? xhr.responseText : null;
};

/* function for getting compiled shader */
function getShader(gl, type, shaderSource) {
    if (shaderSource == null) {
        alert("Not able to load " + type);
        return null;
    }
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
function getProgram(gl, vertShaderSource, fragShaderSource) {
    var vertShader = getShader(gl, gl.VERTEX_SHADER, vertShaderSource);
    var fragShader = getShader(gl, gl.FRAGMENT_SHADER, fragShaderSource);
    var program = gl.createProgram();

    gl.attachShader(program, vertShader);
    gl.attachShader(program, fragShader);
    gl.linkProgram(program);

    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
        return null;
    }
    return program;
};

/* create ajax file loading callbacks */
function createTask(path, cache) {
    return function(callback) { callback(null, loadFileAJAX(path, cache)); };
}

/* asynchronously load shader code in parallel and then initialize WebGL */
function asyncLoadShaders(appName, shaderArray, initWebGL, cache) {
    setDefault(cache, true);
    var taskList = [];
    // populate taskList with shader loading callbacks
    for (var i = 0; i < shaderArray.length; i++) {
        path = "/webgl/assets/app/" + appName + "/" + shaderArray[i];
        taskList.push(createTask(path, cache));
    }
    // asynchronously load shaders
    async.parallel(taskList, function(err, results) {
        if (err) {
            throw err;
        } else {
            initWebGL(results);
        }
    });
}

/***************************************************
 *           geometry utility functions            *
 ***************************************************/
/* create n-sided polygon */
function createPolygon(center, radius, numPoints, withZ) {
    setDefault(withZ, false);
    var i, nVert = [];
    for (i = 0; i < numPoints; i++) {
        if (withZ) {
            nVert.push([center[0] + radius * Math.sin(i * 2 * Math.PI / numPoints), center[1] + radius * Math.cos(i * 2 * Math.PI / numPoints), 1.0]);
        } else {
            nVert.push([center[0] + radius * Math.sin(i * 2 * Math.PI / numPoints), center[1] + radius * Math.cos(i * 2 * Math.PI / numPoints)]);
        }
    }
    return nVert;
}

/* calculate distance between two points */
function dist(a, b) {
    if (a.length != b.length) {
        throw "dist(): trying to calculate distance of points of different dimensions";
    }
    
    if (a.length == 2) {
        return Math.sqrt(Math.pow(a[0] - b[0], 2) + Math.pow(a[1] - b[1], 2));
    } else if (a.length == 3) {
        return Math.sqrt(Math.pow(a[0] - b[0], 2) + Math.pow(a[1] - b[1], 2) + Math.pow(a[2] - b[2], 2));
    } else {
        throw "dist(): points of length " + a.length + " is not yet supported";
    }
}

/* return movement direction */
function move_direction(src, dst) {
    if (src.length != dst.length) {
        throw "move_direction(): trying to calculate distance of points of different dimensions";
    }
    
    if (src.length == 2) {
        return Math.sqrt(Math.pow(a[0] - b[0], 2) + Math.pow(a[1] - b[1], 2));
    } else {
        throw "move_direction(): points of length " + a.length + " is not yet supported";
    }
}

/***************************************************
 *              other utility functions            *
 ***************************************************/
/* return sign of a number */
function sign(num) {
    return num ? num < 0 ? -1 : 1 : 1;
}

/* convert hex color string to rgb */
function hexToRGB(hex) {
    var result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16)
    } : null;
}

/* convert normalized rgb to hex color string */
function nrgbToHex(rgb) {
    r = parseInt(rgb[0] * 255);
    g = parseInt(rgb[1] * 255);
    b = parseInt(rgb[2] * 255);
    return "#" + componentToHex(r) + componentToHex(g) + componentToHex(b);
}

/* convert rgb to hex color string */
function rgbToHex(r, g, b) {
    return "#" + componentToHex(r) + componentToHex(g) + componentToHex(b);
}

function componentToHex(c) {
    var hex = c.toString(16);
    return hex.length == 1 ? "0" + hex : hex;
}

/* encode/decode number to color channel */
function encodeColor(number, normalized) {
    normalized = setDefault(normalized, true);
    var r = (number % 256);
    var g = (parseInt(number / 256));
    if (normalized) {
        return [r / 255.0, g / 255.0, 0.0];
    } else {
        return [r, g, 0];
    }
}

function decodeColor(color) {
    var number = (color[1] * 256) + color[0];
    return number;
}

/* round num to n decimal places */
function roundDown(num, n) {
    n = setDefault(n, 2);
    var multiplier = Math.pow(10, n);    
    return Math.round(num * multiplier) / multiplier;
}

/* set default value for an undefined parameter */
function setDefault(param, value) {
    if (typeof param == 'undefined') {
        return value;
    } else {
        return param;
    }
}

/* show/hide settings panel */
function toggleControls(id, target) {
    title = document.getElementById(id);
    control = document.getElementById(target);
    if (control.style.display == "") {
        control.style.display = "none";
    }
    else {
        control.style.display = "";
    }
}