import { vec3 } from "gl-matrix";
import { normalize, sub, cross, fill } from "./Vec3Utils";

export class Plane {
    private _point: vec3;
    private _normal: vec3;
    private _dist_to_origin: number;

    // a, b and c belong to the plane
    constructor(a: vec3, b: vec3, c: vec3) {
        this._point = a;
        this._normal = normalize(cross(sub(b, a), sub(c, a)));

        if (vec3.equals(this._normal, fill(0))) {
            throw new Error('Cannot construct a plane with aligned points');
        }

        this._dist_to_origin = -vec3.dot(this._point, this._normal);
    }

    // http://mathworld.wolfram.com/HessianNormalForm.html
    public distanceToPoint(point: vec3): number {
        return vec3.dot(this._normal, point) + this._dist_to_origin;
    }

    public containsPoint(p: vec3, eps = 10 ** -4): boolean {
        return Math.abs(vec3.dot(sub(p, this._point), this._normal)) < eps;
    }

    public get point(): vec3 {
        return this._point;
    }

    public get normal(): vec3 {
        return this._normal;
    }
}