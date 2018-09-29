import { mat4, vec3, vec4 } from "gl-matrix";
import { clamp, combineMatrices, degrees, radians, randomMat4, triangleHypotenuse, minimize } from "../Utils/MathUtils";
import { centroid, collinear, fill, lerp, normalize, prod, sub, sum, times, vec } from "../Utils/Vec3Utils";
import { getBoundingBox, g_normalize, g_vec, mapBox } from "../Utils/VecUtils";

type ArrayLike = number[] | Float32Array;

expect.extend({
    toBeCloseToArray(received: ArrayLike, array: ArrayLike, eps = 10 ** -6) {

        const pass = received.length === array.length &&
            (received as number[]).every((x, i) => Math.abs(x - array[i]) < eps);

        return {
            message: () =>
                `expected [${received.join(', ')}] to be close to [${array.join(', ')}]`,
            pass
        };
    }
});

declare global {
    namespace jest {
        interface Matchers<R> {
            toBeCloseToArray(array: ArrayLike): R
        }
    }
}

describe('degrees', () => {
    it('should be accurate', () => {
        const accuracy = 5;
        expect(degrees(0)).toBeCloseTo(0, accuracy);
        expect(degrees(Math.PI / 2)).toBeCloseTo(90, accuracy);
        expect(degrees(Math.PI)).toBeCloseTo(180, accuracy);
        expect(degrees(2 * Math.PI)).toBeCloseTo(0, accuracy);
    });
});

describe('radians', () => {
    it('should be accurate', () => {
        const accuracy = 5;
        expect(radians(0)).toBeCloseTo(0, accuracy);
        expect(radians(90)).toBeCloseTo(Math.PI / 2, accuracy);
        expect(radians(180)).toBeCloseTo(Math.PI, accuracy);
        expect(radians(360)).toBeCloseTo(0, accuracy);
    });
});

describe('clamp', () => {
    it('should clamp', () => {
        expect(clamp(3, 0, 100)).toBe(3);
        expect(clamp(3, 10, 100)).toBe(10);
        expect(clamp(Math.PI, 0, 3)).toBe(3);
        expect(clamp(3, 0, 3)).toBe(3);
        expect(clamp(1789, 0, 1000)).toBe(1000);
        expect(clamp(-1789, 0, 1000)).toBe(0);
        expect(clamp(1789, 0, Infinity)).toBe(1789);
        expect(clamp(-1789, -Infinity, 0)).toBe(-1789);
    });
});

describe('combineMatrices', () => {
    const A = randomMat4();
    const B = randomMat4();
    const C = randomMat4();

    it('should combine matrices in order', () => {
        expect(mat4.equals(combineMatrices(A, B), combineMatrices(B, A))).toBe(false);
    });

    it('should accept one argument', () => {
        expect(mat4.equals(combineMatrices(A), A)).toBe(true);
    });

    it('should be associative', () => {
        expect(mat4.equals(combineMatrices(combineMatrices(A, B), C), combineMatrices(A, B, C))).toBe(true);
    });
});

describe('sum', () => {
    const v1 = vec(4, 5, 6);
    const v2 = vec(1, 2, 3);

    it('should sum up multiple arguments', () => {
        expect(vec3.equals(sum(v1, fill(3), v2), vec(8, 10, 12))).toBe(true);
    });

    it('should be commutative', () => {
        expect(vec3.equals(sum(v1, v2), sum(v2, v1))).toBe(true);
    });

    it('should accept one argument', () => {
        expect(vec3.equals(sum(v1), v1)).toBe(true);
    });
});

describe('prod', () => {
    const v1 = vec(4, 5, 6);
    const v2 = vec(1, 2, 3);

    it('should multiply vec3s together', () => {
        expect(vec3.equals(prod(v1, fill(3), v2), vec(12, 30, 54))).toBe(true);
    });

    it('should be commutative', () => {
        expect(vec3.equals(prod(v1, v2), prod(v2, v1))).toBe(true);
    });

    it('should accept one argument', () => {
        expect(vec3.equals(prod(v1), v1)).toBe(true);
    });
});

