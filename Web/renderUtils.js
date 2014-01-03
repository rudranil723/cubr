var vec = {
    add: function(A, B) {
        C = [];
        for (var i = 0; i < A.length; i++) {
            C.push(A[i] + B[i]);
        }
        return C;
    },
    cross: function(A, B) {
        C = [];
        C.push(A[1] * B[2] - A[2] * B[1]);
        C.push(A[2] * B[0] - A[0] * B[2]);
        C.push(A[0] * B[1] - A[1] * B[0]);
        return C;
    },
    muls: function(s, A) {
        B = [];
        for (var i = 0; i < A.length; i++) {
            B.push(s*A[i]);
        }
        return B;
    },
    sub: function(A, B) {
        return vec.add(A, vec.muls(-1, B));
    },
    proj: function(A, B) {
        return vec.muls(vec.dot(A,B)/(vec.mag2(B)), B);
    },
    dot: function(A, B) {
        return A[0]*B[0] + A[1]*B[1] + A[2]*B[2];
    },
    mag2: function(A) {
        return A[0]*A[0] + A[1]*A[1] + A[2]*A[2];
    },
    without: function(A, B) {
        return vec.sub(A, vec.proj(A, B));
    },
    isZero: function(A) {
        return (A[0]==0 && A[1]==0 && A[2]==0);
    },
    ints: function(A) {
        return [Math.round(A[0]),
                Math.round(A[1]),
                Math.round(A[2])];
    },
    mag: function(A) {
        return Math.sqrt(vec.mag2(A));
    },
    zero: function() {
        return [0, 0, 0];
    },
    unit: function(A) {
        if (vec.isZero(A))
            return vec.zero();
        return vec.muls(1.0/vec.mag(A), A);
    },
    setMag: function(m, A) {
        if (m==0)
            return vec.zero();
        return vec.muls(m, vec.unit(A));
    }
};

var feq = function(a, b) {
    return Math.abs(a-b) < 0.0001;
}

var rendUtil = function() {
    var clearAll = function(gl) {
        gl.clearColor(0.0, 0.0, 0.0, 1.0);  // Clear to black, fully opaque
        gl.clearDepth(1.0);                 // Clear everything
        gl.enable(gl.DEPTH_TEST);           // Enable depth testing
        gl.depthFunc(gl.LEQUAL);            // Near things obscure far things
    };

    var initShaders = function(data) {
        var gl = data.gl;
        var fragmentShader = getShader(gl, "shader-fs");
        var vertexShader = getShader(gl, "shader-vs");
        // Create the shader program
        data.shaderProgram = gl.createProgram();
        gl.attachShader(data.shaderProgram, vertexShader);
        gl.attachShader(data.shaderProgram, fragmentShader);
        gl.linkProgram(data.shaderProgram);
        // If creating the shader program failed, alert
        if (!gl.getProgramParameter(data.shaderProgram, gl.LINK_STATUS)) {
            alert("Unable to initialize the shader program.");
        }
        gl.useProgram(data.shaderProgram);
        data.vertexPositionAttribute = gl.getAttribLocation(data.shaderProgram,
                                                       "aVertexPosition");
        gl.enableVertexAttribArray(data.vertexPositionAttribute);
        data.textureCoordAttribute = gl.getAttribLocation(data.shaderProgram,
                                                     "aTextureCoord");
        gl.enableVertexAttribArray(data.textureCoordAttribute);
        data.vertexNormalAttribute = gl.getAttribLocation(data.shaderProgram,
                                                     "aVertexNormal");
        gl.enableVertexAttribArray(data.vertexNormalAttribute);
    };

    var getShader = function(gl, id) {
        var shaderScript = document.getElementById(id);
        // Didn't find an element with the specified ID; abort.
        if (!shaderScript) {
            return null;
        }
        // Walk through the source element's children, building the
        // shader source string.
        var theSource = "";
        var currentChild = shaderScript.firstChild;
        while(currentChild) {
            if (currentChild.nodeType == 3) {
                theSource += currentChild.textContent;
            }
            currentChild = currentChild.nextSibling;
        }
        // Now figure out what type of shader script we have,
        // based on its MIME type.
        var shader;
        if (shaderScript.type == "x-shader/x-fragment") {
            shader = gl.createShader(gl.FRAGMENT_SHADER);
        } else if (shaderScript.type == "x-shader/x-vertex") {
            shader = gl.createShader(gl.VERTEX_SHADER);
        } else {
            return null;  // Unknown shader type
        }
        // Send the source to the shader object
        gl.shaderSource(shader, theSource);
        // Compile the shader program
        gl.compileShader(shader);
        // See if it compiled successfully
        if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
            alert("An error occurred compiling the shaders: " +
                  gl.getShaderInfoLog(shader));
            return null;
        }
        return shader;
    };


    var publicAttrs = {
        clearAll: clearAll,
        initShaders: initShaders
    };
    return publicAttrs;

}();

