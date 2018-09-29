import { PlanetTextures } from "../../Map/Planet";
import { Texture } from "./Texture";

export type PlanetTexturesGenerator = () => PlanetTextures;

export function generateEarthyTextures(
    gl: WebGL2RenderingContext,
    resolution: number
): PlanetTextures {
    const width = resolution;
    const height = resolution / 2;
    const height_map = Texture.generateClampedHeightMap(gl, width, height, 0.5);
    const normal_map = Texture.generateNormalMap(gl, height_map);

    return {
        height_map,
        normal_map
    };
}

export function generateMoonyTextures(
    gl: WebGL2RenderingContext,
    resolution: number
): PlanetTextures {
    const width = resolution;
    const height = resolution / 2;

    const height_map = Texture.generateHeightMap(gl, width, height);
    const color_map = height_map;

    return {
        height_map,
        color_map
    };
}

