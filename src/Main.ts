import { vec2, vec3 } from 'gl-matrix';
import InputHandler from './Controls/InputHandler';
import Player from './Controls/Player';
import Planet, { SphereType } from './Map/Planet';
import Universe from './Map/Universe';
import Clock from './Utils/Clock';
import { colors } from './Utils/ColorUtils';
import { BoxHelper, createBoxHelper, createFrustumHelper, createPointHelper, FrustumHelper, PointHelper } from './Utils/Helpers';
import { average, combineMatrices, formatDistance, getAltitude, getNormalizedAltitude, minimize, total, radians } from './Utils/MathUtils';
import { Texture } from './Utils/TextureUtils/Texture';
import { createTextureHelper, TextureHelper } from './Utils/TextureUtils/TextureHelper';
import { createPlotHelper, createTextHelper, PlotHelper, TextHelper } from './Utils/TextUtils';
import { fill, vec } from './Utils/Vec3Utils';
import { g_vec } from './Utils/VecUtils';
import { generateEarthyTextures, generateMoonyTextures } from './Utils/TextureUtils/PlanetTextureUtils';

export default class Main {

    private clock: Clock;
    private universe: Universe;
    private _player: Player;
    private mode = 0;
    private culling = true;
    private needs_redraw = true;
    private update_on_move = true;
    private render_text = true;
    private show_height_map = false;
    private show_normal_map = false;
    private show_bounding_box = false;
    private show_frustum = false;
    private show_specular = false;
    private flat_shaded = true;
    private fps_history: number[] = [];

    private drawFrustum: FrustumHelper;
    private drawBoundingBox: BoxHelper;
    private drawTexture: TextureHelper;
    private drawText: TextHelper;
    private drawPlot: PlotHelper;

    private static DRAWING_MODES = [
        WebGL2RenderingContext.TRIANGLES,
        WebGL2RenderingContext.POINTS,
        WebGL2RenderingContext.LINES
    ];

    constructor(private gl: WebGL2RenderingContext) {
        this.clock = new Clock();
        this.universe = new Universe();

        const width = 2 ** 12;

        const earth_like = new Planet(gl, {
            sphere_options: {
                center: vec(0, 0, 0), //km
                radius: 6371, //km
                max_lod: 5,
                patch_levels: 3,
                max_edge_size: 100,
                max_terrain_height: 600 //8.850 // mount everest,
            },
            textures: generateEarthyTextures(gl, width),
            flat_shaded: this.flat_shaded,
            sphere_type: SphereType.IcoSphere
        });

        const moon_like = new Planet(gl, {
            sphere_options: {
                radius: 1737,
                max_lod: 5,
                patch_levels: 2,
                max_edge_size: 50,
                max_terrain_height: 10.786,
                center: vec(-384_400 / 10, 0, 0)
            },
            textures: generateMoonyTextures(gl, 512),
            flat_shaded: this.flat_shaded,
            sphere_type: SphereType.QuadSphere
        });

        this.universe.add(earth_like, moon_like);

        this._player = new Player({ position: vec(0, 0, -earth_like.radius * 3) });

        InputHandler.instance.onKeyDown(e => this.onKeyDown.call(this, e));
        window.addEventListener('resize', () => {
            this.onResize.call(this, window.innerWidth, window.innerHeight);
        });

        this.setCulling(this.culling);

        this.drawFrustum = createFrustumHelper(gl);
        this.drawBoundingBox = createBoxHelper(gl, colors.orange);
        this.drawTexture = createTextureHelper(gl);

        const text_color = '#0abde3';

        this.drawText = createTextHelper(gl, {
            color: text_color,
            font_size: 20,
            font_family: 'monospace, sans-serif',
            background_color: 'rgba(0, 0, 0, 0)'
        });

        this.drawPlot = createPlotHelper(gl, {
            width: 150,
            height: 70,
            auto_scale: false,
            normalized: true,
            background_color: 'rgba(0, 0, 0, 0)',
            color: text_color
        });

        this.setBlending();
    }

    private setBlending(enabled = true): void {
        if (enabled) {
            this.gl.enable(this.gl.BLEND);
            this.gl.blendFunc(this.gl.SRC_ALPHA, this.gl.ONE_MINUS_SRC_ALPHA);
            // this.gl.disable(this.gl.DEPTH_TEST);
        } else {
            this.gl.disable(this.gl.BLEND);
            // this.gl.enable(this.gl.DEPTH_TEST);
        }
    }

    public start(): void {
        this.update();
        requestAnimationFrame(() => { this.start.call(this); });
    }

    private setCulling(enabled = true): void {
        this.culling = enabled;
        if (this.culling) {
            this.gl.enable(this.gl.CULL_FACE);
            this.gl.frontFace(this.gl.CW);

        } else {
            this.gl.disable(this.gl.CULL_FACE);
        }
    }

