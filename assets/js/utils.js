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
 *              other utility functions            *
 ***************************************************/
/* create n-sided polygon */
function createPolygon(radius, numPoints) {
    var i, nVert = [];
    for (i = 0; i < numPoints; i++) {
            nVert.push([radius * Math.sin(i * 2 * Math.PI / numPoints), radius * Math.cos(i * 2 * Math.PI / numPoints)]);
    }
    return nVert;
}

function setDefault(param, value) {
    param = typeof param !== 'undefined' ? param : value;
 }