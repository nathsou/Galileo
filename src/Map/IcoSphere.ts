import { vec3, mat4, quat } from 'gl-matrix';
import IcoSphereFace from './IcoSphereFace';
import Camera from '../Controls/Camera';
import Patch, { PatchInstance } from './Patch';
import { clamp, fill, invert } from '../Utils/MathUtils';
import { TextureInfo, Texture } from '../Utils/Texture';
import { Box } from '../Utils/Helpers';

export interface IcoSphereOptions {
    readonly center?: vec3,
    readonly radius?: number,
    readonly orientation?: quat,
    readonly max_lod?: number,
    readonly patch_levels?: number,
    readonly max_terrain_height?: number,
    readonly max_edge_size?: number,
    readonly morph_range?: number
}

export default class IcoSphere {

    private readonly options: IcoSphereOptions;
    private model_matrix: mat4;
    private inv_model_matrix: mat4;
    private vertices: number[];
    private static count = 0;
    private readonly ID = IcoSphere.count++;
    private SPLIT_DIST_LUT: number[] | undefined;
    private FACE_CULLING_ANGLES: number[] | undefined;
    private patch: Patch;
    private vertexIndexMap: Map<string, number>;
    private height_map: TextureInfo;
    private normal_map: TextureInfo;

    private static readonly icosahedron_vertices = [
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

    private faces = [
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

    constructor(gl: WebGL2RenderingContext, options: IcoSphereOptions) {

        this.options = {
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

        this.vertices = [...IcoSphere.icosahedron_vertices];
        this.computeModelMatrix();

        this.patch = new Patch(gl, this, this.options.patch_levels);
        this.vertexIndexMap = new Map<string, number>();
        this.height_map = Texture.generateHeightMap(gl, 1024, 512);
        this.normal_map = Texture.generateNormalMap(gl, this.height_map);
    }

    public init(): void {
        this.generateFaceCullingAnglesLUT();
        this.patch.init();
    }

    //FOV in radians
    public generateSplitDistancesLUT(FOV: number): void {
        let edge_size = vec3.dist(this.getVertex(0), this.getVertex(1));
        const distances: number[] = [];

        for (let level = 0; level < this.options.max_lod; level++) {
            //solve dist in (arctan(edge_size[LOD] / dist) / FOV) > max_screen_size_percentage
            const max_screen_size_percentage = this.options.max_edge_size / window.innerWidth;
            distances[level] = edge_size / Math.tan(max_screen_size_percentage * FOV);
            edge_size /= 2;
        }

        this.SPLIT_DIST_LUT = distances;
    }

    private generateFaceCullingAnglesLUT(): void {
        //angle = Math.cos((Math.PI / 2) - (Math.acos(0.5) / (2 ** this.level)))
        let angles: number[] = [];

        //take the terrain height into account
        const culling_angle = Math.acos(this.options.radius / (this.options.radius + this.options.max_terrain_height));

        let angle = Math.PI / 3 + culling_angle; //60 degrees + culling_angle
        for (let level = 0; level <= this.options.max_lod; level++) {
            angles.push(Math.sin(angle));
            angle /= 2;
        }

        this.FACE_CULLING_ANGLES = angles;
    }

    private computeModelMatrix(): void {
        this.model_matrix = mat4.create();

        mat4.fromRotationTranslationScale(
            this.model_matrix,
            this.options.orientation,
            this.options.center,
            fill(this.options.radius)
        );

        this.inv_model_matrix = invert(this.model_matrix);
    }

    public getModelMatrix(): mat4 {
        return this.model_matrix;
    }

    public getInverseModelMatrix(): mat4 {
        return this.inv_model_matrix;
    }

    public getSplitDistance(level: number): number {
        if (this.SPLIT_DIST_LUT === undefined) {
            throw new Error('call generateSplitDistanceLUT() before getSplitDistLUT()');
        }

        return this.SPLIT_DIST_LUT[level];
    }

    public getFaceCullingAngle(level: number): number {
        return this.FACE_CULLING_ANGLES[level];
    }

    public getVertex(idx: number): vec3 {
        return vec3.fromValues(
            this.vertices[idx * 3],
            this.vertices[idx * 3 + 1],
            this.vertices[idx * 3 + 2]
        );
    }

    public getRadius(): number {
        return this.options.radius;
    }

    public getAltitude(pos: vec3): number {
        return clamp(vec3.dist(pos, this.options.center) - this.options.radius, 0, Infinity);
    }

    public getNormalizedAltitude(pos: vec3): number {
        return 2 / (1 + Math.exp(-this.getAltitude(pos) / this.options.radius)) - 1;
    }

    private getVertexHash(v: vec3, digits = 5): string {
        return `${v[0].toFixed(digits)}:${v[1].toFixed(digits)}:${v[2].toFixed(digits)}`;
    }

    public addVertex(v: vec3): number {
        const hash = this.getVertexHash(v);
        if (this.vertexIndexMap.has(hash)) {
            return this.vertexIndexMap.get(hash);
        }

        this.vertices.push(...v);
        const idx = this.vertices.length / 3 - 1;
        this.vertexIndexMap.set(hash, idx);
        return idx;
    }

    public update(camera: Camera): void {

        for (let face of this.faces) {
            face.updatePatchInstances(camera);
        }

        this.patch.bindInstances();
    }

    public addPatchInstance(instance: PatchInstance): void {
        this.patch.pushInstance(instance);
    }

    public getVertices(): number[] {
        return this.vertices;
    }

    public getHeightMap(): TextureInfo {
        return this.height_map;
    }

    public getCenter(): vec3 {
        return this.options.center;
    }

    public getOptions(): IcoSphereOptions {
        return this.options;
    }

    public getBoundingBox(): Box {
        return {
            position: this.options.center,
            width: this.options.radius * 2,
            height: this.options.radius * 2,
            depth: this.options.radius * 2
        };
    }

    public getFaces(): IcoSphereFace[] {
        return this.faces;
    }

    public getID(): number {
        return this.ID;
    }

    public draw(camera: Camera, mode: number): void {
        this.patch.draw(camera, mode);
    }

}