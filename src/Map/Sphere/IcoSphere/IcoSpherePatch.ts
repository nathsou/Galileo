import SpherePatch from "../SpherePatch";
import { g_vec } from "../../../Utils/VecUtils";
import { vec2 } from "gl-matrix";


export default class IcoSpherePatch extends SpherePatch {

    public generateInstance(): { vertices: vec2[], morph: vec2[], indices: number[] } {

        const vertices = [
            g_vec(0, 0),
            g_vec(0.5, 0),
            g_vec(1, 0),
            g_vec(0, 0.5),
            g_vec(0.5, 0.5),
            g_vec(0, 1)
        ] as vec2[];


        const morph = [
            g_vec(0, 0),
            g_vec(-0.5, 0),
            g_vec(0, 0),
            g_vec(0, 0.5),
            g_vec(0.5, -0.5),
            g_vec(0, 0)
        ] as vec2[];

        const indices = [
            0, 3, 1,
            3, 4, 1,
            1, 4, 2,
            3, 5, 4
        ];

        return {
            vertices,
            morph,
            indices
        }
    }

    // http://robert-lindner.com/blog/planet-renderer-week-5-6/
    public generateGeometry(): void {

        //clear
        this._vertices = [];
        this._indices = [];

        let positions = [];
        let morphs = [];

        //Generate
        const m_RC = 1 + 2 ** this._levels;

        const delta = 1 / (m_RC - 1);

        let rowIdx = 0;
        let nextIdx = 0;

        for (let row = 0; row < m_RC; row++) {
            const numCols = m_RC - row;
            nextIdx += numCols;
            for (let column = 0; column < numCols; column++) {
                //calc position
                const pos = [
                    column / (m_RC - 1),
                    row / (m_RC - 1)
                ];

                //calc morph
                const morph = [0, 0];
                if (row % 2 == 0) {
                    if (column % 2 == 1) {
                        morph[0] = -delta;
                        morph[1] = 0;
                    }
                } else {
                    if (column % 2 == 0) {
                        morph[0] = 0;
                        morph[1] = delta;
                    } else {
                        morph[0] = delta;
                        morph[1] = -delta;
                    }
                }

                //create vertex
                positions.push(...pos);
                morphs.push(...morph);
                this._vertices.push(...pos, ...morph);

                //calc index
                if (row < m_RC - 1 && column < numCols - 1) {
                    this._indices.push(rowIdx + column); //A
                    this._indices.push(nextIdx + column); //B
                    this._indices.push(1 + rowIdx + column); //C
                    if (column < numCols - 2) {
                        this._indices.push(nextIdx + column); //D
                        this._indices.push(1 + nextIdx + column); //E
                        this._indices.push(1 + rowIdx + column); //F
                    }
                }
            }
            rowIdx = nextIdx;
        }

        this.rebind();
    }

}