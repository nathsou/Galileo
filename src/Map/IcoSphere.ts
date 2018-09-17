import { mat4, quat, vec3 } from 'gl-matrix';
import Camera from '../Controls/Camera';
import { Box } from '../Utils/Helpers';
import { clamp, invert } from '../Utils/MathUtils';
import { Texture, TextureInfo } from '../Utils/Texture';
import { fill } from '../Utils/Vec3Utils';
import IcoSphereFace from './IcoSphereFace';
import Patch, { PatchInstance } from './Patch';
import Sphere, { SphereOptions } from './Sphere';


export default class IcoSphere implements Sphere {

    private readonly _options: SphereOptions;
    private _model_matrix: mat4;
    private _inv_model_matrix: mat4;
    private _vertices: number[];
    private static count = 0;
    private readonly _ID = IcoSphere.count++;
    private _SPLIT_DIST_LUT: number[] | undefined;
    private _FACE_CULLING_ANGLES: number[] | undefined;
    private _patch: Patch;
    private _vertex_index_map: Map<string, number>;
    private first_update = true;
    //private normal_map: TextureInfo;

    private static readonly _icosahedron_vertices = [
        //1.0 / length(vec3(1.0, phi, 0)), phi / length(vec3(1.0, phi, 0))
        -0.5257311121191336, 0.85065080835204, 0,
        0.5257311121191336, 0.85065080835204, 0,
        -0.5257311121191336, -0.85065080835204, 0,
        0.5257311121191336, -0.85065080835204, 0,
        0, -0.5257311121191336, 0.85065080835204,
        0, 0.5257311121191336, 0.85065080835204,
        0, -0.5257311121191336, -0.85065080835204,
        0, 0.5257311121191336, -0.85065080835204,
        0.85065080835204, 0, -0.5257311121191336,
        0.85065080835204, 0, 0.5257311121191336,
        -0.85065080835204, 0, -0.5257311121191336,
        -0.85065080835204, 0, 0.5257311121191336
    ];

    private _faces = [
        new IcoSphereFace(0, 11, 5, this),
        new IcoSphereFace(0, 5, 1, this),
        new IcoSphereFace(0, 1, 7, this),
        new IcoSphereFace(0, 7, 10, this),
        new IcoSphereFace(0, 10, 11, this),

        new IcoSphereFace(1, 5, 9, this),
        new IcoSphereFace(5, 11, 4, this),
        new IcoSphereFace(11, 10, 2, this),
        new IcoSphereFace(10, 7, 6, this),
        new IcoSphereFace(7, 1, 8, this),

        new IcoSphereFace(3, 9, 4, this),
        new IcoSphereFace(3, 4, 2, this),
        new IcoSphereFace(3, 2, 6, this),
        new IcoSphereFace(3, 6, 8, this),
        new IcoSphereFace(3, 8, 9, this),

        new IcoSphereFace(4, 9, 5, this),
        new IcoSphereFace(2, 4, 11, this),
        new IcoSphereFace(6, 2, 10, this),
        new IcoSphereFace(8, 6, 7, this),
        new IcoSphereFace(9, 8, 1, this)
    ];

    constructor(gl: WebGL2RenderingContext, options: SphereOptions = {}) {

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

        this._vertices = [...IcoSphere._icosahedron_vertices];
        this.computeModelMatrix();

        this._patch = new Patch(gl, this);
        this._vertex_index_map = new Map<string, number>();

        if (this._options.height_map === undefined) {
            //this._options.height_map = Texture.generateColorMap(gl, height_map);
            this._options.height_map = Texture.generateHeightMap(gl, 1024, 512);
            //this.options.height_map = Texture.generatePlainColorTexture(gl, 1024, 512, colors.cyan);
            //this.normal_map = Texture.generateNormalMap(gl, this.options.height_map);
        }
    }


    private init(camera: Camera): void {
        this.updateLookUpTables(camera);
        this._patch.init();
    }

    public updateLookUpTables(camera: Camera): void {
        this.generateFaceCullingAnglesLUT();
        this.generateSplitDistancesLUT(camera.FOV);
    }

    //FOV in radians
    private generateSplitDistancesLUT(FOV: number): void {
        let edge_size = vec3.dist(this.getVertex(0), this.getVertex(1));
        const distances: number[] = [];

        for (let level = 0; level < this._options.max_lod; level++) {
            //solve dist in (arctan(edge_size[LOD] / dist) / FOV) > max_screen_size_percentage
            const max_screen_size_percentage = this._options.max_edge_size / window.innerWidth;
            distances[level] = edge_size / Math.tan(max_screen_size_percentage * FOV);
            edge_size /= 2;
        }

        this._SPLIT_DIST_LUT = distances;
    }

    private generateFaceCullingAnglesLUT(): void {
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

    private computeModelMatrix(): void {
        this._model_matrix = mat4.create();

        mat4.fromRotationTranslationScale(
            this._model_matrix,
            this._options.orientation,
            this._options.center,
            fill(this._options.radius)
        );

        this._inv_model_matrix = invert(this._model_matrix);
    }


    public update(camera: Camera): void {

        if (this.first_update) {
            this.first_update = false;
            this.init(camera);
        }

        for (let face of this.faces) {
            face.updatePatchInstances(camera);
        }

        this.patch.bindInstances();
    }

    public render(camera: Camera, mode?: number): void {
        this.patch.render(camera, mode);
    }

    public addPatchInstance(instance: PatchInstance): void {
        this.patch.pushInstance(instance);
    }

    public get vertices(): number[] {
        return this._vertices;
    }

    public get modelMatrix(): mat4 {
        return this._model_matrix;
    }

    public get inverseModelMatrix(): mat4 {
        return this._inv_model_matrix;
    }

    public getSplitDistance(level: number): number {
        if (this._SPLIT_DIST_LUT === undefined) {
            throw new Error('call generateSplitDistanceLUT() before getSplitDistLUT()');
        }

        return this._SPLIT_DIST_LUT[level];
    }

    public getFaceCullingAngle(level: number): number {
        return this._FACE_CULLING_ANGLES[level];
    }

    public getVertex(idx: number): vec3 {
        return vec3.fromValues(
            this._vertices[idx * 3],
            this._vertices[idx * 3 + 1],
            this._vertices[idx * 3 + 2]
        );
    }

    public get radius(): number {
        return this._options.radius;
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

    public get heightMap(): TextureInfo {
        return this._options.height_map;
    }

    public get center(): vec3 {
        return this._options.center;
    }

    public get options(): SphereOptions {
        return this._options;
    }

    public get boundingBox(): Box {
        return {
            position: this._options.center,
            width: this._options.radius * 2,
            height: this._options.radius * 2,
            depth: this._options.radius * 2
        };
    }

    public get faces(): IcoSphereFace[] {
        return this._faces;
    }

    public get patch(): Patch {
        return this._patch;
    }

    public get ID(): number {
        return this._ID;
    }

}