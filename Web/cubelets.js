var COLORS = ["white", "blue", "orange", "green",
              "red", "yellow", "pink", "#202020"];

var Cube = function(sceneData, x, y, z, len, lat, lon, colors) {
    /* Cube is centered at (x, y, z)
     * Each edge has length `len`
     * Azimuth angle with the z axis is lat
     * Rotation about z axis is lon
     */
    var colors = colors;
    var scene;
    var texture;
    var image;
    var pos = [x, y, z];
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
        lat: lat,
        lon: lon
    };

    var moving = {
        currently: false,
        stage: null,
        update: null,
        stop: null
    };

    var rotate = function(axis, angle) {
        var hand = vec.without(pos, axis);
        var right = vec.cross(axis, hand);
        var getPos = function(portion) {
            return vec.add(vec.muls(Math.cos(angle*(1-portion)), hand),
                           vec.muls(Math.sin(angle*(1-portion)), right));
        }
        moving.update = function(portion) {
            var newPos = getPos(portion);
            newPos = vec.add(newPos, axis);
            if (axis[2] != 0) // About z axis
                lon += angle;
            else {
                lat += angle;
                if (lat < -Math.PI/2) {
                    lat -= 2*((-Math.PI/2 - lat)%(Math.PI/2));
                    lon += Math.PI;
                } else if (lat > Math.PI/2) {
                    lat += 2*((Math.PI/2 - lat)%(Math.PI/2));
                    lon += Math.PI;
                }
            }
            pos = newPos;
            resetBuffers();

        };
        moving.stop = function() {
            moving.currently = false;
            pos = vec.ints(getPos(0));
            pos = pos;
        }

        moving.currently = true;
    };

    var getVertices = function() { /* FIX THIS FUNCTION AND THE ONE BELOW IT. */
        var r = len * 0.5;
        var x = pos[0];
        var y = pos[1];
        var z = pos[2];
        return [
         // Front face
         x-r, y-r, z+r,
         x+r, y-r, z+r,
         x+r, y+r, z+r,
         x-r, y+r, z+r,

         // Back face
         x-r, y-r, z-r,
         x+r, y-r, z-r,
         x+r, y+r, z-r,
         x-r, y+r, z-r,

         // Top face
         x-r, y+r, z-r,
         x-r, y+r, z+r,
         x+r, y+r, z+r,
         x+r, y+r, z-r,

         // Bottom face
         x-r, y-r, z-r,
         x-r, y-r, z+r,
         x+r, y-r, z+r,
         x+r, y-r, z-r,

         // Right face
         x+r, y-r, z-r,
         x+r, y+r, z-r,
         x+r, y+r, z+r,
         x+r, y-r, z+r,

         // Left face
         x-r, y-r, z-r,
         x-r, y+r, z-r,
         x-r, y+r, z+r,
         x-r, y-r, z+r,
                ];
    };

    var getNormals = function () {
        return [
         // Front
         0.0,  0.0,  1.0,
         0.0,  0.0,  1.0,
         0.0,  0.0,  1.0,
         0.0,  0.0,  1.0,
         // Back
         0.0,  0.0, -1.0,
         0.0,  0.0, -1.0,
         0.0,  0.0, -1.0,
         0.0,  0.0, -1.0,
         // Top
         0.0,  1.0,  0.0,
         0.0,  1.0,  0.0,
         0.0,  1.0,  0.0,
         0.0,  1.0,  0.0,
         // Bottom
         0.0, -1.0,  0.0,
         0.0, -1.0,  0.0,
         0.0, -1.0,  0.0,
         0.0, -1.0,  0.0,
         // Right
         1.0,  0.0,  0.0,
         1.0,  0.0,  0.0,
         1.0,  0.0,  0.0,
         1.0,  0.0,  0.0,
         // Left
         -1.0,  0.0,  0.0,
         -1.0,  0.0,  0.0,
         -1.0,  0.0,  0.0,
         -1.0,  0.0,  0.0
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
        pos: pos
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

    var add = function(x, y, z, len, lat, lon, colors) {
        cubes.push(Cube(scene, x, y, z, len, lat, lon, colors));
    };

    var makeMove = function(move) {
        for (var i = 0; i < cubes.length; i++) {
            var cube = cubes[i];
            if (move.applies(cube)) {
                cube.rotate(move.axis, move.angle);
            }
        }
    };

    var updateRotation = function(f, fm) {
        var portion = (f * 1.0) / fm;
        for (var i = 0; i < cubes.length; i++) {
            var cube = cubes[i];
            if (cube.moving.currently) {
                cube.moving.update(portion);
                if (f==0) {
                    cube.moving.stop();
                }
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
