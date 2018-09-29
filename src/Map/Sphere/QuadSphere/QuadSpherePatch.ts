import { vec2 } from "gl-matrix";
import { g_scale, g_vec, g_add } from "../../../Utils/VecUtils";
import SpherePatch from "../SpherePatch";

export default class QuadSpherePatch extends SpherePatch {

    public generateInstance(): { vertices: vec2[], morph: vec2[], indices: number[] } {
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
        const vertices = [
            p0,
            p4,// 1
            p5, // 2
            p6,// 3

            p4, // 4
            p1, // 5
            p7, // 6
            p5, // 7

            p5, // 8
            p7, // 9
            p2, // 10
            p8, // 11

            p6, // 12
            p5, // 13
            p8, // 14
            p3, // 15
        ] as vec2[];

        const morph = [
            g_vec(0, 0),
            g_vec(0.5, 0),
            g_vec(0.5, 0.5),
            g_vec(0, 0.5),

            g_vec(-0.5, 0),
            g_vec(0, 0),
            g_vec(0, 0.5),
            g_vec(-0.5, 0.5),

            g_vec(-0.5, -0.5),
            g_vec(0, -0.5),
            g_vec(0, 0),
            g_vec(-0.5, 0),

            g_vec(0, -0.5),
            g_vec(0.5, -0.5),
            g_vec(0.5, 0),
            g_vec(0, 0)
        ] as vec2[];

        /*

        3-------8-------2
        |       |       |
        |       |       |
        6-------5-------7
        |       |       |
        |       |       |
        0-------4-------1

        */

        const indices = [
            0, 1, 2, 2, 3, 0,
            4, 5, 6, 6, 7, 4,
            8, 9, 10, 10, 11, 8,
            12, 13, 14, 14, 15, 12
        ];

        return {
            vertices,
            morph,
            indices
        };
    }

    public generateGeometry(): void {

        const n = this._levels;

        const instance = this.generateInstance();
        const vertices = instance.vertices.map(v => g_scale(v, 1 / n));

        this._vertices = [];
        this._indices = [];

        for (let x = 0; x <= (1 - 1 / n); x += 1 / n) {
            for (let y = 0; y <= (1 - 1 / n); y += 1 / n) {
                const offset = g_vec(x, y);

                instance.indices.forEach((idx: number) => {
                    this._indices.push(idx + this._vertices.length / 4);
                });

                vertices.forEach((v: vec2, i: number) => {
                    this._vertices.push(...g_add(v, offset), ...instance.morph[i]);
                });
            }
        }

        this.rebind();
    }
}