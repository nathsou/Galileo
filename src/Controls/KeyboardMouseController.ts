import Camera from './Camera';
import EventEmitter from "../Utils/EventEmitter";
import Controller from "./Controller";
import { KeyboardLayout, KeyboardLayoutMap, KeyboardLayoutMaps } from "./KeyboardLayout";
import { vec3, quat } from 'gl-matrix';
import { normalize, scale, radians } from '../Utils/MathUtils';

export default class KeyboardMouseController extends EventEmitter implements Controller {

    public camera: Camera;
    public domElement: EventTarget;

    private actions: Map<string, boolean>;
    public speed: number;
    public mouse_sensitivity: number;
    private layout = KeyboardLayout.CLASSICAL;
    private key_map: KeyboardLayoutMap;
    private needs_update = true;
    private pointerLockEnabled = false;

    constructor(
        camera: Camera,
        domElement: EventTarget,
        speed = 10,
        mouse_sensitivity = 0.1
    ) {
        super();
        this.camera = camera;
        this.domElement = domElement;

        this.speed = speed;
        this.mouse_sensitivity = mouse_sensitivity;

        if (KeyboardLayoutMaps.has(this.layout)) {
            this.key_map = KeyboardLayoutMaps.get(this.layout);;
        } else {
            throw new Error(`No Key mapping for '${KeyboardLayout[this.layout]}' defined in 'KeyboardLayoutMaps'`);
        }

        this.actions = new Map<string, boolean>();

        this.domElement.addEventListener('keydown', this.onKeyDown.bind(this), false);
        this.domElement.addEventListener('keyup', this.onKeyUp.bind(this), false);
        this.domElement.addEventListener('mousemove', this.onMouseMove.bind(this), false);
        this.domElement.addEventListener('pointerlockchange', this.onPointerLockChange.bind(this), false);
        this.domElement.addEventListener('pointerlockerror', this.onPointerLockError.bind(this), false);
    }

    private actionPerformed(action: string, keyCode: string): boolean {
        return this.key_map[action].some((code: string) => code === keyCode);
    }

    private updateActions(keyCode: string, key_down: boolean): void {
        for (let action in this.key_map) {
            if (this.actionPerformed(action, keyCode)) {
                this.actions.set(action, key_down);
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
        this.pointerLockEnabled = !this.pointerLockEnabled;
    }

    public onPointerLockError(event: Event) {
        this.emit('pointerlockerror', event);
        console.error('Pointer Lock Error');
    }


    private onMouseMove(event: MouseEvent): void {

        if (!this.pointerLockEnabled) return;

        const deltaYaw = radians(event.movementX * this.mouse_sensitivity);
        const deltaPitch = radians(event.movementY * this.mouse_sensitivity);

        const q = this.camera.getOrientation();
        quat.rotateX(q, q, -deltaPitch);
        quat.rotateY(q, q, -deltaYaw);
        this.camera.setOrientation(q);

        this.emit('turn', event);
        this.needs_update = true;
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

        const speed = delta * this.speed * normalized_altitude;
        const basis = this.camera.getBasis();
        let delta_pos = vec3.create(),
            moved = false;

        if (this.actions.get('forward')) {
            vec3.add(delta_pos, delta_pos, basis.front);
            moved = true;
        }

        if (this.actions.get('backward')) {
            vec3.sub(delta_pos, delta_pos, basis.front);
            moved = true;
        }

        if (this.actions.get('right')) {
            vec3.add(delta_pos, delta_pos, basis.right);
            moved = true;
        }

        if (this.actions.get('left')) {
            vec3.sub(delta_pos, delta_pos, basis.right);
            moved = true;
        }

        if (this.actions.get('up')) {
            vec3.add(delta_pos, delta_pos, basis.up);
            moved = true;
        }

        if (this.actions.get('down')) {
            vec3.sub(delta_pos, delta_pos, basis.up);
            moved = true;
        }

        this.camera.lookAt(basis.front, basis.up);
        this.camera.move(scale(normalize(delta_pos), speed));

        if (moved) this.emit('move', delta_pos);

        const updated = moved || this.needs_update;
        this.needs_update = false;

        return updated;
    }
}