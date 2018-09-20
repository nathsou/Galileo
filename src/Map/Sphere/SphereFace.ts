import Sphere from "./Sphere";
import { vec3 } from "gl-matrix";
import { lerp, normalize, sum, times, centroid, sub } from "../../Utils/Vec3Utils";
import Frustum from "../../Utils/Frustum";
import Camera from "../../Controls/Camera";
import { PatchInstance } from "./SpherePatch";

interface BoundingGeometry {
    bottom_vertices: vec3[];
    top_vertices: vec3[];
}

export default abstract class SphereFace {

    protected _indices: number[];
    protected _sphere: Sphere;
    protected _parent: SphereFace | null;
    protected _has_children = false;
    protected _children: SphereFace[] | undefined;
    protected _level: number;
    protected _centroid: vec3 | undefined;
    protected _bounding_geometry: BoundingGeometry;
    protected _patch_instance: PatchInstance;

    constructor(indices: number[], sphere: Sphere, parent: (SphereFace | null) = null) {
        this._sphere = sphere;
        this._parent = parent;
        this._indices = indices;

        this._level = parent !== null ? this._parent.level + 1 : 0;
    }

    protected abstract split(): void;


    protected intersectsFrustum(frustum: Frustum): boolean {
        return frustum.containsVolume(this.boundingGeometry.bottom_vertices) ||
            frustum.containsVolume(this.boundingGeometry.top_vertices);
    }

    protected get boundingGeometry(): BoundingGeometry {
        if (this._bounding_geometry === undefined) {
            const h = this._sphere.options.max_terrain_height / this._sphere.radius;

            const bottom_vertices = this._indices.map(v => normalize(this._sphere.vertexAt(v)));
            const top_vertices = bottom_vertices.map(v => sum(v, times(normalize(v), h)));

            this._bounding_geometry = { bottom_vertices, top_vertices };
        }

        return this._bounding_geometry;
    }

    protected isVisible(camera: Camera): boolean {
        const normal = vec3.create();
        const dir = vec3.create();
        vec3.normalize(normal, this.centroid);
        vec3.sub(dir, normal, camera.position);
        vec3.normalize(dir, dir);

        const face_culled = vec3.dot(normal, dir) < this._sphere.getFaceCullingAngle(this._level);
        if (!face_culled) return false;

        return this.intersectsFrustum(camera.frustum);
    }

    protected getMidPoint(idx1: number, idx2: number): number {

        const v1 = this._sphere.vertexAt(idx1);
        const v2 = this._sphere.vertexAt(idx2);
        const mid = lerp(v1, v2, 0.5);

        return this._sphere.addVertex(mid);
    }

    protected shouldSplit(camera: Camera): boolean {
        if (this._level >= this._sphere.options.max_lod) return false;
        const p2 = vec3.create();
        vec3.scale(p2, camera.position, 1 / this._sphere.radius);

        const dist = vec3.dist(p2, this.centroid);
        return dist < this._sphere.getSplitDistance(this._level);
    }

    protected mapToUnitSphere(u: vec3): vec3 {
        return normalize(u);
    }

    public get centroid(): vec3 {
        if (this._centroid === undefined) {
            this._centroid = this.mapToUnitSphere(
                centroid(...this._indices.map(v => this._sphere.vertexAt(v)))
            );
        }

        return this._centroid;
    }

    protected get patchInstance(): PatchInstance {
        if (this._patch_instance === undefined) {
            // A face contains at least three vertices
            // forming a basis of the plane in which it is contained
            const [A, B, C] = this._indices.slice(0, 3)
                .map(idx => this._sphere.vertexAt(idx));

            const R = sub(B, A);
            const S = sub(C, A);

            this._patch_instance = {
                level: this._level,
                A, R, S
            };
        }

        return this._patch_instance;
    }

    public updatePatchInstances(camera: Camera, instances: PatchInstance[]): void {
        if (!this.isVisible(camera)) return;

        if (this.shouldSplit(camera)) {
            this.split();

            for (let child of this._children) {
                child.updatePatchInstances(camera, instances);
            }
        } else {
            instances.push(this.patchInstance);
        }
    }

    public get level(): number {
        return this._level;
    }

    public get children(): SphereFace[] {
        return this._children;
    }

    public get hasChildren(): boolean {
        return this._has_children;
    }

}