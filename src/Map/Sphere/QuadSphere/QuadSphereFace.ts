import { vec3 } from "gl-matrix";
import Sphere from "../Sphere";
import SphereFace from "../SphereFace";

export default class QuadSphereFace extends SphereFace {

    constructor(
        a: number,
        b: number,
        c: number,
        d: number,
        sphere: Sphere,
        parent: (SphereFace | null) = null
    ) {
        // vectors ab and ad describe a basis of the face's plane
        super([a, b, d, c], sphere, parent);
    }

    protected mapToUnitSphere(u: vec3): vec3 {
        return u;
    }

    protected split(): void {
        if (this._has_children) return;

        const [a, b, d, c] = this._indices;

        const ab = this.getMidPoint(a, b);
        const bc = this.getMidPoint(b, c);
        const cd = this.getMidPoint(c, d);
        const ad = this.getMidPoint(a, d);

        const ac = this._sphere.addVertex(this.centroid);

        this._children = [
            new QuadSphereFace(a, ab, ac, ad, this._sphere, this),
            new QuadSphereFace(ab, b, bc, ac, this._sphere, this),
            new QuadSphereFace(ac, bc, c, cd, this._sphere, this),
            new QuadSphereFace(ad, ac, cd, d, this._sphere, this)
        ];

        this._has_children = true;
    }

}  