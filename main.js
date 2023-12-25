'use strict';

let gl;                         // The webgl context.
let surface, lighting;                    // A surface model
let shProgram;                  // A shader program
let spaceball;                  // A SimpleRotator object that lets the user rotate the view by mouse.

let t_max = 1;
let alpha_max = 720;
let count_vertical = 0;
let count_horisontal = 0;
let count_vertical_steps = 0;
let count_horisontal_steps = 0;

let r = 0.25;
let c = 1;
let d = 0.5;

let x_max = 1;
let x_min = -1;
let y_max = 1;
let y_min = -1;
let y_steps = 30;
let x_steps = 30;

let gamma_zero = deg2rad(60);

let pointPos = [0.0, 0.0]

function deg2rad(angle) {
    return angle * Math.PI / 180;
}

let keys = ['x_max', 'x_min', 'y_max', 'y_min', 'y_steps', 'x_steps', 'scale'];

keys.forEach((element) => {
    console.log(element + "_Slider");
    document.getElementById(element + "_Slider").addEventListener("change", function () {
        let rValue = document.getElementById(element + "_Slider").value;
        document.getElementById(element + "_Value_span").textContent = rValue;
        updateSurface();
    });
    console.log(element + "_Slider");
})



function updateSurface() {
    x_max = parseFloat(document.getElementById("x_max_Slider").value);
    x_min = parseFloat(document.getElementById("x_min_Slider").value);

    y_max = parseFloat(document.getElementById("y_max_Slider").value);
    y_min = parseFloat(document.getElementById("y_min_Slider").value);

    y_steps = parseFloat(document.getElementById("y_steps_Slider").value);
    x_steps = parseFloat(document.getElementById("x_steps_Slider").value);

    surface.BufferData(CreateSurfaceData(x_max, x_min, y_max, y_min, x_steps, y_steps),
        CreateNormalData(x_max, x_min, y_max, y_min, x_steps, y_steps),
        CreateTextureData(x_max, x_min, y_max, y_min, x_steps, y_steps)
    );

    draw();
}
// Constructor
function Model(name) {
    this.name = name;
    this.iVertexBuffer = gl.createBuffer();
    this.iNormalBuffer = gl.createBuffer();
    this.iTextureBuffer = gl.createBuffer();
    this.count = 0;

    this.BufferData = function (vertices, normals, textures) {

        gl.bindBuffer(gl.ARRAY_BUFFER, this.iVertexBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertices), gl.STREAM_DRAW);

        gl.bindBuffer(gl.ARRAY_BUFFER, this.iNormalBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(normals), gl.STREAM_DRAW);

        gl.bindBuffer(gl.ARRAY_BUFFER, this.iTextureBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(textures), gl.STREAM_DRAW);

        this.count = vertices.length / 3;
    }

    this.Draw = function () {

        gl.bindBuffer(gl.ARRAY_BUFFER, this.iVertexBuffer);
        gl.vertexAttribPointer(shProgram.iAttribVertex, 3, gl.FLOAT, false, 0, 0);
        gl.enableVertexAttribArray(shProgram.iAttribVertex);

        gl.bindBuffer(gl.ARRAY_BUFFER, this.iNormalBuffer);
        gl.vertexAttribPointer(shProgram.iAttribNormal, 3, gl.FLOAT, true, 0, 0);
        gl.enableVertexAttribArray(shProgram.iAttribNormal);

        gl.bindBuffer(gl.ARRAY_BUFFER, this.iTextureBuffer);
        gl.vertexAttribPointer(shProgram.iAttribTexture, 2, gl.FLOAT, true, 0, 0);
        gl.enableVertexAttribArray(shProgram.iAttribTexture);

        gl.drawArrays(gl.TRIANGLES, 0, this.count);
    }
}


// Constructor
function ShaderProgram(name, program) {

    this.name = name;
    this.prog = program;

    // Location of the attribute variable in the shader program.
    this.iAttribVertex = -1;
    // Location of the uniform specifying a color for the primitive.
    this.iColor = -1;
    // Location of the uniform matrix representing the combined transformation.
    this.iModelViewProjectionMatrix = -1;

    this.Use = function () {
        gl.useProgram(this.prog);
    }
}


