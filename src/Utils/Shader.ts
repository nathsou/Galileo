import { mat4, vec2, vec3, vec4 } from "gl-matrix";
import { TextureInfo } from "./Texture";

export interface ShaderSource {
    vertex: string,
    fragment: string
}

export enum ShaderType {
    VERTEX,
    FRAGMENT
}

export default class Shader {

    private gl: WebGL2RenderingContext;
    private _vertex_shader: WebGLShader;
    private _fragment_shader: WebGLSampler;
    private _program: WebGLProgram;
    private _texture_map: Map<string, number>;

    constructor(gl: WebGL2RenderingContext, source: ShaderSource) {
        this.gl = gl;
        this._vertex_shader = this.createShader(this.gl.VERTEX_SHADER, source.vertex);
        this._fragment_shader = this.createShader(this.gl.FRAGMENT_SHADER, source.fragment);
        this._program = this.createProgram();
        this._texture_map = new Map<string, number>();
    }

    private createShader(type: number, source: string): WebGLShader {
        const shader = this.gl.createShader(type);
        this.gl.shaderSource(shader, source);
        this.gl.compileShader(shader);

        if (!this.gl.getShaderParameter(shader, this.gl.COMPILE_STATUS)) {
            const info = this.gl.getShaderInfoLog(shader);
            this.gl.deleteShader(shader);
            throw new Error(info);
        }

        return shader;
    }

    private createProgram(): WebGLProgram {
        const program = this.gl.createProgram();
        this.gl.attachShader(program, this._vertex_shader);
        this.gl.attachShader(program, this._fragment_shader);
        this.gl.linkProgram(program);

        if (!this.gl.getProgramParameter(program, this.gl.LINK_STATUS)) {
            const info = this.gl.getProgramInfoLog(program);
            this.gl.deleteProgram(program);
            throw new Error(info);
        }

        return program;
    }

    public use(): void {
        this.gl.useProgram(this._program);
    }

    public get program(): WebGLProgram {
        return this._program;
    }

    public getAttribLocation(attribute: string): number {
        return this.gl.getAttribLocation(this._program, attribute);
    }

    public getUniformLocation(uniform: string): WebGLUniformLocation {
        return this.gl.getUniformLocation(this._program, uniform);
    }

    public attachTexture(name: string, boundTo: number): void {
        this._texture_map.set(name, boundTo);
    }

    public bindTextures(): void {
        for (const [name, boundTo] of this._texture_map) {
            this.setInt(name, boundTo);
        }
    }

    public setFloat(name: string, value: number): WebGLUniformLocation {
        const loc = this.getUniformLocation(name);
        this.gl.uniform1f(loc, value);
        return loc;
    }

    public setInt(name: string, value: number): WebGLUniformLocation {
        const loc = this.getUniformLocation(name);
        this.gl.uniform1i(loc, Math.floor(value));
        return loc;
    }

    public setBool(name: string, value: boolean): WebGLUniformLocation {
        return this.setInt(name, value ? 1 : 0);
    }

    public setVec2(name: string, value: vec2): WebGLUniformLocation {
        const loc = this.getUniformLocation(name);
        this.gl.uniform2fv(loc, value);
        return loc;
    }

    public setVec3(name: string, value: vec3): WebGLUniformLocation {
        const loc = this.getUniformLocation(name);
        this.gl.uniform3fv(loc, value);
        return loc;
    }

    public setVec4(name: string, value: vec4): WebGLUniformLocation {
        const loc = this.getUniformLocation(name);
        this.gl.uniform4fv(loc, value);
        return loc;
    }

    public setMat4(name: string, value: mat4, transpose = false): WebGLUniformLocation {
        const loc = this.getUniformLocation(name);
        this.gl.uniformMatrix4fv(loc, transpose, value);
        return loc;
    }
}