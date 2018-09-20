import Sphere from '../Sphere';
import SphereFace from '../SphereFace';

export default class IcoSphereFace extends SphereFace {

    constructor(
        a: number,
        b: number,
        c: number,
        sphere: Sphere,
        parent: (SphereFace | null) = null
    ) {
        super([a, b, c], sphere, parent);
    }

    protected split(): void {
        if (this._has_children) return;

        const [a, b, c] = this._indices;

        const ab = this.getMidPoint(a, b);
        const bc = this.getMidPoint(b, c);
        const ac = this.getMidPoint(a, c);

        /*
        // culled way:
            new IcoSphereFace(ab, ac, a, this._sphere, this),
            new IcoSphereFace(ab, b, bc, this._sphere, this),
            new IcoSphereFace(c, ac, bc, this._sphere, this),
            new IcoSphereFace(bc, ac, ab, this._sphere, this)
        
        // proper way:
            new IcoSphereFace(a, ac, ab, this._sphere, this),
            new IcoSphereFace(bc, b, ab, this._sphere, this),
            new IcoSphereFace(bc, ac, c, this._sphere, this),
            new IcoSphereFace(bc, ac, ab, this._sphere, this)
        */

        this._children = [
            new IcoSphereFace(ab, ac, a, this._sphere, this),
            new IcoSphereFace(ab, b, bc, this._sphere, this),
            new IcoSphereFace(c, ac, bc, this._sphere, this),
            new IcoSphereFace(bc, ac, ab, this._sphere, this)
        ];

        this._has_children = true;
    }

}