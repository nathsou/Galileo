import { mat4, vec2, vec3, vec4 } from "gl-matrix";

export interface ShaderSource {
    vertex: string,
    fragment: string
}

export enum UniformType {
    INT, FLOAT, VEC2, VEC3, VEC4, MAT4
}

interface Uniform {
    value: any,
    type: UniformType,
    location: WebGLUniformLocation,
    transpose: boolean //for mat2, mat3 and mat4
}

export default class Shader {

    private static readonly version = '300 es';

    private gl: WebGL2RenderingContext;
    private _vertex_shader: WebGLShader;
    private _fragment_shader: WebGLSampler;
    private _program: WebGLProgram;
    private _definitions: Map<string, string>;
    private _source: ShaderSource;
    private _compiled = false;
    private _uniforms: Map<string, Uniform>;

    constructor(gl: WebGL2RenderingContext, source: ShaderSource) {
        this.gl = gl;
        this._source = source;
        this._uniforms = new Map<string, Uniform>();
        this._definitions = new Map<string, string>();
    }

    private preprocess(source: string): string {
        return `#version ${Shader.version}
        ${[...this._definitions].map(([name, val]) => `\n#define ${name} ${val}`).join('')}
        ${source}
        `;
    }

    public compile(): void {
        if (this._compiled) return;

        // force refetch of uniform locations
        this._uniforms.forEach(uniform => uniform.location = null);
        const vertex = this.preprocess(this._source.vertex);
        const fragment = this.preprocess(this._source.fragment);
        this._vertex_shader = this.createShader(this.gl.VERTEX_SHADER, vertex);
        this._fragment_shader = this.createShader(this.gl.FRAGMENT_SHADER, fragment);
        this._program = this.createProgram();
        this._compiled = true;
    }

    public use(): void {
        this.compile();
        this.gl.useProgram(this._program);
    }

    public define(name: string, value: string = ''): void {
        this._definitions.set(name, value);
        this._compiled = false;
    }

    public defineFloat(name: string, value: number): void {
        let val = value.toString();
        val = (val.includes('.') ? val : `${val}.0`) + 'f';
        this.define(name, val);
    }

    public defineInt(name: string, value: number): void {
        this.define(name, parseInt(value.toString()).toString());
    }

    public undefine(name: string): void {
        this._definitions.delete(name);
        this._compiled = false;
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

    public get program(): WebGLProgram {
        return this._program;
    }

    public getAttribLocation(attribute: string): number {
        return this.gl.getAttribLocation(this._program, attribute);
    }

    public registerUniform(name: string, value: any, type: UniformType, transpose = false): void {
        if (!this._uniforms.has(name)) {
            this._uniforms.set(name, {
                location: null,
                value: value,
                type: type,
                transpose: transpose
            });
        } else {
            this._uniforms.get(name).value = value;
        }
    }

    public registerTexture(name: string, boundTo: number): void {
        this.setInt(name, boundTo);
    }

    public bindUniforms(): void {
        for (const [name, uniform] of this._uniforms) {
            if (uniform.location === null) {
                uniform.location = this.gl.getUniformLocation(this._program, name);
            }

            this.setUniform(uniform);
        }
    }

    public setFloat(name: string, value: number): void {
        this.registerUniform(name, value, UniformType.FLOAT);
    }

    public setInt(name: string, value: number): void {
        this.registerUniform(name, value, UniformType.INT);
    }

    public setBool(name: string, value: boolean): void {
        this.setInt(name, value ? 1 : 0);
    }

    public setVec2(name: string, value: vec2): void {
        this.registerUniform(name, value, UniformType.VEC2);
    }

    public setVec3(name: string, value: vec3): void {
        this.registerUniform(name, value, UniformType.VEC3);
    }

    public setVec4(name: string, value: vec4): void {
        this.registerUniform(name, value, UniformType.VEC4);
    }

    public setMat4(name: string, value: mat4, transpose = false): void {
        this.registerUniform(name, value, UniformType.MAT4, transpose);
    }

    public setArray(name: string, values: any[], type: UniformType): void {
        for (let i = 0; i < values.length; i++) {
            this.registerUniform(`${name}[${i}]`, values[i], type);
        }
    }

    private setUniform(uniform: Uniform): void {

        if (uniform.location === null) return;

        switch (uniform.type) {
            case UniformType.INT:
                this.gl.uniform1i(uniform.location, uniform.value);
                break;

            case UniformType.FLOAT:
                this.gl.uniform1f(uniform.location, uniform.value);
                break;

            case UniformType.VEC2:
                this.gl.uniform2fv(uniform.location, uniform.value);
                break;

            case UniformType.VEC3:
                this.gl.uniform3fv(uniform.location, uniform.value);
                break;

            case UniformType.VEC4:
                this.gl.uniform4fv(uniform.location, uniform.value);
                break;

            case UniformType.MAT4:
                this.gl.uniformMatrix4fv(
                    uniform.location,
                    uniform.transpose,
                    uniform.value
                );
                break;

            default:
                throw new Error(`Unrecognised UniformType: ${uniform.type} with value: ${uniform.value}`);
        }

    }
}