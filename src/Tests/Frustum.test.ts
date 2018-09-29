import Camera from "../Controls/Camera";
import { radians } from "../Utils/MathUtils";
import { mat4 } from "gl-matrix";
import { fill, vec } from "../Utils/Vec3Utils";
import Frustum from "../Utils/Frustum";

describe('Frustum', () => {
    const camera = new Camera(fill(0), radians(30), 16 / 9, 1, 500);
    const frustum = new Frustum(camera);
    frustum.update(mat4.create());

    it('should test whether points are inside the frustum or not', () => {
        expect(frustum.containsPoint(vec(0, 0, 10))).toBe(true);
        expect(frustum.containsPoint(vec(50, 10, 100))).toBe(true);
        expect(frustum.containsPoint(vec(-50, -10, -100))).toBe(false);
        expect(frustum.containsPoint(vec(0, 0, 499))).toBe(true);
        expect(frustum.containsPoint(vec(0, 0, 501))).toBe(false);
        expect(frustum.containsPoint(vec(0, 100, 100))).toBe(false);
        expect(frustum.containsPoint(vec(0, -130, 40))).toBe(false);
        expect(frustum.containsPoint(vec(0, 130, 40))).toBe(false);
        expect(frustum.containsPoint(vec(0, -10, 350))).toBe(true);
    });
});