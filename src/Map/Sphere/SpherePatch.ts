import { vec2, vec3 } from "gl-matrix";
import Camera from "../../Controls/Camera";
import { UniformType } from "../../Utils/Shader";
import { transform, vec } from "../../Utils/Vec3Utils";
import Sphere from "./Sphere";

export interface PatchVertex {
    position: vec2;
    morph: vec2;
}

export interface PatchInstance { //of a triangle ABC
    level: number;
    A: vec3;
    R: vec3; // R = B - A
    S: vec3; // S = C - A
}

export default abstract class SpherePatch {

    protected gl: WebGL2RenderingContext;
    protected _indices: number[];
    protected _vertices: number[];
    protected _instances: number[];
    protected _levels: number;
    protected _sphere: Sphere;
    protected _instances_count: number;

    protected attributes: {
        pos: number,
        morph: number,

        level: number,
        A: number,
        R: number,
        S: number
    };

    protected VAO: WebGLVertexArrayObject;
    protected VBO: WebGLBuffer
    protected EBO: WebGLBuffer;
    protected VBO_instance: WebGLBuffer;

    constructor(gl: WebGL2RenderingContext, sphere: Sphere) {
        this.gl = gl;
        this._sphere = sphere;
        this._levels = sphere.options.patch_levels;
        this._instances = [];
    }

    protected initUniforms(): void {
        const light_pos = vec(-14000, 8000, -17000);

        this._sphere.shader.setFloat('morph_range', this._sphere.options.morph_range);
        this._sphere.shader.setVec3('light_pos', light_pos);
        this._sphere.shader.setArray('distanceLUT', this._sphere.getSplitDistances(), UniformType.FLOAT);
    }

    protected initAttributes(): void {
        this.attributes = {
            pos: this._sphere.shader.getAttribLocation('pos'),
            morph: this._sphere.shader.getAttribLocation('morph'),

            level: this._sphere.shader.getAttribLocation('level'),
            A: this._sphere.shader.getAttribLocation('A'),
            R: this._sphere.shader.getAttribLocation('R'),
            S: this._sphere.shader.getAttribLocation('S')
        }
    }

    protected initBuffers(): void {
        this.VAO = this.gl.createVertexArray();
        this.VBO = this.gl.createBuffer();
        this.EBO = this.gl.createBuffer();
        this.VBO_instance = this.gl.createBuffer();

        this.gl.bindVertexArray(this.VAO);
        this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.VBO);

        this.gl.enableVertexAttribArray(this.attributes.pos);
        this.gl.enableVertexAttribArray(this.attributes.morph);

        this.gl.vertexAttribPointer(this.attributes.pos, 2, this.gl.FLOAT, false, 4 * 4, 0 * 4);
        this.gl.vertexAttribPointer(this.attributes.morph, 2, this.gl.FLOAT, false, 4 * 4, 2 * 4);
    }

    public init(): void {
        this._sphere.shader.use();

        this.initUniforms();
        this.initAttributes();
        this.initBuffers();

        this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.VBO_instance);
        this.gl.enableVertexAttribArray(this.attributes.level);
        this.gl.enableVertexAttribArray(this.attributes.A);
        this.gl.enableVertexAttribArray(this.attributes.R);
        this.gl.enableVertexAttribArray(this.attributes.S);

        this.gl.vertexAttribPointer(this.attributes.level, 1, this.gl.FLOAT, false, 10 * 4, 0);
        this.gl.vertexAttribPointer(this.attributes.A, 3, this.gl.FLOAT, false, 10 * 4, 1 * 4);
        this.gl.vertexAttribPointer(this.attributes.R, 3, this.gl.FLOAT, false, 10 * 4, 4 * 4);
        this.gl.vertexAttribPointer(this.attributes.S, 3, this.gl.FLOAT, false, 10 * 4, 7 * 4);

        this.gl.vertexAttribDivisor(this.attributes.level, 1);
        this.gl.vertexAttribDivisor(this.attributes.A, 1);
        this.gl.vertexAttribDivisor(this.attributes.R, 1);
        this.gl.vertexAttribDivisor(this.attributes.S, 1);

        //indices
        this.gl.bindBuffer(this.gl.ELEMENT_ARRAY_BUFFER, this.EBO);

        //unbind
        this.gl.bindBuffer(this.gl.ARRAY_BUFFER, null);
        this.gl.bindVertexArray(null);

        this.generateGeometry();
    }

    public abstract generateGeometry(): void;

    protected rebind(): void {
        this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.VBO);
        this.gl.bufferData(this.gl.ARRAY_BUFFER, new Float32Array(this._vertices), this.gl.DYNAMIC_DRAW);
        this.gl.bindBuffer(this.gl.ELEMENT_ARRAY_BUFFER, this.EBO);
        this.gl.bufferData(this.gl.ELEMENT_ARRAY_BUFFER, new Uint32Array(this._indices), this.gl.STATIC_DRAW);
        this.gl.bindBuffer(this.gl.ARRAY_BUFFER, null);
    }

    public bindInstances(): void {
        this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.VBO_instance);
        this.gl.bufferData(this.gl.ARRAY_BUFFER, new Float32Array(this._instances), this.gl.STATIC_DRAW);
        this.gl.bindBuffer(this.gl.ARRAY_BUFFER, null);
    }

    public pushInstance(...instances: PatchInstance[]): void {
        for (const instance of instances) {
            this._instances.push(
                instance.level,
                ...instance.A,
                ...instance.R,
                ...instance.S
            );
        }
    }

    protected updateUniforms(camera: Camera, points: boolean): void {

        const cam_pos = transform(camera.position, this._sphere.inverseModelMatrix);
        //const cam_pos = scale(camera.position, 1 / this._sphere.radius);

        this._sphere.shader.setMat4('model', this._sphere.modelMatrix);
        this._sphere.shader.setMat4('view', camera.viewMatrix);
        this._sphere.shader.setMat4('projection', camera.projectionMatrix);

        this._sphere.shader.setVec3('cam_pos', cam_pos);
        this._sphere.shader.setBool('points', points);

        this._sphere.shader.bindUniforms();
    }

    public render(camera: Camera, mode = this.gl.TRIANGLES): void {
        //Enable this objects shader
        this._sphere.shader.use();

        // Pass transformations to the shader
        this.updateUniforms(camera, mode !== this.gl.TRIANGLES);

        //Bind Object vertex array
        this.gl.bindVertexArray(this.VAO);

        this._instances_count = this._instances.length / 10;

        //Draw the object
        this.gl.drawElementsInstanced(
            mode,
            this._indices.length,
            this.gl.UNSIGNED_INT,
            0,
            // level: float + A: vec3 + R: vec3 + S: vec3 -> 10 floats
            this._instances_count
        );

        //unbind vertex array
        this.gl.bindVertexArray(null);

        this._instances = [];
    }


    public get instancesCount(): number {
        return this._instances_count;
    }
}