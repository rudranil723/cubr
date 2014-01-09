var CLOCKWISE = -Math.PI/2;
var COUNTERCW =  Math.PI/2;
var ONEEIGHTY =  Math.PI;

function alignedWithAxis(cube, axis) {
    return (afeq(vec.dot(axis, cube.ploc.orientation.up),
                 vec.dot(axis, cube.home.orientation.up)) &&
            afeq(vec.dot(axis, cube.ploc.orientation.right),
                 vec.dot(axis, cube.home.orientation.right)));
}

function palignedWithAxis(cube, axis) {
    return (feq(vec.dot(axis, cube.ploc.orientation.up),
                 vec.dot(axis, cube.home.orientation.up)) &&
            feq(vec.dot(axis, cube.ploc.orientation.right),
                 vec.dot(axis, cube.home.orientation.right)));
}

function alignedWithAxes(cube, home, current) {
    return (afeq(vec.dot(vec.unit(current), vec.unit(cube.ploc.orientation.up)),
                 vec.dot(vec.unit(home), vec.unit(cube.home.orientation.up))) &&
            afeq(vec.dot(vec.unit(current),
                         vec.unit(cube.ploc.orientation.right)),
                 vec.dot(vec.unit(home),
                         vec.unit(cube.home.orientation.right))));
}

function currentAxis(cube, axis) {
    var upComp = vec.muls(vec.dot(axis, cube.home.orientation.up),
                          cube.ploc.orientation.up);
    var rightComp = vec.muls(vec.dot(axis, cube.home.orientation.right),
                             cube.ploc.orientation.right);
    var backComp = vec.muls(vec.dot(axis,
                                    vec.cross(cube.home.orientation.up,
                                              cube.home.orientation.right)),
                            vec.cross(cube.ploc.orientation.up,
                                      cube.ploc.orientation.right));
    return vec.add(upComp, vec.add(rightComp, backComp));
}

function makeMoves(axesToRotate, info, message) {
    var i,
        axis,
        angle,
        idx,
        move;
    message = message || "";
    info.moves.push({action: function () {
                cubr.updateStatus(message);
            }});
    for (i = 0; i < axesToRotate.length; i += 1) {
        move = axesToRotate[i];
        if (move.hasOwnProperty("action")) {
            info.moves.push(move);
        } else {
            axis = move[0];
            angle = move[1];
            idx = info.state.getIdxFromMove(axis, angle);
            move = info.state.getMoveFromIdx(idx);
            info.state.makeMove(move);
            info.moves.push(move);
        }
    }
    info.moves.push({action: function() {
                cubr.pauseOnTutorial();
            }});
    info.moves.push({action: function() {
                cubr.updateStatus("");
            }});

}

/* TOP CROSS */

function retain(info) { return; }

function flipTXB(info) {
    var axes = [];
    /* Move piece onto second layer */
    axes.push([info.withoutTop(info.cube.ploc.pos), COUNTERCW]);
    /* Rotate first layer */
    if (info.numDone > 0)
        axes.push([info.topLayer, CLOCKWISE]);
    /* Return piece to first layer */
    axes.push([vec.cross(info.cube.ploc.pos, info.topLayer), COUNTERCW]);
    /* Return first layer orientation */
    axes.push([info.topLayer, COUNTERCW]);
    makeMoves(axes, info, "Flip the " +
              info.cube.str() +
              " on the first layer.");
}

function easeOfFTXB(info) {
    if (info.numDone > 0)
        return 4;
    else
        return 3;
}

function faceStr(v) {
    if (vec.parallel(v, [0, 1, 0])) {
        return "top";
    } else if (vec.parallel(v, [0, -1, 0])) {
        return "bottom";
    } else if (vec.parallel(v, [1, 0, 0])) {
        return "right";
    } else if (vec.parallel(v, [-1, 0, 0])) {
        return "left";
    } else if (vec.parallel(v, [0, 0, 1])) {
        return "front";
    } else if (vec.parallel(v, [0, 0, -1])) {
        return "back";
    } else {
        return "unknown";
    }
}

