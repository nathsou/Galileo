import { patchShader } from './Shaders/PatchShader';
import { vec2, vec3 } from "gl-matrix";
import Shader from '../Utils/Shader';
import IcoSphere from './IcoSphere';
import Camera from '../Controls/Camera';
import { vec, normalize, scale } from '../Utils/Vec3Utils';

export interface PatchVertex {
    position: vec2;
    morph: vec2;
    barycentric: vec3;
}

export interface PatchInstance { //of a triangle ABC
    level: number;
    A: vec3;
    R: vec3; // R = B - A
    S: vec3; // S = C - A
}

export default class Patch {

    private gl: WebGL2RenderingContext;
    private _indices: number[];
    private _vertices: number[];
    private _instances: number[];
    private _levels: number;
    private _shader: Shader;
    private _sphere: IcoSphere;
    private _instances_count: number;

    private attributes: {
        pos: number,
        morph: number,
        barycentric: number,

        level: number,
        A: number,
        R: number,
        S: number
    };

    private VAO: WebGLVertexArrayObject;
    private VBO: WebGLBuffer
    private EBO: WebGLBuffer;
    private VBO_instance: WebGLBuffer;

    constructor(gl: WebGL2RenderingContext, sphere: IcoSphere) {
        this.gl = gl;
        this._sphere = sphere;
        this._shader = new Shader(gl, patchShader);
        this._levels = sphere.options.patch_levels;
        this._instances = [];

        this._shader.attachTexture('height_map', 0);
        this._shader.attachTexture('color_map', 1);
        this._shader.attachTexture('normal_map', 2);
    }

    private initUniforms(): void {
        const light_dir = normalize(vec(1, 0.7, 0.3));

        this._shader.setFloat('morph_range', this._sphere.options.morph_range);
        this._shader.setVec3('light_dir', light_dir);

        this.uploadDistanceLUT();
    }

    private uploadDistanceLUT(): void {
        this.gl.useProgram(this._shader.program);

        for (let i = 0; i < this._sphere.options.max_lod; i++) {
            this._shader.setFloat(`distanceLUT[${i}]`, this._sphere.getSplitDistance(i));
        }
    }

    private initAttributes(): void {
        this.attributes = {
            pos: this._shader.getAttribLocation('pos'),
            morph: this._shader.getAttribLocation('morph'),
            barycentric: this._shader.getAttribLocation('barycentric'),

            level: this._shader.getAttribLocation('level'),
            A: this._shader.getAttribLocation('A'),
            R: this._shader.getAttribLocation('R'),
            S: this._shader.getAttribLocation('S')
        }
    }

    private initBuffers(): void {
        this.VAO = this.gl.createVertexArray();
        this.VBO = this.gl.createBuffer();
        this.EBO = this.gl.createBuffer();
        this.VBO_instance = this.gl.createBuffer();

        this.gl.bindVertexArray(this.VAO);
        this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.VBO);

        this.gl.enableVertexAttribArray(this.attributes.pos);
        this.gl.enableVertexAttribArray(this.attributes.morph);
        this.gl.enableVertexAttribArray(this.attributes.barycentric);

        this.gl.vertexAttribPointer(this.attributes.pos, 2, this.gl.FLOAT, false, 7 * 4, 0 * 4);
        this.gl.vertexAttribPointer(this.attributes.morph, 2, this.gl.FLOAT, false, 7 * 4, 2 * 4);
        this.gl.vertexAttribPointer(this.attributes.barycentric, 3, this.gl.FLOAT, false, 7 * 4, 4 * 4);
    }

    public init(): void {

        //Shader init
        this._shader.use();
        this.gl.enable(this.gl.DEPTH_TEST);
        this.gl.enable(this.gl.CULL_FACE);

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

    // http://robert-lindner.com/blog/planet-renderer-week-5-6/
    public generateGeometry(): void {

        const coords = [
            [1, 0, 0],
            [0, 1, 0],
            [0, 0, 1]
        ];

        let idx = 0;

        //clear
        this._vertices = [];
        this._indices = [];

        let positions = [];
        let morphs = [];

        //Generate
        const m_RC = 1 + 2 ** this._levels;

        const delta = 1 / (m_RC - 1);

        let rowIdx = 0;
        let nextIdx = 0;

        for (let row = 0; row < m_RC; row++) {
            const numCols = m_RC - row;
            nextIdx += numCols;
            for (let column = 0; column < numCols; column++) {
                //calc position
                const pos = [
                    column / (m_RC - 1),
                    row / (m_RC - 1)
                ];

                //calc morph
                const morph = [0, 0];
                if (row % 2 == 0) {
                    if (column % 2 == 1) {
                        morph[0] = -delta;
                        morph[1] = 0;
                    }
                } else {
                    if (column % 2 == 0) {
                        morph[0] = 0;
                        morph[1] = delta;
                    } else {
                        morph[0] = delta;
                        morph[1] = -delta;
                    }
                }

                //create vertex
                positions.push(...pos);
                morphs.push(...morph);
                this._vertices.push(...pos, ...morph, ...coords[(idx++) % 3]);

                //calc index
                if (row < m_RC - 1 && column < numCols - 1) {
                    this._indices.push(rowIdx + column); //A
                    this._indices.push(nextIdx + column); //B
                    this._indices.push(1 + rowIdx + column); //C
                    if (column < numCols - 2) {
                        this._indices.push(nextIdx + column); //D
                        this._indices.push(1 + nextIdx + column); //E
                        this._indices.push(1 + rowIdx + column); //F
                    }
                }
            }
            rowIdx = nextIdx;
        }

        //Rebind
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

    public pushInstance(instance: PatchInstance): void {
        this._instances.push(
            instance.level,
            ...instance.A,
            ...instance.R,
            ...instance.S
        );
    }

    private updateUniforms(camera: Camera, points: boolean): void {

        const cam_pos = scale(camera.position, 1 / this._sphere.radius);

        this._shader.setMat4('model', this._sphere.modelMatrix);
        this._shader.setMat4('view', camera.viewMatrix);
        this._shader.setMat4('projection', camera.projectionMatrix);

        this._shader.setVec3('cam_pos', cam_pos);
        this._shader.setBool('points', points);
        this._shader.setFloat('time', Math.sin((Date.now() / 5000) % (2 * Math.PI)));

        this._shader.bindTextures();
    }

    public render(camera: Camera, mode = this.gl.TRIANGLES): void {
        //Enable this objects shader
        this._shader.use();

        // Pass transformations to the shader
        this.updateUniforms(camera, mode !== this.gl.TRIANGLES);

        //Bind Object vertex array
        this.gl.bindVertexArray(this.VAO);

        //Draw the object
        this.gl.drawElementsInstanced(
            mode,
            this._indices.length,
            this.gl.UNSIGNED_INT,
            0,
            this._instances.length / 10
        );

        //unbind vertex array
        this.gl.bindVertexArray(null);

        this._instances_count = this._instances.length;
        this._instances = [];
    }


    public get instancesCount(): number {
        return this._instances_count;
    }

}