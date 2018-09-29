import Planet from "./Planet";
import Camera from "../Controls/Camera";

export default class Universe {

    private _planets: Planet[];

    constructor() {
        this._planets = [];
    }

    public add(...planets: Planet[]): void {
        this._planets.push(...planets);
    }

    public update(camera: Camera): void {
        for (const planet of this._planets) {
            planet.update(camera);
            planet.sphere.updateFrustum();
        }
    }

    public render(camera: Camera, mode?: number): void {
        for (const planet of this._planets.values()) {
            planet.render(camera, mode);
        }
    }

    public get planets(): Planet[] {
        return this._planets;
    }

}