function relocateTopLayerTXB(info) {
    var angle1,
        angle2;
    var desired = info.withoutTop(info.cube.home.pos);
    var current = info.withoutTop(info.cube.ploc.pos);
    if (vec.parallels(desired, current)) {
        angle1 = ONEEIGHTY;
        angle2 = ONEEIGHTY;
    }
    else if (info.onTop(vec.cross(desired, current))) {
        angle1 = COUNTERCW;
        angle2 = CLOCKWISE;
    }
    else {
        angle1 = CLOCKWISE;
        angle2 = COUNTERCW;
    }
    var axes = [];
    if (info.numDone > 0) {
        // Protect from displacing others
        axes.push([current, COUNTERCW]);
        axes.push([info.topLayer, angle1]);
        axes.push([current, CLOCKWISE]);
    }
    axes.push([info.topLayer, angle2]);
    makeMoves(axes, info, "Move the " + info.cube.str() +
              " on the first layer from the " + faceStr(current) +
              " face to the " + faceStr(desired) + " face.");
}

function easeOfRLTLTXB(info) {
    if (info.numDone > 0)
        return 4;
    else
        return 1;
}

function reorientTopLayerTXB(info) {
    var current = vec.without(info.cube.ploc.pos, info.topLayer);
    var desired = vec.without(info.cube.home.pos, info.topLayer);
    var axes = [];
    if (vec.parallels(desired, current)) {
        axes.push([current, CLOCKWISE]);
        if (info.numDone > 0) {
            axes.push([info.topLayer, CLOCKWISE]);
        }
        axes.push([vec.cross(info.topLayer, current), CLOCKWISE]);
        axes.push([info.topLayer, COUNTERCW]);
    } else if (info.onTop(vec.cross(desired, current))) {
        axes.push([current, COUNTERCW]);
        axes.push([desired, COUNTERCW]);
    } else {
        axes.push([current, CLOCKWISE]);
        axes.push([desired, CLOCKWISE]);
    }
    makeMoves(axes, info, "Move the " + info.cube.str() +
              " on the first layer from the " + faceStr(current) +
              " face to the " + faceStr(desired) + " face.");
}

function easeOfTLTXB(info) {
    var current = vec.without(info.cube.ploc.pos, info.topLayer);
    var desired = vec.without(info.cube.home.pos, info.topLayer);
    if (vec.parallels(desired, current)) {
        if (info.numDone > 0)
            return 4;
        else
            return 3;
    } else {
        return 2;
    }
}

function secondLayerTXB(info) {
    var current = info.cube.ploc.pos;
    var desired = vec.without(info.cube.home.pos, info.topLayer);
    var against = vec.without(current, desired);
    var along = vec.without(current, against);
    var axes = [];
    var angle;
    if (alignedWithAxes(info.cube, info.topLayer, along)) {
        /* Top face is along `along` axis. rotate about `against` */
        if (info.onTop(vec.cross(against, current))) {
            angle = COUNTERCW;
        } else {
            angle = CLOCKWISE;
        }
        if (info.onTop(vec.cross(against, desired))) {
            if (info.numDone > 0)
                axes.push([info.topLayer, CLOCKWISE]);
            axes.push([against, angle]);
            axes.push([info.topLayer, COUNTERCW]);
        } else {
            if (info.numDone > 0)
                axes.push([info.topLayer, COUNTERCW]);
            axes.push([against, angle]);
            axes.push([info.topLayer, CLOCKWISE]);
        }
    } else {
        if (info.onTop(vec.cross(along, current))) {
            angle = COUNTERCW;
        } else {
            angle = CLOCKWISE;
        }
        if (vec.dot(along, desired) > 0) {
            axes.push([along, angle]);
        } else {
            if (info.numDone > 0)
                axes.push([info.topLayer, ONEEIGHTY]);
            axes.push([along, angle]);
            axes.push([info.topLayer, ONEEIGHTY]);
        }
    }
    makeMoves(axes, info, "Move the " + info.cube.str() + " from the " +
              "second layer to the first layer.");
}

