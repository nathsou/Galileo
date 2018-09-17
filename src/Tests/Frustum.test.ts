import Camera from "../Controls/Camera";
import { radians } from "../Utils/MathUtils";
import { mat4 } from "gl-matrix";
import { fill, vec } from "../Utils/Vec3Utils";

describe('Frustum', () => {
    const camera = new Camera(fill(0), radians(30), 16 / 9, 1, 500);
    const frustum = camera.frustum;
    frustum.update(mat4.create());

    it('should test whether points are inside the frustum or not', () => {
        expect(frustum.containsPoint(vec(0, 0, -10))).toBe(true);
        expect(frustum.containsPoint(vec(50, 10, -100))).toBe(true);
        expect(frustum.containsPoint(vec(-50, -10, 100))).toBe(false);
        expect(frustum.containsPoint(vec(0, 0, -249))).toBe(true);
        expect(frustum.containsPoint(vec(0, 0, -251))).toBe(false);
        expect(frustum.containsPoint(vec(0, 50, -100))).toBe(false);
    });
});