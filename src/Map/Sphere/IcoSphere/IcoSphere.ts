import Sphere from '../Sphere';
import IcoSphereFace from './IcoSphereFace';
import IcoSpherePatch from './IcoSpherePatch';


export default class IcoSphere extends Sphere {

    private static readonly icosahedron_vertices = [
        //1.0 / length(vec3(1.0, phi, 0)), phi / length(vec3(1.0, phi, 0))
        -0.5257311121191336, 0.85065080835204, 0,
        0.5257311121191336, 0.85065080835204, 0,
        -0.5257311121191336, -0.85065080835204, 0,
        0.5257311121191336, -0.85065080835204, 0,
        0, -0.5257311121191336, 0.85065080835204,
        0, 0.5257311121191336, 0.85065080835204,
        0, -0.5257311121191336, -0.85065080835204,
        0, 0.5257311121191336, -0.85065080835204,
        0.85065080835204, 0, -0.5257311121191336,
        0.85065080835204, 0, 0.5257311121191336,
        -0.85065080835204, 0, -0.5257311121191336,
        -0.85065080835204, 0, 0.5257311121191336
    ];

    protected initPatch(): IcoSpherePatch {
        return new IcoSpherePatch(this.gl, this);
    }

    protected initVertices(): number[] {
        return [...IcoSphere.icosahedron_vertices];
    }

    protected initFaces(): IcoSphereFace[] {
        return [
            new IcoSphereFace(0, 11, 5, this),
            new IcoSphereFace(0, 5, 1, this),
            new IcoSphereFace(0, 1, 7, this),
            new IcoSphereFace(0, 7, 10, this),
            new IcoSphereFace(0, 10, 11, this),

            new IcoSphereFace(1, 5, 9, this),
            new IcoSphereFace(5, 11, 4, this),
            new IcoSphereFace(11, 10, 2, this),
            new IcoSphereFace(10, 7, 6, this),
            new IcoSphereFace(7, 1, 8, this),

            new IcoSphereFace(3, 9, 4, this),
            new IcoSphereFace(3, 4, 2, this),
            new IcoSphereFace(3, 2, 6, this),
            new IcoSphereFace(3, 6, 8, this),
            new IcoSphereFace(3, 8, 9, this),

            new IcoSphereFace(4, 9, 5, this),
            new IcoSphereFace(2, 4, 11, this),
            new IcoSphereFace(6, 2, 10, this),
            new IcoSphereFace(8, 6, 7, this),
            new IcoSphereFace(9, 8, 1, this)
        ];
    }

}