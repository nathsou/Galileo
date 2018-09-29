import { mat4, quat, vec3 } from "gl-matrix";
import Camera from "../../Controls/Camera";
import Shader, { ShaderSource } from "../../Utils/Shader";
import { fill } from "../../Utils/Vec3Utils";
import { Box } from "../../Utils/Helpers";
import { invert } from "../../Utils/MathUtils";
import SphereFace from "./SphereFace";
import SpherePatch, { PatchInstance } from "./SpherePatch";
import Frustum from "../../Utils/Frustum";

export interface SphereOptions {
    center?: vec3,
    radius?: number,
    orientation?: quat,
    max_lod?: number,
    patch_levels?: number,
    max_terrain_height?: number,
    max_edge_size?: number,
    morph_range?: number
}

export default abstract class Sphere {

    private static count = 0;

    protected readonly _ID = Sphere.count++;
    protected readonly gl: WebGL2RenderingContext;
    protected _options: SphereOptions;
    protected readonly _shader: Shader;
    protected _vertices: number[];
    protected _faces: SphereFace[];
    protected readonly _vertex_index_map: Map<string, number>;
    protected _model_matrix: mat4;
    protected _inv_model_matrix: mat4;
    protected readonly _patch: SpherePatch;
    protected _first_update = true;
    protected _needs_model_mat_update = true;
    protected _bounding_box: Box | undefined;
    protected _frustum: Frustum;

    protected _SPLIT_DIST_LUT: number[] | undefined;
    protected _FACE_CULLING_ANGLES: number[] | undefined;

    constructor(
        gl: WebGL2RenderingContext,
        options: SphereOptions = {},
        shader: (Shader | ShaderSource)
    ) {
        this.gl = gl;

        this._options = {
            radius: 1,
            center: fill(0),
            orientation: quat.create(),
            max_lod: 6,
            patch_levels: 4,
            max_terrain_height: 400,
            max_edge_size: 150,
            morph_range: 0.5,
            ...options
        };

        this._vertices = this.initVertices();
        this._vertex_index_map = new Map<string, number>();
        this.computeModelMatrix();
        this._shader = shader instanceof Shader ? shader : new Shader(gl, shader);
        this._patch = this.initPatch();
    }

    protected init(camera: Camera): void {
        this._faces = this.initFaces();
        this._frustum = new Frustum(camera);
        this.updateLookUpTables(camera);
        this._patch.init();
    }

    public updateLookUpTables(camera: Camera): void {
        this.generateFaceCullingAnglesLUT();
        this.generateSplitDistancesLUT(camera.FOV);
    }

    protected computeModelMatrix(): void {
        if (this._model_matrix === undefined) {
            this._model_matrix = mat4.create();
        }

        mat4.fromRotationTranslationScale(
            this._model_matrix,
            this._options.orientation,
            this._options.center,
            fill(this._options.radius)
        );

        this._inv_model_matrix = invert(this._model_matrix);
    }

    //FOV in radians
    protected generateSplitDistancesLUT(FOV: number): void {
        let edge_size = vec3.dist(this.vertexAt(0), this.vertexAt(1));
        const distances: number[] = [];

        for (let level = 0; level < this._options.max_lod; level++) {
            //solve dist in (arctan(edge_size[LOD] / dist) / FOV) > max_screen_size_percentage
            const max_screen_size_percentage = this._options.max_edge_size / window.innerWidth;
            distances[level] = edge_size / Math.tan(max_screen_size_percentage * FOV);
            edge_size /= 2;
        }

        this._SPLIT_DIST_LUT = distances;
    }

    protected generateFaceCullingAnglesLUT(): void {
        //angle = Math.cos((Math.PI / 2) - (Math.acos(0.5) / (2 ** this.level)))
        let angles: number[] = [];

        //take the terrain height into account
        const culling_angle = Math.acos(
            this._options.radius / (this._options.radius + this._options.max_terrain_height)
        );

        let angle = Math.PI / 3 + culling_angle; //60 degrees + culling_angle
        for (let level = 0; level <= this._options.max_lod; level++) {
            angles.push(Math.sin(angle));
            angle /= 2;
        }

        this._FACE_CULLING_ANGLES = angles;
    }

    public getSplitDistances(): number[] {
        if (this._SPLIT_DIST_LUT === undefined) {
            throw new Error('call generateSplitDistanceLUT() before getSplitDistLUT()');
        }

        return this._SPLIT_DIST_LUT;
    }

    public getFaceCullingAngle(level: number): number {
        return this._FACE_CULLING_ANGLES[level];
    }

    private getVertexHash(v: vec3, digits = 5): string {
        return `${v[0].toFixed(digits)}:${v[1].toFixed(digits)}:${v[2].toFixed(digits)}`;
    }

    public addVertex(v: vec3): number {
        const hash = this.getVertexHash(v);
        if (this._vertex_index_map.has(hash)) {
            return this._vertex_index_map.get(hash);
        }

        this._vertices.push(...v);
        const idx = this._vertices.length / 3 - 1;
        this._vertex_index_map.set(hash, idx);
        return idx;
    }

    public vertexAt(idx: number): vec3 {
        return vec3.fromValues(
            this._vertices[idx * 3],
            this._vertices[idx * 3 + 1],
            this._vertices[idx * 3 + 2]
        );
    }

    public rotate(axis: vec3, radians: number): void {
        quat.setAxisAngle(this._options.orientation, axis, radians);
        this._needs_model_mat_update = true;
    }

    protected abstract initPatch(): SpherePatch;

    protected abstract initVertices(): number[];

    protected abstract initFaces(): SphereFace[];

    public updateFrustum(): void {
        this._frustum.update(this._inv_model_matrix);
    }

    public update(camera: Camera): void {

        if (this._first_update) {
            this._first_update = false;
            this.init(camera);
        }

        if (this._needs_model_mat_update) {
            this._needs_model_mat_update = false;
            this.computeModelMatrix();
        }

        const instances: PatchInstance[] = [];

        for (const face of this._faces) {
            face.updatePatchInstances(camera, instances);
        }

        this._patch.pushInstance(...instances);
        this._patch.bindInstances();
    }

    public render(camera: Camera, mode?: number): void {
        this._patch.render(camera, mode);
    }

    public get shader(): Shader {
        return this._shader;
    }

    public get radius(): number {
        return this._options.radius;
    }

    public get center(): vec3 {
        return this._options.center;
    }

    public get modelMatrix(): mat4 {
        return this._model_matrix;
    }

    public get inverseModelMatrix(): mat4 {
        return this._inv_model_matrix;
    }

    public get faces(): Readonly<SphereFace[]> {
        return this._faces;
    }

    public get faceCount(): number {
        return this._patch.instancesCount;
    }

    public get ID(): number {
        return this._ID;
    }

    public get options(): Readonly<SphereOptions> {
        return this._options;
    }

    public get frustum(): Frustum {
        return this._frustum;
    }

}