/* Draws a colored cube, along with a set of coordinate axes.
 * (Note that the use of the above drawPrimitive function is not an efficient
 * way to draw with WebGL.  Here, the geometry is so simple that it doesn't matter.)
 */
function draw() {
    gl.clearColor(0, 0, 0, 1);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    /* Set the values of the projection transformation */
    let projection = m4.perspective(Math.PI / 8, 1, 8, 20);

    /* Get the view matrix from the SimpleRotator object.*/
    let modelView = spaceball.getViewMatrix();

    let rotateToPointZero = m4.axisRotation([0.707, 0.707, 0], 0.7);
    let translateToPointZero = m4.translation(0, 0, -14);

    let matAccum0 = m4.multiply(rotateToPointZero, modelView);
    let matAccum1 = m4.multiply(translateToPointZero, matAccum0);

    /* Multiply the projection matrix times the modelview matrix to give the
       combined transformation matrix, and send that to the shader program. */
    let modelViewProjection = m4.multiply(projection, matAccum1);

    gl.uniformMatrix4fv(shProgram.iModelViewProjectionMatrix, false, modelViewProjection);

    const normal = m4.identity();
    m4.inverse(modelView, normal);
    m4.transpose(normal, normal);

    gl.uniformMatrix4fv(shProgram.iNormalMatrix, false, normal);

    /* Draw the six faces of a cube, with different colors. */
    gl.uniform4fv(shProgram.iColor, [1, 1, 0, 1]);

    let shoe = function (a, b) {
        return (a * a * a) / 3 - (b * b) / 2;
    }
    gl.uniformMatrix4fv(shProgram.iTranslationMatrix, false, m4.translation(...pointPos, shoe(...pointPos)));
    gl.uniform3fv(shProgram.iLightPosition, [0.5 * Math.cos(Date.now() * 0.001), 0.5 * Math.sin(Date.now() * 0.001), 0]);
    gl.uniform2fv(shProgram.iPointPos, [map(pointPos[0],x_min,x_max,0,1),map(pointPos[1],y_min,y_max,0,1)]);
    gl.uniform1f(shProgram.iScale, parseFloat(document.getElementById("scale_Slider").value));
    gl.uniform3fv(shProgram.iPointTranslation, [...pointPos, shoe(...pointPos)])
    // console.log(...pointPos,shoe(...pointPos))


    surface.Draw();
    gl.uniformMatrix4fv(shProgram.iModelViewProjectionMatrix, false, m4.multiply(modelViewProjection, m4.translation(...pointPos, shoe(...pointPos))));
    gl.uniform1i(shProgram.iLighting, true);
    lighting.Draw();
    gl.uniform1i(shProgram.iLighting, false);
}

function animate() {
    draw()
    window.requestAnimationFrame(animate)
}

function CreateSurfaceData(x_max, x_min, y_max, y_min, x_steps, y_steps) {
    count_vertical = 0;
    count_horisontal = 0;


    let vertexList = [];

    let shoe = function (a, b) {
        return (a * a * a) / 3 - (b * b) / 2;
    }

    for (let j = x_min; j < x_max + (x_max - x_min) / x_steps; j += (x_max - x_min) / x_steps) {
        count_horisontal_steps = 0;
        for (let i = y_min; i < y_max + (y_max - y_min) / y_steps; i += (y_max - y_min) / y_steps) {
            vertexList.push(i
                , j
                , shoe(i, j)
            );
            vertexList.push(i + (y_max - y_min) / y_steps
                , j
                , shoe(i + (y_max - y_min) / y_steps, j)
            );
            vertexList.push(i
                , j + (x_max - x_min) / x_steps
                , shoe(i, j + (x_max - x_min) / x_steps)
            );
            vertexList.push(i
                , j + (x_max - x_min) / x_steps
                , shoe(i, j + (x_max - x_min) / x_steps)
            );
            vertexList.push(i + (y_max - y_min) / y_steps
                , j
                , shoe(i + (y_max - y_min) / y_steps, j)
            );
            vertexList.push(i + (y_max - y_min) / y_steps
                , j + (x_max - x_min) / x_steps
                , shoe(i + (y_max - y_min) / y_steps, j + (x_max - x_min) / x_steps)
            );
            count_horisontal_steps++;
            count_horisontal++;
        }
    }
    console.log(vertexList.length)
    return vertexList;
}

