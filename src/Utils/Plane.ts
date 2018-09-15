import { vec3 } from "gl-matrix";
import { normalize, sub, cross, fill } from "./MathUtils";

export class Plane {
    private point: vec3;
    private normal: vec3;
    private dist_to_origin: number;

    // a, b and c belong to the plane
    constructor(a: vec3, b: vec3, c: vec3) {
        this.point = a;
        this.normal = normalize(cross(sub(b, a), sub(c, a)));

        if (vec3.equals(this.normal, fill(0))) {
            throw new Error('Cannot construct a plane with aligned points');
        }

        this.dist_to_origin = -vec3.dot(this.point, this.normal);
    }

    // http://mathworld.wolfram.com/HessianNormalForm.html
    public distanceToPoint(point: vec3): number {
        return vec3.dot(this.normal, point) + this.dist_to_origin;
    }

    public containsPoint(p: vec3, eps = 10 ** -4): boolean {
        return Math.abs(vec3.dot(sub(p, this.point), this.normal)) < eps;
    }

    public getPoint(): vec3 {
        return this.point;
    }

    public getNormal(): vec3 {
        return this.normal;
    }
}