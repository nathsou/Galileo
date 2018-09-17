import { vec3, vec4, mat4, quat } from "gl-matrix";

// Math utils manipulating vec3s (or number arrays of length 3)

export type Vec3Like = vec3 | number[] | Float32Array;

export function vec(a: number, b: number, c: number): vec3 {
    return vec3.fromValues(a, b, c);
}

export function fill(n: number): vec3 {
    return vec3.fromValues(n, n, n);
}

export function sum(...vecs: Vec3Like[]): vec3 {
    return vecs.reduce((prev: vec3, curr: vec3) => vec3.add(prev, prev, curr), fill(0)) as vec3;
}

export function prod(...vecs: Vec3Like[]): vec3 {
    return vecs.reduce((prev: vec3, curr: vec3) => vec3.mul(prev, prev, curr), fill(1)) as vec3;
}

export function div(a: vec3, b: vec3): vec3 {
    const out = vec3.create();
    return vec3.div(out, a, b);
}

export function sub(a: vec3, b: vec3): vec3 {
    const out = vec3.create();
    return vec3.sub(out, a, b);
}

export function times(vec: vec3, k: number): vec3 {
    return prod(vec, [k, k, k]);
}

//alias
export const scale = times;

export function centroid(...points: vec3[]): vec3 {
    return scale(sum(...points), 1 / points.length);
}

export function normalize(v: vec3): vec3 {
    const n = vec3.create();
    vec3.normalize(n, v);
    return n;
}

export function vec3FromVec4(v: vec4): vec3 {
    return vec3.fromValues(v[0], v[1], v[2]);
}

export function transform(vec: vec3, mat: mat4): vec3 {
    const v = vec4.fromValues(vec[0], vec[1], vec[2], 0);
    vec4.transformMat4(v, v, mat);
    return vec3FromVec4(v);
}

export function rotate(vec: vec3 | number[], rotation: quat): vec3 {
    const rotated_vec = vec3.create();
    vec3.transformQuat(rotated_vec, vec, rotation);
    vec3.normalize(rotated_vec, rotated_vec);
    return rotated_vec;
}

export function cross(a: vec3, b: vec3): vec3 {
    const cr = vec3.create();
    return vec3.cross(cr, a, b);
}

export function lerp(from: vec3, to: vec3, t: number): vec3 {
    const out = vec3.create();
    return vec3.lerp(out, from, to, t);
}


/**
 * Returns whether a is colinear to b
 *
 * @export
 * @param {vec3} a
 * @param {vec3} b
 * @param {number} eps - the tolerated error, defaults to 10 ** -4
 * @returns {boolean}
 */
export function collinear(a: vec3, b: vec3, eps = 10 ** -4): boolean {
    return Math.abs(Math.abs(vec3.dot(a, b) / (vec3.len(a) * vec3.len(b))) - 1) < eps;
}