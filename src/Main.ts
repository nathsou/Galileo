import IcoSphere from './Map/IcoSphere';
import { mat4 } from 'gl-matrix';
import Clock from './Utils/Clock';
import Player from './Controls/Player';
import { terrainShader } from './Map/Shaders/TerrainShader';
import { Texture } from './Utils/Texture';
import { BoxHelper, createBoxHelper, FrustumHelper, createFrustumHelper, PrismHelper, createPrismHelper } from './Utils/Helpers';
import { colors } from './Utils/ColorUtils';
import { combineMatrices, fill, vec } from './Utils/MathUtils';
import IcoSphereFace, { Prism } from './Map/IcoSphereFace';

export default class Main {

    private clock: Clock;
    private sphere: IcoSphere;
    private player: Player;
    private mode = 0;
    private culling = true;
    private needs_redraw = true;
    private update_on_move = true;
    private render_debug = false;
    private drawFrustum: FrustumHelper;
    private drawBoundingBox: BoxHelper;
    private drawPrism: PrismHelper;
    private readonly debug_prisms = false;
    private static DRAWING_MODES = [
        WebGL2RenderingContext.TRIANGLES,
        WebGL2RenderingContext.POINTS
    ];

    constructor(private gl: WebGL2RenderingContext) {
        this.clock = new Clock()

        this.sphere = new IcoSphere(gl, {
            radius: 6371,
            max_lod: 5,
            patch_levels: 3,
            max_edge_size: 100
        });

        this.player = new Player({ position: vec(0, 0, this.sphere.getRadius() * 3) });

        this.sphere.generateSplitDistancesLUT(this.player.getCamera().getFOV());

        this.player.on('keydown', (ev: KeyboardEvent) => this.onKeyDown.call(this, ev));
        window.addEventListener('resize', () => {
            this.onResize.call(this, window.innerWidth, window.innerHeight);
        });

        this.sphere.init();
        this.setCulling(this.culling);

        this.drawFrustum = createFrustumHelper(gl);
        this.drawBoundingBox = createBoxHelper(gl, colors.pink);
        this.drawPrism = createPrismHelper(gl, colors.white);
    }

    private computeModelViewProjMatrix(): mat4 {
        //const model = this.sphere.getModelMatrix();
        const model = this.sphere.getModelMatrix();
        const view = this.player.getCamera().getViewMatrix();
        const proj = this.player.getCamera().getProjectionMatrix();

        return combineMatrices(proj, view, model);
    }

    public start(): void {
        this.update();
        requestAnimationFrame((time: number) => { this.start.call(this); });
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

            case 't': // show texture
                Texture.openInWindow(terrainShader, 1024, 512);
                break;
        }
    }

    private onResize(width: number, height: number): void {
        this.player.getCamera().setAspectRatio(width / height);
        this.needs_redraw = true;
    }

    private clearGL(): void {
        this.gl.viewport(0, 0, this.gl.canvas.width, this.gl.canvas.height);
        this.gl.clearColor(0, 0, 0, 1);
        this.gl.clear(this.gl.COLOR_BUFFER_BIT | this.gl.DEPTH_BUFFER_BIT);
        this.sphere.draw(this.player.getCamera(), Main.DRAWING_MODES[this.mode]);
    }

    private update(): boolean {
        const delta = this.clock.getDelta();

        this.needs_redraw =
            this.player.update(delta, this.sphere) ||
            !this.update_on_move ||
            this.needs_redraw;

        if (!this.needs_redraw) return (this.needs_redraw = false);

        this.needs_redraw = false;
        this.sphere.update(this.player.getCamera());

        this.clearGL();
        this.debug();

        return true;
    }

    private debug(): void {
        if (this.render_debug) {
            const mvp = this.computeModelViewProjMatrix();
            this.drawFrustum(this.player.getCamera().getFrustum(), mvp);

            if (this.debug_prisms) {
                const prisms: Prism[] = [];

                const getPrisms = (children: IcoSphereFace[]): void => {
                    for (const child of children) {
                        prisms.push(child.getBoundingPrism());

                        if (child.hasChildren()) {
                            getPrisms(child.getChildren());
                        }
                    }
                };

                getPrisms(this.sphere.getFaces());
                this.drawPrism(mvp, ...prisms);
            }

            mat4.scale(mvp, mvp, fill(1 / this.sphere.getRadius()));
            //this.drawBoundingBox(this.sphere.getBoundingBox(), mvp);
        }
    }


}

///@ts-ignore
window['Main'] = Main;