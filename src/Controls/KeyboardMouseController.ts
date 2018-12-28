import { quat, vec3 } from 'gl-matrix';
import { radians } from '../Utils/MathUtils';
import { normalize, scale } from '../Utils/Vec3Utils';
import Camera from './Camera';
import Controller from "./Controller";
import InputHandler from './InputHandler';
import { KeyboardLayout, KeyboardLayoutMap, KeyboardLayoutMaps } from "./KeyboardLayout";

export default class KeyboardMouseController implements Controller {

    public camera: Camera;
    public domElement: EventTarget;

    private _actions: Map<string, boolean>;
    private _speed_kps: number; //kilometers per second
    private _mouse_sensitivity: number;
    private _layout = KeyboardLayout.CLASSICAL;
    private _key_map: KeyboardLayoutMap;
    private _needs_update = true;
    private _pointerLockEnabled = false;

    constructor(
        camera: Camera,
        domElement: EventTarget,
        speed_kps = 10_000, //km per second
        mouse_sensitivity = 0.1
    ) {
        this.camera = camera;
        this.domElement = domElement;

        this._speed_kps = speed_kps;
        this._mouse_sensitivity = mouse_sensitivity;

        if (KeyboardLayoutMaps.has(this._layout)) {
            this._key_map = KeyboardLayoutMaps.get(this._layout);
        } else {
            throw new Error(`No Key mapping for '${KeyboardLayout[this._layout]}' defined in 'KeyboardLayoutMaps'`);
        }

        this._actions = new Map<string, boolean>();


        InputHandler.instance.onKeyDown(this.onKeyDown.bind(this));
        InputHandler.instance.onKeyUp(this.onKeyUp.bind(this));
        InputHandler.instance.onMouseMove(this.onMouseMove.bind(this));
        InputHandler.instance.onPointerLockChange(this.onPointerLockChange.bind(this));
        InputHandler.instance.onPointerLockError(this.onPointerLockError.bind(this));
    }

    private actionPerformed(action: string, keyCode: string): boolean {
        return this._key_map[action].some((code: string) => code === keyCode);
    }

    private updateActions(keyCode: string, key_down: boolean): void {
        for (let action in this._key_map) {
            if (this.actionPerformed(action, keyCode)) {
                this._actions.set(action, key_down);
            }
        }
    }

    private onKeyDown(event: KeyboardEvent): void {
        this.updateActions(event.code, true);
    }

    private onKeyUp(event: KeyboardEvent): void {
        this.updateActions(event.code, false);
    }

    public onPointerLockChange(event: Event) {
        this._pointerLockEnabled = !this._pointerLockEnabled;
    }

    public onPointerLockError(event: Event) {
        console.error('Pointer Lock Error');
    }


    private onMouseMove(event: MouseEvent): void {

        if (!this._pointerLockEnabled) return;

        const deltaYaw = radians(event.movementX * this._mouse_sensitivity);
        const deltaPitch = radians(event.movementY * this._mouse_sensitivity);

        const q = this.camera.orientation;
        quat.rotateX(q, q, deltaPitch);
        quat.rotateY(q, q, -deltaYaw);
        this.camera.orientation = q;

        this._needs_update = true;
    }

    //returns whether or not the player has moved during this update
    public update(delta: number, normalized_altitude: number): boolean {

        const speed = (delta / 1000) * this._speed_kps * normalized_altitude;
        const basis = this.camera.basis;
        let delta_pos = vec3.create(),
            moved = false;

        if (this._actions.get('forward')) {
            vec3.add(delta_pos, delta_pos, basis.front);
            moved = true;
        }

        if (this._actions.get('backward')) {
            vec3.sub(delta_pos, delta_pos, basis.front);
            moved = true;
        }

        if (this._actions.get('right')) {
            vec3.sub(delta_pos, delta_pos, basis.right);
            moved = true;
        }

        if (this._actions.get('left')) {
            vec3.add(delta_pos, delta_pos, basis.right);
            moved = true;
        }

        if (this._actions.get('up')) {
            vec3.add(delta_pos, delta_pos, basis.up);
            moved = true;
        }

        if (this._actions.get('down')) {
            vec3.sub(delta_pos, delta_pos, basis.up);
            moved = true;
        }

        this.camera.move(scale(normalize(delta_pos), speed));
        this.camera.updateViewMatrix();

        const updated = moved || this._needs_update;
        this._needs_update = false;

        return updated;
    }
}