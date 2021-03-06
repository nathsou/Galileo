import Shader, { ShaderSource } from "../Shader";
import { heightMapShader } from "../../Map/Shaders/HeightMapShader";
import { normalMapShader } from "../../Map/Shaders/NormalMapShader";
import { vec3 } from "gl-matrix";
import { plainColorShader } from "../../Map/Shaders/PlainColorShader";
import { heightMapToColorMapShader } from "../../Map/Shaders/HeightMapToColorMapShader";
import { clampedHeightMapShader } from "../../Map/Shaders/ClampedHeightMapShader";

export interface TextureInfo {
    handle: WebGLTexture,
    bound_to: number,
    width: number,
    height: number
}

export namespace Texture {

    // 0 --> Text Rendering Textures
    let id = 1;

    // generate a Webgl.Texture from a given shader
    export function generate(
        gl: WebGL2RenderingContext,
        shader: Shader | ShaderSource,
        width: number,
        height: number,
        mipmaps = true
    ): Readonly<TextureInfo> {

        if (!(shader instanceof Shader)) {
            shader = new Shader(gl, shader);
        }

        shader.compile();

        const vertices = [
            -1.0, -1.0,
            1.0, -1.0,
            1.0, 1.0,

            1.0, 1.0,
            -1.0, 1.0,
            -1.0, -1.0
        ];

        const VAO = gl.createVertexArray();
        const VBO = gl.createBuffer();
        // bind the Vertex Array Object first, then bind and set vertex buffer(s), and then configure vertex attributes(s).
        gl.bindVertexArray(VAO);

        gl.bindBuffer(gl.ARRAY_BUFFER, VBO);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertices), gl.STATIC_DRAW);

        const pos_loc = shader.getAttribLocation('position');
        gl.vertexAttribPointer(pos_loc, 2, gl.FLOAT, false, 0, 0);
        gl.enableVertexAttribArray(pos_loc);

        // note that this is allowed, the call to gl.VertexAttribPointer registered VBO as the vertex attribute's bound vertex buffer object so afterwards we can safely unbind
        gl.bindBuffer(gl.ARRAY_BUFFER, null);

        // framebuffer configuration
        // -------------------------
        const framebuffer = gl.createFramebuffer();
        gl.bindFramebuffer(gl.FRAMEBUFFER, framebuffer);
        // create a color attachment texture

        this.texture = gl.createTexture();
        const bound_to = id++;
        gl.activeTexture(gl.TEXTURE0 + bound_to);
        gl.bindTexture(gl.TEXTURE_2D, this.texture);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGB, width, height, 0, gl.RGB, gl.UNSIGNED_BYTE, null);

        if (mipmaps) {
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
            gl.generateMipmap(gl.TEXTURE_2D);
        }

        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.REPEAT);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.REPEAT);
        gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, this.texture, 0);
        // create a renderbuffer object for depth and stencil attachment (we won't be sampling these)
        if (gl.checkFramebufferStatus(gl.FRAMEBUFFER) != gl.FRAMEBUFFER_COMPLETE) {
            console.error('ERROR::FRAMEBUFFER:: Framebuffer is not complete');
        }

        gl.disable(gl.DEPTH_TEST);

        gl.viewport(0, 0, width, height);

        gl.clearColor(0.0, 1.0, 0.5, 1.0);
        gl.clear(gl.COLOR_BUFFER_BIT);

        shader.use();
        shader.bindUniforms();

        gl.bindVertexArray(VAO);
        gl.drawArrays(gl.TRIANGLES, 0, 6);

        gl.deleteVertexArray(VAO);
        gl.deleteBuffer(VBO);

        gl.bindFramebuffer(gl.FRAMEBUFFER, null);

        gl.enable(gl.DEPTH_TEST);

        return {
            handle: this.texture,
            bound_to: bound_to,
            width: width,
            height: height
        };
    }

    export function remove(gl: WebGL2RenderingContext, tex: TextureInfo): void {
        gl.deleteTexture(tex.handle);
    }

    export function bind(gl: WebGL2RenderingContext, tex: TextureInfo, to: number) {
        gl.bindTexture(gl.TEXTURE0 + to, tex.handle);
        tex.bound_to = to;
    }



    // Draw the texture onto a canvas
    export function toCanvas(source: Shader | ShaderSource, width: number, height: number): HTMLCanvasElement {

        const canvas = document.createElement('canvas');
        const gl = canvas.getContext('webgl2') as WebGL2RenderingContext;
        const shader = source instanceof Shader ? source : new Shader(gl, source);
        canvas.width = width;
        canvas.height = height;

        shader.use();

        const pos_loc = shader.getAttribLocation('position');

        const pos_buffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, pos_buffer);
        gl.bufferData(
            gl.ARRAY_BUFFER,
            new Float32Array([
                -1.0, -1.0,
                1.0, -1.0,
                -1.0, 1.0,
                -1.0, 1.0,
                1.0, -1.0,
                1.0, 1.0]),
            gl.STATIC_DRAW
        );
        gl.enableVertexAttribArray(pos_loc);
        gl.vertexAttribPointer(pos_loc, 2, gl.FLOAT, false, 0, 0);

        gl.viewport(0, 0, width, height);
        // draw
        gl.drawArrays(gl.TRIANGLES, 0, 6);

        //free up memory
        gl.deleteBuffer(pos_buffer);
        return canvas;
    }

    export function toURL(source: Shader | ShaderSource, width: number, height: number): Promise<string> {
        return new Promise<string>(resolve => {
            const canvas = Texture.toCanvas(source, width, height);
            canvas.toBlob((blob: Blob) => {
                resolve(URL.createObjectURL(blob));
            });
        });
    }

    export function getImage(source: ShaderSource, width: number, height: number): Promise<HTMLImageElement> {
        return new Promise<HTMLImageElement>(resolve => {
            Texture.toURL(source, width, height).then(url => {
                const img = new Image();
                img.onload = () => {
                    URL.revokeObjectURL(url);
                    resolve(img);
                };
                img.src = url;
            });
        });
    }

    export function openInWindow(
        source: Shader | ShaderSource,
        width: number,
        height: number,
        name = 'Texture Visualizer'
    ): void {
        Texture.toURL(source, width, height).then(url => {
            window.open(
                url,
                name,
                `menubar=no,
                location=no,
                resizable=yes,
                scrollbars=no,
                status=no,
                width=${width},
                height=${height}
            `);

            window.setTimeout(() => { URL.revokeObjectURL(url); }, 500);
        });
    }

    export function generatePlainColorTexture(
        gl: WebGL2RenderingContext,
        width: number,
        height: number,
        color: vec3,
        mipmaps = true
    ): TextureInfo {
        const shader = new Shader(gl, plainColorShader);
        shader.setVec3('color', color);
        return Texture.generate(gl, shader, width, height, mipmaps);
    }

    export function generateHeightMap(
        gl: WebGL2RenderingContext,
        width: number,
        height: number,
        seed = Math.random() * 10000,
        octaves = 8,
        frequency = 2,
        mipmaps = true
    ): Readonly<TextureInfo> {
        const shader = new Shader(gl, heightMapShader);
        shader.defineFloat('SEED', seed);
        shader.defineFloat('FREQUENCY', frequency);
        shader.defineInt('OCTAVES', octaves);
        return Texture.generate(gl, shader, width, height, mipmaps);
    }

    export function generateClampedHeightMap(
        gl: WebGL2RenderingContext,
        width: number,
        height: number,
        clamp_height: number,
        seed = Math.random() * 10000,
        octaves = 8,
        frequency = 2,
        mipmaps = true
    ): Readonly<TextureInfo> {
        const shader = new Shader(gl, clampedHeightMapShader);
        shader.defineFloat('SEED', seed);
        shader.defineFloat('FREQUENCY', frequency);
        shader.defineInt('OCTAVES', octaves);
        shader.setFloat('clamp_height', clamp_height);
        return Texture.generate(gl, shader, width, height, mipmaps);
    }

    export function generateColorMap(
        gl: WebGL2RenderingContext,
        height_map: TextureInfo,
        mipmaps = true
    ): Readonly<TextureInfo> {
        const shader = new Shader(gl, heightMapToColorMapShader);
        shader.registerTexture('height_map', height_map.bound_to);
        return Texture.generate(gl, shader, height_map.width, height_map.height, mipmaps);
    }

    export function generateNormalMap(
        gl: WebGL2RenderingContext,
        height_map: TextureInfo,
        mipmaps = true
    ): Readonly<TextureInfo> {
        const shader = new Shader(gl, normalMapShader);
        shader.registerTexture('height_map', height_map.bound_to);
        return Texture.generate(gl, shader, height_map.width, height_map.height, mipmaps);
    }
}