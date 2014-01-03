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

COLORS; /* From cubelets.js */
/* ORDER:
 * front, back, top, bottom, right, left
 *
 */
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

    var setState = function(state) {
        /*
        if (state == "solved") {
            for (cubelet in cubelets.iterate()) {
                cubelet.setPosition(cubelet.solvedPos);
                cubelet.setOrientation(cubelet.solvedPos);
            }
            }*/
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
        if (moveQueue.length > 0) {
            if (makeMove(moveQueue[0]))
                moveQueue.shift();
        }
    };

    var applyMoves = function() {
        cubelets.updateRotation();
    }

    var update = function(keys, momentum) {
        cycleMoves();
        applyMoves();
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
        cubelets = Cubelets();
        initMoves();
        scene.linkObjects(cubelets);
    };
    init(sce, set);

    var publicAttrs = {
        setVersion: setVersion,
        setState: setState,
        update: update,
        checkForMoves: checkForMoves,
        rotate: rotate
    };
    return publicAttrs;
};
