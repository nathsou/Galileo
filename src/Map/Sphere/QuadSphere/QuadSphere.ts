import Sphere from "../Sphere";
import QuadSphereFace from "./QuadSphereFace";
import QuadSpherePatch from "./QuadSpherePatch";

export default class QuadSphere extends Sphere {

    private static readonly cube_vertices = [
        // back
        -1, -1, -1,
        1, -1, -1,
        1, 1, -1,
        -1, 1, -1,

        // front
        -1, -1, 1,
        -1, 1, 1,
        1, 1, 1,
        1, -1, 1,

        // left
        -1, -1, -1,
        -1, 1, -1,
        -1, 1, 1,
        -1, -1, 1,

        // right
        1, -1, -1,
        1, -1, 1,
        1, 1, 1,
        1, 1, -1,

        // top
        -1, 1, -1,
        1, 1, -1,
        1, 1, 1,
        -1, 1, 1,

        // bottom
        -1, -1, -1,
        -1, -1, 1,
        1, -1, 1,
        1, -1, -1
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
            new QuadSphereFace(8, 9, 10, 11, this),
            new QuadSphereFace(12, 13, 14, 15, this),
            new QuadSphereFace(16, 17, 18, 19, this),
            new QuadSphereFace(20, 21, 22, 23, this)
        ];
    }

}