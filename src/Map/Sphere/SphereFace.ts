import { vec3 } from "gl-matrix";
import Camera from "../../Controls/Camera";
import { centroid, lerp, normalize, sub, sum, times, transform } from "../../Utils/Vec3Utils";
import Sphere from "./Sphere";
import { PatchInstance } from "./SpherePatch";

interface BoundingGeometry {
    bottom_vertices: vec3[];
    top_vertices: vec3[];
}

export default abstract class SphereFace {

    protected _indices: ReadonlyArray<number>;
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

    protected intersectsFrustum(): boolean {
        return this._sphere.frustum.containsVolume(this.boundingGeometry.bottom_vertices) ||
            this._sphere.frustum.containsVolume(this.boundingGeometry.top_vertices);
    }

    public get boundingGeometry(): BoundingGeometry {
        if (this._bounding_geometry === undefined) {
            const h = (this._sphere.options.max_terrain_height / this._sphere.radius);

            const bottom_vertices = this._indices.map(v => normalize(this._sphere.vertexAt(v)));
            const top_vertices = bottom_vertices.map(v => sum(v, times(normalize(v), h)));

            this._bounding_geometry = { bottom_vertices, top_vertices };
        }

        return this._bounding_geometry;
    }

    protected isVisible(cam_pos: vec3): boolean {
        const normal = normalize(this.centroid);
        const dir = normalize(sub(normal, cam_pos));

        const face_culled = vec3.dot(normal, dir) < this._sphere.getFaceCullingAngle(this._level);
        if (!face_culled) return false;

        return this.intersectsFrustum();
    }

    protected getMidPoint(idx1: number, idx2: number): number {
        const v1 = this._sphere.vertexAt(idx1);
        const v2 = this._sphere.vertexAt(idx2);
        const mid = lerp(v1, v2, 0.5);

        return this._sphere.addVertex(mid);
    }

    protected shouldSplit(cam_pos: vec3): boolean {
        if (this._level >= this._sphere.options.max_lod) return false;

        const dist = vec3.dist(cam_pos, this.centroid);
        return dist < this._sphere.getSplitDistances()[this._level];
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
        const cam_pos = transform(camera.position, this._sphere.inverseModelMatrix);

        if (!this.isVisible(cam_pos)) return;

        if (this.shouldSplit(cam_pos)) {
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