function easeOfSLTXB(info) {
    var current = info.cube.ploc.pos;
    var desired = vec.without(info.cube.home.pos, info.topLayer);
    var against = vec.without(current, desired);
    var along = vec.without(current, against);
    if ((!alignedWithAxes(info.cube, info.topLayer, along)) &&
        vec.dot(along, desired) > 0)
        return 1;
    else {
        if (info.numDone > 0)
            return 3;
        else
            return 2;
    }

}

function relocateBottomLayerTXB(info) {
    var current = vec.without(info.cube.ploc.pos, info.topLayer);
    var desired = vec.without(info.cube.home.pos, info.topLayer);
    var axes = [];
    if (vec.parallel(current, desired)) {
        axes.push([current, ONEEIGHTY]);
    } else if (vec.parallels(current, desired)) {
        axes.push([info.topLayer, ONEEIGHTY]);
        axes.push([current, ONEEIGHTY]);
        axes.push([info.topLayer, ONEEIGHTY]);
    } else if (vec.dot(info.topLayer, vec.cross(current, desired)) > 0) {
        axes.push([info.topLayer, CLOCKWISE]);
        axes.push([current, ONEEIGHTY]);
        axes.push([info.topLayer, COUNTERCW]);
    } else {
        axes.push([info.topLayer, COUNTERCW]);
        axes.push([current, ONEEIGHTY]);
        axes.push([info.topLayer, CLOCKWISE]);
    }
    makeMoves(axes, info, "Move the " + info.cube.str() + " from the " +
              "bottom layer to the first layer.");
}

function easeOfBLTXB(info) {
    var current = vec.without(info.cube.ploc.pos, info.topLayer);
    var desired = vec.without(info.cube.home.pos, info.topLayer);
    if (vec.parallel(current, desired))
        return 1;
    else
        return 3;
}

function reorientBottomLayerTXB(info) {
    var current = vec.without(info.cube.ploc.pos, info.topLayer);
    var desired = vec.without(info.cube.home.pos, info.topLayer);
    var axes = [];
    if (vec.parallel(current, desired)) {
        axes.push([current, CLOCKWISE]);
        axes.push([info.topLayer, CLOCKWISE]);
        axes.push([vec.cross(current, info.topLayer), COUNTERCW]);
        axes.push([info.topLayer, COUNTERCW]);
    } else if (vec.parallels(current, desired)) {
        axes.push([info.topLayer, ONEEIGHTY]);
        axes.push([current, CLOCKWISE]);
        axes.push([info.topLayer, CLOCKWISE]);
        axes.push([vec.cross(current, info.topLayer), COUNTERCW]);
        axes.push([info.topLayer, CLOCKWISE]);
    } else if (vec.dot(info.topLayer, vec.cross(current, desired)) > 0) {
        axes.push([info.topLayer, CLOCKWISE]);
        axes.push([current, COUNTERCW]);
        axes.push([info.topLayer, COUNTERCW]);
        axes.push([vec.cross(info.topLayer, current), CLOCKWISE]);
    } else {
        axes.push([info.topLayer, COUNTERCW]);
        axes.push([current, CLOCKWISE]);
        axes.push([info.topLayer, CLOCKWISE]);
        axes.push([vec.cross(current, info.topLayer), COUNTERCW]);

    }
    makeMoves(axes, info, "Move the " + info.cube.str() + " from the " +
              "bottom layer to the first layer.");

}

