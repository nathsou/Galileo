import { TextureInfo } from "./Texture";
import { vec2, mat4 } from "gl-matrix";
import Shader from "../Shader";
import { textShader } from "../../Map/Shaders/TextShader";
import { vec, div } from "../Vec3Utils";
import { g_vec } from "../VecUtils";

export type TextureHelper = (tex: TextureInfo, position: vec2, dimensions?: vec2) => void;

export function createTextureHelper(gl: WebGL2RenderingContext): TextureHelper {
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


    return (tex: TextureInfo, position: vec2, dimensions?: vec2) => {


        /*         
        const tr = mat4.create();
        mat4.ortho(tr, 0, gl.canvas.width, gl.canvas.height, 0, -1, 1);
        mat4.translate(tr, tr, position);
        mat4.scale(tr, tr, [canvas.width, canvas.height, 1]); 
        */

        if (!dimensions) {
            dimensions = g_vec(tex.width, tex.height);
        }

        const transfo = mat4.create();

        mat4.translate(
            transfo,
            transfo,
            div(
                vec(position[0], gl.canvas.height - dimensions[1] - position[1], 0),
                vec(gl.canvas.width, gl.canvas.height, 1)
            )
        );

        mat4.scale(
            transfo,
            transfo,
            [
                dimensions[0] / gl.canvas.width,
                dimensions[1] / gl.canvas.height,
                1
            ]
        );

        //console.log(`[${transfo.join(', ')}] - [${tr.join(', ')}]`);

        shader.use();
        gl.bindTexture(gl.TEXTURE_2D, tex.handle);
        shader.registerTexture('u_texture', tex.bound_to);
        shader.setMat4('transfo', transfo);
        shader.bindUniforms();

        gl.bindVertexArray(VAO);
        gl.drawArrays(gl.TRIANGLES, 0, 6);

        gl.bindVertexArray(null);
        gl.bindBuffer(gl.ARRAY_BUFFER, null);
        // gl.bindTexture(gl.TEXTURE_2D, null);
    }
}