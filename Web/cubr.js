function SimpleScene(canvasID) {
    'use strict';
    // `canvasID` is the id of the canvas element used for the scene.
    var data,
        renderHeap;

    data = {
        canvas: null,
        gl: null,
        rot: [0.0, 0.0, 0.0],
        mvMatrix: null,
        mvMatrixStack: [],
        shaderProgram: null,
        perspectiveMatrix: null,
        vertexPositionAttribute: null,
        textureCoordAttribute: null,
        vertexNormalAttribute: null,
        loadIdentity: function () {return matUtil.loadIdentity(data); },
        mvTranslate: function (v) {return matUtil.mvTranslate(data, v); },
        mvPushMatrix: function (m) {return matUtil.mvPushMatrix(data, m); },
        mvPopMatrix: function () {return matUtil.mvPopMatrix(data); },
        mvRotate: function (a, v) {return matUtil.mvRotate(data, a, v); },
        setMatrixUniforms: function () {
            return matUtil.setMatrixUniforms(data);
        }
    };

    renderHeap = [];

    function linkObjects(sceneObjects) {
        renderHeap.push(sceneObjects);
        sceneObjects.linkRendering(data);
    }

    function drawScene() {
        var gl,
            i,
            sceneObject;
        gl = data.gl;
        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
        // Establish the perspective with which we want to view the
        // scene. Our field of view is 45 degrees, with a width/height
        // ratio of 640:480, and we only want to see objects between 0.1 units
        // and 100 units away from the camera.
        data.perspectiveMatrix = makePerspective(45, 640.0 / 480.0, 0.1, 100.0);
        for (i = 0; i < renderHeap.length; i += 1) {
            sceneObject = renderHeap[i];
            sceneObject.draw();
        }
    }

    function init() {
        data.canvas = document.getElementById(canvasID);
        data.gl = data.canvas.getContext("experimental-webgl");
        rendUtil.clearAll(data.gl);
        rendUtil.initShaders(data);
        data.loadIdentity();
        data.mvPushMatrix();
        data.mvTranslate([0, 0, -20.0]);
    }

    init();

    this.draw = drawScene;
    this.linkObjects = linkObjects;
    this.data = data;
}