function moveDownTCB(info) {
    var pos = vec.without(info.cube.ploc.pos, info.topLayer);
    var c = vec.unit(currentAxis(info.cube, info.topLayer));
    var right = vec.unit(vec.add(vec.unit(pos),
                                 vec.unit(vec.cross(info.topLayer, pos))));
    var left = vec.unit(vec.without(pos, right));
    var topLayer = info.topLayer;
    var bottomLayer = vec.muls(-1, topLayer);
    var axes = [];
    if (vec.parallel(c, right)) {
        axes.push([right, COUNTERCW]);
        axes.push([bottomLayer, COUNTERCW]);
        axes.push([right, CLOCKWISE]);
    } else {
        axes.push([left, CLOCKWISE]);
        axes.push([bottomLayer, CLOCKWISE]);
        axes.push([left, COUNTERCW]);
    }
    makeMoves(axes, info, "Move the mispositioned " + info.cube.str() +
              " from the first layer to the third layer.");
}

function moveUpTCB(info) {
    var current = vec.without(info.cube.ploc.pos, info.topLayer);
    var desired = vec.without(info.cube.home.pos, info.topLayer);
    var topLayer = vec.unit(info.topLayer);
    var bottomLayer = vec.muls(-1, topLayer);
    var axes = [];
    var angle = 0;
    /* Get it beneath where it needs to be */
    if (!vec.parallel(current, desired)) {
        if (vec.parallels(current, desired)) {
            angle = ONEEIGHTY;
        } else if (vec.dot(topLayer, vec.cross(current, desired)) > 0) {
            angle = CLOCKWISE;
        } else {
            angle = COUNTERCW;
        }
        axes.push([bottomLayer, angle]);
    }
    /* Move to the top */
    var c = vec.unit(currentAxis(info.cube, topLayer));
    var cR = vec.unit(vec.cross(c, topLayer));
    if (vec.isZero(cR)) {
        var cw = vec.unit(vec.cross(topLayer, desired));
        var right = vec.unit(vec.add(vec.unit(desired), cw));
        axes.push([right, ONEEIGHTY]);
        axes.push([bottomLayer, COUNTERCW]);
        axes.push([right, ONEEIGHTY]);
        axes.push([bottomLayer, CLOCKWISE]);
        axes.push([right, ONEEIGHTY]);
    } else {
        c = vec.add(vec.muls(Math.cos(angle), c),
                    vec.muls(Math.sin(angle), cR));
        if (vec.dot(topLayer, vec.cross(desired, c)) > 0) {
            axes.push([c, COUNTERCW]);
            axes.push([bottomLayer, COUNTERCW]);
            axes.push([c, CLOCKWISE]);
        } else if (vec.dot(topLayer, vec.cross(desired, c)) < 0) {
            axes.push([c, CLOCKWISE]);
            axes.push([bottomLayer, CLOCKWISE]);
            axes.push([c, COUNTERCW]);
        }
    }
    makeMoves(axes, info, "Move the " + info.cube.str() +
              " from the third layer to the first layer.");
}

function moveDownSL(info) {
    var topLayer = info.topLayer;
    var bottomLayer = vec.muls(-1, topLayer);
    var current = vec.unit(info.cube.ploc.pos);
    var right = vec.unit(vec.add(vec.unit(current),
                                 vec.unit(vec.cross(vec.unit(topLayer),
                                                    vec.unit(current)))));
    var left = vec.unit(vec.without(current, right));
    var bleft = vec.muls(-1, right);
    var bright = vec.muls(-1, left);
    var axes = [];
    axes.push([right, COUNTERCW]);
    axes.push([bottomLayer, CLOCKWISE]);
    axes.push([right, CLOCKWISE]);
    axes.push([bottomLayer, CLOCKWISE]);
    axes.push([left, CLOCKWISE]);
    axes.push([bottomLayer, COUNTERCW]);
    axes.push([left, COUNTERCW]);
    makeMoves(axes, info, "Move the misplaced " + info.cube.str() +
              " from the second layer to the third layer.");

}

