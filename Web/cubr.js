var Cube = function(sceneData, x, y, z, len, up, right, colors, set) {
    /* Cube is centered at (x, y, z)
     * Each edge has length `len`
     * Azimuth angle with the z axis is lat
     * Rotation about z axis is lon
     */
    var colors = colors;
    var scene;
    var settings;
    var texture;
    var image;
    var loc = {
        len: len,
        pos: [x, y, z],
        orientation: {up: up,
                      right: right}
    };
    /* Permanent location (updated at the end of a move) */
    var ploc = {
        pos: [x, y, z],
        orientation: {up: copyArray(up),
                      right: copyArray(right)}

    };

    var buffers = {
        vertices: null,
        normals: null,
        texture: null,
        indices: null
    };

    var home = {
        pos: [x, y, z],
        len: len,
        orientation: {up: copyArray(up),
                      right: copyArray(right)}
    };

    var returnHome = function() {
        loc.pos = copyArray(home.pos);
        loc.orientation.up = copyArray(home.orientation.up);
        loc.orientation.right = copyArray(home.orientation.right);
        loc.len = home.len;
        snap();
        resetBuffers();
    };

    var moving = {
        currently: false,
        update: null,
        stop: null,
        frameStart: null,
        frameCurrent: null,
    };

    var snap = function() {
        loc.pos = vec.ints(loc.pos);
        loc.orientation = {
            up: vec.ints(loc.orientation.up),
            right: vec.ints(loc.orientation.right)
        };
        ploc.pos = copyArray(loc.pos);
        ploc.orientation = {up: copyArray(loc.orientation.up),
                            right: copyArray(loc.orientation.right)};

    }

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
            loc.pos = getPos(0);
            loc.orientation = getOrientation(0);
            snap();
            moving.currently = false;
            resetBuffers();
        }
        moving.currently = true;
        moving.frameStart = frameStart;
        moving.frameCurrent = frameStart;
    };

    var getVertices = function() { /* FIX THIS FUNCTION AND THE ONE BELOW IT. */
        var r = loc.len * 0.5;
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

        for (var f = 0; f < settings.colors.length; f++) {
            ctx.beginPath();
            ctx.rect(0, H*f, W, H);
            ctx.fillStyle = settings.colors[f];
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

    var init = function(sce, set) {
        scene = sce;
        settings = set;
        texture = createTexture();
        resetBuffers();
    };
    init(sceneData, set);

    var publicAttrs = {
        draw: draw,
        moving: moving,
        rotate: rotate,
        loc: loc,
        ploc: ploc,
        returnHome: returnHome
    };
    return publicAttrs;
};

var Cubelets = function(set) {
    var cubes = [];
    var scene;
    var settings;

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
        cubes.push(Cube(scene, x, y, z, len, up, right, colors, settings));
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

    var setState = function(state) {
        if (state==="solved") {
            for (var i = 0; i < cubes.length; i++) {
                var cube = cubes[i];
                cube.returnHome();
            }
        }
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

    var init = function(set) {
        settings = set;
    };
    init(set);

    var publicAttrs = {
        linkRendering: linkRendering,
        draw: draw,
        removeAll: removeAll,
        updateRotation: updateRotation,
        makeMove: makeMove,
        add: add,
        setState: setState
    };

    return publicAttrs;
};

var KEYCODES = {
    up: 38,
    down: 40,
    left: 37,
    right: 39,
    f: 70,
    u: 85,
    d: 68,
    r: 82,
    l: 76,
    b: 66
};

var RubiksCube = function(sce, set) {
    var cubelets;
    var scene;
    var moveQueue;
    var moves;
    var settings;
    var moveFrameStart;
    var currentMove;
    var setVersion = function(versionID) {
        cubelets.removeAll();
        var sl = versionID;
        var min = -sl+1;
        var max = sl-1;
        for (var z = min; z <= max; z += 2) {
            for (var y = min; y <= max; y += 2) {
                for (var x = min; x <= max; x += 2) {
                    var colors = [ (z ==  max) ? 0: -1,
                                   (z ==  min) ? 1: -1,
                                   (y ==  max) ? 2: -1,
                                   (y ==  min) ? 3: -1,
                                   (x ==  max) ? 4: -1,
                                   (x ==  min) ? 5: -1
                                 ];
                    cubelets.add(x, y, z, 1.95,
                                 [0, 1, 0], [1, 0, 0], colors);
                }
            }
        }
    };

    var checkForMoves = function(key, keys) {
        for (var i in moves) {
            var move = moves[i];
            if (!keys[key] && (move.key==key)) {
                moveQueue.push(move);
                break;
            }
        }
    };

    var makeMove = function(move) {
        return cubelets.makeMove(move, settings.speed);
    };

    var cycleMoves = function() {
        while (moveQueue.length > 0 && makeMove(moveQueue[0]))
            moveQueue.shift();
    };

    var update = function(keys, momentum) {
        cycleMoves();
        cubelets.updateRotation();
        var r = settings.rotateSpeed;
        var dx = 0;
        var dy = 0;
        if (keys[KEYCODES.up])
            dy -= r;
        if (keys[KEYCODES.down])
            dy += r;
        if (keys[KEYCODES.left])
            dx -= r;
        if (keys[KEYCODES.right])
            dx += r;
        rotate(dx+momentum.x, dy+momentum.y);
    };

    var rotate = function(dx, dy) {
        var right = $V([1.0, 0.0, 0.0, 0.0]);
        var up = $V([0.0, 1.0, 0.0, 0.0]);

        var inv = scene.data.mvMatrix.inverse();
        var newRight = inv.x(right);
        if (dy != 0)
            scene.data.mvRotate(dy, [newRight.elements[0],
                                     newRight.elements[1],
                                     newRight.elements[2]]);

        var newUp = inv.x(up);
        if (dx != 0)
            scene.data.mvRotate(dx, [newUp.elements[0],
                                     newUp.elements[1],
                                     newUp.elements[2]]);

    };

    var initMoves = function() {
        moveQueue = [];
        moves = {
            front: {
                axis: [0.0, 0.0, 2.0],
                key: KEYCODES.f,
                angle: -Math.PI/2,
                applies: function(c){return feq(c.ploc.pos[2], 2);}
            },
            back: {
                axis: [0.0, 0.0, -2.0],
                key: KEYCODES.b,
                angle: -Math.PI/2,
                applies: function(c){return feq(c.ploc.pos[2], -2);}
            },
            right: {
                axis: [2.0, 0.0, 0.0],
                key: KEYCODES.r,
                angle: -Math.PI/2,
                applies: function(c){return feq(c.ploc.pos[0], 2);}
            },
            left: {
                axis : [-2.0, 0.0, 0.0],
                angle : -Math.PI/2,
                key: KEYCODES.l,
                applies : function(c){return feq(c.ploc.pos[0], -2);}
            },
            up: {
                axis : [0.0, 2.0, 0.0],
                key: KEYCODES.u,
                angle : -Math.PI/2,
                applies : function(c){return feq(c.ploc.pos[1], 2);}
            },
            down: {
                axis : [0.0, -2.0, 0.0],
                key: KEYCODES.d,
                angle : -Math.PI/2,
                applies : function(c){return feq(c.ploc.pos[1], -2);}
            }
        }
    };

    var init = function(sce, set) {
        scene = sce;
        settings = set;
        cubelets = Cubelets(settings);
        initMoves();
        scene.linkObjects(cubelets);
    };
    init(sce, set);

    var publicAttrs = {
        setVersion: setVersion,
        setState: cubelets.setState,
        update: update,
        checkForMoves: checkForMoves,
        rotate: rotate
    };
    return publicAttrs;
};

var cubr = function() {
    var scene;
    var cube;
    var keys;
    var mouse = {
        down: false,
        last: [0, 0],
    };
    var momentum = {
        x: 0,
        y: 0
    }

    var settings = {
        timerInterval: 20,
        rotateSpeed: Math.PI / 48,
        speed: 16,
        dragSensitivity: 0.003,
        inertia: 0.75,
        colors: ["white", "blue", "orange", "green",
                 "red", "yellow", "pink", "#303030"]
    };

    var resetKeys = function() {
        keys = [];
        for (var k = 0; k < 256; k++) {
            keys.push(false);
        }
    };

    var timerFired = function() {
        cube.update(keys, momentum);
        momentum.x *= settings.inertia;
        momentum.y *= settings.inertia;
        scene.draw();
    };

    var onKeyDown = function(e) {
        var keyCode = event.keyCode;
        if (cube)
            cube.checkForMoves(keyCode, keys);
        if (33 <= keyCode && keyCode <= 40)
            event.preventDefault();
        keys[keyCode] = true;
    };

    var onKeyUp = function(e) {
        var keyCode = event.keyCode;
        keys[keyCode] = false;
    };

    var onMouseDown = function(e) {
        if (e.toElement.id==="glcanvas") {
            e.preventDefault();
            mouse.down = true;
            mouse.last = [e.x, e.y];
        }
    };

    var onMouseUp = function(e) {
        mouse.down = false;
    };

    var onMouseMove = function(e) {
        if (mouse.down) {
            e.preventDefault();
            if (e.toElement.id==="glcanvas") {
                momentum.x += settings.dragSensitivity * (e.x - mouse.last[0]);
                momentum.y += settings.dragSensitivity * (e.y - mouse.last[1]);
                mouse.last = [e.x, e.y];
            }
        }
    };

    var bindEventListeners = function() {
        //document.addEventListener("blur", onLoseFocus, false);
        // Keys
        resetKeys();
        document.addEventListener("keydown", onKeyDown, false);
        document.addEventListener("keyup", onKeyUp, false);
        // Mouse clicking
        document.addEventListener("mousedown", onMouseDown, false);
        document.addEventListener("mouseup", onMouseUp, false);
        document.addEventListener("mousemove", onMouseMove, false);
        //canvas.addEventListener("click", onClick, false);
        //canvas.addEventListener("dblclick", onDoubleClick, false);
        //document.addEventListener("contextmenu", onRightClick, true);
        // Mouse movement
        //canvas.addEventListener("mouseout", onMouseExit, false);
        //canvas.addEventListener("mouseover", onMouseEnter, false);
        //canvas.addEventListener("focus", onGainFocus, false);
        // Mouse wheel
        //canvas.addEventListener("mousewheel", onMouseWheel, false);
        // Window
        //document.addEventListener("resize", onResize, false);
        //document.addEventListener("unload", onExit, false);
        // Timer:
        setInterval(timerFired, settings.timerInterval);
    };

    var run = function() {
        scene = SimpleScene("glcanvas");
        cube = RubiksCube(scene, settings);
        cube.setVersion(3);
        bindEventListeners();
    };

    var reset = function() {
        cube.setState("solved");
    }

    var publicAttrs = {
        run: run,
        reset: reset,
    };
    return publicAttrs;
}();
