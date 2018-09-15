import Camera from './Camera';
import EventEmitter from "../Utils/EventEmitter";

export default interface Controller extends EventEmitter {
    camera: Camera;
    domElement: EventTarget;
    onMove(handler: () => void): void;
    onTurn(handler: () => void): void;
    update(delta: number, normalized_altitude: number): boolean;
    dispose(): void;
}