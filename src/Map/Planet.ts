import { vec3 } from "gl-matrix";
import Camera from "../Controls/Camera";
import Shader, { ShaderSource } from "../Utils/Shader";
import { Texture, TextureInfo } from "../Utils/Texture";
import { earthShader } from "./Shaders/EarthShader";
import IcoSphere from "./Sphere/IcoSphere/IcoSphere";
import QuadSphere from "./Sphere/QuadSphere/QuadSphere";
import Sphere, { SphereOptions } from "./Sphere/Sphere";

export interface PlanetOptions {
    sphere_options?: SphereOptions,
    sphere_type?: SphereType,
    textures?: PlanetTextures,
    flat_shaded?: boolean
}

export interface PlanetTextures {
    height_map?: TextureInfo,
    color_map?: TextureInfo,
    normal_map?: TextureInfo
}

export enum SphereType { IcoSphere, QuadSphere }; //TODO?: HexaSphere

export default class Planet {

    private gl: WebGL2RenderingContext;
    private _shader: Shader;
    private _sphere: Sphere;
    private _options: PlanetOptions;

    constructor(
        gl: WebGL2RenderingContext,
        options: PlanetOptions = {},
        shader?: (Shader | ShaderSource)
    ) {
        this.gl = gl;

        this._options = {
            sphere_options: {},
            textures: {},
            sphere_type: SphereType.IcoSphere,
            flat_shaded: true,
            ...options
        };


        this.initShader(shader);

        if (this._options.textures.height_map === undefined) {
            const height_map = Texture.generateHeightMap(gl, 1024, 512);
            const normal_map = Texture.generateNormalMap(gl, height_map);
            this._options.textures.height_map = height_map;
            this._options.textures.normal_map = normal_map;
            this._shader.attachTexture('height_map', height_map.boundTo);
            this._shader.attachTexture('normal_map', normal_map.boundTo);
        }

        this.initSphere();
    }

    private initShader(shader: Shader | ShaderSource): void {

        this._shader = shader instanceof Shader ?
            shader : new Shader(this.gl, earthShader);

        switch (this._options.sphere_type) {
            case SphereType.QuadSphere:
                this._shader.define('QUAD_SPHERE');
                break;

            case SphereType.IcoSphere:
            default:
                this._shader.define('ICO_SPHERE');
                break;
        }

        this._shader.define(this._options.flat_shaded ? 'FLAT_SHADING' : 'SMOOTH_SHADING');
        this._shader.compile();
    }

    private initSphere(): void {
        switch (this._options.sphere_type) {

            case SphereType.QuadSphere:
                this._sphere = new QuadSphere(
                    this.gl,
                    this._options.sphere_options,
                    this._shader
                );
                break;

            case SphereType.IcoSphere:
            default:
                this._sphere = new IcoSphere(
                    this.gl,
                    this._options.sphere_options,
                    this._shader
                );
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

    public get radius(): number {
        return this._options.sphere_options.radius;
    }

    public get center(): vec3 {
        return this._options.sphere_options.center;
    }

    public get options(): PlanetOptions {
        return this._options;
    }
}