var matUtil = function() {
    var loadIdentity = function(data) {
        data.mvMatrix = Matrix.I(4);
    };

    var multMatrix = function(data, m) {
        data.mvMatrix = data.mvMatrix.x(m);
    };

    var mvTranslate = function(data, v) {
        multMatrix(data,
                   Matrix.Translation($V([v[0], v[1], v[2]])).ensure4x4());
    };

    var setMatrixUniforms = function(data) {
        var gl = data.gl;
        var pUniform = gl.getUniformLocation(data.shaderProgram, "uPMatrix");
        gl.uniformMatrix4fv(pUniform, false,
                            new Float32Array(data.perspectiveMatrix.flatten()));
        var mvUniform = gl.getUniformLocation(data.shaderProgram, "uMVMatrix");
        gl.uniformMatrix4fv(mvUniform, false,
                            new Float32Array(data.mvMatrix.flatten()));
        var normalMatrix = data.mvMatrix.inverse();
        normalMatrix = normalMatrix.transpose();
        var nUniform = gl.getUniformLocation(data.shaderProgram,
                                             "uNormalMatrix");
        gl.uniformMatrix4fv(nUniform, false,
                            new Float32Array(normalMatrix.flatten()));
    };

    var mvPushMatrix = function(data, m) {
        if (m) {
            data.mvMatrixStack.push(m.dup());
            data.mvMatrix = m.dup();
        } else {
            data.mvMatrixStack.push(data.mvMatrix.dup());
        }
    };
    var mvPopMatrix = function(data) {
        if (!data.mvMatrixStack.length) {
            throw("Can't pop from an empty matrix stack.");
        }
        data.mvMatrix = data.mvMatrixStack.pop();
        return data.mvMatrix;
    };
    var mvRotate = function(data, angle, v) {
        var m = Matrix.Rotation(angle, $V([v[0], v[1], v[2]])).ensure4x4();
        multMatrix(data, m);
    };

    var publicAttrs = {
        loadIdentity: loadIdentity,
        mvTranslate: mvTranslate,
        mvPushMatrix: mvPushMatrix,
        mvPopMatrix: mvPopMatrix,
        mvRotate: mvRotate,
        setMatrixUniforms: setMatrixUniforms
    };
    return publicAttrs;
}();

var cubeUtil = function() {
    var updateBuffers = function(buffers, gl, x, y, z, len, lat, lon) {
        buffers.vertices = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, buffers.vertices);
        var r = len * 0.5;
        var vertices =
        [
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
        // Now pass the list of vertices into WebGL to build the shape. We
        // do this by creating a Float32Array from the JavaScript array,
        // then use it to fill the current vertex buffer.
        gl.bufferData(gl.ARRAY_BUFFER,
                      new Float32Array(vertices), gl.STATIC_DRAW);
        // Set up the normals for the vertices, so that we can compute lighting.
        verticesNormalBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, verticesNormalBuffer);
        var vertexNormals =
        [
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
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertexNormals),
                      gl.STATIC_DRAW);
        // Map the texture onto the cube's faces.
        buffers.textures = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, buffers.textures);
        var textureCoordinates =
        [
         // Front
         0.0,  0.0,
         1.0,  0.0,
         1.0,  1.0,
         0.0,  1.0,
         // Back
         0.0,  0.0,
         1.0,  0.0,
         1.0,  1.0,
         0.0,  1.0,
         // Top
         0.0,  0.0,
         1.0,  0.0,
         1.0,  1.0,
         0.0,  1.0,
         // Bottom
         0.0,  0.0,
         1.0,  0.0,
         1.0,  1.0,
         0.0,  1.0,
         // Right
         0.0,  0.0,
         1.0,  0.0,
         1.0,  1.0,
         0.0,  1.0,
         // Left
         0.0,  0.0,
         1.0,  0.0,
         1.0,  1.0,
         0.0,  1.0
         ];
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(textureCoordinates),
                      gl.STATIC_DRAW);
        // Build the element array buffer; this specifies the indices
        // into the vertex array for each face's vertices.
        buffers.indices = gl.createBuffer();
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, buffers.indices);
        // This array defines each face as two triangles, using the
        // indices into the vertex array to specify each triangle's
        // position.
        var vertexIndices = [
                           0,  1,  2,      0,  2,  3,    // front
                           4,  5,  6,      4,  6,  7,    // back
                           8,  9,  10,     8,  10, 11,   // top
                           12, 13, 14,     12, 14, 15,   // bottom
                           16, 17, 18,     16, 18, 19,   // right
                           20, 21, 22,     20, 22, 23    // left
                                 ];
        // Now send the element array to GL
        gl.bufferData(gl.ELEMENT_ARRAY_BUFFER,
                      new Uint16Array(vertexIndices), gl.STATIC_DRAW);

    }

    var publicAttrs = {
        updateBuffers: updateBuffers
    };
    return publicAttrs;
}();
