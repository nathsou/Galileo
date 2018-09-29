import Shader from "./Shader";
import { wireFrameShader } from "../Map/Shaders/WireFrameShader";
import { mat4, vec3 } from "gl-matrix";
import { colors } from "./ColorUtils";
import Frustum from "./Frustum";
import { sum, times, transform, normalize, vec, Vec3Like } from "./Vec3Utils";
import { CanvasHelper } from "./CanvasHelper";
import { TextHelper, PlotHelper } from "./TextUtils";
import { TextureHelper } from "./TextureUtils/TextureHelper";
import { pointShader } from "../Map/Shaders/PointShader";

export type Helper = LineHelper | ArrowHelper | BoxHelper | FrustumHelper | PrismHelper
    | CanvasHelper | TextHelper | TextureHelper | PlotHelper;

export type PointHelper = (model_view_proj: mat4, ...points: Vec3Like[]) => void;
export type LineHelper = (model_view_proj: mat4, ...lines: Line[]) => void;
export type ArrowHelper = (model_view_proj: mat4, ...arrows: Arrow[]) => void;
export type BoxHelper = (model_view_proj: mat4, ...boxes: Box[]) => void;
export type FrustumHelper = (model_view_proj: mat4, ...frustums: Frustum[]) => void;
export type PrismHelper = (model_view_proj: mat4, ...prisms: Prism[]) => void;

export interface Line {
    [key: string]: vec3,
    from: vec3,
    to: vec3
}

export interface Arrow {
    origin: vec3,
    dir: vec3,
    length: number
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

export interface Prism {
    [key: string]: vec3;
    a1: vec3;
    b1: vec3;
    c1: vec3;
    a2: vec3;
    b2: vec3;
    c2: vec3;
}

export function createPointHelper(gl: WebGL2RenderingContext, color = colors.red): PointHelper {

    const shader = new Shader(gl, pointShader);
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

    return (model_view_proj: mat4, ...points: Vec3Like[]) => {

        const vertices = new Float32Array(points.length * 3);
        points.forEach((p, i) => {
            vertices[3 * i] = p[0];
            vertices[3 * i + 1] = p[1];
            vertices[3 * i + 2] = p[2];
        });

        shader.use();
        gl.bindBuffer(gl.ARRAY_BUFFER, VBO);
        gl.bufferData(gl.ARRAY_BUFFER, vertices, gl.STATIC_DRAW);

        shader.setMat4('model_view_proj', model_view_proj);
        shader.setVec3('color', color);
        shader.bindUniforms();

        gl.bindVertexArray(VAO);
        gl.drawArrays(gl.POINTS, 0, vertices.length / 3);

        gl.bindVertexArray(null);
        gl.bindBuffer(gl.ARRAY_BUFFER, null);
    };
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

    return (model_view_proj: mat4, ...lines: Line[]) => {

        const vertices: number[] = [];
        lines.forEach((line: Line) => {
            vertices.push(...line.from, ...line.to);
        });

        shader.use();
        gl.bindBuffer(gl.ARRAY_BUFFER, VBO);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertices), gl.STATIC_DRAW);

        shader.setMat4('model_view_proj', model_view_proj);
        shader.setVec3('color', color);
        shader.bindUniforms();

        gl.bindVertexArray(VAO);
        gl.drawArrays(gl.LINES, 0, vertices.length / 3);

        gl.bindVertexArray(null);
        gl.bindBuffer(gl.ARRAY_BUFFER, null);
    };
}

export function createArrowHelper(gl: WebGL2RenderingContext, color = colors.blue): ArrowHelper {

    const drawLines = createLineHelper(gl, color);

    return (model_view_proj: mat4, ...arrows: Arrow[]) => {
        const lines: Line[] = [];

        for (const { origin, dir, length } of arrows) {
            const to = sum(origin, times(normalize(dir), length));
            lines.push({ from: origin, to: to });
        }

        drawLines(model_view_proj, ...lines);
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

// Truncated square pyramid
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
        position: sum(box.position, vec(0, 0, half_depth)),
        width: box.width,
        height: box.height
    });

    const back = createRectangle({
        position: sum(box.position, vec(0, 0, -half_depth)),
        width: box.width,
        height: box.height
    });

    // A box is a special case of a square frustum 
    // (where the dimensions of the front and back rectangles are the same)
    return createSquareFrustum(front, back);
}

export function createBoxHelper(gl: WebGL2RenderingContext, color = colors.red): BoxHelper {

    const drawLines = createLineHelper(gl, color);

    return (model_view_proj: mat4, ...boxes: Box[]) => {
        const lines: Line[] = [];

        for (const box of boxes) {
            lines.push(...createBox(box));
        }

        drawLines(model_view_proj, ...lines);
    };
}

export function createFrustumHelper(gl: WebGL2RenderingContext): FrustumHelper {

    const drawFarPlane = createLineHelper(gl, colors.yellow);
    const drawNearPlane = createLineHelper(gl, colors.red);
    const drawEdges = createLineHelper(gl, colors.green);

    return (model_view_proj: mat4, ...frustums: Frustum[]) => {
        const far_lines: Line[] = [];
        const near_lines: Line[] = [];
        const edge_lines: Line[] = [];

        for (const frustum of frustums) {
            const lines = frustum.getDebugLines();
            far_lines.push(...lines.slice(0, 4));
            near_lines.push(...lines.slice(4, 8));
            edge_lines.push(...lines.slice(8, 12));
        }

        drawFarPlane(model_view_proj, ...far_lines);
        drawNearPlane(model_view_proj, ...near_lines);
        drawEdges(model_view_proj, ...edge_lines);
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

        drawLines(model_view_proj, ...createLines(lines));
    };
}