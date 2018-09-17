import { vec3 } from 'gl-matrix';
import Camera from '../Controls/Camera';
import { centroid, normalize, sub, sum, times } from '../Utils/Vec3Utils';
import IcoSphere from './IcoSphere';
import { PatchInstance } from './Patch';

export interface Prism {
    [key: string]: vec3;
    a1: vec3;
    b1: vec3;
    c1: vec3;
    a2: vec3;
    b2: vec3;
    c2: vec3;
}

export default class IcoSphereFace {

    //indices of the vertices of the face
    private a: number;
    private b: number;
    private c: number;

    private _patchInstance: PatchInstance;
    private _sphere: IcoSphere;
    private _parent: IcoSphereFace | null;
    private _has_children = false;
    private _children: IcoSphereFace[] | undefined;
    private _level: number;
    private _centroid: vec3 | undefined;
    private _bounding_prism: Prism | undefined;

    constructor(
        a: number,
        b: number,
        c: number,
        sphere: IcoSphere,
        parent: (IcoSphereFace | null) = null
    ) {
        this.a = a;
        this.b = b;
        this.c = c;
        this._sphere = sphere;
        this._parent = parent;
        this._level = parent !== null ? this._parent.level + 1 : 0;
    }

    public get level(): number {
        return this._level;
    }

    public get centroid(): vec3 {
        if (this._centroid === undefined) {
            this._centroid = normalize(
                centroid(
                    ...[this.a, this.b, this.c].map(v => this._sphere.getVertex(v))
                )
            );
        }

        return this._centroid;
    }

    private getMidPoint(idx1: number, idx2: number): number {

        const v1 = this._sphere.getVertex(idx1);
        const v2 = this._sphere.getVertex(idx2);

        const mid = vec3.create();
        vec3.lerp(mid, v1, v2, 0.5);

        return this._sphere.addVertex(mid);
    }

    public get boundingPrism(): Prism {

        if (this._bounding_prism === undefined) {
            const h = this._sphere.options.max_terrain_height / this._sphere.radius;

            const [a1, b1, c1] = [this.a, this.b, this.c]
                .map(v => normalize(this._sphere.getVertex(v)));

            const [a2, b2, c2] = [a1, b1, c1].map(v => sum(v, times(normalize(v), h)));

            this._bounding_prism = { a1, b1, c1, a2, b2, c2 };
        }

        return this._bounding_prism;
    }

    private split(): void {
        if (this._has_children) return;

        const ab = this.getMidPoint(this.a, this.b);
        const bc = this.getMidPoint(this.b, this.c);
        const ac = this.getMidPoint(this.a, this.c);

        /*
        // culled way:
            new IcoSphereFace(ab, ac, this.a, this._sphere, this),
            new IcoSphereFace(ab, this.b, bc, this._sphere, this),
            new IcoSphereFace(this.c, ac, bc, this._sphere, this),
            new IcoSphereFace(bc, ac, ab, this._sphere, this)
        
        // proper way:
            new IcoSphereFace(this.a, ac, ab, this._sphere, this),
            new IcoSphereFace(bc, this.b, ab, this._sphere, this),
            new IcoSphereFace(bc, ac, this.c, this._sphere, this),
            new IcoSphereFace(bc, ac, ab, this._sphere, this)
        */

        this._children = [
            new IcoSphereFace(ab, ac, this.a, this._sphere, this),
            new IcoSphereFace(ab, this.b, bc, this._sphere, this),
            new IcoSphereFace(this.c, ac, bc, this._sphere, this),
            new IcoSphereFace(bc, ac, ab, this._sphere, this)
        ];

        this._has_children = true;
    }

    private isVisible(camera: Camera): boolean {
        const normal = vec3.create();
        const dir = vec3.create();
        vec3.normalize(normal, this.centroid);
        vec3.sub(dir, normal, camera.position);
        vec3.normalize(dir, dir);

        const face_culled = vec3.dot(normal, dir) < this._sphere.getFaceCullingAngle(this._level);
        if (!face_culled) return false;
        return camera.frustum.containsPrism(this.boundingPrism);
    }

    public hasChildren(): boolean {
        return this._has_children;
    }

    public get children(): IcoSphereFace[] {
        return this._children;
    }

    public shouldSplit(camera: Camera): boolean {
        //return false;
        //return this._level === 0;
        if (this._level >= this._sphere.options.max_lod) return false;
        const p2 = vec3.create();
        vec3.scale(p2, camera.position, 1 / this._sphere.radius);

        const dist = vec3.dist(p2, this.centroid);
        return dist < this._sphere.getSplitDistance(this._level);
    }

    private get patchInstance(): PatchInstance {
        if (this._patchInstance === undefined) {
            const A = this._sphere.getVertex(this.a);
            const B = this._sphere.getVertex(this.b);
            const C = this._sphere.getVertex(this.c);
            const R = sub(B, A);
            const S = sub(C, A);

            this._patchInstance = {
                level: this._level,
                A, R, S
            };
        }

        return this._patchInstance;
    }

    public updatePatchInstances(camera: Camera): void {
        if (!this.isVisible(camera)) return;

        if (this.shouldSplit(camera)) {
            this.split();

            for (let child of this._children as IcoSphereFace[]) {
                child.updatePatchInstances(camera);
            }
        } else {
            this._sphere.addPatchInstance(this.patchInstance);
        }
    }
}