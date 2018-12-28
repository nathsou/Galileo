import Sphere from "../Sphere";
import QuadSphereFace from "./QuadSphereFace";
import QuadSpherePatch from "./QuadSpherePatch";

export default class QuadSphere extends Sphere {

    private static readonly cube_vertices = [
        -1, -1, -1,
        1, -1, -1,
        1, 1, -1,
        -1, 1, -1,
        -1, -1, 1,
        -1, 1, 1,
        1, 1, 1,
        1, -1, 1
    ];

    protected initPatch(): QuadSpherePatch {
        return new QuadSpherePatch(this.gl, this);
    }

    protected initVertices(): number[] {
        return [...QuadSphere.cube_vertices];
    }

    protected initFaces(): QuadSphereFace[] {
        return [
            new QuadSphereFace(0, 1, 2, 3, this),
            new QuadSphereFace(4, 5, 6, 7, this),
            new QuadSphereFace(0, 3, 5, 4, this),
            new QuadSphereFace(1, 7, 6, 2, this),
            new QuadSphereFace(3, 2, 6, 5, this),
            new QuadSphereFace(0, 4, 7, 1, this)
        ];
    }

}