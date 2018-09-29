import { vec3 } from "gl-matrix";
import Camera from "../Controls/Camera";
import Shader, { ShaderSource } from "../Utils/Shader";
import { TextureInfo } from "../Utils/TextureUtils/Texture";
import { planetShader } from "./Shaders/PlanetShader";
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
            flat_shaded: false,
            ...options
        };

        this.initShader(shader);
        this.initSphere();
        this.initTextures();
    }

    private initTextures(): void {
        if (this._options.textures.height_map !== undefined) {
            this._shader.registerTexture('height_map', this._options.textures.height_map.bound_to);
            this._shader.define('HEIGHT_MAP');
        }

        if (this._options.textures.normal_map !== undefined) {
            this._shader.registerTexture('normal_map', this._options.textures.normal_map.bound_to);
            this._shader.define('NORMAL_MAP');
        } else if (!this._options.flat_shaded) {
            throw new Error('Cannot render a planet using smooth shading without a normal map');
        }

        if (this._options.textures.color_map !== undefined) {
            this._shader.registerTexture('color_map', this._options.textures.color_map.bound_to);
            this._shader.define('COLOR_MAP');
        }


        this._shader.defineFloat('RADIUS', this._options.sphere_options.radius);
        this._shader.defineFloat('MAX_HEIGHT', this._options.sphere_options.max_terrain_height);
    }

    private initShader(shader: Shader | ShaderSource): void {

        this._shader = shader instanceof Shader ?
            shader : new Shader(this.gl, planetShader);

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

        this._options.sphere_options = this.sphere.options;
    }

    public update(camera: Camera): void {
        // this._sphere.rotate(0.01);
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

    public get options(): Readonly<PlanetOptions> {
        return this._options;
    }

    public get shader(): Readonly<Shader> {
        return this._shader;
    }
}