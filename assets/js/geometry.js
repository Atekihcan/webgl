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

function drawtri(a, b, c, numDivision, r, prop) {
    if (numDivision <= 0) {
        vArray.push(scaleBy(a, r), scaleBy(b, r), scaleBy(c, r));
        if (prop.normal)  { nArray.push(a, b, c); }
        if (prop.texture) {
            var mint = 0.25, maxt = 1 - mint, 
                texHack_1 = 0, texHack_2 = 0, texHack_3 = 0, 
                tempTexA = getTexCoordFromNormal(a), 
                tempTexB = getTexCoordFromNormal(b), 
                tempTexC = getTexCoordFromNormal(c);
            
            // hack to fix poles
            if ((a[0] == 0) && ((a[1] == 1) || (a[1] == -1))) {
                tempTexA[0] = (tempTexB[0] + tempTexC[0]) / 2;
                if (((tempTexC[0] < mint) && (tempTexB[0] > maxt)) || ((tempTexB[0] < mint) && (tempTexC[0] > maxt))) { tempTexA[0] += 0.5; }
            } else if ((b[0] == 0) && ((b[1] == 1) || (b[1] == -1))) {
                tempTexB[0] = (tempTexA[0] + tempTexC[0]) / 2;
                if (((tempTexC[0] < mint) && (tempTexA[0] > maxt)) || ((tempTexA[0] < mint) && (tempTexC[0] > maxt))) { tempTexB[0] += 0.5; }
            } else if ((c[0] == 0) && ((c[1] == 1) || (c[1] == -1))) {
                tempTexC[0] = (tempTexA[0] + tempTexB[0]) / 2;
                if (((tempTexA[0] < mint) && (tempTexB[0] > maxt)) || ((tempTexB[0] < mint) && (tempTexA[0] > maxt))) { tempTexC[0] += 0.5; }
            }
            
            // hack to fix seam
            if (tempTexB[0] - tempTexA[0] > mint || tempTexC[0] - tempTexA[0] > mint ) {
                texHack_1 = 1;
            }
            if (tempTexA[0] - tempTexB[0] > mint || tempTexC[0] - tempTexB[0] > mint ) {
                texHack_2 = 1;
            }
            if (tempTexA[0] - tempTexC[0] > mint || tempTexB[0] - tempTexC[0] > mint ) {
                texHack_3 = 1;
            }
            tArray.push(
                        [tempTexA[0] + texHack_1, tempTexA[1]], 
                        [tempTexB[0] + texHack_2, tempTexB[1]], 
                        [tempTexC[0] + texHack_3, tempTexC[1]]
                       );
        }
    } else {
        var ab = mix(a, b, 0.5);
        var ac = mix(a, c, 0.5);
        var bc = mix(b, c, 0.5);
        
        normalize(ab);
        normalize(ac);
        normalize(bc);
        drawtri(a, ab, ac, numDivision - 1, r, prop);
        drawtri(b, bc, ab, numDivision - 1, r, prop);
        drawtri(c, ac, bc, numDivision - 1, r, prop);
        drawtri(ab, bc, ac, numDivision - 1, r, prop);
    }  
}

function drawSphere(numDivision, radius, prop) {
    for (var i = 0; i < 20; i++) {
        drawtri(icosahedronVert[icosahedronIndx[i][0]], 
                icosahedronVert[icosahedronIndx[i][1]], 
                icosahedronVert[icosahedronIndx[i][2]], 
                numDivision , radius, prop);
    }
}

/***************************************************
 *         functions to create vertex data         *
 ***************************************************/
/* axis vertex data */
function getAxesData(numDivs, prop) {
    var data = {v: [], c: [], i: [], n: [], t: []};

    // positive axis - solid
    data.v.push([0.0, 0.0, 0.0], [1.0, 0.0, 0.0]);
    if (prop.normal)  { data.n.push([0.0, 0.0, 0.0], [0.0, 0.0, 0.0]); }
    if (prop.texture) { data.t.push([0, 0], [0, 0]); }
    // negative axis - dotted
    for (var i = 0; i < numDivs; i++) {
        data.v.push([i * -1.0 / numDivs, 0.0, 0.0]);
        if (prop.normal)  { data.n.push([0.0, 0.0, 0.0]); }
        if (prop.texture) { data.t.push([0, 0]); }
    }
    return data;
}

/* line vertex data */
function getLineData(prop) {
    var data = {v: [], c: [], i: [], n: [], t: []};

    // positive axis - solid
    data.v.push([0.0, 0.0, 0.0], [1.0, 0.0, 0.0]);
    if (prop.normal)  { data.n.push([0.0, 0.0, 0.0], [0.0, 0.0, 0.0]); }
    if (prop.texture) { data.t.push([0, 0], [0, 0]); }
    return data;
}