    private onKeyDown(ev: KeyboardEvent): void {

        switch (ev.key.toLocaleLowerCase()) {
            case 'm': // change mode
                this.mode = (this.mode + 1) % Main.DRAWING_MODES.length;
                this.needs_redraw = true;
                break;

            case 'b': // toggle bounding box
                this.show_bounding_box = !this.show_bounding_box;
                this.needs_redraw = true;
                break;

            case 'c': // toggle backface culling
                this.setCulling(!this.culling);
                this.needs_redraw = true;
                break;

            case 'f': // toggle flat shading
                this.flat_shaded = !this.flat_shaded;

                for (const planet of this.universe.planets) {
                    if (planet.options.textures.normal_map === undefined) {
                        planet.options.textures.normal_map = Texture.generateNormalMap(
                            this.gl,
                            planet.options.textures.height_map
                        );
                        planet.shader.registerTexture(
                            'normal_map',
                            planet.options.textures.normal_map.bound_to
                        );
                    }

                    planet.shader.define(this.flat_shaded ? 'FLAT_SHADING' : 'SMOOTH_SHADING');
                    planet.shader.undefine(this.flat_shaded ? 'SMOOTH_SHADING' : 'FLAT_SHADING');
                }

                this.needs_redraw = true;
                break;

            case 'u': // update on move
                this.update_on_move = !this.update_on_move;
                this.needs_redraw = true;
                break;

            case 't': // show debug info
                this.render_text = !this.render_text;
                this.needs_redraw = true;
                break;

            case 'h': // show height_map
                for (const planet of this.universe.planets) {
                    if (planet.options.textures.height_map) {
                        this.show_height_map = !this.show_height_map;
                        this.show_normal_map = !this.show_height_map;
                        planet.shader.setBool('show_normal_map', this.show_normal_map);
                        planet.shader.setBool('show_height_map', this.show_height_map);
                        this.needs_redraw = true;
                    }
                }
                break;
            case 'n': // show normal map

                for (const planet of this.universe.planets) {
                    if (planet.options.textures.normal_map) {
                        this.show_normal_map = !this.show_normal_map;
                        this.show_height_map = !this.show_normal_map;
                        planet.shader.setBool('show_height_map', this.show_height_map);
                        planet.shader.setBool('show_normal_map', this.show_normal_map);
                        this.needs_redraw = true;

                        // this.drawTexture(
                        //     planet.options.textures.normal_map,
                        //     g_vec(0, 0),
                        //     g_vec(this.gl.canvas.width, this.gl.canvas.height)
                        // );
                    }
                }
                break;

            case 'p':
                for (const planet of this.universe.planets) {
                    this.show_specular = !this.show_specular;
                    if (this.show_specular) {
                        planet.shader.define('SPECULAR');
                    } else {
                        planet.shader.undefine('SPECULAR');
                    }
                }
                this.needs_redraw = true;
                break;
        }
    }

    private onResize(width: number, height: number): void {
        this._player.camera.aspectRatio = width / height;
        for (const planet of this.universe.planets) {
            planet.sphere.updateLookUpTables(this._player.camera);
        }
        this.needs_redraw = true;
    }

    private clearGL(): void {
        this.gl.viewport(0, 0, this.gl.canvas.width, this.gl.canvas.height);
        // Set the backbuffer's alpha to 1.0
        this.gl.clearColor(0, 0, 0, 1)
        this.gl.clear(this.gl.COLOR_BUFFER_BIT | this.gl.DEPTH_BUFFER_BIT);
    }

    private updateFPS(delta: number): void {
        const history_len = 60;
        if (this.fps_history.length >= history_len) {
            this.fps_history.splice(0, this.fps_history.length - history_len + 1);
        }

        this.fps_history.push(delta);
    }

    private update(): boolean {
        const delta = this.clock.getDelta();

        const closest_planet = minimize(
            this.universe.planets,
            p => vec3.dist(p.center, this._player.position)
        );

        const speed_factor = getNormalizedAltitude(
            this._player.position,
            closest_planet.center,
            closest_planet.radius
        );

        this.needs_redraw = this._player.update(delta, speed_factor) ||
            !this.update_on_move ||
            this.needs_redraw;

        if (!this.needs_redraw) return (this.needs_redraw = false);

        this.needs_redraw = false;
        this.universe.update(this._player.camera);

        this.updateFPS(delta);
        this.clearGL();
        this.render();

        return true;
    }

    private render(): void {
        this.universe.render(this._player.camera, Main.DRAWING_MODES[this.mode]);
        this.renderText();

        for (const planet of this.universe.planets) {
            const mvp = combineMatrices(
                this._player.camera.projectionMatrix,
                this._player.camera.viewMatrix,
                planet.sphere.modelMatrix
            );

            if (this.show_frustum) {
                this.drawFrustum(mvp, planet.sphere.frustum);
            }

            if (this.show_bounding_box) {
                this.drawBoundingBox(mvp, {
                    position: fill(0),
                    width: 2,
                    height: 2,
                    depth: 2
                });
            }
        }
    }

    private renderText(): void {
        this.setBlending(this.render_text);

        if (this.render_text) {

            const closest_planet = minimize(
                this.universe.planets,
                p => vec3.dist(p.center, this._player.position)
            );

            const dims = this.drawText(
                `patches: ${total(...this.universe.planets.map(p => p.sphere.faceCount))}`,
                g_vec(0, 0)
            );

            const avg_fps = (1000 / average(...this.fps_history)).toPrecision(2);
            const min_fps = (1000 / Math.max(...this.fps_history)).toPrecision(2);

            const altitude = formatDistance(getAltitude(
                this._player.position,
                closest_planet.sphere.center,
                closest_planet.sphere.radius
            ) * 1000);

            this.drawText(`alt: ${altitude}`, g_vec(0, dims.height));
            this.drawText(`avg fps: ${avg_fps}`, g_vec(0, dims.height * 2));
            this.drawText(`min fps: ${min_fps}`, g_vec(0, dims.height * 3));

            //normalize fps data
            const points: vec2[] = this.fps_history.map((fps, i) =>
                g_vec(i / this.fps_history.length, fps / 60)
            );

            this.drawPlot(g_vec(0, dims.height * 4), ...points);
        }
    }

}