describe('sub', () => {
    const v1 = vec(4, 5, 6);
    const v2 = vec(1, 2, 3);

    it('should subtract two vec3s', () => {
        expect(vec3.equals(sub(v1, v2), fill(3))).toBe(true);
        expect(vec3.equals(sub(v2, v1), fill(-3))).toBe(true);
        expect(vec3.equals(sub(v1, v1), fill(0))).toBe(true);
    });

    it('should not be commutative', () => {
        expect(vec3.equals(sub(v1, v2), sub(v2, v2))).toBe(false);
    });

    it('should be equivalent to sum(a, times(b, -1))', () => {
        expect(vec3.equals(sum(v2, times(v1, -1)), sub(v2, v1))).toBe(true);
    });
});

describe('times', () => {
    const v1 = vec(1, 2, 3);
    const v2 = vec(2, 4, 6);

    it('should uniformly scale a vec3', () => {
        expect(vec3.equals(times(v1, 2), v2)).toBe(true);
        expect(vec3.equals(times(v1, 0), fill(0))).toBe(true);
    });
});

describe('normalize', () => {
    it('should normalize vectors of any dimensions', () => {
        const u = vec(1, 2, 3);
        const v = g_vec(4, 5, 6, 7);
        const v2 = vec4.fromValues(4, 5, 6, 7);
        expect(vec3.equals(vec3.normalize(u, u), normalize(vec(1, 2, 3)))).toBe(true);
        expect(vec4.normalize(v2, v2)).toBeCloseToArray(g_normalize(v));
    });

    it('should return the null vector when v = fill(0)', () => {
        const null_vec = fill(0);
        expect(normalize(null_vec)).toBeCloseToArray(null_vec);
    });
});

describe('centroid', () => {
    const v1 = vec(1, 2, 3);
    const v2 = vec(2, 4, 6);

    it('should find the middle of two vec3s', () => {
        expect(vec3.equals(centroid(v1, v2), lerp(v1, v2, 0.5))).toBe(true);
    });

    it('should accept one argument', () => {
        expect(vec3.equals(centroid(v1), v1)).toBe(true);
    });
});

describe('triangleHypotenuse', () => {
    const a = vec(0, 0, 0);
    const b = vec(1, 0, 0);
    const c = vec(0, 1, 1);

    it('should find the longest side of a triangle', () => {
        expect(triangleHypotenuse(a, b, c).len).toBeCloseTo(Math.sqrt(3));
        expect(vec3.equals(triangleHypotenuse(b, c, a).other, a)).toBe(true);
    });
});

describe('collinear', () => {
    const a = vec(7, 2, 8);
    const b = vec(3, 12, 5);

    it('should test colinearity', () => {
        expect(collinear(a, b)).toBe(false);
        expect(collinear(b, a)).toBe(false);
    });

    it('a vector should be colinear to itself', () => {
        expect(collinear(a, a)).toBe(true);
    });

    it('a vector should be colinear to any scalar multiple', () => {
        expect(collinear(a, times(a, -1))).toBe(true);
        expect(collinear(a, times(a, 0.12))).toBe(true);
        expect(collinear(a, times(a, 73))).toBe(true);
    });
});

describe('getBoundingBox', () => {
    const points: vec3[] = [
        vec(0, 1, 0),
        vec(2, 1, 0),
        vec(0, 18, 27),
        vec(-12, 3, 9)
    ];

    it('should compute the correct bounding box of a list of vectors', () => {
        const { min, max } = getBoundingBox(...points);
        expect(min).toEqual([-12, 1, 0]);
        expect(max).toEqual([2, 18, 27]);
    });
});

describe('mapBox', () => {

    it('should map a box to another linearly', () => {

        const box_from = {
            min: vec(0, 0, 0),
            max: vec(10, 10, 10)
        };

        const box_to = {
            min: vec(5, 18, 7),
            max: vec(200, 200, 200)
        };

        expect(mapBox(vec(0, 0, 0), box_from, box_to)).toEqual([5, 18, 7]);
        expect(mapBox(vec(10, 5, 6), box_from, box_to)).toEqual([200, 109, 122.8]);
    });
});

describe('minimize', () => {
    it('should minimize an array according to a performance function', () => {
        expect(minimize([3, 89, 232, 4, 17, 1, 27, -293, Infinity, 313], a => a)).toBe(-293);
        expect(minimize([3, 89, 232, 4, 17, 1, 27, -293, Infinity, 313], a => -a)).toBe(Infinity);
        expect(minimize([3, 89, 232, 4, 17, 1, 27, -293, Infinity, 313], a => Math.abs(a))).toBe(1);
        expect(minimize([], () => 0)).toBeUndefined();
    });
});