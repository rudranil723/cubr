var COLORS = ["white", "blue", "orange", "green",
              "red", "yellow", "pink", "#303030"];

var Cube = function(sceneData, x, y, z, len, up, right, colors) {
    /* Cube is centered at (x, y, z)
     * Each edge has length `len`
     * Azimuth angle with the z axis is lat
     * Rotation about z axis is lon
     */
    var colors = colors;
    var scene;
    var texture;
    var image;
    var loc = {
        pos: [x, y, z],
        orientation: {up: up,
                      right: right}
    };
    /* Permanent location (updated at the end of a move) */
    var ploc = {
        pos: [x, y, z],
        orientation: {up: copyArray(up),
                      right: copyArray(right)}

    }
    var buffers = {
        vertices: null,
        normals: null,
        texture: null,
        indices: null
    };

    var home = {
        x: x,
        y: y,
        z: z,
        len: len,
        orientation: {up: copyArray(up),
                      right: copyArray(right)}
    };

    var moving = {
        currently: false,
        update: null,
        stop: null,
        frameStart: null,
        frameCurrent: null,
    };

    var rotate = function(axis, angle, frameStart) {
        var hand = vec.without(loc.pos, axis);
        var right = vec.setMag(vec.mag(hand), vec.cross(axis, hand));
        var getPos = function(portion) {
            return vec.add(axis,
                           vec.add(vec.muls(Math.cos(angle*(1-portion)), hand),
                           vec.muls(Math.sin(angle*(1-portion)), right)));
        };
        var upOrig = vec.unit(loc.orientation.up);
        var upPerp = vec.unit(vec.cross(axis, upOrig));
        var rightOrig = vec.unit(loc.orientation.right);
        var rightPerp = vec.unit(vec.cross(axis, rightOrig));
        var getOrientation = function(portion) {
            return {up: (vec.isZero(upPerp) ? upOrig :
                         vec.add(vec.muls(Math.cos(angle*(1-portion)),
                                          upOrig),
                                 vec.muls(Math.sin(angle*(1-portion)),
                                          upPerp))),
                    right: (vec.isZero(rightPerp) ? rightOrig :
                            vec.add(vec.muls(Math.cos(angle*(1-portion)),
                                             rightOrig),
                                    vec.muls(Math.sin(angle*(1-portion)),
                                             rightPerp)))
            };
        };
        // Change these two functions with orientation!
        moving.update = function() {
            var portion = (1.0 * moving.frameCurrent) / moving.frameStart;
            loc.pos = getPos(portion);
            loc.orientation = getOrientation(portion);
            resetBuffers();
            moving.frameCurrent--;
            return (moving.frameCurrent == -1);
        };
        moving.stop = function() {
            moving.currently = false;
            loc.pos = vec.ints(getPos(0));
            var newOrientation = getOrientation(0);
            loc.orientation = {
                up: vec.ints(newOrientation.up),
                right: vec.ints(newOrientation.right)
            };
            ploc.pos = copyArray(loc.pos);
            ploc.orientation = {up: copyArray(loc.orientation.up),
                                right: copyArray(loc.orientation.right)};
            resetBuffers();
        }
        moving.currently = true;
        moving.frameStart = frameStart;
        moving.frameCurrent = frameStart;
    };

    var getVertices = function() { /* FIX THIS FUNCTION AND THE ONE BELOW IT. */
        var r = len * 0.5;
        var F = vec.unit(vec.cross(loc.orientation.right, loc.orientation.up));
        var U = vec.unit(loc.orientation.up);
        var R = vec.unit(loc.orientation.right);
        F = vec.muls(r, F);
        U = vec.muls(r, U);
        R = vec.muls(r, R);
        var B = vec.muls(-1, F);
        var D = vec.muls(-1, U);
        var L = vec.muls(-1, R);

        var FUL = vec.add(loc.pos, vec.add(F, vec.add(U, L)));
        var FUR = vec.add(loc.pos, vec.add(F, vec.add(U, R)));
        var FDL = vec.add(loc.pos, vec.add(F, vec.add(D, L)));
        var FDR = vec.add(loc.pos, vec.add(F, vec.add(D, R)));
        var BUL = vec.add(loc.pos, vec.add(B, vec.add(U, L)));
        var BUR = vec.add(loc.pos, vec.add(B, vec.add(U, R)));
        var BDL = vec.add(loc.pos, vec.add(B, vec.add(D, L)));
        var BDR = vec.add(loc.pos, vec.add(B, vec.add(D, R)));

        return [
         // Front face
                FUL[0], FUL[1], FUL[2],
                FUR[0], FUR[1], FUR[2],
                FDR[0], FDR[1], FDR[2],
                FDL[0], FDL[1], FDL[2],

         // Back face
                BUL[0], BUL[1], BUL[2],
                BUR[0], BUR[1], BUR[2],
                BDR[0], BDR[1], BDR[2],
                BDL[0], BDL[1], BDL[2],

         // Top face
                FUL[0], FUL[1], FUL[2],
                BUL[0], BUL[1], BUL[2],
                BUR[0], BUR[1], BUR[2],
                FUR[0], FUR[1], FUR[2],

         // Bottom face
                FDL[0], FDL[1], FDL[2],
                BDL[0], BDL[1], BDL[2],
                BDR[0], BDR[1], BDR[2],
                FDR[0], FDR[1], FDR[2],


         // Right face
                FUR[0], FUR[1], FUR[2],
                FDR[0], FDR[1], FDR[2],
                BDR[0], BDR[1], BDR[2],
                BUR[0], BUR[1], BUR[2],

         // Left face
                FUL[0], FUL[1], FUL[2],
                FDL[0], FDL[1], FDL[2],
                BDL[0], BDL[1], BDL[2],
                BUL[0], BUL[1], BUL[2],
                ];
    };

    var getNormals = function () {
        var F = vec.unit(vec.cross(loc.orientation.right, loc.orientation.up));
        var U = vec.unit(loc.orientation.up);
        var R = vec.unit(loc.orientation.right);
        var B = vec.muls(-1, F);
        var D = vec.muls(-1, U);
        var L = vec.muls(-1, R);

        return [
         // Front
                F[0], F[1], F[2],
                F[0], F[1], F[2],
                F[0], F[1], F[2],
                F[0], F[1], F[2],
         // Back
                B[0], B[1], B[2],
                B[0], B[1], B[2],
                B[0], B[1], B[2],
                B[0], B[1], B[2],
         // Top
                U[0], U[1], U[2],
                U[0], U[1], U[2],
                U[0], U[1], U[2],
                U[0], U[1], U[2],
         // Bottom
                D[0], D[1], D[2],
                D[0], D[1], D[2],
                D[0], D[1], D[2],
                D[0], D[1], D[2],
         // Right
                R[0], R[1], R[2],
                R[0], R[1], R[2],
                R[0], R[1], R[2],
                R[0], R[1], R[2],
         // Left
                L[0], L[1], L[2],
                L[0], L[1], L[2],
                L[0], L[1], L[2],
                L[0], L[1], L[2],
         ];
    };

    var getTextureCoords = function() {
        return [
                // Front
                0.0,  1.0 - 0.125 * colors[0],
                1.0,  1.0 - 0.125 * colors[0],
                1.0,  1.0 - 0.125 * (1+colors[0]),
                0.0,  1.0 - 0.125 * (1+colors[0]),
                // Back
                0.0,  1.0 - 0.125 * colors[1],
                1.0,  1.0 - 0.125 * colors[1],
                1.0,  1.0 - 0.125 * (1+colors[1]),
                0.0,  1.0 - 0.125 * (1+colors[1]),
                // Top
                0.0,  1.0 - 0.125 * colors[2],
                1.0,  1.0 - 0.125 * colors[2],
                1.0,  1.0 - 0.125 * (1+colors[2]),
                0.0,  1.0 - 0.125 * (1+colors[2]),
                // Bottom
                0.0,  1.0 - 0.125 * colors[3],
                1.0,  1.0 - 0.125 * colors[3],
                1.0,  1.0 - 0.125 * (1+colors[3]),
                0.0,  1.0 - 0.125 * (1+colors[3]),
                // Right
                0.0,  1.0 - 0.125 * colors[4],
                1.0,  1.0 - 0.125 * colors[4],
                1.0,  1.0 - 0.125 * (1+colors[4]),
                0.0,  1.0 - 0.125 * (1+colors[4]),
                // Left
                0.0,  1.0 - 0.125 * colors[5],
                1.0,  1.0 - 0.125 * colors[5],
                1.0,  1.0 - 0.125 * (1+colors[5]),
                0.0,  1.0 - 0.125 * (1+colors[5]),
         ];
    };

    var getIndices = function () {
        return [
         0,  1,  2,      0,  2,  3,    // front
         4,  5,  6,      4,  6,  7,    // back
         8,  9,  10,     8,  10, 11,   // top
         12, 13, 14,     12, 14, 15,   // bottom
         16, 17, 18,     16, 18, 19,   // right
         20, 21, 22,     20, 22, 23    // left
         ];
    };

    var resetBuffers = function() {
        var gl = scene.gl;
        buffers.vertices = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, buffers.vertices);
        var vertices = getVertices();
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertices),
                      gl.STATIC_DRAW);
        buffers.normals = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, buffers.normals);
        var vertexNormals = getNormals();
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertexNormals),
                      gl.STATIC_DRAW);
        buffers.texture = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, buffers.texture);
        var textureCoordinates = getTextureCoords();
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(textureCoordinates),
                      gl.STATIC_DRAW);
        buffers.indices = gl.createBuffer();
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, buffers.indices);
        var vertexIndices = getIndices();
        gl.bufferData(gl.ELEMENT_ARRAY_BUFFER,
                      new Uint16Array(vertexIndices), gl.STATIC_DRAW);
    };

    var getColors = function() {
        return colors;
    };

    var draw = function(scene) {
        var gl = scene.gl;
        scene.mvPushMatrix();
        gl.bindBuffer(gl.ARRAY_BUFFER, buffers.vertices);
        gl.vertexAttribPointer(scene.vertexPositionAttribute, 3,
                               gl.FLOAT, false, 0, 0);
        gl.bindBuffer(gl.ARRAY_BUFFER, buffers.texture);
        gl.vertexAttribPointer(scene.textureCoordAttribute, 2,
                               gl.FLOAT, false, 0, 0);
        gl.bindBuffer(gl.ARRAY_BUFFER, buffers.normals);
        gl.vertexAttribPointer(scene.vertexNormalAttribute, 3,
                               gl.FLOAT, false, 0, 0);
        // Specify the texture to map onto the faces.
        gl.activeTexture(gl.TEXTURE0);
        gl.bindTexture(gl.TEXTURE_2D, texture);
        gl.uniform1i(gl.getUniformLocation(scene.shaderProgram, "uSampler"), 0);
        // Draw the cube.
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, buffers.indices);
        scene.setMatrixUniforms();
        gl.drawElements(gl.TRIANGLES, 36, gl.UNSIGNED_SHORT, 0);
        scene.mvPopMatrix();
    };

    var createTexture = function () {
        var gl = scene.gl;
        var canvas = document.createElement('canvas');
        canvas.id     = "hiddenCanvas";
        canvas.width  = 128;
        canvas.height = 128*8;
        canvas.style.display   = "none";
        var body = document.getElementsByTagName("body")[0];
        body.appendChild(canvas);
        // draw texture
        var image = document.getElementById('hiddenCanvas');
        var ctx = image.getContext('2d');
        ctx.beginPath();
        ctx.rect(0, 0, ctx.canvas.width/2, ctx.canvas.height/2);
        ctx.fillStyle = 'white';
        ctx.fill();

        var W = 128;
        var H = 128;

        for (var f = 0; f < COLORS.length; f++) {
            ctx.beginPath();
            ctx.rect(0, H*f, W, H);
            ctx.fillStyle = COLORS[f];
            ctx.fill();
        }
        ctx.restore();
        // create new texture
        var texture = gl.createTexture();
        gl.bindTexture(gl.TEXTURE_2D, texture);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER,
                         gl.LINEAR_MIPMAP_NEAREST);
        gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
        gl.bindTexture(gl.TEXTURE_2D, texture);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA,
                      gl.UNSIGNED_BYTE, image);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER,
                         gl.LINEAR_MIPMAP_NEAREST);
        gl.generateMipmap(gl.TEXTURE_2D);
        gl.bindTexture(gl.TEXTURE_2D, null);
        return texture;
    };

    var init = function(s) {
        scene = s;
        texture = createTexture();
        resetBuffers();
    };
    init(sceneData);

    var publicAttrs = {
        draw: draw,
        moving: moving,
        rotate: rotate,
        loc: loc,
        ploc: ploc
    };
    return publicAttrs;
};

