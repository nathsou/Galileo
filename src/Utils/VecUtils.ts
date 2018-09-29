import { vec2, vec4, vec3, glMatrix } from "gl-matrix";
import { mapIntervals } from "./MathUtils";

// Arbitrary-size vector utilities
// those functions are generally (way) slower than their vec3 counterpart

// 'g' in 'g_func stands for generalized or generic

export type VecLike = vec2 | vec3 | vec4 | NumberArrayLike;

export type NumberArrayLike = number[] | Float32Array;
export type Vec2Like = vec2 | NumberArrayLike;
export type Vec4Like = vec4 | NumberArrayLike;

export function g_vec<T extends VecLike>(...coords: number[]): T {
    return new Float32Array(coords) as T;
}

export function g_fill<T extends VecLike>(n: number, dims = 3): T {
    return new Float32Array(dims).fill(n) as T;
}

export function g_add<T extends VecLike>(u: T, v: T): T {
    const out: T = new Float32Array(u.length) as T;
    for (let i = 0; i < u.length; i++) out[i] = u[i] + v[i];
    return out;
}

export function g_sum<T extends VecLike>(...vecs: T[]): T {
    return vecs.reduce((prev: T, curr: T) => g_add(prev, curr), g_fill(0, vecs[0].length)) as T;
}

export function g_prod<T extends VecLike>(...vecs: T[]): T {
    const out: T = g_fill(1, vecs[0].length);
    for (const v of vecs) {
        for (let d = 0; d < out.length; d++) {
            out[d] *= v[d];
        }
    }

    return out;
}

export function g_div<T extends VecLike>(u: T, v: T): T {
    const out: T = new Float32Array(u.length) as T;
    for (let i = 0; i < u.length; i++) out[i] = u[i] / v[i];
    return out;
}

export function g_sub<T extends VecLike>(u: T, v: T): T {
    const out: T = new Float32Array(u.length) as T;
    for (let i = 0; i < u.length; i++) out[i] = u[i] - v[i];
    return out;
}


export function g_times<T extends VecLike>(vec: T, k: number): T {
    return (vec as number[]).map(x => x * k) as T;
    //return g_prod(vec, g_fill(k, vec.length));
}

// alias
export const g_scale = g_times;

export function g_clone<T extends VecLike>(vec: T): T {
    return new Float32Array(vec) as T;
}

export function g_centroid<T extends VecLike>(...points: T[]): T {
    return g_scale(g_sum(...points), 1 / points.length);
}

export function g_len<T extends VecLike>(u: T): number {
    return (u as number[]).reduce((p, c) => p + c ** 2, 0) ** 0.5;
    //return g_dot(u, u) ** 0.5;
}

export function g_normalize<T extends VecLike>(u: T): T {
    const l = g_len(u);
    return l !== 0 ? g_scale(u, 1 / l) : g_fill(0, u.length);
}

export function g_equals<T extends VecLike>(u: T, v: T): boolean {
    return u.length === v.length && (u as number[]).every((x, i) => glMatrix.equals(x, v[i]));
}

export function g_dot<T extends VecLike>(u: T, v: T): number {
    return (u as number[]).reduce((p, c, i) => p + c * v[i], 0);
}

export function dist<T extends VecLike>(u: T, v: T): number {
    return g_len(g_sub(u, v));
}


/* export function normalize(v: vec3): vec3 {
    const n = vec3.create();
    vec3.normalize(n, v);
    return n;
}
 */


export function fillArray(value: number, count: number): number[] {
    const filled = [];
    for (let i = 0; i < count; i++) {
        filled.push(value);
    }
    return filled;
}

/**
 * Represents a bounding shape in any dimension >= 2 (rectangle, box, hyperbox...)
 * by two of its extremities
 *
 * @export
 * @interface BoundingBox
 * @template T
 */
export interface BoundingBox<T extends VecLike> {
    min: T,
    max: T
}

/**
 * Computes the bounding box of a list of vectors
 * 
 * @export
 * @template T
 * @param {...T[]} points
 * @returns {BoundingBox<T>}
 */
export function getBoundingBox<T extends VecLike>(...points: T[]): BoundingBox<T> {

    const dims = points[0].length;

    const min: T = fillArray(Infinity, dims) as T;
    const max: T = fillArray(-Infinity, dims) as T;

    for (const point of points) {
        for (let d = 0; d < dims; d++) {
            if (point[d] < min[d]) {
                min[d] = point[d];
            } else if (point[d] > max[d]) {
                max[d] = point[d];
            }
        }
    }

    return { min, max };
}

/**
 * Linearly maps a vector contained in box_from to box_to
 *
 * @export
 * @template T
 * @param {T} v
 * @param {BoundingBox<T>} rect_from
 * @param {BoundingBox<T>} rect_to
 * @returns {T}
 */
export function mapBox<T extends VecLike>(
    v: T,
    box_from: BoundingBox<T>,
    box_to: BoundingBox<T>
): T {

    const dims = v.length;
    const out: T = [] as T;

    for (let d = 0; d < dims; d++) {
        out[d] = mapIntervals(v[d], box_from.min[d], box_from.max[d], box_to.min[d], box_to.max[d]);
    }

    return out;
}