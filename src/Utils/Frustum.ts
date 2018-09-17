import { vec3, mat4 } from "gl-matrix";
import Camera from "../Controls/Camera";
import { radians } from "./MathUtils";
import { sum, times, transform } from "./Vec3Utils";
import { Plane } from "./Plane";
import { Line, createLines } from "./Helpers";
import { Prism } from "../Map/IcoSphereFace";

export default class Frustum {

    private camera: Camera;
    private planes: Plane[];

    private debug_lines: Line[];

    constructor(camera: Camera) {
        this.camera = camera;
        this.planes = [];
    }

    public update(inverse_model_matrix: mat4): void {
        // invert the world matrix to prevent having
        // to transform each vertex in world coordinates
        const world_inv = inverse_model_matrix;

        //TODO: Fix frustum culling
        const normHalfWidth = Math.tan(this.camera.FOV); //+ radians(20));
        //const normHalfWidth = Math.tan(radians(25));
        const aspectRatio = this.camera.aspectRatio;

        //calculate width and height for near and far plane
        const nearHW = normHalfWidth * this.camera.near;
        const nearHH = nearHW / aspectRatio;
        const farHW = normHalfWidth * this.camera.far * 0.5;
        const farHH = farHW / aspectRatio;

        const basis = this.camera.basis;

        //calculate near and far plane centers
        const fCenter = sum(this.camera.position, times(basis.front, this.camera.far * 0.5));
        const nCenter = sum(this.camera.position, times(basis.front, this.camera.near));

        //construct corners of the near plane in the culled objects world space
        const na = transform(sum(nCenter, times(basis.up, nearHH), times(basis.right, -nearHW)), world_inv);
        const nb = transform(sum(nCenter, times(basis.up, nearHH), times(basis.right, nearHW)), world_inv);
        const nc = transform(sum(nCenter, times(basis.up, -nearHH), times(basis.right, -nearHW)), world_inv);
        const nd = transform(sum(nCenter, times(basis.up, -nearHH), times(basis.right, nearHW)), world_inv);

        const fa = transform(sum(fCenter, times(basis.up, farHH), times(basis.right, -farHW)), world_inv);
        const fb = transform(sum(fCenter, times(basis.up, farHH), times(basis.right, farHW)), world_inv);
        const fc = transform(sum(fCenter, times(basis.up, -farHH), times(basis.right, -farHW)), world_inv);
        const fd = transform(sum(fCenter, times(basis.up, -farHH), times(basis.right, farHW)), world_inv);

        //winding in an outside perspective so the cross product creates normals pointing inward
        this.planes = [
            new Plane(na, nb, nc),//Near
            new Plane(fb, fa, fd),//Far Maybe skip this step? most polys further away should already be low res
            new Plane(fa, na, fc),//Left
            new Plane(nb, fb, nd),//Right
            new Plane(fa, fb, na),//Top
            new Plane(nc, nd, fc)//Bottom
        ];

        //update the list of corners for debug drawing
        this.debug_lines = createLines([
            na, nb,
            nd, nb,
            nd, nc,
            na, nc,

            fa, fb,
            fd, fb,
            fd, fc,
            fa, fc,

            na, fa,
            nb, fb,
            nc, fc,
            nd, fd
        ]);
    }

    public getPlanes(): Plane[] {
        return this.planes;
    }

    public containsPoint(point: vec3): boolean {

        for (let plane of this.planes) {
            if (plane.distanceToPoint(point) < 0) return false;
        }

        return true;

        //return this.planes.every((p: Plane) => p.distanceToPoint(point) >= 0);
    }

    public containsTriangle(a: vec3, b: vec3, c: vec3): boolean {
        for (const plane of this.planes) {
            if (plane.distanceToPoint(a) < 0 &&
                plane.distanceToPoint(b) < 0 &&
                plane.distanceToPoint(c) < 0
            ) {
                return false;
            }
        }

        return true;
    }

    public containsPrism(prism: Prism): boolean {
        return this.containsTriangle(prism.a1, prism.b1, prism.c1) ||
            this.containsTriangle(prism.a2, prism.b2, prism.c2);
    }

    public getDebugLines(): Line[] {
        return this.debug_lines;
    }
}