var Cube = function (sceneData, x, y, z, len, up, right, cols, set) {
    /* Cube is centered at (x, y, z)
     * Each edge has length `len`
     * "Up" indicates the normal to the face with color colors[0]
     * "Right" indicates the normal to the face with color colors[2]
     * Colors are in this order: F B U D R L
     */
    'use strict';
    var colors,
        scene,
        settings,
        texture,
        loc = {
            len: len,
            pos: [x, y, z],
            orientation: {up: up,
                          right: right}
        },
    /* Permanent location (updated at the end of a move) */
        ploc = {
            len: len,
            pos: [x, y, z],
            orientation: {up: copyArray(up),
                          right: copyArray(right)}
        },

    /* Buffers (used for WebGL rendering) */
        buffers = {
            vertices: null,
            normals: null,
            texture: null,
            indices: null
        },

    /* Starting position and orientation. This is where the solver
     * aims to return the Cube to.
     */
        home = {
            len: len,
            pos: [x, y, z],
            orientation: {up: copyArray(up),
                          right: copyArray(right)}
        },

    /* Data about the movement state. */
        moving = {
            currently: false,
            update: null,
            stop: null,
            frameStart: null,
            frameCurrent: null
        };

    /* Snap the cube into integer coordinates. Used at move completion
     * to remove rounding errors. It is important that inter-move locations
     * are on integer coordinates, because of this function!
     */
    function snap() {
        loc.pos = vec.ints(loc.pos);
        loc.orientation = {
            up: vec.ints(loc.orientation.up),
            right: vec.ints(loc.orientation.right)
        };
        ploc.pos = copyArray(loc.pos);
        ploc.orientation = {up: copyArray(loc.orientation.up),
                            right: copyArray(loc.orientation.right)};

    }

    function returnHome() {
        moving.currently = false;
        loc.pos = copyArray(home.pos);
        loc.orientation.up = copyArray(home.orientation.up);
        loc.orientation.right = copyArray(home.orientation.right);
        loc.len = home.len;
        snap();
        resetBuffers();
    }

    function rotate(axis, angle, frameStart) {
        var hand = vec.without(loc.pos, axis),
            perpHand = vec.setMag(vec.mag(hand), vec.cross(axis, hand)),
            getPos = function (portion) {
                return vec.add(axis,
                               vec.add(vec.muls(Math.cos(angle * (1 - portion)),
                                                hand),
                               vec.muls(Math.sin(angle * (1 - portion)),
                                        perpHand)));
            },
            upOrig = vec.unit(loc.orientation.up),
            upPerp = vec.unit(vec.cross(axis, upOrig)),
            rightOrig = vec.unit(loc.orientation.right),
            rightPerp = vec.unit(vec.cross(axis, rightOrig)),
            getOrientation = function (portion) {
                return {up: (vec.isZero(upPerp) ? upOrig :
                             vec.add(vec.muls(Math.cos(angle * (1 - portion)),
                                              upOrig),
                                     vec.muls(Math.sin(angle * (1 - portion)),
                                              upPerp))),
                        right: (vec.isZero(rightPerp) ? rightOrig :
                                vec.add(vec.muls(Math.cos(angle *
                                                          (1 - portion)),
                                                 rightOrig),
                                        vec.muls(Math.sin(angle *
                                                          (1 - portion)),
                                                 rightPerp)))
                };
            };
        moving.update = function () {
            var portion = moving.frameCurrent / moving.frameStart;
            loc.pos = getPos(portion);
            loc.orientation = getOrientation(portion);
            resetBuffers();
            moving.frameCurrent -= 1;
            return (moving.frameCurrent <= -1);
        };
        moving.stop = function () {
            loc.pos = getPos(0);
            loc.orientation = getOrientation(0);
            snap();
            moving.currently = false;
            resetBuffers();
        };
        moving.currently = true;
        moving.frameStart = frameStart;
        moving.frameCurrent = frameStart;
    }

    /* Used by resetBuffers */
    function getVertices() {
        var r,
            F,
            U,
            R,
            B,
            D,
            L,
            FUL,
            FUR,
            FDL,
            FDR,
            BUL,
            BUR,
            BDL,
            BDR;
        r = loc.len * 0.5;
        F = vec.unit(vec.cross(loc.orientation.right, loc.orientation.up));
        U = vec.unit(loc.orientation.up);
        R = vec.unit(loc.orientation.right);
        F = vec.muls(r, F);
        U = vec.muls(r, U);
        R = vec.muls(r, R);
        B = vec.muls(-1, F);
        D = vec.muls(-1, U);
        L = vec.muls(-1, R);
        FUL = vec.add(loc.pos, vec.add(F, vec.add(U, L)));
        FUR = vec.add(loc.pos, vec.add(F, vec.add(U, R)));
        FDL = vec.add(loc.pos, vec.add(F, vec.add(D, L)));
        FDR = vec.add(loc.pos, vec.add(F, vec.add(D, R)));
        BUL = vec.add(loc.pos, vec.add(B, vec.add(U, L)));
        BUR = vec.add(loc.pos, vec.add(B, vec.add(U, R)));
        BDL = vec.add(loc.pos, vec.add(B, vec.add(D, L)));
        BDR = vec.add(loc.pos, vec.add(B, vec.add(D, R)));

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
            BUL[0], BUL[1], BUL[2]
        ];
    }

    function getNormals() {
        var F = vec.unit(vec.cross(loc.orientation.right, loc.orientation.up)),
            U = vec.unit(loc.orientation.up),
            R = vec.unit(loc.orientation.right),
            B = vec.muls(-1, F),
            D = vec.muls(-1, U),
            L = vec.muls(-1, R);

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
            L[0], L[1], L[2]
        ];
    }

    function getTextureCoords() {
        return [
            // Front
            0.0,  1.0 - 0.125 * colors[0],
            1.0,  1.0 - 0.125 * colors[0],
            1.0,  1.0 - 0.125 * (1 + colors[0]),
            0.0,  1.0 - 0.125 * (1 + colors[0]),
            // Back
            0.0,  1.0 - 0.125 * colors[1],
            1.0,  1.0 - 0.125 * colors[1],
            1.0,  1.0 - 0.125 * (1 + colors[1]),
            0.0,  1.0 - 0.125 * (1 + colors[1]),
            // Top
            0.0,  1.0 - 0.125 * colors[2],
            1.0,  1.0 - 0.125 * colors[2],
            1.0,  1.0 - 0.125 * (1 + colors[2]),
            0.0,  1.0 - 0.125 * (1 + colors[2]),
            // Bottom
            0.0,  1.0 - 0.125 * colors[3],
            1.0,  1.0 - 0.125 * colors[3],
            1.0,  1.0 - 0.125 * (1 + colors[3]),
            0.0,  1.0 - 0.125 * (1 + colors[3]),
            // Right
            0.0,  1.0 - 0.125 * colors[4],
            1.0,  1.0 - 0.125 * colors[4],
            1.0,  1.0 - 0.125 * (1 + colors[4]),
            0.0,  1.0 - 0.125 * (1 + colors[4]),
            // Left
            0.0,  1.0 - 0.125 * colors[5],
            1.0,  1.0 - 0.125 * colors[5],
            1.0,  1.0 - 0.125 * (1 + colors[5]),
            0.0,  1.0 - 0.125 * (1 + colors[5])
        ];
    }

    function getIndices() {
        return [
            0,  1,  2,      0,  2,  3,    // front
            4,  5,  6,      4,  6,  7,    // back
            8,  9,  10,     8,  10, 11,   // top
            12, 13, 14,     12, 14, 15,   // bottom
            16, 17, 18,     16, 18, 19,   // right
            20, 21, 22,     20, 22, 23    // left
        ];
    }

    function resetBuffers() {
        var gl,
            vertices,
            vertexNormals,
            textureCoordinates,
            vertexIndices;

        gl = scene.gl;
        vertices = getVertices();
        vertexNormals = getNormals();
        textureCoordinates = getTextureCoords();
        vertexIndices = getIndices();

        buffers.vertices = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, buffers.vertices);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertices),
                      gl.STATIC_DRAW);

        buffers.normals = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, buffers.normals);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertexNormals),
                      gl.STATIC_DRAW);

        buffers.texture = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, buffers.texture);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(textureCoordinates),
                      gl.STATIC_DRAW);

        buffers.indices = gl.createBuffer();
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, buffers.indices);
        gl.bufferData(gl.ELEMENT_ARRAY_BUFFER,
                      new Uint16Array(vertexIndices), gl.STATIC_DRAW);
    }

    function draw(scene) {
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
    }

    function createTexture() {
        var gl,
            canvas,
            body,
            image,
            ctx,
            W,
            H,
            f,
            tex;
        gl = scene.gl;
        canvas = document.createElement('canvas');
        canvas.id     = "hiddenCanvas";
        canvas.width  = 128;
        canvas.height = 128 * 8;
        canvas.style.display   = "none";
        body = document.getElementsByTagName("body")[0];
        body.appendChild(canvas);
        // draw texture
        image = document.getElementById('hiddenCanvas');
        ctx = image.getContext('2d');
        ctx.beginPath();
        ctx.rect(0, 0, ctx.canvas.width / 2,
                 ctx.canvas.height / 2);
        ctx.fillStyle = 'white';
        ctx.fill();

        W = 128;
        H = 128;

        for (f = 0; f < settings.colors.length; f += 1) {
            ctx.beginPath();
            ctx.rect(0, H * f, W, H);
            ctx.fillStyle = settings.colors[f];
            ctx.fill();
        }
        ctx.restore();
        // create new texture
        tex = gl.createTexture();
        gl.bindTexture(gl.TEXTURE_2D, tex);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER,
                         gl.LINEAR_MIPMAP_NEAREST);
        gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
        gl.bindTexture(gl.TEXTURE_2D, tex);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA,
                      gl.UNSIGNED_BYTE, image);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER,
                         gl.LINEAR_MIPMAP_NEAREST);
        gl.generateMipmap(gl.TEXTURE_2D);
        gl.bindTexture(gl.TEXTURE_2D, null);
        return tex;
    }

    function init(sce, set, cols) {
        scene = sce;
        settings = set;
        colors = cols;
        texture = createTexture();
        resetBuffers();
    }
    init(sceneData, set, cols);

    this.draw = draw;
    this.moving = moving;
    this.rotate = rotate;
    this.loc = loc;
    this.ploc = ploc;
    this.returnHome = returnHome;
};

