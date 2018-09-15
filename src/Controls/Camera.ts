import { vec3, mat4, quat } from "gl-matrix";
import { sum, rotate, normalize, cross } from "../Utils/MathUtils";
import Frustum from "../Utils/Frustum";

export interface Basis {
    up: vec3;
    front: vec3;
    right: vec3;
}

export default class Camera {

    private position: vec3;
    private view_matrix: mat4;
    private proj_matrix: mat4;
    private FOV: number;
    private near: number;
    private far: number;
    private aspect: number;

    private basis: Basis;
    private orientation: quat;
    private frustum: Frustum;

    constructor(pos: vec3, FOV: number, aspect: number, near: number, far: number) {
        this.position = pos;
        this.FOV = FOV;
        this.near = near;
        this.far = far;
        this.aspect = aspect;

        this.proj_matrix = mat4.create();
        this.view_matrix = mat4.create();

        this.updateProjectionMatrix();

        this.basis = {
            up: vec3.fromValues(0, 1, 0),
            right: vec3.fromValues(1, 0, 0),
            front: vec3.fromValues(0, 0, -1)
        };

        this.orientation = quat.create();

        this.frustum = new Frustum(this);
    }

    private updateProjectionMatrix(): void {
        mat4.perspective(
            this.proj_matrix,
            this.FOV,
            this.aspect,
            this.near,
            this.far
        );
    }

    public move(delta_pos: vec3): void {
        vec3.add(this.position, this.position, delta_pos);
    }

    public lookAt(target: vec3, up: vec3): void {
        const t = sum(this.position, target);
        mat4.lookAt(this.view_matrix, this.position, t, up);
    }

    public getProjectionMatrix(): mat4 {
        return this.proj_matrix;
    }

    public getViewMatrix(): mat4 {
        return this.view_matrix;
    }

    public getPosition(): vec3 {
        return this.position;
    }

    public getFOV(): number {
        return this.FOV;
    }

    public setFOV(fov: number): void {
        this.FOV = fov;
        this.updateProjectionMatrix();
    }

    public getAspectRatio(): number {
        return this.aspect;
    }

    public setAspectRatio(aspect: number): void {
        this.aspect = aspect;
        this.updateProjectionMatrix();
    }

    public getNear(): number {
        return this.near;
    }

    public getFar(): number {
        return this.far;
    }

    public getFront(): vec3 {
        return this.basis.front;
    }

    public getOrientation(): quat {
        return this.orientation;
    }

    public setOrientation(q: quat): void {
        this.orientation.set(q);
        this.updateDirectionVectors();
    }

    //frustum methods

    public getFrustum(): Frustum {
        return this.frustum;
    }

    public updateFrustum(inv_model_matrix: mat4): void {
        this.frustum.update(inv_model_matrix);
    }

    private updateDirectionVectors(): void {
        this.basis.front = rotate([0, 0, -1], this.orientation);
        this.basis.right = rotate([1, 0, 0], this.orientation);
        this.basis.up = normalize(cross(this.basis.right, this.basis.front));
    }

    public getBasis(): Basis {
        return this.basis;
    }
}