function CreateNormalData(x_max, x_min, y_max, y_min, x_steps, y_steps) {
    count_vertical = 0;
    count_horisontal = 0;

    let normalList = [];

    let shoe = function (a, b) {
        return (a * a * a) / 3 - (b * b) / 2;
    }

    let calcNormal = function (i, j, stepJ, stepI) {
        let v0 = [i, j, shoe(i, j)]
        let v1 = [i + stepI, j, shoe(i + stepI, j)]
        let v2 = [i, j + stepJ, shoe(i, j + stepJ)]
        let v3 = [i - stepI, j + stepJ, shoe(i - stepI, j + stepJ)]
        let v4 = [i - stepI, j, shoe(i - stepI, j)]
        let v5 = [i - stepI, j - stepJ, shoe(i - stepI, j - stepJ)]
        let v6 = [i, j - stepJ, shoe(i, j - stepJ)]
        let v01 = m4.subtractVectors(v1, v0)
        let v02 = m4.subtractVectors(v2, v0)
        let v03 = m4.subtractVectors(v3, v0)
        let v04 = m4.subtractVectors(v4, v0)
        let v05 = m4.subtractVectors(v5, v0)
        let v06 = m4.subtractVectors(v6, v0)
        let n1 = m4.normalize(m4.cross(v01, v02))
        let n2 = m4.normalize(m4.cross(v02, v03))
        let n3 = m4.normalize(m4.cross(v03, v04))
        let n4 = m4.normalize(m4.cross(v04, v05))
        let n5 = m4.normalize(m4.cross(v05, v06))
        let n6 = m4.normalize(m4.cross(v06, v01))
        let n = [(n1[0] + n2[0] + n3[0] + n4[0] + n5[0] + n6[0]) / 6.0,
        (n1[1] + n2[1] + n3[1] + n4[1] + n5[1] + n6[1]) / 6.0,
        (n1[2] + n2[2] + n3[2] + n4[2] + n5[2] + n6[2]) / 6.0]
        n = m4.normalize(n);
        return n;
    }

    for (let j = x_min; j < x_max + (x_max - x_min) / x_steps; j += (x_max - x_min) / x_steps) {
        count_horisontal_steps = 0;
        for (let i = y_min; i < y_max + (y_max - y_min) / y_steps; i += (y_max - y_min) / y_steps) {
            normalList.push(...calcNormal(i, j, (x_max - x_min) / x_steps, (y_max - y_min) / y_steps))
            normalList.push(...calcNormal(i + (y_max - y_min) / y_steps, j, (x_max - x_min) / x_steps, (y_max - y_min) / y_steps))
            normalList.push(...calcNormal(i, j + (x_max - x_min) / x_steps, (x_max - x_min) / x_steps, (y_max - y_min) / y_steps))
            normalList.push(...calcNormal(i, j + (x_max - x_min) / x_steps, (x_max - x_min) / x_steps, (y_max - y_min) / y_steps))
            normalList.push(...calcNormal(i + (y_max - y_min) / y_steps, j, (x_max - x_min) / x_steps, (y_max - y_min) / y_steps))
            normalList.push(...calcNormal(i + (y_max - y_min) / y_steps, j + (x_max - x_min) / x_steps, (x_max - x_min) / x_steps, (y_max - y_min) / y_steps))
            count_horisontal_steps++;
            count_horisontal++;
        }
    }
    console.log(normalList.length)
    return normalList;
}