function Cubelets(set) {
    'use strict';
    var cubes,
        scene,
        settings;

    function linkRendering(d) {
        scene = d;
    }

    function draw() {
        var i;
        for (i = 0; i < cubes.length; i += 1) {
            cubes[i].draw(scene);
        }
    }

    function removeAll() {
        cubes = [];
    }

    function add(x, y, z, len, up, right, colors) {
        cubes.push(new Cube(scene, x, y, z, len, up, right, colors, settings));
    }

    function makeMove(move, moveFrameStart) {
        var i,
            cube;
        if (move.hasOwnProperty("action")) {
            move.action();
            return true;
        }
        for (i = 0; i < cubes.length; i += 1) {
            cube = cubes[i];
            if (move.applies(cube)) {
                if (cube.moving.currently) {
                    return false;
                }
            }
        }
        for (i = 0; i < cubes.length; i += 1) {
            cube = cubes[i];
            if (move.applies(cube)) {
                cube.rotate(move.axis, move.angle, moveFrameStart);
            }
        }
        return true;
    }

    function setState(state) {
        var i,
            cube;
        if (state === "solved") {
            for (i = 0; i < cubes.length; i += 1) {
                cube = cubes[i];
                cube.returnHome();
            }
        }
    }

    function updateRotation() {
        var i,
            cube;
        for (i = 0; i < cubes.length; i += 1) {
            cube = cubes[i];
            if (cube.moving.currently) {
                if (cube.moving.update()) {
                    cube.moving.stop();
                }
            }
        }
    }

    function init(set) {
        cubes = [];
        settings = set;
    }
    init(set);

    this.linkRendering = linkRendering;
    this.draw = draw;
    this.removeAll = removeAll;
    this.updateRotation = updateRotation;
    this.makeMove = makeMove;
    this.add = add;
    this.setState = setState;
}

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

