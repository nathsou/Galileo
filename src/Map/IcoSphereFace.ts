import { vec3 } from 'gl-matrix';
import Camera from '../Controls/Camera';
import { centroid, normalize, sub, sum, times } from '../Utils/MathUtils';
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

    private patchInstance: PatchInstance;
    private sphere: IcoSphere;
    private parent: IcoSphereFace | null;
    private has_children = false;
    private children: IcoSphereFace[] | undefined;
    private level: number;
    private centroid: vec3 | undefined;
    private bounding_prism: Prism | undefined;

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
        this.sphere = sphere;
        this.parent = parent;
        this.level = parent !== null ? this.parent.getLevel() + 1 : 0;
    }

    public getLevel(): number {
        return this.level;
    }

    public getCentroid(): vec3 {
        if (this.centroid === undefined) {
            const va = this.sphere.getVertex(this.a);
            const vb = this.sphere.getVertex(this.b);
            const vc = this.sphere.getVertex(this.c);

            const ctd = normalize(centroid(va, vb, vc));

            //vec3.scale(centroid, centroid, this.sphere.getRadius());

            this.centroid = ctd;
        }

        return this.centroid;
    }

    private getMidPoint(idx1: number, idx2: number): number {

        const v1 = this.sphere.getVertex(idx1);
        const v2 = this.sphere.getVertex(idx2);

        const mid = vec3.create();
        vec3.lerp(mid, v1, v2, 0.5);

        return this.sphere.addVertex(mid);
    }

    public getBoundingPrism(): Prism {

        if (this.bounding_prism === undefined) {
            const h = this.sphere.getOptions().max_terrain_height / this.sphere.getRadius();

            const a = normalize(this.sphere.getVertex(this.a));
            const b = normalize(this.sphere.getVertex(this.b));
            const c = normalize(this.sphere.getVertex(this.c));

            const a2 = sum(a, times(normalize(a), h));
            const b2 = sum(b, times(normalize(b), h));
            const c2 = sum(c, times(normalize(c), h));

            this.bounding_prism = {
                a1: a, b1: b, c1: c,
                a2: a2, b2: b2, c2: c2
            };
        }

        return this.bounding_prism;
    }

    private split(): void {
        if (this.has_children) return;

        const ab = this.getMidPoint(this.a, this.b);
        const bc = this.getMidPoint(this.b, this.c);
        const ac = this.getMidPoint(this.a, this.c);

        /*
        // culled way:
            new IcoSphereFace(ab, ac, this.a, this.sphere, this),
            new IcoSphereFace(ab, this.b, bc, this.sphere, this),
            new IcoSphereFace(this.c, ac, bc, this.sphere, this),
            new IcoSphereFace(bc, ac, ab, this.sphere, this)
        
        // proper way:
            new IcoSphereFace(this.a, ac, ab, this.sphere, this),
            new IcoSphereFace(bc, this.b, ab, this.sphere, this),
            new IcoSphereFace(bc, ac, this.c, this.sphere, this),
            new IcoSphereFace(bc, ac, ab, this.sphere, this)
        */

        this.children = [
            new IcoSphereFace(ab, ac, this.a, this.sphere, this),
            new IcoSphereFace(ab, this.b, bc, this.sphere, this),
            new IcoSphereFace(this.c, ac, bc, this.sphere, this),
            new IcoSphereFace(bc, ac, ab, this.sphere, this)
        ];

        this.has_children = true;
    }

    private isVisible(camera: Camera): boolean {
        const normal = vec3.create();
        const dir = vec3.create();
        vec3.normalize(normal, this.getCentroid());
        vec3.sub(dir, normal, camera.getPosition());
        vec3.normalize(dir, dir);
        const face_culled = vec3.dot(normal, dir) < this.sphere.getFaceCullingAngle(this.level);
        if (!face_culled) return false;
        const visible = camera.getFrustum().containsPrism(this.getBoundingPrism());
        return visible;
        //return true;
    }

    public hasChildren(): boolean {
        return this.has_children;
    }

    public getChildren(): IcoSphereFace[] {
        return this.children;
    }

    public shouldSplit(camera: Camera): boolean {
        //return false;
        //return this.level === 0;
        if (this.level >= this.sphere.getOptions().max_lod) return false;
        const p2 = vec3.create();
        vec3.scale(p2, camera.getPosition(), 1 / this.sphere.getRadius());

        const dist = vec3.dist(p2, this.getCentroid());
        return dist < this.sphere.getSplitDistance(this.level);
    }

    private getPatchInstance(): PatchInstance {
        if (this.patchInstance === undefined) {
            const A = this.sphere.getVertex(this.a);
            const B = this.sphere.getVertex(this.b);
            const C = this.sphere.getVertex(this.c);
            const R = sub(B, A);
            const S = sub(C, A);

            this.patchInstance = {
                level: this.level,
                A, R, S
            };
        }

        return this.patchInstance;
    }

    public updatePatchInstances(camera: Camera): void {
        if (!this.isVisible(camera)) return;

        if (this.shouldSplit(camera)) {
            this.split();

            for (let child of this.children as IcoSphereFace[]) {
                child.updatePatchInstances(camera);
            }
        } else {
            this.sphere.addPatchInstance(this.getPatchInstance());
        }
    }
}