import { vec3, vec4, mat4, quat } from "gl-matrix";

export function degrees(angle_radians: number): number {
    return (angle_radians * 57.29577951308232) % 360;
}

export function radians(angle_degrees: number): number {
    return (angle_degrees * 0.017453292519943295) % 6.283185307179586;
}

export function clamp(x: number, min: number, max: number): number {
    return Math.min(Math.max(x, min), max);
}

/**
 * Format a number to a string of a maximum of max_length characters 
 *
 * @export
 * @param {number} x
 * @param {number} max_length
 * @returns
 */
export function numFormat(x: number, max_length = 10): string {
    if (!Number.isFinite(x)) return null;
    if (`${x}`.length < max_length) return `${x}`;
    const x_cpy = x;
    const max_length_cpy = max_length;
    const neg = x < 0;
    x = Math.abs(x);
    // take '-' into account
    max_length -= neg ? 1 : 0;
    // ensure max_length is an integer
    max_length = Math.floor(max_length);

    let str;
    const [int_part, frac_part] = [`${Math.floor(x)}`, `${(x % 1)}`.slice(2)];
    const len_frac = max_length - (int_part.length + 1);

    if (int_part.length === max_length || max_length === int_part.length + 1) {
        str = int_part;
    } else if (len_frac >= 0) {
        const rounded_frac = parseFloat(parseFloat('0.' + frac_part).toFixed(len_frac));
        str = `${parseFloat(int_part) + rounded_frac}`;
        str = str.endsWith('.') ? str.slice(0, -1) : str;
    } else {
        const exp = x.toExponential();
        const exp_part = exp.substr(exp.indexOf('e'));
        if (max_length < exp_part.length + 1) {
            const min_rep = max_length <= int_part.length ? int_part : `${exp.charAt(0)}${exp_part}`;
            throw new Error(
                `Cannot represent '${x_cpy}' with less than ${min_rep.length} characters, ` +
                `minimal approximation is '${min_rep}', got max_length = ${max_length_cpy}`
            );
        }
        //const exp_len = `e+${Math.floor(Math.log10(x))}`.length;
        const m = exp.substr(0, exp.length - exp_part.length);
        const precision = max_length - (exp_part.length + 2);
        let rounded = precision !== -1 ? parseFloat(m).toFixed(precision) : m;
        //return rounded;
        rounded = rounded.substr(0, max_length - exp_part.length);
        rounded = rounded.endsWith('.') ? rounded.slice(0, -1) : rounded;
        str = rounded.substr(0, max_length - exp_part.length) + exp_part;
    }

    return `${neg ? '-' : ''}${str}`;
}

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
    return new Float32Array(16).map(() => rand_gen()) as mat4;
}

//vec3 shorthands

export function vec(a: number, b: number, c: number): vec3 {
    return vec3.fromValues(a, b, c);
}

export function fill(n: number): vec3 {
    return vec3.fromValues(n, n, n);
}

export type vec3Like = vec3 | number[] | Float32Array;

export function sum(...vecs: vec3Like[]): vec3 {
    return vecs.reduce((prev: vec3, curr: vec3) => vec3.add(prev, prev, curr), fill(0)) as vec3;
}

export function prod(...vecs: vec3Like[]): vec3 {
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

export function times(vec: vec3, k = 1): vec3 {
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

export function lerp3(from: vec3, to: vec3, t: number): vec3 {
    const out = vec3.create();
    return vec3.lerp(out, from, to, t);
}

export function triangleHypotenuse(a: vec3, b: vec3, c: vec3): { from: vec3, to: vec3, other: vec3, len: number } {
    return [
        { from: a, to: b, other: c, len: vec3.dist(a, b) },
        { from: a, to: c, other: b, len: vec3.dist(a, c) },
        { from: b, to: c, other: a, len: vec3.dist(b, c) }
    ].sort((side1, side2) => side2.len - side1.len)[0];
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