function RubiksCube(sce, set) {
    'use strict';
    var cubelets,
        scene,
        moveQueue,
        moves,
        settings;
    function setVersion(versionID) {
        cubelets.removeAll();
        var sl,
            min,
            max,
            z,
            y,
            x,
            colors;
        sl = versionID;
        min = -sl + 1;
        max = sl - 1;
        for (z = min; z <= max; z += 2) {
            for (y = min; y <= max; y += 2) {
                for (x = min; x <= max; x += 2) {
                    colors = [ (z === max) ? 0 : -1,
                               (z === min) ? 1 : -1,
                               (y === max) ? 2 : -1,
                               (y === min) ? 3 : -1,
                               (x === max) ? 4 : -1,
                               (x === min) ? 5 : -1
                             ];
                    cubelets.add(x, y, z, 1.95,
                                 [0, 1, 0], [1, 0, 0], colors);
                }
            }
        }
    }

    function checkForMoves(key, keys) {
        var i,
            move;
        for (i in moves) {
            if (moves.hasOwnProperty(i)) {
                move = moves[i];
                if (!keys[key] && (move.key === key)) {
                    moveQueue.push(move);
                    break;
                }
            }
        }
    }

    function randomMove() {
        var result,
            key,
            count;
        count = 0;
        for (key in moves) {
            if (moves.hasOwnProperty(key)) {
                count += 1;
                if (Math.random() < 1 / count) {
                    result = moves[key];
                }
            }
        }
        return result;
    }

    function enqueueMoves(moves, clearOthers) {
        if (clearOthers) {
            moveQueue = [];
        }
        moveQueue.push.apply(moveQueue, moves);
    }

    function shuffle(startAction, endAction) {
        var i,
            randomMoves;
        randomMoves = [];
        randomMoves.push({"action": startAction});
        for (i = 0; i < settings.shuffleLength; i += 1) {
            randomMoves.push(randomMove());
        }
        randomMoves.push({"action": endAction});
        enqueueMoves(randomMoves, false);
    }

    function makeMove(move) {
        return cubelets.makeMove(move, settings.speed);
    }

    function cycleMoves() {
        while (moveQueue.length > 0 && makeMove(moveQueue[0])) {
            moveQueue.shift();
        }
    }

    function rotate(dx, dy) {
        var right,
            up,
            inv,
            newRight,
            newUp;
        right = $V([1.0, 0.0, 0.0, 0.0]);
        up = $V([0.0, 1.0, 0.0, 0.0]);

        inv = scene.data.mvMatrix.inverse();
        newRight = inv.x(right);
        if (dy !== 0) {
            scene.data.mvRotate(dy, [newRight.elements[0],
                                     newRight.elements[1],
                                     newRight.elements[2]]);
        }

        newUp = inv.x(up);
        if (dx !== 0) {
            scene.data.mvRotate(dx, [newUp.elements[0],
                                     newUp.elements[1],
                                     newUp.elements[2]]);
        }

    }


    function update(keys, momentum) {
        var r,
            dx,
            dy;
        cycleMoves();
        cubelets.updateRotation();
        r = settings.rotateSpeed;
        dx = 0;
        dy = 0;
        if (keys[KEYCODES.up]) {
            dy -= r;
        }
        if (keys[KEYCODES.down]) {
            dy += r;
        }
        if (keys[KEYCODES.left]) {
            dx -= r;
        }
        if (keys[KEYCODES.right]) {
            dx += r;
        }
        rotate(dx + momentum.x, dy + momentum.y);
    }

    function initMoves() {
        moveQueue = [];
        moves = {
            front: {
                axis: [0.0, 0.0, 2.0],
                key: KEYCODES.f,
                angle: -Math.PI / 2,
                applies: function (c) {return feq(c.ploc.pos[2], 2); }
            },
            back: {
                axis: [0.0, 0.0, -2.0],
                key: KEYCODES.b,
                angle: -Math.PI / 2,
                applies: function (c) {return feq(c.ploc.pos[2], -2); }
            },
            right: {
                axis: [2.0, 0.0, 0.0],
                key: KEYCODES.r,
                angle: -Math.PI / 2,
                applies: function (c) {return feq(c.ploc.pos[0], 2); }
            },
            left: {
                axis : [-2.0, 0.0, 0.0],
                angle : -Math.PI / 2,
                key: KEYCODES.l,
                applies : function (c) {return feq(c.ploc.pos[0], -2); }
            },
            up: {
                axis : [0.0, 2.0, 0.0],
                key: KEYCODES.u,
                angle : -Math.PI / 2,
                applies : function (c) {return feq(c.ploc.pos[1], 2); }
            },
            down: {
                axis : [0.0, -2.0, 0.0],
                key: KEYCODES.d,
                angle : -Math.PI / 2,
                applies : function (c) {return feq(c.ploc.pos[1], -2); }
            }
        };
    }

    function setState(state, abort) {
        var i,
            move;
        if (abort) {
            for (i = 0; i < moveQueue.length; i += 1) {
                move = moveQueue[i];
                if (move.hasOwnProperty("action")) {
                    move.action();
                }
            }
            moveQueue = [];
        }
        cubelets.setState(state);
    }

    function init(sce, set) {
        scene = sce;
        settings = set;
        cubelets = new Cubelets(settings);
        initMoves();
        scene.linkObjects(cubelets);
    }
    init(sce, set);

    this.setVersion = setVersion;
    this.setState = setState;
    this.update = update;
    this.checkForMoves = checkForMoves;
    this.rotate = rotate;
    this.shuffle = shuffle;
}

