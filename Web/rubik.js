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
var RubiksCube = function(s) {
    var cubelets;
    var scene;
    var moveQueue;
    var moving;
    var moves;
    var moveFrame;
    var moveFrameStart;
    var currentMove;
    var setVersion = function(versionID) {
        cubelets.removeAll();
        if (versionID == "3x3x3") {
            for (var z = -1; z <= 1; z++) {
                for (var y = -1; y <= 1; y++) {
                    for (var x = -1; x <= 1; x++) {
                        var colors = [ (z ==  1) ? 0: -1,
                                       (z == -1) ? 1: -1,
                                       (y ==  1) ? 2: -1,
                                       (y == -1) ? 3: -1,
                                       (x ==  1) ? 4: -1,
                                       (x == -1) ? 5: -1
                                      ];
                        cubelets.add(x, y, z, 0.95, 0, 0, colors);
                    }
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

    var checkForMoves = function(key) {
        switch (key) {
        case KEYCODES.f:
        moveQueue.push(moves.front);
        break;
        case KEYCODES.b:
        moveQueue.push(moves.back);
        break;
        case KEYCODES.u:
        moveQueue.push(moves.up);
        break;
        case KEYCODES.d:
        moveQueue.push(moves.down);
        break;
        case KEYCODES.r:
        moveQueue.push(moves.right);
        break;
        case KEYCODES.l:
        moveQueue.push(moves.left);
        default:
        break;
        }
    };

    var makeMove = function(move) {
        cubelets.makeMove(move);
    };

    var cycleMoves = function() {
        if (moving) {
            moving = (moveFrame!=0);
            moveFrame--;
        }
        if (!moving && (moveQueue.length > 0)) {
            currentMove = moveQueue.shift();
            makeMove(currentMove);
            moveFrame = moveFrameStart;
            moving = true;
        }
    };

    var applyMoves = function() {
        if (moving) {
            cubelets.updateRotation(moveFrame, moveFrameStart);
        }
    }

    var update = function(keys, settings) {
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
        moving = false;
        moveFrameStart = 9;
        moveFrame = moveFrameStart;;
        currentMove = null;
        moves = {
            front: {
                axis: [0.0, 0.0, 1.0],
                angle: Math.PI/2,
                applies: function(c){return feq(c.pos[2], 1);}
            },
            back: {
                axis: [0.0, 0.0, -1.0],
                angle: Math.PI/2,
                applies: function(c){return feq(c.pos[2], -1);}
            },
            right: {
                axis: [1.0, 0.0, 0.0],
                angle: Math.PI/2,
                applies: function(c){return feq(c.pos[0], 1);}
            },
            left: {
                axis : [-1.0, 0.0, 0.0],
                angle : Math.PI/2,
                applies : function(c){return feq(c.pos[0], -1);}
            },
            up: {
                axis : [0.0, 1.0, 0.0],
                angle : Math.PI/2,
                applies : function(c){return feq(c.pos[1], 1);}
            },
            down: {
                axis : [0.0, -1.0, 0.0],
                angle : Math.PI/2,
                applies : function(c){return feq(c.pos[1], -1);}
            }
        }
    };

    var init = function() {
        scene = s;
        cubelets = Cubelets();
        initMoves();
        scene.linkObjects(cubelets);
    };
    init();

    var publicAttrs = {
        setVersion: setVersion,
        setState: setState,
        update: update,
        checkForMoves: checkForMoves
    };
    return publicAttrs;
};
