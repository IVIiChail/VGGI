'use strict';

let gl;                         // The webgl context.
let surface;                    // A surface model
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

function deg2rad(angle) {
    return angle * Math.PI / 180;
}

let keys = ['x_max','x_min','y_max','y_min','y_steps','x_steps'];

keys.forEach((element) => {
    console.log(element+"_Slider");
    document.getElementById(element+"_Slider").addEventListener("change", function() {
        let rValue = document.getElementById(element+"_Slider").value;
        document.getElementById(element+"_Value_span").textContent = rValue;
        updateSurface();
      });
      console.log(element+"_Slider");
})



function updateSurface() {
    x_max = parseFloat(document.getElementById("x_max_Slider").value);
    x_min = parseFloat(document.getElementById("x_min_Slider").value);

    y_max = parseFloat(document.getElementById("y_max_Slider").value);
    y_min = parseFloat(document.getElementById("y_min_Slider").value);

    y_steps = parseFloat(document.getElementById("y_steps_Slider").value);
    x_steps = parseFloat(document.getElementById("x_steps_Slider").value);

    surface.BufferData(CreateSurfaceData(x_max,x_min,y_max,y_min,x_steps,y_steps));

    draw();
}
// Constructor
function Model(name) {
    this.name = name;
    this.iVertexBuffer = gl.createBuffer();
    this.count = 0;

    this.BufferData = function(vertices) {

        gl.bindBuffer(gl.ARRAY_BUFFER, this.iVertexBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertices), gl.STREAM_DRAW);

        this.count = vertices.length/3;
    }

    this.Draw = function() {

        gl.bindBuffer(gl.ARRAY_BUFFER, this.iVertexBuffer);
        gl.vertexAttribPointer(shProgram.iAttribVertex, 3, gl.FLOAT, false, 0, 0);
        gl.enableVertexAttribArray(shProgram.iAttribVertex);

        for( let i=0; i < count_horisontal; i+=count_horisontal_steps){
            gl.drawArrays(gl.LINE_STRIP, i, count_horisontal_steps);
            
        }
        for( let i=count_horisontal; i < this.count; i+=count_vertical_steps){
            gl.drawArrays(gl.LINE_STRIP, i, count_vertical_steps);
        }
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

    this.Use = function() {
        gl.useProgram(this.prog);
    }
}


/* Draws a colored cube, along with a set of coordinate axes.
 * (Note that the use of the above drawPrimitive function is not an efficient
 * way to draw with WebGL.  Here, the geometry is so simple that it doesn't matter.)
 */
function draw() { 
    gl.clearColor(0,0,0,1);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    
    /* Set the values of the projection transformation */
    let projection = m4.perspective(Math.PI/8, 1, 8, 20); 
    
    /* Get the view matrix from the SimpleRotator object.*/
    let modelView = spaceball.getViewMatrix();

    let rotateToPointZero = m4.axisRotation([0.707,0.707,0], 0.7);
    let translateToPointZero = m4.translation(0,0,-14);

    let matAccum0 = m4.multiply(rotateToPointZero, modelView );
    let matAccum1 = m4.multiply(translateToPointZero, matAccum0 );
        
    /* Multiply the projection matrix times the modelview matrix to give the
       combined transformation matrix, and send that to the shader program. */
    let modelViewProjection = m4.multiply(projection, matAccum1 );

    gl.uniformMatrix4fv(shProgram.iModelViewProjectionMatrix, false, modelViewProjection );
    
    /* Draw the six faces of a cube, with different colors. */
    gl.uniform4fv(shProgram.iColor, [1,1,0,1] );

    surface.Draw();
}

function CreateSurfaceData(x_max,x_min,y_max,y_min,x_steps,y_steps)
{
    count_vertical = 0;
    count_horisontal = 0;


    let vertexList = [];

    let shoe = function(a,b){
        return (a*a*a)/3-(b*b)/2;
    }

    for(let j = x_min; j < x_max + (x_max-x_min)/x_steps; j+=(x_max-x_min)/x_steps){
        count_horisontal_steps = 0;
        for(let i = y_min; i < y_max + (y_max-y_min)/y_steps; i+=(y_max-y_min)/y_steps) {
            vertexList.push( i
                        , j
                        , shoe(i,j)
            );
            count_horisontal_steps++;
            count_horisontal++;
        }
    }
    
    for(let i = y_min; i < y_max + (y_max-y_min)/y_steps; i+=(y_max-y_min)/y_steps) {
        count_vertical_steps = 0;
        for(let j = x_min; j < x_max + (x_max-x_min)/x_steps; j+=(x_max-x_min)/x_steps){
            vertexList.push( i
                        , j
                        , shoe(i,j)
            );
            count_vertical_steps++;
            count_vertical++;
        }
    }

    return vertexList;
}


/* Initialize the WebGL context. Called from init() */
function initGL() {
    let prog = createProgram( gl, vertexShaderSource, fragmentShaderSource );

    shProgram = new ShaderProgram('Basic', prog);
    shProgram.Use();

    shProgram.iAttribVertex              = gl.getAttribLocation(prog, "vertex");
    shProgram.iModelViewProjectionMatrix = gl.getUniformLocation(prog, "ModelViewProjectionMatrix");
    shProgram.iColor                     = gl.getUniformLocation(prog, "color");

    surface = new Model('Surface');
    surface.BufferData(CreateSurfaceData(x_max,x_min,y_max,y_min,x_steps,y_steps));
    
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
    let vsh = gl.createShader( gl.VERTEX_SHADER );
    gl.shaderSource(vsh,vShader);
    gl.compileShader(vsh);
    if ( ! gl.getShaderParameter(vsh, gl.COMPILE_STATUS) ) {
        throw new Error("Error in vertex shader:  " + gl.getShaderInfoLog(vsh));
     }
    let fsh = gl.createShader( gl.FRAGMENT_SHADER );
    gl.shaderSource(fsh, fShader);
    gl.compileShader(fsh);
    if ( ! gl.getShaderParameter(fsh, gl.COMPILE_STATUS) ) {
       throw new Error("Error in fragment shader:  " + gl.getShaderInfoLog(fsh));
    }
    let prog = gl.createProgram();
    gl.attachShader(prog,vsh);
    gl.attachShader(prog, fsh);
    gl.linkProgram(prog);
    if ( ! gl.getProgramParameter( prog, gl.LINK_STATUS) ) {
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
        if ( ! gl ) {
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
}