function moveUpSL(info) {
    var axes = [];
    var topLayer = info.topLayer;
    var bottomLayer = vec.muls(-1, topLayer);
    var current = info.withoutTop(info.cube.ploc.pos);
    var desired = info.cube.home.pos;
    var right = vec.unit(vec.add(vec.unit(desired),
                                 vec.unit(vec.cross(vec.unit(topLayer),
                                                    vec.unit(desired)))));
    var left = vec.unit(vec.without(desired, right));
    var bleft = vec.muls(-1, right);
    var bright = vec.muls(-1, left);
    if (info.onTop(vec.cross(current, currentAxis(info.cube, topLayer)))) {
        /* Align with left side */
        if (!vec.parallel(current, bleft)) {
            if (vec.parallel(current, right)) {
                axes.push([bottomLayer, ONEEIGHTY]);
            } else if (vec.parallel(current, left)) {
                axes.push([bottomLayer, COUNTERCW]);
            } else {
                axes.push([bottomLayer, CLOCKWISE]);
            }
        }
        axes.push([right, COUNTERCW]);
        axes.push([bottomLayer, CLOCKWISE]);
        axes.push([right, CLOCKWISE]);
        axes.push([bottomLayer, CLOCKWISE]);
        axes.push([left, CLOCKWISE]);
        axes.push([bottomLayer, COUNTERCW]);
        axes.push([left, COUNTERCW]);
    } else {
        if (!vec.parallel(current, bright)) {
            if (vec.parallel(current, left)) {
                axes.push([bottomLayer, ONEEIGHTY]);
            } else if (vec.parallel(current, right)) {
                axes.push([bottomLayer, CLOCKWISE]);
            } else {
                axes.push([bottomLayer, COUNTERCW]);
            }
        }
        axes.push([left, CLOCKWISE]);
        axes.push([bottomLayer, COUNTERCW]);
        axes.push([left, COUNTERCW]);
        axes.push([bottomLayer, COUNTERCW]);
        axes.push([right, COUNTERCW]);
        axes.push([bottomLayer, CLOCKWISE]);
        axes.push([right, CLOCKWISE]);
    }
    makeMoves(axes, info, "Move the " + info.cube.str() +
              " from the third layer to the second layer.");
}

function easeOfMUTCB(info) {
    var count = 3;
    var current = vec.without(info.cube.ploc.pos, info.topLayer);
    var desired = vec.without(info.cube.home.pos, info.topLayer);
    var topLayer = info.topLayer;
    var c = currentAxis(info.cube, topLayer);
    if (!vec.parallel(current, desired)) {
        count += 1;
    }
    if (feq(0, vec.dot(topLayer, vec.cross(desired, c)))) {
        count += 2;
    }
    return count;
}

function fixMake(fixer, ease, info) {
    return {done: false,
            ease: ease,
            fixer: {go: fixer,
                info: info}};
}

function determineFixTXB(info) {
    if (vec.eq(info.cube.ploc.pos, info.cube.home.pos)) {
        /* Correct position */
        if (vec.eq(info.cube.ploc.orientation.up,
                   info.cube.home.orientation.up) &&
            vec.eq(info.cube.ploc.orientation.right,
                   info.cube.home.orientation.right)) {
            /* Already where it needs to be */
            return {done: true};
        } else {
            return fixMake(flipTXB, easeOfFTXB(info), info);
        }
    } else if (vec.dot(info.topLayer, info.cube.ploc.pos) > 0) {
        /* Elsewhere on top layer */
        if (alignedWithAxis(info.cube, info.topLayer)) {
            return fixMake(relocateTopLayerTXB,
                           easeOfRLTLTXB(info), info);
        } else {
            return fixMake(reorientTopLayerTXB,
                           easeOfTLTXB(info), info);
        }
    } else if (feq(0, vec.dot(info.topLayer, info.cube.ploc.pos))) {
        /* Second layer */
        return fixMake(secondLayerTXB, easeOfSLTXB(info), info);
    } else {
        if (alignedWithAxis(info.cube, info.topLayer)) {
            return fixMake(relocateBottomLayerTXB, 3, info);
        } else {
            return fixMake(reorientBottomLayerTXB, 4, info);
        }
    }
}

