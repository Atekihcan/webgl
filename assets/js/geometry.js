/***************************************************
 *           primitive vertex positions            *
 ***************************************************/
/* cube vertex positions */
var cubeVert = [
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

/* sphere data generator */
var X = 0.525731112119133606;
var Z = 0.850650808352039932;

var icosahedronVert = [    
    [-X, 0.0, Z], [X, 0.0, Z], [-X, 0.0, -Z], [X, 0.0, -Z],    
    [0.0, Z, X], [0.0, Z, -X], [0.0, -Z, X], [0.0, -Z, -X],    
    [Z, X, 0.0], [-Z, X, 0.0], [Z, -X, 0.0], [-Z, -X, 0.0] 
];

var icosahedronIndx = [ 
    [0,4,1], [0,9,4], [9,5,4], [4,5,8], [4,8,1],    
    [8,10,1], [8,3,10], [5,3,8], [5,2,3], [2,7,3],    
    [7,10,3], [7,6,10], [7,11,6], [11,0,6], [0,1,6], 
    [6,1,10], [9,0,11], [9,11,2], [9,2,5], [7,2,11]
];

function drawtri(a, b, c, numDivision, r) {
    if (numDivision <= 0) {
        pointsArray.push(scaleBy(a, r));
        pointsArray.push(a);
        pointsArray.push(scaleBy(b, r));
        pointsArray.push(b);
        pointsArray.push(scaleBy(c, r));
        pointsArray.push(c);
    } else {
        var ab = mix(a, b, 0.5);
        var ac = mix(a, c, 0.5);
        var bc = mix(b, c, 0.5);
        
        normalize(ab);
        normalize(ac);
        normalize(bc);
        drawtri(a, ab, ac, numDivision - 1, r);
        drawtri(b, bc, ab, numDivision - 1, r);
        drawtri(c, ac, bc, numDivision - 1, r);
        drawtri(ab, bc, ac, numDivision - 1, r);
    }  
}

function drawSphere(numDivision, radius) {
    for (var i = 0; i < 20; i++) {
        drawtri(icosahedronVert[icosahedronIndx[i][0]], 
                icosahedronVert[icosahedronIndx[i][1]], 
                icosahedronVert[icosahedronIndx[i][2]], 
                numDivision , radius);
    }
}

/***************************************************
 *         functions to create vertex data         *
 ***************************************************/
/* axis vertex data */
function getAxesVertexData(numDivs) {
    var pointsArray = [];

    // positive axis - solid
    pointsArray.push([0.0, 0.0, 0.0]);
    pointsArray.push([0.0, 0.0, 0.0]);
    pointsArray.push([1.0, 0.0, 0.0]);
    pointsArray.push([0.0, 0.0, 0.0]);
    // negative axis - dotted
    for (var i = 0; i < numDivs; i++) {
        pointsArray.push([i * -1.0 / numDivs, 0.0, 0.0]);
        pointsArray.push([0.0, 0.0, 0.0]);
    }
    return pointsArray;
}

/* line vertex data */
function getLineVertexData() {
    var pointsArray = [];

    // positive axis - solid
    pointsArray.push([0.0, 0.0, 0.0]);
    pointsArray.push([0.0, 0.0, 0.0]);
    pointsArray.push([1.0, 0.0, 0.0]);
    pointsArray.push([0.0, 0.0, 0.0]);
    return pointsArray;
}

/* grid vertex data */
function getGridVertexData(divs) {
    var pointsArray = [];
    var start = [-1.0, -1.0], end = [1.0, 1.0], 
        a = [parseInt(start[0] * divs), parseInt(start[1] * divs)],
        b = [parseInt(end[0] * divs), parseInt(end[1] * divs)];
    
    for (var i = a[0]; i <= b[0]; i++) {
        pointsArray.push([i / divs, start[1], 0.0]);
        pointsArray.push([0.0, 0.0, 0.0]);
        pointsArray.push([i / divs, end[1], 0.0]);
        pointsArray.push([0.0, 0.0, 0.0]);
    }
    for (var i = a[1]; i <= b[1]; i++) {
        pointsArray.push([start[0], i / divs, 0.0]);
        pointsArray.push([0.0, 0.0, 0.0]);
        var tmp_2 = [0.0, 0.0, 0.0];
        pointsArray.push([end[0], i / divs, 0.0]);
        pointsArray.push([0.0, 0.0, 0.0]);
    }
    return pointsArray;
}

/* polygon vertex data */
function getPolygonVertexData(numDivs) {
    pointsArray = [];
    var v = createPolygonFan([0.0, 0.0, 0.0], 1.0, numDivs);
    // base
    for (var i = 1; i <= numDivs; i++) {
        pointsArray.push(v[0]);
        pointsArray.push([0.0, 0.0, 1.0]);
        pointsArray.push(v[i]);
        pointsArray.push([0.0, 0.0, 1.0]);
        pointsArray.push(v[i + 1]);
        pointsArray.push([0.0, 0.0, 1.0]);
    }
    return pointsArray;
}

/* function for getting cube vertex data */
function getCubeVertexData() {
    return [
        // front
        cubeVert[0], [0.0,  0.0,  1.0], cubeVert[1], [0.0,  0.0,  1.0], cubeVert[2], [0.0,  0.0,  1.0],
        cubeVert[0], [0.0,  0.0,  1.0], cubeVert[2], [0.0,  0.0,  1.0], cubeVert[3], [0.0,  0.0,  1.0],
        // back
        cubeVert[4], [0.0,  0.0, -1.0], cubeVert[5], [0.0,  0.0, -1.0], cubeVert[6], [0.0,  0.0, -1.0],
        cubeVert[4], [0.0,  0.0, -1.0], cubeVert[6], [0.0,  0.0, -1.0], cubeVert[7], [0.0,  0.0, -1.0],
        // left
        cubeVert[0], [-1.0,  0.0,  0.0], cubeVert[4], [-1.0,  0.0,  0.0], cubeVert[7], [-1.0,  0.0,  0.0],
        cubeVert[0], [-1.0,  0.0,  0.0], cubeVert[7], [-1.0,  0.0,  0.0], cubeVert[3], [-1.0,  0.0,  0.0],
        // right
        cubeVert[1], [1.0,  0.0,  0.0], cubeVert[5], [1.0,  0.0,  0.0], cubeVert[6], [1.0,  0.0,  0.0],
        cubeVert[1], [1.0,  0.0,  0.0], cubeVert[6], [1.0,  0.0,  0.0], cubeVert[2], [1.0,  0.0,  0.0],
        // top
        cubeVert[2], [0.0,  1.0,  0.0], cubeVert[6], [0.0,  1.0,  0.0], cubeVert[7], [0.0,  1.0,  0.0],
        cubeVert[2], [0.0,  1.0,  0.0], cubeVert[7], [0.0,  1.0,  0.0], cubeVert[3], [0.0,  1.0,  0.0],
        // bottom
        cubeVert[1], [0.0, -1.0,  0.0], cubeVert[5], [0.0, -1.0,  0.0], cubeVert[4], [0.0, -1.0,  0.0],
        cubeVert[1], [0.0, -1.0,  0.0], cubeVert[4], [0.0, -1.0,  0.0], cubeVert[0], [0.0, -1.0,  0.0]
    ];
}

/* function for getting sphere vertex data */
function getSphereVertexData(numDivs) {
    pointsArray = [];
    drawSphere(numDivs, 1.0);
    return pointsArray;
}

/* function for getting cylinder vertex data */
function getCylinderVertexData(numDivs) {
    pointsArray = [];
    var v_front = createPolygonFan([0.0, 0.0, +1.0], 1.0, numDivs);
    var v_back  = createPolygonFan([0.0, 0.0, -1.0], 1.0, numDivs);
    // front face
    for (var i = 1; i <= numDivs; i++) {
        pointsArray.push(v_front[0]);
        pointsArray.push([0.0, 0.0, +1.0]);
        pointsArray.push(v_front[i]);
        pointsArray.push([0.0, 0.0, +1.0]);
        pointsArray.push(v_front[i + 1]);
        pointsArray.push([0.0, 0.0, +1.0]);
    }

    // body
    for (var i = 1; i <= numDivs; i++) {
        // triangle strip 1
        pointsArray.push(v_front[i]);
        pointsArray.push(v_front[i]);
        pointsArray.push(v_back[i]);
        pointsArray.push(v_back[i]);
        pointsArray.push(v_front[i + 1]);
        pointsArray.push(v_front[i + 1]);
        // triangle strip 2
        pointsArray.push(v_front[i + 1]);
        pointsArray.push(v_front[i + 1]);
        pointsArray.push(v_back[i]);
        pointsArray.push(v_back[i]);
        pointsArray.push(v_back[i + 1]);
        pointsArray.push(v_back[i + 1]);
    }

    // back face
    for (var i = 1; i <= numDivs; i++) {
        pointsArray.push(v_back[0]);
        pointsArray.push([0.0, 0.0, -1.0]);
        pointsArray.push(v_back[i]);
        pointsArray.push([0.0, 0.0, -1.0]);
        pointsArray.push(v_back[i + 1]);
        pointsArray.push([0.0, 0.0, -1.0]);
    }
    return pointsArray;
}

/* function for getting cone vertex data */
function getConeVertexData(numDivs) {
    pointsArray = [];
    var tip = [0.0, 0.0, +1.0];
    var v_base = createPolygonFan([0.0, 0.0, -1.0], 1.0, numDivs);
    // base
    for (var i = 1; i <= numDivs; i++) {
        pointsArray.push(v_base[0]);
        pointsArray.push([0.0, 0.0, -1.0]);
        pointsArray.push(v_base[i]);
        pointsArray.push([0.0, 0.0, -1.0]);
        pointsArray.push(v_base[i + 1]);
        pointsArray.push([0.0, 0.0, -1.0]);
    }

    // body
    for (var i = 1; i <= numDivs; i++) {
        // triangle strip 1
        var normal = getSurfaceNormal(tip, v_base[i], v_base[i + 1]);
        pointsArray.push(tip);
        pointsArray.push(normal);
        pointsArray.push(v_base[i]);
        pointsArray.push(normal);
        pointsArray.push(v_base[i + 1]);
        pointsArray.push(normal);
    }
    return pointsArray;
}

/* return vertex data for primitive object */
function getPrimitiveVertexData(id, details) {
    var v = [];
    switch(id) {
        // lights
        case 0:
            v.push([0.0, 0.0, 0.0]);
            v.push([0.0, 0.0, 0.0]);
            break;
        // axes
        case 1:
            v = getAxesVertexData(details);
            break;
        case 2:
            v = getLineVertexData();
            break;
        case 3:
            v = getGridVertexData(details);
            break;
        case 4:
            v = getPolygonVertexData(details);
            break;
        case 5:
            v = getCubeVertexData();
            break;
        case 6:
            v = getSphereVertexData(details);
            break;
        case 7:
            v = getCylinderVertexData(details);
            break;
        case 8:
            v = getConeVertexData(details);
            break;
        default:
            console.error("shape <" + id + "> is not supported");
            break;
    }

    return v;
}


/***************************************************
 *         geometry utility functions              *
 ***************************************************/
/* create n-sided polygon to be used with TRIANGLE_FAN */
function createPolygonFan(center, radius, numPoints, normal) {
    var v = [];
    var withZ = false;
    var pushNormals = false;
    if (center.length == 3) {
        withZ = true;
    }
    if (typeof normal != 'undefined') {
        pushNormals = true;
    }

    v.push(center);
    if (pushNormals) {
        v.push(normal);
    }
    for (var i = 0; i <= numPoints; i++) {
        if (withZ) {
            v.push([center[0] + radius * Math.sin(i * 2 * Math.PI / numPoints), center[1] + radius * Math.cos(i * 2 * Math.PI / numPoints), center[2]]);
            if (pushNormals) {
                v.push(normal);
            }
        } else {
            v.push([center[0] + radius * Math.sin(i * 2 * Math.PI / numPoints), center[1] + radius * Math.cos(i * 2 * Math.PI / numPoints)]);
            if (pushNormals) {
                v.push(normal);
            }
        }
    }
    return v;
}

/* calculate surface normal for a triangle strip */
function getSurfaceNormal(a, b, c) {
    return normalize(cross(subtract(c, a), subtract(b, a)));
}

/***************************************************
 *                geometry objects                 *
 ***************************************************/
/* object primitive */
function Geometry(shapeObject, property) {
    this.shape        = shapeObject.id;
    this._gl          = {
                           vbo: shapeObject.vbo,
                           numVert: shapeObject.numVert,
                           program: shapeObject.program,
                        };
    this.center       = [0.0, 0.0, 0.0];
    this.scale        = [1.0, 1.0, 1.0];
    this.rotate       = [0.0, 0.0, 0.0];
    this.translate    = [0.0, 0.0, 0.0];
    this.matColor     = [1.0, 0.0, 0.0, 1.0];
    this.matAmbient   = [0.0, 0.0, 0.0, 1.0];
    this.matDiffuse   = [1.0, 1.0, 1.0, 1.0];
    this.matSpecular  = [0.0, 0.0, 0.0, 1.0];
    this.matShininess = 100.0;
    this.lighting     = false;
    this.symmetry     = true;
    this.fill         = true;
    this.wireFrame    = false;
    this.selected     = false;
    this.render       = true;
    this.animate      = false;
    // only for lights
    this.enabled      = true;
    
    for(var p in property) {
        if(property.hasOwnProperty(p)) {
            this[p] = property[p];
        }
    }

    if (typeof this.material != 'undefined') {
        setMaterialType(this, this.material);
    }

    // dynamically update the shape depending upon the mouse move endpoint
    this.modifyShape = function(end) {
        // hack to make symmetric shape
        if (this.symmetry) {
            if (Math.abs(this.center[0] - end[0]) != Math.abs(this.center[1] - end[1])) {
                end[1] = this.center[1] + sign(end[1] - this.center[1]) * Math.abs(this.center[0] - end[0]);
            }

            this.scale = [Math.abs(end[0] - this.center[0]), Math.abs(end[1] - this.center[1]), Math.abs(end[1] - this.center[1])];
        }
        this.scale = [Math.abs(end[0] - this.center[0]), Math.abs(end[1] - this.center[1]), Math.abs(end[1] - this.center[1])];
        this.translate = this.center;
    };

    // draw method for objects
    this.draw = function(gl, offline) {
        if (!this.render) {
            return;
        }
        switch(this.shape) {
            case 0:
                if (this.enabled) {
                    gl.drawArrays(gl.POINTS, 0, this._gl.numVert);
                }
                break;
            case 1:
            case 2:
            case 3:
                gl.drawArrays(gl.LINES, 0, this._gl.numVert);
                break;
            case 4:
            case 5:
            case 6:
            case 7:
            case 8:
                if (offline || this.fill) {
                    gl.drawArrays(gl.TRIANGLES, 0, this._gl.numVert);
                }
                if (!offline && this.selected) {
                    for(var i = 0; i < this._gl.numVert; i += 3) {
                        gl.uniform4fv(gl.getUniformLocation(this._gl.program, "u_materialColor"), flatten(getComplement(this.matDiffuse)));
                        gl.drawArrays(gl.LINE_LOOP, i, 3);
                    }
                }
                if (!offline && !this.fill && !this.selected && this.wireFrame) {
                    for(var i = 0; i < this._gl.numVert; i += 3) {
                        gl.drawArrays(gl.LINE_LOOP, i, 3);
                    }
                }
                break;
            default:
                console.log("Shape <" + this.shape + "> is not supported");
                break;
        }
    };
    
    // set reflective material type
    this.setMaterial = function(type) {
        setMaterialType(this, type);
    };
}