/* grid vertex data */
function getGridData(divs, prop) {
    var data = {v: [], c: [], i: [], n: [], t: []};
    var start = [-1.0, -1.0], end = [1.0, 1.0], 
        a = [parseInt(start[0] * divs), parseInt(start[1] * divs)],
        b = [parseInt(end[0] * divs), parseInt(end[1] * divs)];
    
    for (var i = a[0]; i <= b[0]; i++) {
        data.v.push([i / divs, start[1], 0.0], [i / divs, end[1], 0.0]);
        if (prop.normal)  { data.n.push([0.0, 0.0, 0.0], [0.0, 0.0, 0.0]); }
        if (prop.texture) { data.t.push([0, 0], [0, 0]); }
    }
    for (var i = a[1]; i <= b[1]; i++) {
        data.v.push([start[0], i / divs, 0.0], [end[0], i / divs, 0.0]);
        if (prop.normal)  { data.n.push([0.0, 0.0, 0.0], [0.0, 0.0, 0.0]); }
        if (prop.texture) { data.t.push([0, 0], [0, 0]); }
    }
    return data;
}

/* polygon vertex data */
function getPolygonData(numDivs, prop) {
    var data = {v: [], c: [], i: [], n: [], t: []};
    var v = createPolygonFan([0.0, 0.0, 0.0], 1.0, numDivs);
    // base
    for (var i = 1; i <= numDivs; i++) {
        data.v.push(v[0], v[i], v[i + 1]);
        if (prop.normal)  { data.n.push([0.0, 0.0, 1.0], [0.0, 0.0, 1.0], [0.0, 0.0, 1.0]); }
        if (prop.texture) { data.t.push([0, 0], [0, 0], [0, 0]); }
    }
    return data;
}

/* function for getting cube vertex data */
function getCubeData(prop) {
    var data = {v: [], c: [], i: [], n: [], t: []};
    // front
    data.v.push(cubeVert[0], cubeVert[1], cubeVert[2], cubeVert[0], cubeVert[2], cubeVert[3]);
    if (prop.normal)  { for (var i = 0; i < 6; i++ ) { data.n.push([0.0, 0.0, 1.0]); } }
    if (prop.texture) { data.t.push([0, 0], [1, 0], [1, 1], [0, 0], [1, 1], [0, 1]) }
    // back
    data.v.push(cubeVert[4], cubeVert[5], cubeVert[6], cubeVert[4], cubeVert[6], cubeVert[7]);
    if (prop.normal)  { for (var i = 0; i < 6; i++ ) { data.n.push([0.0, 0.0, -1.0]); } }
    if (prop.texture) { data.t.push([0, 0], [1, 0], [1, 1], [0, 0], [1, 1], [0, 1]) }
    // left
    data.v.push(cubeVert[0], cubeVert[4], cubeVert[7], cubeVert[0], cubeVert[7], cubeVert[3]);
    if (prop.normal)  { for (var i = 0; i < 6; i++ ) { data.n.push([-1.0, 0.0, 0.0]); } }
    if (prop.texture) { data.t.push([0, 0], [1, 0], [1, 1], [0, 0], [1, 1], [0, 1]) }
    // right
    data.v.push(cubeVert[1], cubeVert[5], cubeVert[6], cubeVert[1], cubeVert[6], cubeVert[2]);
    if (prop.normal)  { for (var i = 0; i < 6; i++ ) { data.n.push([1.0, 0.0, 0.0]); } }
    if (prop.texture) { data.t.push([0, 0], [1, 0], [1, 1], [0, 0], [1, 1], [0, 1]) }
    // top
    data.v.push(cubeVert[2], cubeVert[6], cubeVert[7], cubeVert[2], cubeVert[7], cubeVert[3]);
    if (prop.normal)  { for (var i = 0; i < 6; i++ ) { data.n.push([0.0, 1.0, 0.0]); } }
    if (prop.texture) { data.t.push([0, 0], [1, 0], [1, 1], [0, 0], [1, 1], [0, 1]) }
    // bottom
    data.v.push(cubeVert[1], cubeVert[5], cubeVert[4], cubeVert[1], cubeVert[4], cubeVert[0]);
    if (prop.normal)  { for (var i = 0; i < 6; i++ ) { data.n.push([0.0, -1.0, 0.0]); } }
    if (prop.texture) { data.t.push([0, 0], [1, 0], [1, 1], [0, 0], [1, 1], [0, 1]) }
    
    return data;
}

/* function for getting sphere vertex data */
function getIcosahedronData(numDivs, prop) {
    vArray = [], nArray = [], tArray = [];
    drawSphere(numDivs, 1.0, prop);
    return {v: vArray, c: [], i: [], n: nArray, t: tArray};
}

