import Shader from "./Shader";
import { textShader } from "../Map/Shaders/TextShader";
import { vec3, mat4 } from "gl-matrix";
import { vec, div } from "./Vec3Utils";

export type CanvasHelper = (canvas: HTMLCanvasElement, pos: vec3) => void;

export function createCanvasHelper(
    gl: WebGL2RenderingContext
): CanvasHelper {

    const shader = new Shader(gl, textShader);
    shader.use();

    // Setup the position and texture coords attributes
    const VAO = gl.createVertexArray();

    const positions = [
        0, 0,
        0, 1,
        1, 0,
        1, 0,
        0, 1,
        1, 1,
    ];

    const texcoords = [
        0, 0,
        0, 1,
        1, 0,
        1, 0,
        0, 1,
        1, 1,
    ];

    //bind the attrivutes to a VAO

    gl.bindVertexArray(VAO);

    const pos_buffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, pos_buffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(positions), gl.STATIC_DRAW);
    const pos_attrib = shader.getAttribLocation('position');
    gl.vertexAttribPointer(pos_attrib, 2, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(pos_attrib);

    const uv_buffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, uv_buffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(texcoords), gl.STATIC_DRAW);
    const uv_attrib = shader.getAttribLocation('texcoords');
    gl.vertexAttribPointer(uv_attrib, 2, gl.FLOAT, true, 0, 0);
    gl.enableVertexAttribArray(uv_attrib);

    gl.bindBuffer(gl.ARRAY_BUFFER, null);
    gl.bindVertexArray(null);


    //create a WebGLTexture from the canvas
    const tex = gl.createTexture();

    return (canvas: HTMLCanvasElement, position: vec3) => {
        gl.activeTexture(gl.TEXTURE2);
        gl.bindTexture(gl.TEXTURE_2D, tex);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
        gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, canvas);
        gl.generateMipmap(gl.TEXTURE_2D);

        const transfo = mat4.create();

        mat4.translate(
            transfo,
            transfo,
            div(
                vec(position[0], gl.canvas.height - canvas.height - position[1], 0),
                vec(gl.canvas.width, gl.canvas.height, 1)
            )
        );

        mat4.scale(transfo, transfo, [canvas.width / gl.canvas.width, canvas.height / gl.canvas.height, 1]);

        shader.use();
        gl.bindTexture(gl.TEXTURE_2D, tex);
        shader.setInt('u_texture', 2);
        shader.setMat4('transfo', transfo);

        gl.bindVertexArray(VAO);
        gl.drawArrays(gl.TRIANGLES, 0, 6);

        gl.bindVertexArray(null);
        gl.bindBuffer(gl.ARRAY_BUFFER, null);
        gl.bindTexture(gl.TEXTURE_2D, null);
    }
}