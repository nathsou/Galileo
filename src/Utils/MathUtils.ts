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