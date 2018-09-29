import { vec3, mat4 } from "gl-matrix";

export const degrees = (angle_radians: number): number => {
    return (angle_radians * 57.29577951308232) % 360;
}

export const radians = (angle_degrees: number): number => {
    return (angle_degrees * 0.017453292519943295) % 6.283185307179586;
}

export const kph_to_kps = (speed_kph: number): number => {
    return speed_kph / 3600;
};

export const kps_to_kph = (speed_kps: number): number => {
    return speed_kps * 3600;
};

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
    return maximize([
        { from: a, to: b, other: c, len: vec3.dist(a, b) },
        { from: a, to: c, other: b, len: vec3.dist(a, c) },
        { from: b, to: c, other: a, len: vec3.dist(b, c) }
    ], side => side.len);
}

export const mapIntervals = (x: number, min_A: number, max_A: number, min_B: number, max_B: number): number =>
    min_B + (x - min_A) * (max_B - min_B) / (max_A - min_A);


export const getAltitude = (pos: vec3, sphere_center: vec3, sphere_radius: number): number => {
    return Math.max(vec3.dist(pos, sphere_center) - sphere_radius, 0);
};

export const getNormalizedAltitude = (pos: vec3, sphere_center: vec3, sphere_radius: number): number => {
    return 2 / (1 + Math.exp(-this.getAltitude(pos, sphere_center, sphere_radius) / sphere_radius)) - 1;
};


const unit_dists = [1, 1000, 149597870700, 365 * 24 * 3600 * 299792458].reverse();
const unit = ['m', 'km', 'au', 'ly'].reverse();

export function formatDistance(dist: number, precision = 5): string {

    let idx = dist <= 1 ? unit.length - 1 : unit_dists.findIndex(d => dist > d);

    const d = (dist / unit_dists[idx]).toPrecision(precision);

    return `${d}${unit[idx]} `;
}

export function minimize<T>(data: T[], perf_func: (a: T) => number): T {

    let min_idx = -1;
    let min_perf = Infinity;

    for (let i = 0; i < data.length; i++) {
        const perf = perf_func(data[i]);
        if (perf < min_perf) {
            min_perf = perf;
            min_idx = i;
        }
    }

    return data[min_idx];

    // (less efficient) functional ways :
    // const perfs = data.map(elem => perf_func(elem));
    // return data[perfs.indexOf(Math.min(...perfs))];
    // or
    // return data.sort((a: T, b: T) => perf_func(a) - perf_func(b))[0];
}

export function maximize<T>(data: T[], perf_func: (a: T) => number): T {
    return minimize(data, (a: T) => -perf_func(a));
}