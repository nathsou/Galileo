import { mat4, vec2 } from 'gl-matrix';
import Player from './Controls/Player';
import Planet from './Map/Planet';
import Universe from './Map/Universe';
import Clock from './Utils/Clock';
import { colors } from './Utils/ColorUtils';
import { BoxHelper, createBoxHelper, createFrustumHelper, FrustumHelper } from './Utils/Helpers';
import { average, combineMatrices } from './Utils/MathUtils';
import { createTextureHelper, TextureHelper } from './Utils/TextureHelper';
import { createPlotHelper, createTextHelper, PlotHelper, TextHelper } from './Utils/TextUtils';
import { fill, vec } from './Utils/Vec3Utils';
import { g_vec } from './Utils/VecUtils';

export default class Main {

    private clock: Clock;
    private universe: Universe;
    private _planet: Planet;
    private _player: Player;
    private mode = 0;
    private culling = true;
    private needs_redraw = true;
    private update_on_move = true;
    private render_debug = false;
    private render_text = true;
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

        const planet_ID = this.universe.add(new Planet(gl, {
            sphere_options: {
                radius: 6371,
                max_lod: 5,
                patch_levels: 3,
                max_edge_size: 100
            }
        }));

        this._planet = this.universe.planets.get(planet_ID);
        this._player = new Player({ position: vec(0, 0, this._planet.radius * 3) });

        this._player.on('keydown', (ev: KeyboardEvent) => this.onKeyDown.call(this, ev));
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
            this.gl.disable(this.gl.DEPTH_TEST);
        } else {
            this.gl.disable(this.gl.BLEND);
            this.gl.enable(this.gl.DEPTH_TEST);
        }
    }

    private computeModelViewProjMatrix(): mat4 {
        //const model = this.sphere.getModelMatrix();
        const model = this._planet.sphere.modelMatrix;
        const view = this._player.camera.viewMatrix;
        const proj = this._player.camera.projectionMatrix;

        return combineMatrices(proj, view, model);
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

            case 'c': // toggle backface culling
                this.setCulling(!this.culling);
                this.needs_redraw = true;
                break;

            case 'f': // show/hide frustum
                this.render_debug = !this.render_debug;
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
                if (this._planet.options.textures.height_map) {
                    this.drawTexture(
                        this._planet.options.textures.height_map,
                        g_vec(0, 0),
                        g_vec(this.gl.canvas.width, this.gl.canvas.height)
                    );
                }
                break;
            case 'n': // show normal map
                if (this._planet.options.textures.normal_map) {
                    this.drawTexture(
                        this._planet.options.textures.normal_map,
                        g_vec(0, 0),
                        g_vec(this.gl.canvas.width, this.gl.canvas.height)
                    );
                }
                break;

        }
    }

    private onResize(width: number, height: number): void {
        this._player.camera.aspectRatio = width / height;
        this._planet.sphere.updateLookUpTables(this._player.camera);
        this.needs_redraw = true;
    }

    private clearGL(): void {
        this.gl.viewport(0, 0, this.gl.canvas.width, this.gl.canvas.height);
        // Set the backbuffer's alpha to 1.0
        this.gl.clearColor(0, 0, 0, 1)
        this.gl.clear(this.gl.COLOR_BUFFER_BIT | this.gl.DEPTH_BUFFER_BIT);
        this._planet.render(this._player.camera, Main.DRAWING_MODES[this.mode]);
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

        this.needs_redraw =
            this._player.update(delta, this._planet.sphere) ||
            !this.update_on_move ||
            this.needs_redraw;

        if (!this.needs_redraw) return (this.needs_redraw = false);

        this.needs_redraw = false;
        this._planet.update(this._player.camera)

        this.updateFPS(delta);
        this.clearGL();
        this.debug();
        this.renderText();

        return true;
    }

    private renderText() {
        this.setBlending(this.render_text);

        if (this.render_text) {
            const dims = this.drawText(
                `faces: ${this._planet.sphere.faceCount}`,
                g_vec(0, 0)
            );

            const avg_fps = (1000 / average(...this.fps_history)).toPrecision(2);
            const min_fps = (1000 / Math.max(...this.fps_history)).toPrecision(2);

            this.drawText(`avg fps: ${avg_fps}`, g_vec(0, dims.height));
            this.drawText(`min fps: ${min_fps}`, g_vec(0, dims.height * 2));

            //normalize fps data
            const points: vec2[] = this.fps_history.map((fps, i) =>
                g_vec(i / this.fps_history.length, fps / 60)
            );

            this.drawPlot(g_vec(0, dims.height * 3), ...points);
        }
    }

    private debug(): void {
        if (this.render_debug) {
            const mvp = this.computeModelViewProjMatrix();
            //this.drawFrustum(mvp, this._player.camera.frustum);

            mat4.scale(mvp, mvp, fill(1 / this._planet.radius));
            this.drawBoundingBox(mvp, this._planet.sphere.boundingBox);
        }
    }

}

///@ts-ignore
window['Main'] = Main;