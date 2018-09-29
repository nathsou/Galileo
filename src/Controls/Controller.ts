import Camera from './Camera';

export default interface Controller {
    camera: Camera;
    domElement: EventTarget;
    update(delta: number, normalized_altitude: number): boolean;
}