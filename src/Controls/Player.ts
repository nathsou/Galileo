import Camera from './Camera';
import EventEmitter from '../Utils/EventEmitter';
import Controller from "./Controller";
import KeyboardMouseController from "./KeyboardMouseController";
import { vec3, quat } from 'gl-matrix';
import { radians, getNormalizedAltitude } from '../Utils/MathUtils';
import { fill } from '../Utils/Vec3Utils';
import Sphere from '../Map/Sphere/Sphere';

export enum PlayerControls { MOUSE_KEYBOARD } //TODO: VR_CONTROLLER, GAMEPAD...

export interface PlayerOptions {
    readonly position?: vec3,
    readonly orientation?: quat,
    readonly FOV?: number,
    readonly view_distance?: number,
    readonly controls?: PlayerControls
}

export default class Player extends EventEmitter {

    private _camera: Camera;
    private _controller: Controller;
    private readonly _options: PlayerOptions;

    constructor(options: PlayerOptions, domElement: HTMLElement | Document = document) {
        super();

        this._options = {
            position: fill(0),
            orientation: quat.create(),
            FOV: radians(45),
            view_distance: 20000000,
            controls: PlayerControls.MOUSE_KEYBOARD,
            ...options
        };

        this._camera = new Camera(
            this._options.position,
            this._options.FOV,
            window.innerWidth / window.innerHeight,
            0.1,
            this._options.view_distance
        );

        this._camera.orientation = this._options.orientation;

        this.initController(domElement);
    }

    private initController(domElement: EventTarget) {
        switch (this._options.controls) {
            case PlayerControls.MOUSE_KEYBOARD:
            default:
                this._controller = new KeyboardMouseController(this._camera, domElement);

                this.bindEvent(this._controller, 'move');
                this.bindEvent(this._controller, 'turn');
                this.bindEvent(this._controller, 'keydown');
        }
    }

    //returns whether or not the player has moved during this update
    public update(delta: number, sphere: Sphere): boolean {
        const normalizer_altitude = getNormalizedAltitude(this.position, sphere.center, sphere.radius);
        const moved = this._controller.update(delta, normalizer_altitude);
        if (moved) this._camera.updateFrustum(sphere.inverseModelMatrix);
        return moved;
    }

    public get camera(): Camera {
        return this._camera;
    }

    public get position(): vec3 {
        return this._camera.position;
    }

    public get FOV(): number {
        return this._camera.FOV;
    }

    public get controller(): Controller {
        return this._controller;
    }

    public dispose(): void {
        this._controller.dispose();
    }

}