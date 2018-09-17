import Camera from "../Controls/Camera";
import { Texture, TextureInfo } from "../Utils/Texture";
import IcoSphere from "./IcoSphere";
import Sphere, { SphereOptions } from "./Sphere";


export interface PlanetTextures {
    height_map?: TextureInfo,
    color_map?: TextureInfo,
    normal_map?: TextureInfo
}


export interface PlanetOptions {
    sphere_options?: SphereOptions,
    textures?: PlanetTextures
}


export enum SphereType { IcoSphere }; //TODO?: QuadSphere, HexaSphere

export default class Planet {

    private gl: WebGL2RenderingContext;
    private _sphere_type: SphereType;
    private _sphere: Sphere;
    private _options: PlanetOptions;

    constructor(gl: WebGL2RenderingContext, options: PlanetOptions = {}) {
        this.gl = gl;

        this._options = {
            sphere_options: {},
            textures: {},
            ...options
        };

        if (this._options.textures.height_map === undefined) {
            this._options.textures.height_map = Texture.generateHeightMap(gl, 1024, 512);
        }

        this.initSphere();
    }

    private initSphere(): void {
        switch (this._sphere_type) {
            case SphereType.IcoSphere:
            default:
                this._sphere = new IcoSphere(this.gl, this._options.sphere_options);
                break;
        }
    }

    public update(camera: Camera): void {
        this._sphere.update(camera);
    }

    public render(camera: Camera, mode?: number): void {
        this._sphere.render(camera, mode);
    }

    public get ID(): number {
        return this._sphere.ID;
    }

    public get sphere(): Sphere {
        return this._sphere;
    }
}