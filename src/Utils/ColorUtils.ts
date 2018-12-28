import { vec3 } from "gl-matrix";

export type color = vec3;

export function hex2vec3(hex: number): vec3 {
    return vec3.fromValues(
        ((hex >> 16) & 0xff) / 0xff,
        ((hex >> 8) & 0xff) / 0xff,
        (hex & 0xff) / 0xff
    );
}

export const colors = {
    black: hex2vec3(0x000000),
    white: hex2vec3(0xffffff),
    red: hex2vec3(0xff0000),
    green: hex2vec3(0x00ff00),
    blue: hex2vec3(0x0000ff),
    yellow: hex2vec3(0xffff00),
    cyan: hex2vec3(0x00ffff),
    pink: hex2vec3(0xff00ff),
    orange: hex2vec3(0xff8c00)
};