var Cubelets = function() {
    var cubes = [];
    var scene;

    var linkRendering = function(d) {
        scene = d;
    };

    var draw = function() {
        for (var i = 0; i < cubes.length; i++) {
            var cube = cubes[i];
            cube.draw(scene);
        }
    };

    var removeAll = function() {
       cubes = [];
    };

    var add = function(x, y, z, len, up, right, colors) {
        cubes.push(Cube(scene, x, y, z, len, up, right, colors));
    };

    var makeMove = function(move, moveFrameStart) {
        for (var i = 0; i < cubes.length; i++) {
            var cube = cubes[i];
            if (move.applies(cube)) {
                if (cube.moving.currently)
                    return false;
            }
        }
        for (var i = 0; i < cubes.length; i++) {
            var cube = cubes[i];
            if (move.applies(cube)) {
                cube.rotate(move.axis, move.angle, moveFrameStart);
            }
        }
        return true;
    };

    var updateRotation = function() {
        for (var i = 0; i < cubes.length; i++) {
            var cube = cubes[i];
            if (cube.moving.currently) {
                if (cube.moving.update())
                    cube.moving.stop();
            }
        }
    };

    var init = function(c) {

    };

    var publicAttrs = {
        linkRendering: linkRendering,
        draw: draw,
        removeAll: removeAll,
        updateRotation: updateRotation,
        makeMove: makeMove,
        add: add
    };

    return publicAttrs;
};
