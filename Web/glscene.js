/* glscene.js
 * by Chris Barker
 * sets up a simplified interface to a subset of webgl's features
 * Dependencies:
 *  - webgl/sylvester.js
 *  - webgl/glUtils.js
 */

var SimpleScene = function(canvasID) {
    // `canvasID` is the id of the canvas element used for the scene.
    var data = {
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
        loadIdentity: function() {return matUtil.loadIdentity(data);},
        mvTranslate: function(v) {return matUtil.mvTranslate(data,v);},
        mvPushMatrix: function(m) {return matUtil.mvPushMatrix(data,m);},
        mvPopMatrix: function() {return matUtil.mvPopMatrix(data);},
        mvRotate: function(a,v) {return matUtil.mvRotate(data,a,v);},
        setMatrixUniforms: function() {return matUtil.setMatrixUniforms(data);}
    };

    var renderHeap = [];

    var linkObjects = function(sceneObjects) {
        renderHeap.push(sceneObjects);
        sceneObjects.linkRendering(data);
    };

    var drawScene = function() {
        var gl = data.gl;
        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
        // Establish the perspective with which we want to view the
        // scene. Our field of view is 45 degrees, with a width/height
        // ratio of 640:480, and we only want to see objects between 0.1 units
        // and 100 units away from the camera.
        data.perspectiveMatrix = makePerspective(45, 640.0/480.0, 0.1, 100.0);
        for (var i = 0; i < renderHeap.length; i++) {
            var sceneObject = renderHeap[i];
            sceneObject.draw();
        }
    };

    var init = function() {
        data.canvas = document.getElementById(canvasID);
        data.gl = data.canvas.getContext("experimental-webgl");
        rendUtil.clearAll(data.gl);
        rendUtil.initShaders(data);
        data.loadIdentity()
        data.mvPushMatrix();
        data.mvTranslate([0, 0, -20.0]);

    };

    init();

    var publicAttrs = {
        draw: drawScene,
        linkObjects: linkObjects,
        data: data
    };
    return publicAttrs;
};
