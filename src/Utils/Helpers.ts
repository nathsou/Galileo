import Shader from "./Shader";
import { wireFrameShader } from "../Map/Shaders/WireFrameShader";
import { mat4, vec3 } from "gl-matrix";
import { colors } from "./ColorUtils";
import Frustum from "./Frustum";
import { sum, times, transform } from "./MathUtils";
import { Prism } from "../Map/IcoSphereFace";

export type LineHelper = (lines: Line[], model_view_proj: mat4) => void;
export type ArrowHelper = (origin: vec3, dir: vec3, model_view_proj: mat4, length: number) => void;
export type BoxHelper = (box: Box, model_view_proj: mat4) => void;
export type FrustumHelper = (frustum: Frustum, model_view_proj: mat4) => void;
export type PrismHelper = (model_view_proj: mat4, ...prisms: Prism[]) => void;

export interface Line {
    [key: string]: vec3,
    from: vec3,
    to: vec3
}

export interface Rectangle {
    position: vec3,
    width: number,
    height: number
}

export interface RectangleCoords {
    [key: string]: vec3,
    top_left: vec3,
    top_right: vec3,
    bottom_left: vec3,
    bottom_right: vec3
}

export interface Box {
    position: vec3,
    width: number,
    height: number,
    depth: number
}

export function createLineHelper(gl: WebGL2RenderingContext, color = colors.green): LineHelper {

    const shader = new Shader(gl, wireFrameShader);
    shader.use();

    const position_attrib = shader.getAttribLocation('position');

    //Setup the position attribute
    const VAO = gl.createVertexArray();
    const VBO = gl.createBuffer();

    gl.bindVertexArray(VAO);
    gl.bindBuffer(gl.ARRAY_BUFFER, VBO);
    gl.vertexAttribPointer(position_attrib, 3, gl.FLOAT, false, 3 * 4, 0);
    gl.enableVertexAttribArray(position_attrib);
    gl.bindBuffer(gl.ARRAY_BUFFER, null);
    gl.bindVertexArray(null);

    return (lines: Line[], model_view_proj: mat4) => {
        shader.use();
        gl.bindBuffer(gl.ARRAY_BUFFER, VBO);

        const vertices: number[] = [];
        lines.forEach((line: Line) => {
            vertices.push(...line.from, ...line.to);
        });

        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertices), gl.STATIC_DRAW);

        shader.setMat4('model_view_proj', model_view_proj);
        shader.setVec3('color', color);

        gl.bindVertexArray(VAO);
        gl.drawArrays(gl.LINES, 0, vertices.length / 3);

        gl.bindVertexArray(null);
        gl.bindBuffer(gl.ARRAY_BUFFER, null);
    };
}

export function createArrowHelper(gl: WebGL2RenderingContext, color = colors.blue): ArrowHelper {

    const drawLines = createLineHelper(gl, color);

    return (origin: vec3, dir: vec3, model_view_proj: mat4, length = 1) => {
        const _dir = vec3.create();
        vec3.normalize(_dir, dir);
        const end_point = sum(origin, _dir.map(v => v * length));

        drawLines([{ from: origin, to: end_point }], model_view_proj);
    };
}

export function createLines(vertices: vec3[]): Line[] {
    const lines: Line[] = [];
    for (let i = 0; i < vertices.length; i += 2) {
        lines.push({
            from: vertices[i],
            //if odd number of vertices, loop back to the first vertex
            to: vertices[(i + 1) % vertices.length]
        });
    }

    return lines;
}

export function createRectangle(
    rect: Rectangle,
    right = vec3.fromValues(1, 0, 0),
    up = vec3.fromValues(0, 1, 0),
    transform_matrix = mat4.create()
): RectangleCoords {

    const w = rect.width / 2;
    const h = rect.height / 2;

    return {
        top_left: transform(sum(rect.position, times(right, -w), times(up, h)), transform_matrix),
        top_right: transform(sum(rect.position, times(right, w), times(up, h)), transform_matrix),
        bottom_right: transform(sum(rect.position, times(right, w), times(up, -h)), transform_matrix),
        bottom_left: transform(sum(rect.position, times(right, -w), times(up, -h)), transform_matrix)
    };
}

//Truncated square pyramid
export function createSquareFrustum(front: RectangleCoords, back: RectangleCoords): Line[] {
    return createLines([
        front.top_left, front.top_right,
        front.bottom_right, front.bottom_left,
        front.top_left, front.bottom_left,
        front.top_right, front.bottom_right,

        back.top_left, back.top_right,
        back.bottom_right, back.bottom_left,
        back.top_left, back.bottom_left,
        back.top_right, back.bottom_right,

        front.top_right, back.top_right,
        front.bottom_right, back.bottom_right,
        front.top_left, back.top_left,
        front.bottom_left, back.bottom_left
    ]);
}

export function createBox(box: Box): Line[] {
    const half_depth = box.depth / 2;

    const front = createRectangle({
        position: sum(box.position, [0, 0, half_depth]),
        width: box.width,
        height: box.height
    });

    const back = createRectangle({
        position: sum(box.position, [0, 0, -half_depth]),
        width: box.width,
        height: box.height
    });

    //A box is a special case of a square frustum 
    //(where the dimensions of the front and back rectangles are the same)
    return createSquareFrustum(front, back);
}

export function createBoxHelper(gl: WebGL2RenderingContext, color = colors.red): BoxHelper {

    const drawLines = createLineHelper(gl, color);

    return (box: Box, model_view_proj: mat4) => {
        drawLines(createBox(box), model_view_proj);
    };
}

export function createFrustumHelper(gl: WebGL2RenderingContext): FrustumHelper {

    const drawFarPlane = createLineHelper(gl, colors.yellow);
    const drawNearPlane = createLineHelper(gl, colors.red);
    const drawEdges = createLineHelper(gl, colors.green);

    return (frustum: Frustum, model_view_proj: mat4) => {
        const lines = frustum.getDebugLines();
        drawFarPlane(lines.slice(0, 4), model_view_proj);
        drawNearPlane(lines.slice(4, 8), model_view_proj);
        drawEdges(lines.slice(8, 12), model_view_proj);
    };
}

export function createPrismHelper(gl: WebGL2RenderingContext, color = colors.cyan): PrismHelper {
    const drawLines = createLineHelper(gl, color);
    return (model_view_proj: mat4, ...prisms: Prism[]) => {
        const lines = [];

        for (const prism of prisms) {
            lines.push(
                prism.a1, prism.b1,
                prism.b1, prism.c1,
                prism.c1, prism.a1,

                prism.a1, prism.a2,
                prism.b1, prism.b2,
                prism.c1, prism.c2,

                prism.a2, prism.b2,
                prism.b2, prism.c2,
                prism.c2, prism.a2
            );
        }

        drawLines(createLines(lines), model_view_proj);
    };
}