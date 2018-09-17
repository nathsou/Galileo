import { vec3, mat4, quat } from "gl-matrix";
import { sum, rotate, normalize, cross } from "../Utils/Vec3Utils";
import Frustum from "../Utils/Frustum";

export interface Basis {
    up: vec3;
    front: vec3;
    right: vec3;
}

export default class Camera {

    private _position: vec3;
    private _view_matrix: mat4;
    private _proj_matrix: mat4;
    private _FOV: number;
    private _near: number;
    private _far: number;
    private _aspect: number;

    private _basis: Basis;
    private _orientation: quat;
    private _frustum: Frustum;

    constructor(pos: vec3, FOV: number, aspect: number, near: number, far: number) {
        this._position = pos;
        this._FOV = FOV;
        this._near = near;
        this._far = far;
        this._aspect = aspect;

        this._proj_matrix = mat4.create();
        this._view_matrix = mat4.create();

        this.updateProjectionMatrix();

        this._basis = {
            up: vec3.fromValues(0, 1, 0),
            right: vec3.fromValues(1, 0, 0),
            front: vec3.fromValues(0, 0, -1)
        };

        this._orientation = quat.create();

        this._frustum = new Frustum(this);
    }

    private updateProjectionMatrix(): void {
        mat4.perspective(
            this._proj_matrix,
            this._FOV,
            this._aspect,
            this._near,
            this._far
        );
    }

    public move(delta_pos: vec3): void {
        vec3.add(this._position, this._position, delta_pos);
    }

    public lookAt(target: vec3, up: vec3): void {
        const t = sum(this._position, target);
        mat4.lookAt(this._view_matrix, this._position, t, up);
    }

    public get projectionMatrix(): mat4 {
        return this._proj_matrix;
    }

    public get viewMatrix(): mat4 {
        return this._view_matrix;
    }

    public get position(): vec3 {
        return this._position;
    }

    public get FOV(): number {
        return this._FOV;
    }

    public set FOV(fov: number) {
        this._FOV = fov;
        this.updateProjectionMatrix();
    }

    public get aspectRatio(): number {
        return this._aspect;
    }

    public set aspectRatio(aspect: number) {
        this._aspect = aspect;
        this.updateProjectionMatrix();
    }

    public get near(): number {
        return this._near;
    }

    public get far(): number {
        return this._far;
    }

    public get front(): vec3 {
        return this._basis.front;
    }

    public get orientation(): quat {
        return this._orientation;
    }

    public set orientation(q: quat) {
        this._orientation.set(q);
        this.updateBasis();
    }

    //frustum methods

    public get frustum(): Frustum {
        return this._frustum;
    }

    public updateFrustum(inv_model_matrix: mat4): void {
        this._frustum.update(inv_model_matrix);
    }

    private updateBasis(): void {
        this._basis.front = rotate([0, 0, -1], this._orientation);
        this._basis.right = rotate([1, 0, 0], this._orientation);
        this._basis.up = cross(this._basis.right, this._basis.front);
    }

    public get basis(): Basis {
        return this._basis;
    }
}