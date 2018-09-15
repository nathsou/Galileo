import Shader from "./Shader";
import { textShader } from "../Map/Shaders/TextShader";
import { mat4 } from "gl-matrix";

export interface TextInfo {
    readonly text: string,
    readonly position: { x: number, y: number },
    readonly style?: string,
    readonly fontSize?: number //px
}

const text_ctx = document.createElement('canvas').getContext('2d');

function generateTextTexture(info: TextInfo): HTMLCanvasElement {

    info = {
        style: 'red',
        fontSize: 20,
        ...info
    };

    const width = text_ctx.measureText(info.text).width;
    const height = 2 * info.fontSize;

    text_ctx.canvas.width = width;
    text_ctx.canvas.height = height;
    text_ctx.font = `${info.fontSize} monospace`;
    text_ctx.textAlign = 'center';
    text_ctx.textBaseline = 'middle';
    text_ctx.clearRect(0, 0, width, height);
    text_ctx.fillStyle = 'rgba(0, 0, 0, 0.0)';
    text_ctx.fillStyle = info.style;
    text_ctx.fill();
    text_ctx.fillText(info.text, width / 2, height / 2);

    return text_ctx.canvas;
}

export type TextHelper = (model_view_proj: mat4, text: string) => void;

export function drawText(gl: WebGL2RenderingContext, info: TextInfo): TextHelper {
    const tex_cnv = generateTextTexture(info);

    const shader = new Shader(gl, textShader);
    shader.use();

    //Setup the position attribute
    const VAO = gl.createVertexArray();
    const VBO = gl.createBuffer();

    const vertices = [
        -1.0, -1.0, 0.0,
        1.0, -1.0, 0.0,
        1.0, 1.0, 0.0,

        1.0, 1.0, 0.0,
        -1.0, 1.0, 0.0,
        -1.0, -1.0, 0.0
    ];

    gl.bindVertexArray(VAO);
    gl.bindBuffer(gl.ARRAY_BUFFER, VBO);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertices), gl.STATIC_DRAW);
    const position_attrib = shader.getAttribLocation('position');
    gl.vertexAttribPointer(position_attrib, 3, gl.FLOAT, false, 3 * 4, 0);
    gl.enableVertexAttribArray(position_attrib);
    gl.bindBuffer(gl.ARRAY_BUFFER, null);
    gl.bindVertexArray(null);

    const tex = gl.createTexture();
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, tex);
    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, tex_cnv);
    gl.generateMipmap(gl.TEXTURE_2D);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.bindTexture(gl.TEXTURE_2D, null);

    return (model_view_proj: mat4, text: string) => {
        shader.use();
        gl.bindTexture(gl.TEXTURE_2D, tex);
        shader.setInt('u_texture', 0);
        shader.setMat4('model_view_proj', model_view_proj);

        gl.bindVertexArray(VAO);
        gl.drawArrays(gl.TRIANGLES, 0, 6);

        gl.bindVertexArray(null);
        gl.bindBuffer(gl.ARRAY_BUFFER, null);
        gl.bindTexture(gl.TEXTURE_2D, null);
    };
}