function determineFixTCB(info) {
    if (vec.eq(info.cube.ploc.pos, info.cube.home.pos)) {
        if (alignedWithAxis(info.cube, info.topLayer)) {
            return {done: true};
        } else {
            return fixMake(moveDownTCB, 3, info);
        }
    } else if (vec.dot(info.cube.ploc.pos, info.topLayer) > 0) {
        return fixMake(moveDownTCB, 6, info);
    } else {
        return fixMake(moveUpTCB, easeOfMUTCB(info), info);
    }
}

function determineFixSL(info) {
    if (vec.eq(info.cube.ploc.pos, info.cube.home.pos)) {
        if (palignedWithAxis(info.cube, info.topLayer)) {
            return {done: true};
        } else {
            return fixMake(moveDownSL, 8, info);
        }
    } else if (feq(0, vec.dot(info.cube.ploc.pos, info.topLayer))) {
        return fixMake(moveDownSL, 16, info);
    } else {
        return fixMake(moveUpSL, 8, info);
    }
}

function findHome(pos, cubes) {
    var i,
        cube;
    for (i = 0; i < cubes.length; i += 1) {
        cube = cubes[i];
        if (vec.parallel(pos, cube.home.pos)) {
            return cube;
        }
    }
    console.log(cubes);
    console.log(pos);
    throw "Cube not found: Home="+vec.toString(pos);
}


function Info(pos, state, topLayer, moves) {
    this.cube = findHome(pos, state.cubes);
    this.state = state;
    this.topLayer = topLayer;
    this.moves = moves;
    this.onTop = function (v) {
        return vec.dot(v, this.topLayer) > 0;
    };
    this.onBottom = function (v) {
        return vec.dot(v, this.topLayer) < 0;
    };
    this.withoutTop = function(v) {
        return vec.without(v, this.topLayer);
    };
}

function topCross(state, topLayer) {
    var stepMoves = [];
    var axis0 = vec.getPerpendicular(topLayer);
    var axis1 = vec.cross(topLayer, axis0);
    var topCross = new PriorityQueue();
    var topCross = [vec.add(topLayer, axis0),
                    vec.sub(topLayer, axis0),
                    vec.add(topLayer, axis1),
                    vec.sub(topLayer, axis1)];
    var i,
        pos,
        info,
        fix,
        fixes;
    var done = false;
    while (!done) {
        done = true;
        fixes = new PriorityQueue();
        for (i = 0; i < topCross.length; i += 1) {
            pos = topCross[i];
            info = new Info(pos, state, topLayer, stepMoves);
            info.numDone = i;
            fix = determineFixTXB(info);
            if (!fix.done) {
                done = false;
                fixes.insert(fix.fixer, fix.ease);
            }
        }
        if (fixes.isEmpty())
            break;
        var fixer = fixes.pop();
        fixer.go(fixer.info);
    }
    return stepMoves;
}

function topCorners(state, topLayer) {
    var stepMoves = [];
    var axis0 = vec.getPerpendicular(topLayer);
    var axis1 = vec.cross(topLayer, axis0);
    var topCorners = [vec.add(topLayer, vec.add(axis0, axis1)),
                      vec.add(topLayer, vec.sub(axis0, axis1)),
                      vec.add(topLayer, vec.sub(axis1, axis0)),
                      vec.sub(topLayer, vec.add(axis0, axis1))];
    var i,
        pos,
        info,
        fix,
        fixes;
    var done = false;
    while (!done) {
        done = true;
        fixes = new PriorityQueue();
        for (i = 0; i < topCorners.length; i += 1) {
            pos = topCorners[i];
            info = new Info(pos, state, topLayer, stepMoves);
            info.numDone = i;
            fix = determineFixTCB(info);
            if (!fix.done) {
                done = false;
                fixes.insert(fix.fixer, fix.ease);
            }
        }
        if (!fixes.isEmpty()) {
            var fixer = fixes.pop();
            fixer.go(fixer.info);
        }

    }
    return stepMoves;
}

