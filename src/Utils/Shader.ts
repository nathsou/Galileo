import { vec2, vec3, vec4, mat4 } from "gl-matrix";

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
    private vertex_shader: WebGLShader;
    private fragment_shader: WebGLSampler;
    private program: WebGLProgram;

    constructor(gl: WebGL2RenderingContext, source: ShaderSource) {
        this.gl = gl;
        this.vertex_shader = this.createShader(this.gl.VERTEX_SHADER, source.vertex);
        this.fragment_shader = this.createShader(this.gl.FRAGMENT_SHADER, source.fragment);
        this.program = this.createProgram();
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
        this.gl.attachShader(program, this.vertex_shader);
        this.gl.attachShader(program, this.fragment_shader);
        this.gl.linkProgram(program);

        if (!this.gl.getProgramParameter(program, this.gl.LINK_STATUS)) {
            const info = this.gl.getProgramInfoLog(program);
            this.gl.deleteProgram(program);
            throw new Error(info);
        }

        return program;
    }

    public use(): void {
        this.gl.useProgram(this.program);
    }

    public getProgram(): WebGLProgram {
        return this.program;
    }

    public getAttribLocation(attribute: string): number {
        return this.gl.getAttribLocation(this.program, attribute);
    }

    public getUniformLocation(uniform: string): WebGLUniformLocation {
        return this.gl.getUniformLocation(this.program, uniform);
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