function Cubr() {
    'use strict';
    var scene,
        cube,
        keys,
        mouse = {down: false, last: [0, 0]},
        momentum = {x: 0, y: 0},
        settings = {
            timerInterval: 20,
            rotateSpeed: Math.PI / 48,
            speed: 16,
            dragSensitivity: 0.003,
            inertia: 0.75,
            colors: ["white", "blue", "orange", "green",
                     "red", "yellow", "pink", "#303030"],
            startMomentum: {
                x: 0.55,
                y: 1.65
            },
            shuffleLength: 50,
            progBar: {
                queueMin: 3,
                queueMax: 10,
                color: "green",
                margin: 10,
                thickness: 20
            }
        };

    function resetKeys() {
        var k;
        keys = [];
        for (k = 0; k < 256; k += 1) {
            keys.push(false);
        }
    }

    function timerFired() {
        cube.update(keys, momentum);
        momentum.x *= settings.inertia;
        momentum.y *= settings.inertia;
        scene.draw();
    }

    function onKeyDown(e) {
        var keyCode = e.keyCode;
        if (cube) {
            cube.checkForMoves(keyCode, keys);
        }
        if (33 <= keyCode && keyCode <= 40) {
            e.preventDefault();
        }
        keys[keyCode] = true;
    }

    function onKeyUp(e) {
        var keyCode = e.keyCode;
        keys[keyCode] = false;
    }

    function onMouseDown(e) {
        if (e.toElement.id === "glcanvas") {
            e.preventDefault();
            mouse.down = true;
            mouse.last = [e.x, e.y];
        }
    }

    function onMouseUp() {
        mouse.down = false;
    }

    function onMouseMove(e) {
        if (mouse.down) {
            e.preventDefault();
            if (e.toElement.id === "glcanvas") {
                momentum.x += settings.dragSensitivity * (e.x - mouse.last[0]);
                momentum.y += settings.dragSensitivity * (e.y - mouse.last[1]);
                mouse.last = [e.x, e.y];
            }
        }
    }

    function bindEventListeners() {
        resetKeys();
        document.addEventListener("keydown", onKeyDown, false);
        document.addEventListener("keyup", onKeyUp, false);
        document.addEventListener("mousedown", onMouseDown, false);
        document.addEventListener("mouseup", onMouseUp, false);
        document.addEventListener("mousemove", onMouseMove, false);
        // Timer:
        setInterval(timerFired, settings.timerInterval);
    }

    function reset() {
        cube.setState("solved", true);
        momentum.x = settings.startMomentum.x;
        momentum.y = settings.startMomentum.y;
    }

    function run() {
        scene = new SimpleScene("glcanvas");
        cube = new RubiksCube(scene, settings);
        cube.setVersion(3);
        bindEventListeners();
        reset();
    }

    function shuffle() {
        var origSpeed = settings.speed;
        cube.shuffle(function () {settings.speed = 0; },
                     function () {settings.speed = origSpeed; });
    }

    this.run = run;
    this.reset = reset;
    this.shuffle = shuffle;
}
var cubr = new Cubr();
