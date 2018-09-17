import { Plane } from "../Utils/Plane";
import { vec, fill, times, collinear, centroid } from "../Utils/Vec3Utils";
import { vec3 } from "gl-matrix";

describe('Plane', () => {
    const a = vec(2, 1, -1);
    const b = vec(0, -2, 0);
    const c = vec(1, -1, 2);

    const p1 = new Plane(a, b, c);
    const p2 = new Plane(b, a, c);
    const n = vec(7, -5, -1);

    it('should create a plane from three points', () => {
        const norm1 = p1.normal;
        const norm2 = p2.normal;
        expect(collinear(norm1, n)).toBe(true);
        expect(collinear(norm2, n)).toBe(true);
        expect(vec3.equals(norm1, times(norm2, -1))).toBe(true);

        const d1 = p1.distanceToPoint(fill(0)) * vec3.len(n);
        const d2 = p2.distanceToPoint(fill(0)) * vec3.len(n);
        expect(Math.abs(d1)).toBeCloseTo(10);
        expect(Math.abs(d2)).toBeCloseTo(10);
        expect(d1).toBeCloseTo(-d2);
    });

    it('should give a normalized normal vector', () => {
        expect(vec3.len(p1.normal)).toBeCloseTo(1);
    });

    it('should countain its constructing points', () => {
        expect(p1.containsPoint(a)).toBe(true);
        expect(p1.containsPoint(b)).toBe(true);
        expect(p1.containsPoint(c)).toBe(true);
        expect(p1.containsPoint(centroid(a, b, c))).toBe(true);
    });

    it('should throw an error if constructed using aligned points', () => {
        expect(() => { new Plane(a, b, a) }).toThrow(/aligned/);
    });
});