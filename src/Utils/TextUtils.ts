import { vec2 } from "gl-matrix";
import { createCanvasHelper } from "./CanvasHelper";
import { getBoundingBox, g_prod, mapBox } from "./VecUtils";

const text_ctx = document.createElement('canvas').getContext('2d');

export type TextHelper = (text: string, pos: vec2) => { width: number, height: number };
export type PlotHelper = (position: vec2, ...points: (vec2 | number[])[]) => void;

export interface TextOptions {
    color?: string,
    font_size?: number,
    font_family?: string,
    margin?: number,
    background_color?: string
}

function generateTextTexture(text: string, text_info: TextOptions): HTMLCanvasElement {

    const info: TextOptions = {
        color: 'tomato',
        font_size: 35,
        font_family: 'monospace, sans-serif',
        margin: 5,
        background_color: 'rgba(0, 0, 0, 0)',
        ...text_info
    };

    text_ctx.font = `${info.font_size}px ${info.font_family}`;
    const w = text_ctx.measureText(text).width + info.margin;
    const h = info.font_size + info.margin;

    text_ctx.canvas.width = w;
    text_ctx.canvas.height = h;

    text_ctx.font = `${info.font_size}px ${info.font_family}`;
    text_ctx.textAlign = 'center';
    text_ctx.textBaseline = 'middle';
    text_ctx.fillStyle = info.background_color;
    text_ctx.fillRect(0, 0, w, h);
    text_ctx.fillStyle = info.color;
    text_ctx.fill();
    text_ctx.fillText(text, w / 2, h / 2);

    return text_ctx.canvas;
}


export function createTextHelper(gl: WebGL2RenderingContext, text_info: TextOptions): TextHelper {

    const drawCanvas = createCanvasHelper(gl);
    let tex_cnv: HTMLCanvasElement;
    let last_text: string;

    return (text: string, pos: vec2) => {
        if (last_text !== text) {
            last_text = text;
            tex_cnv = generateTextTexture(text, text_info);
        }

        drawCanvas(tex_cnv, pos);

        return {
            width: tex_cnv.width,
            height: tex_cnv.height
        };
    };
}

export interface PlotOptions {
    width: number,
    height: number,
    color?: string,
    background_color?: string,
    line_width?: number,
    auto_scale?: boolean, //automatically adjust the points to fit in [[0, width], [0, height]]
    normalized?: boolean //points are in [[0, 1], [0, 1]] ?
}

export function createPlotHelper(gl: WebGL2RenderingContext, options: PlotOptions): PlotHelper {
    const drawCanvas = createCanvasHelper(gl);

    const cnv = document.createElement('canvas');
    cnv.width = options.width;
    cnv.height = options.height;
    const ctx = cnv.getContext('2d');

    options = {
        color: 'blue',
        background_color: 'white',
        line_width: 1,
        auto_scale: true,
        normalized: false,
        ...options
    };

    return (position: vec2, ...points: (vec2 | number[])[]) => {

        if (options.normalized) {
            points = points.map(p => g_prod(p, [cnv.width, cnv.height]));
        }

        if (options.auto_scale) {
            //auto scale points to fit in the canvas
            const box = getBoundingBox(...points as number[][]);
            points = points.map(p =>
                mapBox(p, box, { min: [0, 0], max: [options.width, options.height] })
            );
        }

        //plot the points to the canvas
        ctx.clearRect(0, 0, cnv.width, cnv.height);
        ctx.fillStyle = options.background_color;
        ctx.fillRect(0, 0, cnv.width, cnv.height);
        ctx.fill();
        ctx.strokeStyle = options.color;

        ctx.beginPath();
        ctx.moveTo(points[0][0], points[0][1]);
        for (const point of points.slice(1)) {
            ctx.lineTo(point[0], point[1]);
        }
        ctx.stroke();
        ctx.closePath();

        drawCanvas(cnv, position);
    };
}