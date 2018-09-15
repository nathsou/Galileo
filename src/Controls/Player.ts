import Camera from './Camera';
import EventEmitter from '../Utils/EventEmitter';
import Controller from "./Controller";
import KeyboardMouseController from "./KeyboardMouseController";
import { vec3, quat } from 'gl-matrix';
import { radians, fill } from '../Utils/MathUtils';
import IcoSphere from '../Map/IcoSphere';

export enum PlayerControls { MOUSE_KEYBOARD } //TODO: VR_CONTROLLER, GAMEPAD...

export interface PlayerOptions {
    readonly position?: vec3,
    readonly orientation?: quat,
    readonly FOV?: number,
    readonly view_distance?: number,
    readonly controls?: PlayerControls
}

export default class Player extends EventEmitter {

    private camera: Camera;
    private controller: Controller;
    private readonly options: PlayerOptions;

    constructor(options: PlayerOptions, domElement: EventTarget = document) {
        super();

        this.options = {
            position: fill(0),
            orientation: quat.create(),
            FOV: radians(45),
            view_distance: 20000000,
            controls: PlayerControls.MOUSE_KEYBOARD,
            ...options
        };

        this.camera = new Camera(
            this.options.position,
            this.options.FOV,
            window.innerWidth / window.innerHeight,
            0.1,
            this.options.view_distance
        );

        this.camera.setOrientation(this.options.orientation);

        this.initController(domElement);
    }

    private initController(domElement: EventTarget) {
        switch (this.options.controls) {
            case PlayerControls.MOUSE_KEYBOARD:
            default:
                this.controller = new KeyboardMouseController(this.camera, domElement);

                this.bindEvent(this.controller, 'move');
                this.bindEvent(this.controller, 'turn');
                this.bindEvent(this.controller, 'keydown');
        }
    }

    //returns whether or not the player has moved during this update
    public update(delta: number, sphere: IcoSphere): boolean {
        const moved = this.controller.update(delta, sphere.getNormalizedAltitude(this.getPosition()));
        if (moved) this.camera.updateFrustum(sphere.getInverseModelMatrix());
        return moved;
    }

    public getCamera(): Camera {
        return this.camera;
    }

    public getPosition(): vec3 {
        return this.camera.getPosition();
    }

    public getFOV(): number {
        return this.camera.getFOV();
    }

    public getController(): Controller {
        return this.controller;
    }

    public dispose(): void {
        this.controller.dispose();
    }

}