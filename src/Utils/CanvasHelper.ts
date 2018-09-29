import { vec2 } from "gl-matrix";
import { TextureInfo } from "./TextureUtils/Texture";
import { createTextureHelper } from "./TextureUtils/TextureHelper";

export type CanvasHelper = (canvas: HTMLCanvasElement, pos: vec2, dimensions?: vec2) => void;

export function createCanvasHelper(
    gl: WebGL2RenderingContext
): CanvasHelper {

    //create a WebGLTexture from the canvas
    const drawTexture = createTextureHelper(gl);
    const tex = gl.createTexture();

    return (canvas: HTMLCanvasElement, position: vec2, dimensions?: vec2) => {
        gl.activeTexture(gl.TEXTURE0);
        gl.bindTexture(gl.TEXTURE_2D, tex);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
        gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, 1);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, canvas);
        gl.generateMipmap(gl.TEXTURE_2D);

        const tex_info: TextureInfo = {
            handle: tex,
            width: canvas.width,
            height: canvas.height,
            bound_to: 0
        };

        drawTexture(tex_info, position, dimensions);
    }
}