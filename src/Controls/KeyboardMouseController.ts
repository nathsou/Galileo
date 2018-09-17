import Camera from './Camera';
import EventEmitter from "../Utils/EventEmitter";
import Controller from "./Controller";
import { KeyboardLayout, KeyboardLayoutMap, KeyboardLayoutMaps } from "./KeyboardLayout";
import { vec3, quat } from 'gl-matrix';
import { radians } from '../Utils/MathUtils';
import { normalize, scale } from '../Utils/Vec3Utils';

export default class KeyboardMouseController extends EventEmitter implements Controller {

    public camera: Camera;
    public domElement: EventTarget;

    private _actions: Map<string, boolean>;
    public _speed: number;
    public _mouse_sensitivity: number;
    private _layout = KeyboardLayout.CLASSICAL;
    private _key_map: KeyboardLayoutMap;
    private _needs_update = true;
    private _pointerLockEnabled = false;

    constructor(
        camera: Camera,
        domElement: EventTarget,
        speed = 10,
        mouse_sensitivity = 0.1
    ) {
        super();
        this.camera = camera;
        this.domElement = domElement;

        this._speed = speed;
        this._mouse_sensitivity = mouse_sensitivity;

        if (KeyboardLayoutMaps.has(this._layout)) {
            this._key_map = KeyboardLayoutMaps.get(this._layout);
        } else {
            throw new Error(`No Key mapping for '${KeyboardLayout[this._layout]}' defined in 'KeyboardLayoutMaps'`);
        }

        this._actions = new Map<string, boolean>();

        this.domElement.addEventListener('keydown', this.onKeyDown.bind(this), false);
        this.domElement.addEventListener('keyup', this.onKeyUp.bind(this), false);
        this.domElement.addEventListener('mousemove', this.onMouseMove.bind(this), false);
        this.domElement.addEventListener('pointerlockchange', this.onPointerLockChange.bind(this), false);
        this.domElement.addEventListener('pointerlockerror', this.onPointerLockError.bind(this), false);
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
        this.emit('keydown', event);
        this.updateActions(event.code, true);
    }

    private onKeyUp(event: KeyboardEvent): void {
        this.emit('keyup', event);
        this.updateActions(event.code, false);
    }

    public onPointerLockChange(event: Event) {
        this.emit('pointerlockchange', event);
        this._pointerLockEnabled = !this._pointerLockEnabled;
    }

    public onPointerLockError(event: Event) {
        this.emit('pointerlockerror', event);
        console.error('Pointer Lock Error');
    }


    private onMouseMove(event: MouseEvent): void {

        if (!this._pointerLockEnabled) return;

        const deltaYaw = radians(event.movementX * this._mouse_sensitivity);
        const deltaPitch = radians(event.movementY * this._mouse_sensitivity);

        const q = this.camera.orientation;
        quat.rotateX(q, q, -deltaPitch);
        quat.rotateY(q, q, -deltaYaw);
        this.camera.orientation = q;

        this.emit('turn', event);
        this._needs_update = true;
    }

    public dispose(): void {
        this.domElement.removeEventListener('keydown', this.onKeyDown.bind(this), false);
        this.domElement.removeEventListener('keyup', this.onKeyUp.bind(this), false);
        this.domElement.removeEventListener('mousemove', this.onMouseMove.bind(this), false);
        this.domElement.removeEventListener('pointerlockchange', this.onPointerLockChange.bind(this), false);
        this.domElement.removeEventListener('pointerlockerror', this.onPointerLockError.bind(this), false);
        this.removeListeners();
    }

    public onMove(handler: () => void): void {
        this.on('move', handler);
    }

    public onTurn(handler: () => void): void {
        this.on('turn', handler);
    }

    //returns whether or not the player has moved during this update
    public update(delta: number, normalized_altitude: number): boolean {

        const speed = delta * this._speed * normalized_altitude;
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
            vec3.add(delta_pos, delta_pos, basis.right);
            moved = true;
        }

        if (this._actions.get('left')) {
            vec3.sub(delta_pos, delta_pos, basis.right);
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

        this.camera.lookAt(basis.front, basis.up);
        this.camera.move(scale(normalize(delta_pos), speed));

        if (moved) this.emit('move', delta_pos);

        const updated = moved || this._needs_update;
        this._needs_update = false;

        return updated;
    }
}