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