/* function for getting sphere vertex data */
function getSphereData(numDivs, prop) {
    vArray = [], iArray = [], nArray = [], tArray = [];

    for (var latNumber = 0; latNumber <= numDivs; latNumber++) {
        for (var longNumber = 0; longNumber <= numDivs; longNumber++) {
            var theta = latNumber * Math.PI / numDivs, 
                phi = longNumber * 2 * Math.PI / numDivs, 
                sinTheta = Math.sin(theta), 
                sinPhi = Math.sin(phi), 
                cosTheta = Math.cos(theta), 
                cosPhi = Math.cos(phi);

            var x = cosPhi * sinTheta, 
                y = cosTheta, 
                z = sinPhi * sinTheta, 
                u = 1 - (longNumber / numDivs), 
                v = (latNumber / numDivs);

            vArray.push([x, y, z]);
            if (prop.normal)  { nArray.push([x, y, z]); }
            if (prop.texture) { tArray.push([u, v]); }

            if (prop.index)  { 
                if(latNumber < numDivs && longNumber < numDivs) {
                    var first = latNumber * (numDivs + 1) + longNumber;
                    var second = first + numDivs + 1;
                    iArray.push(first, second, first + 1, second, second + 1, first + 1);
                }
            }
        }
    }
    
    return {v: vArray, c: [], i: iArray, n: nArray, t: tArray};
}

/* function for getting cylinder vertex data */
function getCylinderData(numDivs, prop) {
    var data = {v: [], c: [], i: [], n: [], t: []};
    var v_front = createPolygonFan([0.0, 0.0, +1.0], 1.0, numDivs);
    var v_back  = createPolygonFan([0.0, 0.0, -1.0], 1.0, numDivs);
    // front face
    for (var i = 1; i <= numDivs; i++) {
        data.v.push(v_front[0], v_front[i], v_front[i + 1]);
        if (prop.normal) {
            data.n.push([0.0, 0.0, 1.0], [0.0, 0.0, 1.0], [0.0, 0.0, 1.0]);
        }
    }

    // body
    for (var i = 1; i <= numDivs; i++) {
        // triangle strip 1
        data.v.push(v_front[i], v_back[i], v_front[i + 1]);
        data.n.push(v_front[i], v_back[i], v_front[i + 1]);
        // triangle strip 2
        data.v.push(v_front[i + 1], v_back[i], v_back[i + 1]);
        data.n.push(v_front[i + 1], v_back[i], v_back[i + 1]);
    }

    // back face
    for (var i = 1; i <= numDivs; i++) {
        data.v.push(v_back[0], v_back[i], v_back[i + 1]);
        data.n.push([0.0, 0.0, 1.0], [0.0, 0.0, 1.0], [0.0, 0.0, 1.0]);
    }
    return data;
}

/* function for getting cone vertex data */
function getConeData(numDivs, prop) {
    var data = {v: [], c: [], i: [], n: [], t: []};
    var tip = [0.0, 0.0, +1.0];
    var v_base = createPolygonFan([0.0, 0.0, -1.0], 1.0, numDivs);
    // base
    for (var i = 1; i <= numDivs; i++) {
        data.v.push(v_base[0], v_base[i], v_base[i + 1]);
        data.n.push([0.0, 0.0, 1.0], [0.0, 0.0, 1.0], [0.0, 0.0, 1.0]);
    }

    // body
    for (var i = 1; i <= numDivs; i++) {
        // triangle strip 1
        var normal = getSurfaceNormal(tip, v_base[i], v_base[i + 1]);
        data.v.push(tip, v_base[i], v_base[i + 1]);
        data.n.push(normal, normal, normal);
    }
    return data;
}

/* return vertex data for primitive object */
function getPrimitiveData(id, details, prop) {
    var data = {v: [], c: [], i: [], n: [], t: []};
    switch(id) {
        // points
        case 0:
            data.v.push([0.0, 0.0, 0.0]);
            if (prop.normal)  { data.n.push([0.0, 0.0, 0.0]) };
            if (prop.texture) { data.t.push([0.0, 0.0]) };
            break;
        // axes
        case 1:
            data = getAxesData(details, prop);
            break;
        case 2:
            data = getLineData(prop);
            break;
        case 3:
            data = getGridData(details, prop);
            break;
        case 4:
            data = getPolygonData(details, prop);
            break;
        case 5:
            data = getCubeData(prop);
            break;
        case 6:
            data = getIcosahedronData(details, prop);
            break;
        case 7:
            data = getSphereData(details, prop);
            break;
        case 8:
            data = getCylinderData(details, prop);
            break;
        case 9:
            data = getConeData(details, prop);
            break;
        default:
            console.error("shape <" + id + "> is not supported");
            break;
    }

    return data;
}


