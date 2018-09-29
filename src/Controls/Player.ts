import { quat, vec3 } from 'gl-matrix';
import Sphere from '../Map/Sphere/Sphere';
import { getNormalizedAltitude, radians } from '../Utils/MathUtils';
import { fill } from '../Utils/Vec3Utils';
import Camera from './Camera';
import Controller from "./Controller";
import KeyboardMouseController from "./KeyboardMouseController";

export enum PlayerControls { MOUSE_KEYBOARD } //TODO: VR_CONTROLLER, GAMEPAD...

export interface PlayerOptions {
    readonly position?: vec3,
    readonly orientation?: quat,
    readonly FOV?: number,
    readonly max_view_distance?: number,
    readonly min_view_distance?: number,
    readonly controls?: PlayerControls
}

export default class Player {

    private _camera: Camera;
    private _controller: Controller;
    private readonly _options: PlayerOptions;

    constructor(options: PlayerOptions, domElement: HTMLElement | Document = document) {

        this._options = {
            position: fill(0),
            orientation: quat.create(),
            FOV: radians(45),
            max_view_distance: 299_792_458, // 1 light second
            min_view_distance: 0.1, // 1 light second
            controls: PlayerControls.MOUSE_KEYBOARD,
            ...options
        };

        this._camera = new Camera(
            this._options.position,
            this._options.FOV,
            window.innerWidth / window.innerHeight,
            this._options.min_view_distance,
            this._options.max_view_distance
        );

        this._camera.orientation = this._options.orientation;

        this.initController(domElement);
    }

    private initController(domElement: EventTarget) {
        switch (this._options.controls) {
            case PlayerControls.MOUSE_KEYBOARD:
            default:
                this._controller = new KeyboardMouseController(this._camera, domElement);
        }
    }

    //returns whether or not the player has moved dusring this update
    public update(delta: number, speed_factor = 1): boolean {
        return this._controller.update(delta, speed_factor);
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
}