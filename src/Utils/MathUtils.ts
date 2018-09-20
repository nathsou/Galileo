import { vec3, mat4 } from "gl-matrix";

export const degrees = (angle_radians: number): number => {
    return (angle_radians * 57.29577951308232) % 360;
}

export const radians = (angle_degrees: number): number => {
    return (angle_degrees * 0.017453292519943295) % 6.283185307179586;
}

export const clamp = (x: number, min: number, max: number): number => {
    return Math.min(Math.max(x, min), max);
}

export const total = (...nums: number[]): number =>
    nums.reduce((p, c) => p + c, 0);

export const average = (...nums: number[]): number =>
    nums.length !== 0 ? total(...nums) / nums.length : 0;


export function combineMatrices(...matrices: mat4[]): mat4 {
    const m = mat4.clone(matrices[0]);

    for (let i = 1; i < matrices.length; i++) {
        mat4.mul(m, m, matrices[i]);
    }

    return m;
}

export function invert(mat: mat4): mat4 {
    const inv = mat4.create();
    return mat4.invert(inv, mat);
}


export function randomMat4(rand_gen = () => Math.random()): mat4 {
    return new Float32Array(16).map(rand_gen) as mat4;
}


export function triangleHypotenuse(a: vec3, b: vec3, c: vec3): { from: vec3, to: vec3, other: vec3, len: number } {
    return [
        { from: a, to: b, other: c, len: vec3.dist(a, b) },
        { from: a, to: c, other: b, len: vec3.dist(a, c) },
        { from: b, to: c, other: a, len: vec3.dist(b, c) }
    ].sort((side1, side2) => side2.len - side1.len)[0];
}

export const mapIntervals = (x: number, min_A: number, max_A: number, min_B: number, max_B: number): number =>
    min_B + (x - min_A) * (max_B - min_B) / (max_A - min_A);


export const getAltitude = (pos: vec3, sphere_center: vec3, sphere_radius: number): number => {
    return clamp(vec3.dist(pos, sphere_center) - sphere_radius, 0, Infinity);
};

export const getNormalizedAltitude = (pos: vec3, sphere_center: vec3, sphere_radius: number): number => {
    return 2 / (1 + Math.exp(-this.getAltitude(pos, sphere_center, sphere_radius) / sphere_radius)) - 1;
};