/***************************************************
 *         geometry utility functions              *
 ***************************************************/
/* create n-sided polygon to be used with TRIANGLE_FAN */
function createPolygonFan(translate, radius, numPoints) {
    var v = [];
    var withZ = false;
    if (translate.length == 3) {
        withZ = true;
    }

    v.push(translate);
    for (var i = 0; i <= numPoints; i++) {
        if (withZ) {
            v.push([translate[0] + radius * Math.sin(i * 2 * Math.PI / numPoints), translate[1] + radius * Math.cos(i * 2 * Math.PI / numPoints), translate[2]]);
        } else {
            v.push([translate[0] + radius * Math.sin(i * 2 * Math.PI / numPoints), translate[1] + radius * Math.cos(i * 2 * Math.PI / numPoints)]);
        }
    }
    return v;
}

/* calculate surface normal for a triangle strip */
function getSurfaceNormal(a, b, c) {
    return normalize(cross(subtract(c, a), subtract(b, a)));
}

/* calculate texture coord from normal */
function getTexCoordFromNormal(n) {
    var t = [0, 0],
        nX = 0, 
        nZ = -1;
    if (((n[0] * n[0]) + (n[2] * n[2])) > 0){
        nX = Math.sqrt((n[0] * n[0]) / ((n[0] * n[0]) + (n[2] * n[2])));
        if (n[0] < 0){
            nX = -nX;
        }
        nZ = Math.sqrt((n[2] * n[2]) / ((n[0] * n[0]) + (n[2] * n[2])));
        if (n[2] < 0){
            nZ = -nZ;
        }
    }
    if (nZ == 0){
        t[0] = nX * Math.PI / 2;
    } else {
        t[0] = Math.atan(nX / nZ);
        if (nZ < 0){
            t[0] += Math.PI;
        }
        if (t[0] < 0){
            t[0] += 2 * Math.PI;
        }
    }
    t[0] /= 2 * Math.PI;
    t[1] = (-n[1] + 1) / 2;
    return t;
}

/***************************************************
 *                geometry objects                 *
 ***************************************************/
/* object primitive */
function Geometry(shapeObject, property) {
    this.shape        = shapeObject.id;
    this._gl          = {
                           vbo: shapeObject.vbo,
                           cbo: shapeObject.cbo,
                           ibo: shapeObject.ibo,
                           nbo: shapeObject.nbo,
                           tbo: shapeObject.tbo,
                           numVert: shapeObject.numVert,
                           numIndx: shapeObject.numIndx,
                           program: shapeObject.program,
                        };
    this.scale        = [1.0, 1.0, 1.0];
    this.rotate       = [0.0, 0.0, 0.0];
    this.translate    = [0.0, 0.0, 0.0];
    this.matColor     = [1.0, 0.0, 0.0, 1.0];
    this.matAmbient   = [0.0, 0.0, 0.0, 1.0];
    this.matDiffuse   = [1.0, 1.0, 1.0, 1.0];
    this.matSpecular  = [0.0, 0.0, 0.0, 1.0];
    this.matShininess = 100.0;
    this.lighting     = false;
    this.texture      = false;
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
            if (Math.abs(this.translate[0] - end[0]) != Math.abs(this.translate[1] - end[1])) {
                end[1] = this.translate[1] + sign(end[1] - this.translate[1]) * Math.abs(this.translate[0] - end[0]);
            }

            this.scale = [Math.abs(end[0] - this.translate[0]), Math.abs(end[1] - this.translate[1]), Math.abs(end[1] - this.translate[1])];
        }
        this.scale = [Math.abs(end[0] - this.translate[0]), Math.abs(end[1] - this.translate[1]), Math.abs(end[1] - this.translate[1])];
        this.translate = this.translate;
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
            case 8:
            case 9:
                if (offline || this.fill) {
                    gl.drawArrays(gl.TRIANGLES, 0, this._gl.numVert);
                }
                if (!offline && this.selected) {
                    for(var i = 0; i < this._gl.numVert; i += 3) {
                        gl.uniform4fv(gl.getUniformLocation(this._gl.program, "u_matDiffuse"), flatten(getComplement(this.matDiffuse)));
                        gl.drawArrays(gl.LINE_LOOP, i, 3);
                    }
                }
                if (!offline && !this.fill && !this.selected && this.wireFrame) {
                    for(var i = 0; i < this._gl.numVert; i += 3) {
                        gl.drawArrays(gl.LINE_LOOP, i, 3);
                    }
                }
                break;
            case 7:
                if (offline || this.fill) {
                    gl.drawElements(gl.TRIANGLES, this._gl.numIndx, gl.UNSIGNED_SHORT, 0);
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