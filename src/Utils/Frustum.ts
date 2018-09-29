import { mat4, vec3 } from "gl-matrix";
import Camera from "../Controls/Camera";
import { createLines, Line } from "./Helpers";
import { radians, invert } from "./MathUtils";
import { Plane } from "./Plane";
import { sum, times, transform, scale } from "./Vec3Utils";

export default class Frustum {

    private _camera: Camera;
    private _planes: Plane[];

    private debug_lines: Line[];

    constructor(camera: Camera) {
        this._camera = camera;
        this._planes = [];
    }

    public update(inverse_model_matrix: mat4): void {
        // invert the world matrix to prevent having
        // to transform each vertex in world coordinates
        const world_inv = inverse_model_matrix;

        //TODO: Fix frustum culling
        const normHalfWidth = Math.tan(this._camera.FOV);
        // const normHalfWidth = Math.tan(radians(25));
        const aspectRatio = this._camera.aspectRatio;

        //calculate width and height for near and far plane
        const nearHW = normHalfWidth * this._camera.near;
        const nearHH = nearHW / aspectRatio;
        const farHW = normHalfWidth * this._camera.far;
        const farHH = farHW / aspectRatio;

        const basis = this._camera.basis;
        const pos = this._camera.position;

        //calculate near and far plane centers
        const far_center = sum(pos, times(basis.front, this._camera.far));
        const near_center = sum(pos, times(basis.front, this._camera.near));

        //construct corners of the near plane in the culled objects world space
        const na = transform(sum(near_center, times(basis.up, nearHH), times(basis.right, -nearHW)), world_inv);
        const nb = transform(sum(near_center, times(basis.up, nearHH), times(basis.right, nearHW)), world_inv);
        const nc = transform(sum(near_center, times(basis.up, -nearHH), times(basis.right, -nearHW)), world_inv);
        const nd = transform(sum(near_center, times(basis.up, -nearHH), times(basis.right, nearHW)), world_inv);

        const fa = transform(sum(far_center, times(basis.up, farHH), times(basis.right, -farHW)), world_inv);
        const fb = transform(sum(far_center, times(basis.up, farHH), times(basis.right, farHW)), world_inv);
        const fc = transform(sum(far_center, times(basis.up, -farHH), times(basis.right, -farHW)), world_inv);
        const fd = transform(sum(far_center, times(basis.up, -farHH), times(basis.right, farHW)), world_inv);

        //winding in an outside perspective so the cross product creates normals pointing inward
        this._planes = [
            new Plane(na, nb, nc),//Near
            new Plane(fb, fa, fd),//Far Maybe skip this step? most polys further away should already be low res
            new Plane(fa, na, fc),//Left
            new Plane(nb, fb, nd),//Right
            new Plane(fa, fb, na),//Top
            new Plane(nc, nd, fc)//Bottom
        ];

        //update the list of corners for debug drawing
        this.debug_lines = createLines([
            fa, fb,
            fd, fb,
            fd, fc,
            fa, fc,

            na, nb,
            nd, nb,
            nd, nc,
            na, nc,

            na, fa,
            nb, fb,
            nc, fc,
            nd, fd
        ]);
    }

    public get planes(): Plane[] {
        return this._planes;
    }

    public containsPoint(point: vec3): boolean {

        for (let plane of this._planes) {
            if (plane.distanceToPoint(point) < 0) return false;
        }

        return true;

        //return this.planes.every((p: Plane) => p.distanceToPoint(point) >= 0);
    }

    public containsTriangle(a: vec3, b: vec3, c: vec3): boolean {
        for (const plane of this._planes) {
            if (plane.distanceToPoint(a) < 0 &&
                plane.distanceToPoint(b) < 0 &&
                plane.distanceToPoint(c) < 0
            ) {
                return false;
            }
        }

        return true;
    }

    public containsRectangle(a: vec3, b: vec3, c: vec3, d: vec3): boolean {
        for (const plane of this._planes) {
            if (plane.distanceToPoint(a) < 0 &&
                plane.distanceToPoint(b) < 0 &&
                plane.distanceToPoint(c) < 0 &&
                plane.distanceToPoint(d) < 0
            ) {
                return false;
            }
        }

        return true;
    }


    /**
     * Returns whether the volume described by its vertices is contained in the frustum
     *
     * @param {vec3[]} vertices
     * @returns {boolean}
     * @memberof Frustum
     */
    public containsVolume(vertices: vec3[]): boolean {
        for (const plane of this._planes) {
            if (vertices.every(v => plane.distanceToPoint(v) < 0)) {
                return false;
            }
        }

        return true;
    }

    public getDebugLines(): Line[] {
        return this.debug_lines;
    }
}