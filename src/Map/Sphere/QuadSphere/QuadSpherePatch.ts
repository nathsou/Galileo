import SpherePatch from "../SpherePatch";
import { g_vec } from "../../../Utils/VecUtils";

export default class QuadSpherePatch extends SpherePatch {

    public generateGeometry(): void {

        const p0 = g_vec(0, 0);
        const p1 = g_vec(1, 0);
        const p2 = g_vec(1, 1);
        const p3 = g_vec(0, 1);
        const p4 = g_vec(0.5, 0);
        const p5 = g_vec(0.5, 0.5);
        const p6 = g_vec(0, 0.5);
        const p7 = g_vec(1, 0.5);
        const p8 = g_vec(0.5, 1);

        // pos.x, pos.y, morph.x, morph.y
        this._vertices = [
            ...p0, 0, 0, // 0
            ...p4, 0.5, 0, // 1
            ...p5, 0.5, 0.5, // 2
            ...p6, 0, 0.5, // 3

            ...p4, -0.5, 0, // 4
            ...p1, 0, 0, // 5
            ...p7, 0, 0.5, // 6
            ...p5, -0.5, 0.5, // 7

            ...p5, -0.5, -0.5, // 8
            ...p7, 0, -0.5, // 9
            ...p2, 0, 0, // 10
            ...p8, -0.5, 0, // 11

            ...p6, 0, -0.5, // 12
            ...p5, 0.5, -0.5, // 13
            ...p8, 0.5, 0, // 14
            ...p3, 0, 0, // 15
        ];

        /*

        3-------8-------2
        |       |       |
        |       |       |
        6-------5-------7
        |       |       |
        |       |       |
        0-------4-------1

        */

        this._indices = [
            0, 1, 2, 2, 3, 0,
            4, 5, 6, 6, 7, 4,
            8, 9, 10, 10, 11, 8,
            12, 13, 14, 14, 15, 12
        ];

        this.rebind();
    }
}