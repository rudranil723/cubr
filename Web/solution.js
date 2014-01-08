var CLOCKWISE = -Math.PI/2;
var COUNTERCW =  Math.PI/2;
var ONEEIGHTY =  Math.PI;

function alignedWithAxis(cube, axis) {
    return (afeq(vec.dot(axis, cube.ploc.orientation.up),
                 vec.dot(axis, cube.home.orientation.up)) &&
            afeq(vec.dot(axis, cube.ploc.orientation.right),
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

function makeMoves(axesToRotate, info) {
    var i,
        axis,
        angle,
        idx,
        move;
    for (i = 0; i < axesToRotate.length; i += 1) {
        axis = axesToRotate[i][0];
        angle = axesToRotate[i][1];
        idx = info.state.getIdxFromMove(axis, angle);
        move = info.state.getMoveFromIdx(idx);
        info.state.makeMove(move);
        info.moves.push(idx);
    }
}

/* TOP CROSS */

function retain(info) { return; }

function flipTXB(info) {
    var axes = [];
    /* Move piece onto second layer */
    axes.push([vec.without(info.cube.ploc.pos, info.topLayer), COUNTERCW]);
    /* Rotate first layer */
    if (info.numDone > 0)
        axes.push([info.topLayer, CLOCKWISE]);
    /* Return piece to first layer */
    axes.push([vec.cross(info.cube.ploc.pos, info.topLayer), COUNTERCW]);
    /* Return first layer orientation */
    axes.push([info.topLayer, COUNTERCW]);
    makeMoves(axes, info);
}

function easeOfFTXB(info) {
    if (info.numDone > 0)
        return 4;
    else
        return 3;
}

function relocateTopLayerTXB(info) {
    var angle1,
        angle2;
    var desired = vec.without(info.cube.home.pos, info.topLayer);
    var current = vec.without(info.cube.ploc.pos, info.topLayer);
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
    makeMoves(axes, info);

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
    makeMoves(axes, info);
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
    makeMoves(axes, info);
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
    makeMoves(axes, info);
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
    makeMoves(axes, info);

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
    makeMoves(axes, info);
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
    makeMoves(axes, info);
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
    var count = 0;
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
        count++;
        done = done || (count > 5);
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
    var final = [];
    var i;
    var idx;
    var angle;
    var axis;
    for (i = 0; i < moveset.length; i += 1) {
        move = state.getMoveFromIdx(moveset[i]);
        angle = move.angle;
        axis = move.axis;
        while ((i+1 < moveset.length) &&
               vec.parallel(axis, state.getMoveFromIdx(moveset[i+1]).axis)) {
            i += 1;
            move = state.getMoveFromIdx(moveset[i]);
            angle += move.angle;
        }
        angle = ((angle + Math.PI) % (2*Math.PI) - Math.PI);
        if (feq(angle, -Math.PI))
            angle = Math.PI;
        if (!feq(angle, 0)) {
            final.push(state.getIdxFromMove(move.axis, angle));
        }
    }
    return final;
}

function getSolution(state, topLayer) {
    var i;
    var finalMoves = [];
    var moveSet,
        steps = [topCross,
                 topCorners],
        step;
    topLayer = topLayer || [0, 1, 0];;

    for (i = 0; i < steps.length; i += 1) {
        step = steps[i];
        moveSet = step(state, topLayer);
        finalMoves.push.apply(finalMoves, moveSet);
    }
    return refine(state, finalMoves);
}
