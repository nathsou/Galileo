import { patchShader } from './Shaders/PatchShader';
import { vec2, vec3 } from "gl-matrix";
import Shader from '../Utils/Shader';
import IcoSphere from './IcoSphere';
import Camera from '../Controls/Camera';
import { vec, normalize, scale } from '../Utils/MathUtils';

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
    private indices: number[];
    private vertices: number[];
    private instances: number[];
    private levels: number;
    private shader: Shader;
    private sphere: IcoSphere;

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

    constructor(gl: WebGL2RenderingContext, sphere: IcoSphere, levels: number) {
        this.gl = gl;
        this.sphere = sphere;
        this.shader = new Shader(gl, patchShader);
        this.levels = levels;
        this.instances = [];
    }

    private initUniforms(): void {
        const sp = this.sphere.getOptions();
        const light_dir = normalize(vec(1, 0.7, 0.3));

        this.shader.setFloat('morph_range', this.sphere.getOptions().morph_range);
        this.shader.setVec3('light_dir', light_dir);
        this.shader.setFloat('time', Date.now());

        this.uploadDistanceLUT();
    }

    private uploadDistanceLUT(): void {
        this.gl.useProgram(this.shader.getProgram());

        for (let i = 0; i < this.sphere.getOptions().max_lod; i++) {
            this.shader.setFloat(`distanceLUT[${i}]`, this.sphere.getSplitDistance(i));
        }
    }

    private initAttributes(): void {
        this.attributes = {
            pos: this.shader.getAttribLocation('pos'),
            morph: this.shader.getAttribLocation('morph'),
            barycentric: this.shader.getAttribLocation('barycentric'),

            level: this.shader.getAttribLocation('level'),
            A: this.shader.getAttribLocation('A'),
            R: this.shader.getAttribLocation('R'),
            S: this.shader.getAttribLocation('S')
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
        this.gl.useProgram(this.shader.getProgram());
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
        this.vertices = [];
        this.indices = [];

        let positions = [];
        let morphs = [];

        //Generate
        const m_RC = 1 + 2 ** this.levels;

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
                this.vertices.push(...pos, ...morph, ...coords[(idx++) % 3]);

                //calc index
                if (row < m_RC - 1 && column < numCols - 1) {
                    this.indices.push(rowIdx + column); //A
                    this.indices.push(nextIdx + column); //B
                    this.indices.push(1 + rowIdx + column); //C
                    if (column < numCols - 2) {
                        this.indices.push(nextIdx + column); //D
                        this.indices.push(1 + nextIdx + column); //E
                        this.indices.push(1 + rowIdx + column); //F
                    }
                }
            }
            rowIdx = nextIdx;
        }

        //Rebind
        this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.VBO);
        this.gl.bufferData(this.gl.ARRAY_BUFFER, new Float32Array(this.vertices), this.gl.DYNAMIC_DRAW);
        this.gl.bindBuffer(this.gl.ELEMENT_ARRAY_BUFFER, this.EBO);
        this.gl.bufferData(this.gl.ELEMENT_ARRAY_BUFFER, new Uint32Array(this.indices), this.gl.STATIC_DRAW);
        this.gl.bindBuffer(this.gl.ARRAY_BUFFER, null);
    }

    public bindInstances(): void {
        this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.VBO_instance);
        this.gl.bufferData(this.gl.ARRAY_BUFFER, new Float32Array(this.instances), this.gl.STATIC_DRAW);
        this.gl.bindBuffer(this.gl.ARRAY_BUFFER, null);
    }

    public pushInstance(instance: PatchInstance): void {
        this.instances.push(
            instance.level,
            ...instance.A,
            ...instance.R,
            ...instance.S
        );
    }

    private updateUniforms(camera: Camera, points: boolean): void {

        const cam_pos = scale(camera.getPosition(), 1 / this.sphere.getRadius());

        this.shader.setMat4('model', this.sphere.getModelMatrix());
        this.shader.setMat4('view', camera.getViewMatrix());
        this.shader.setMat4('projection', camera.getProjectionMatrix());

        this.shader.setVec3('cam_pos', cam_pos);
        this.shader.setBool('points', points);
        this.shader.setFloat('time', Math.sin((Date.now() / 5000) % (2 * Math.PI)));
        this.shader.setInt('height_map', 0);
        this.shader.setInt('normal_map', 1);
    }

    public draw(camera: Camera, mode: number): void {
        //Enable this objects shader
        this.shader.use();

        // Pass transformations to the shader
        this.updateUniforms(camera, mode !== this.gl.TRIANGLES);

        //Bind Object vertex array
        this.gl.bindVertexArray(this.VAO);

        //Draw the object
        this.gl.drawElementsInstanced(
            mode,
            this.indices.length,
            this.gl.UNSIGNED_INT,
            0,
            this.instances.length / 10
        );

        //unbind vertex array
        this.gl.bindVertexArray(null);

        console.log(this.instances.length);

        this.instances = [];
    }

}