function CreateLightVisData() {
    let vertexList = [];

    let u = 0,
        v = 0,
        step = 0.1;
    while (u < Math.PI * 2) {
        while (v < Math.PI) {
            let v1 = getSphereVertex(u, v);
            let v2 = getSphereVertex(u + step, v);
            let v3 = getSphereVertex(u, v + step);
            let v4 = getSphereVertex(u + step, v + step);
            vertexList.push(v1.x, v1.y, v1.z);
            vertexList.push(v2.x, v2.y, v2.z);
            vertexList.push(v3.x, v3.y, v3.z);
            vertexList.push(v3.x, v3.y, v3.z);
            vertexList.push(v2.x, v2.y, v2.z);
            vertexList.push(v4.x, v4.y, v4.z);
            v += step;
        }
        v = 0;
        u += step;
    }
    return vertexList;
}

let radius = 0.05;
function getSphereVertex(long, lat) {
    return {
        x: radius * Math.cos(long) * Math.sin(lat),
        y: radius * Math.sin(long) * Math.sin(lat),
        z: radius * Math.cos(lat)
    }

}

function CreateTextureData(x_max, x_min, y_max, y_min, x_steps, y_steps) {
    count_vertical = 0;
    count_horisontal = 0;

    let textureList = [];
    for (let j = x_min; j < x_max + (x_max - x_min) / x_steps; j += (x_max - x_min) / x_steps) {
        count_horisontal_steps = 0;
        for (let i = y_min; i < y_max + (y_max - y_min) / y_steps; i += (y_max - y_min) / y_steps) {
            textureList.push(map(i, y_min, y_max, 0, 1), map(j, x_min, x_max, 0, 1))
            textureList.push(map(i + (y_max - y_min) / y_steps, y_min, y_max, 0, 1), map(j, x_min, x_max, 0, 1))
            textureList.push(map(i, y_min, y_max, 0, 1), map(j + (x_max - x_min) / x_steps, x_min, x_max, 0, 1))
            textureList.push(map(i, y_min, y_max, 0, 1), map(j + (x_max - x_min) / x_steps, x_min, x_max, 0, 1))
            textureList.push(map(i + (y_max - y_min) / y_steps, y_min, y_max, 0, 1), map(j, x_min, x_max, 0, 1))
            textureList.push(map(i + (y_max - y_min) / y_steps, y_min, y_max, 0, 1), map(j + (x_max - x_min) / x_steps, x_min, x_max, 0, 1))
            count_horisontal_steps++;
            count_horisontal++;
        }
    }
    console.log(textureList.length)
    return textureList;
}

function map(value, a, b, c, d) {
    value = (value - a) / (b - a);
    return c + value * (d - c);
}


/* Initialize the WebGL context. Called from init() */
function initGL() {
    let prog = createProgram(gl, vertexShaderSource, fragmentShaderSource);

    shProgram = new ShaderProgram('Basic', prog);
    shProgram.Use();

    shProgram.iAttribVertex = gl.getAttribLocation(prog, "vertex");
    shProgram.iAttribNormal = gl.getAttribLocation(prog, "normal");
    shProgram.iAttribTexture = gl.getAttribLocation(prog, "texture");
    shProgram.iModelViewProjectionMatrix = gl.getUniformLocation(prog, "ModelViewProjectionMatrix");
    shProgram.iNormalMatrix = gl.getUniformLocation(prog, "NormalMatrix");
    shProgram.iTranslationMatrix = gl.getUniformLocation(prog, "TranslationMatrix");
    shProgram.iColor = gl.getUniformLocation(prog, "color");
    shProgram.iLighting = gl.getUniformLocation(prog, "lighting");
    shProgram.iLightPosition = gl.getUniformLocation(prog, "lightPos");
    shProgram.iTMU = gl.getUniformLocation(prog, 'tmu');
    shProgram.iScale = gl.getUniformLocation(prog, 'scaleFactor');
    shProgram.iPointPos = gl.getUniformLocation(prog, 'pointPos');
    shProgram.iPointTranslation = gl.getUniformLocation(prog, 'pointTranslation');

    LoadTexture();

    surface = new Model('Surface');
    surface.BufferData(CreateSurfaceData(x_max, x_min, y_max, y_min, x_steps, y_steps),
        CreateNormalData(x_max, x_min, y_max, y_min, x_steps, y_steps),
        CreateTextureData(x_max, x_min, y_max, y_min, x_steps, y_steps)
    );
    lighting = new Model()
    lighting.BufferData(CreateLightVisData(), CreateLightVisData(), CreateLightVisData())

    gl.enable(gl.DEPTH_TEST);
}