function secondLayer(state, topLayer) {
    var stepMoves = [];
    var axis0 = vec.getPerpendicular(topLayer);
    var axis1 = vec.cross(topLayer, axis0);
    var secondLayer = [vec.add(axis1, axis0),
                       vec.sub(axis1, axis0),
                       vec.sub(axis0, axis1),
                       vec.muls(-1, vec.add(axis0, axis1))];
    var i,
        pos,
        info,
        fix,
        fixes;
    var done = false;
    while (!done) {
        done = true;
        fixes = new PriorityQueue();
        for (i = 0; i < secondLayer.length; i += 1) {
            pos = secondLayer[i];
            info = new Info(pos, state, topLayer, stepMoves);
            info.numDone = i;
            fix = determineFixSL(info);
            if (!fix.done) {
                done = false;
                fixes.insert(fix.fixer, fix.ease);
            }
        }
        if (!fixes.isEmpty()) {
            var fixer = fixes.pop();
            fixer.go(fixer.info);
        }
    }
    return stepMoves;
}


/*
  var upIdx = rubik.getIdxFromMove([0, 1, 0], Math.PI/2);
  var upMove = rubik.getMoveFromIdx(upIdx);
  rubik.makeMove(upMove);
  moveQueue.push(upIdx);
  return moveQueue;
*/

function refine(state, moveset) {
    var finalMoves = [];
    var i;
    var j;
    var idx;
    var angle;
    var axis;
    var done;
    var move;
    var nmove;
    var actionsAfter;
    for (i = 0; i < moveset.length; i += 1) {
        actionsAfter = [];
        move = moveset[i];
        if (move.hasOwnProperty("action")) {
            finalMoves.push(move);
        } else {
            angle = move.angle;
            axis = move.axis;
            for (j = i+1; j < moveset.length; j += 1) {
                nmove = moveset[j];
                if (nmove.hasOwnProperty("action")) {
                    actionsAfter.push(nmove);
                } else {
                    if (vec.parallel(move.axis, nmove.axis)) {
                        angle += nmove.angle;
                    } else {
                        i = j-1; /* Start here next time */
                        break;
                    }
                }
            }
            angle = ((angle + Math.PI) % (2*Math.PI) - Math.PI);
            if (feq(angle, -Math.PI))
                angle = Math.PI;
            if (!feq(angle, 0)) {
                idx = state.getIdxFromMove(axis, angle);
                finalMoves.push(state.getMoveFromIdx(idx));
            }
            finalMoves.push.apply(finalMoves, actionsAfter);
        }
    }
    return finalMoves;
}

function interlace(moves) {
    var total = 0;
    var soFar = 0;
    for (var k = 0; k < moves.length; k++) {
        if (!moves[k].hasOwnProperty("action"))
            total++;
    }
    total = (total === 0) ? 1 : total;
    var info = {
        moves: [],
        add: function(i) {
            info.moves.push(moves[i]);
            if (!moves[i].hasOwnProperty("action")) {
                var percent = soFar / total;
                info.moves.push({action: function () {
                            cubr.updateProgressBar(percent);
                    }});
                soFar++;
            }
        }
    }
    for (var j = 0; j < moves.length; j += 1) {
        info.add(j);
    }
    info.moves.push({"action": function () {
                cubr.updateProgressBar(0);
            }});
    return info.moves;
}

function getSolution(state, topLayer) {
    var i;
    var finalMoves = [];
    var moveSet,
        steps = [topCross,
                  topCorners,
                  secondLayer],
        step;
    topLayer = topLayer || [0, 1, 0];;

    for (i = 0; i < steps.length; i += 1) {
        step = steps[i];
        moveSet = step(state, topLayer);
        finalMoves.push.apply(finalMoves, moveSet);
    }
    return interlace(refine(state, finalMoves));
}
