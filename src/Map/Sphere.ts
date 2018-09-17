import Camera from "../Controls/Camera";
import { vec3, quat, mat4 } from "gl-matrix";
import { TextureInfo } from "../Utils/Texture";
import Patch from "./Patch";
import { Box } from "../Utils/Helpers";

export interface SphereOptions {
    center?: vec3,
    radius?: number,
    orientation?: quat,
    max_lod?: number,
    patch_levels?: number,
    max_terrain_height?: number,
    max_edge_size?: number,
    morph_range?: number,
    height_map?: TextureInfo
}

export default interface Sphere {
    update(camera: Camera): void;
    render(camera: Camera, mode?: number): void;
    updateLookUpTables(camera: Camera): void;
    patch: Patch;
    radius: number;
    center: vec3;
    modelMatrix: mat4;
    inverseModelMatrix: mat4;
    boundingBox: Box;
    ID: number;
}