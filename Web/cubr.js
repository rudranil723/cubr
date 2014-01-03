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
        inertia: 0.75
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
        cube.setState("solved");
        bindEventListeners();
    }

    var publicAttrs = {run: run,
    };
    return publicAttrs;
}();