/* Creates a program for use in the WebGL context gl, and returns the
 * identifier for that program.  If an error occurs while compiling or
 * linking the program, an exception of type Error is thrown.  The error
 * string contains the compilation or linking error.  If no error occurs,
 * the program identifier is the return value of the function.
 * The second and third parameters are strings that contain the
 * source code for the vertex shader and for the fragment shader.
 */
function createProgram(gl, vShader, fShader) {
    let vsh = gl.createShader(gl.VERTEX_SHADER);
    gl.shaderSource(vsh, vShader);
    gl.compileShader(vsh);
    if (!gl.getShaderParameter(vsh, gl.COMPILE_STATUS)) {
        throw new Error("Error in vertex shader:  " + gl.getShaderInfoLog(vsh));
    }
    let fsh = gl.createShader(gl.FRAGMENT_SHADER);
    gl.shaderSource(fsh, fShader);
    gl.compileShader(fsh);
    if (!gl.getShaderParameter(fsh, gl.COMPILE_STATUS)) {
        throw new Error("Error in fragment shader:  " + gl.getShaderInfoLog(fsh));
    }
    let prog = gl.createProgram();
    gl.attachShader(prog, vsh);
    gl.attachShader(prog, fsh);
    gl.linkProgram(prog);
    if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) {
        throw new Error("Link error in program:  " + gl.getProgramInfoLog(prog));
    }
    return prog;
}


/**
 * initialization function that will be called when the page has loaded
 */
function init() {
    let canvas;
    try {
        canvas = document.getElementById("webglcanvas");
        gl = canvas.getContext("webgl");
        if (!gl) {
            throw "Browser does not support WebGL";
        }
    }
    catch (e) {
        document.getElementById("canvas-holder").innerHTML =
            "<p>Sorry, could not get a WebGL graphics context.</p>";
        return;
    }
    try {
        initGL();  // initialize the WebGL graphics context
    }
    catch (e) {
        document.getElementById("canvas-holder").innerHTML =
            "<p>Sorry, could not initialize the WebGL graphics context: " + e + "</p>";
        return;
    }

    spaceball = new TrackballRotator(canvas, draw, 0);

    draw();
    animate();
}

function LoadTexture() {
    let texture = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, texture);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);

    const image = new Image();
    image.crossOrigin = 'anonymus';
    image.src = "https://github.com/IVIiChail/VGGI/tree/rgr/screenshots/tree.jpeg";
    image.onload = () => {
        gl.bindTexture(gl.TEXTURE_2D, texture);
        gl.texImage2D(
            gl.TEXTURE_2D,
            0,
            gl.RGBA,
            gl.RGBA,
            gl.UNSIGNED_BYTE,
            image
        );
        console.log("imageLoaded")
        draw()
    }
}

window.onkeydown = (e) => {
    // console.log(e.keyCode)
    if (e.keyCode == 87) { //w
        pointPos[0] = Math.min(pointPos[0] + (x_max - x_min) / x_steps, x_max);
    }
    else if (e.keyCode == 65) { //a
        pointPos[1] = Math.max(pointPos[1] - (y_max - y_min) / y_steps, y_min);
    }
    else if (e.keyCode == 83) { //s
        pointPos[0] = Math.max(pointPos[0] - (x_max - x_min) / x_steps, x_min);
    }
    else if (e.keyCode == 68) { //d
        pointPos[1] = Math.min(pointPos[1] + (y_max - y_min) / y_steps, y_max);
    }
    draw();
}