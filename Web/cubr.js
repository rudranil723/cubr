var cubr = function() {
    var scene;
    var cube;
    var keys;

    var settings = {
        timerInterval: 30,
        rotateSpeed: Math.PI / 30,
    };

    var resetKeys = function() {
        keys = [];
        for (var k = 0; k < 256; k++) {
            keys.push(false);
        }
    };

    var timerFired = function() {
        cube.update(keys, settings);
        scene.draw();
    };

    var onKeyDown = function(e) {
        var keyCode = event.keyCode;
        if (cube)
            cube.checkForMoves(keyCode);
        if (33 <= keyCode && keyCode <= 40)
            event.preventDefault();
        keys[keyCode] = true;
    };

    var onKeyUp = function(e) {
        var keyCode = event.keyCode;
        keys[keyCode] = false;
    };

    var bindEventListeners = function() {
        //document.addEventListener("blur", onLoseFocus, false);
        // Keys
        resetKeys();
        document.addEventListener("keydown", onKeyDown, false);
        document.addEventListener("keyup", onKeyUp, false);
        // Mouse clicking
        //canvas.addEventListener("mousedown", onMouseDown, false);
        //canvas.addEventListener("mouseup", onMouseUp, false);
        //canvas.addEventListener("click", onClick, false);
        //canvas.addEventListener("dblclick", onDoubleClick, false);
        //document.addEventListener("contextmenu", onRightClick, true);
        // Mouse movement
        //canvas.addEventListener("mousemove", onMouseMove, false);
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
        cube = RubiksCube(scene);
        cube.setVersion("3x3x3");
        cube.setState("solved");
        bindEventListeners();
    }

    var publicAttrs = {run: run,
    };
    return publicAttrs;
}();
