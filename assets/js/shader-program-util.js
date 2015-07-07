/* function for getting shader code from remote source */
function loadFileAJAX(name) {
    var xhr = new XMLHttpRequest(),
        okStatus = document.location.protocol === "file:" ? 0 : 200;
    xhr.open('GET', name, false);
    xhr.send(null);
    return xhr.status == okStatus ? xhr.responseText : null;
};

/* function for getting compiled shader */
function getShader(gl, type, shaderSource) {
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
        alert("[ERROR] Could not initialise shaders");
        return null;
    }
    return program;
};

/* asynchronously load shader code in parallel and then initialize WebGL */
function asyncLoadShaders(appName, initWebGL) {
    async.parallel({
        vert: function(callback) {
            callback(null, loadFileAJAX("/webgl/assets/app/" + appName + "/shader.vert"));
        },
        frag: function(callback) {
            callback(null, loadFileAJAX("/webgl/assets/app/" + appName + "/shader.frag"));
        }
    }, function(err, results) {
        if (err) {
            throw err;
        } else {
            initWebGL(results.vert, results.frag);
        }
    });
}