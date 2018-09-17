import Planet from "./Planet";
import Camera from "../Controls/Camera";

export default class Universe {

    private _planets: Map<number, Planet>;

    constructor() {
        this._planets = new Map<number, Planet>();
    }

    public add(planet: Planet): number {
        this._planets.set(planet.ID, planet);
        return planet.ID;
    }

    public update(camera: Camera) {
        for (const planet of this._planets.values()) {
            planet.update(camera);
        }
    }

    public render(camera: Camera, mode?: number) {
        for (const planet of this._planets.values()) {
            planet.render(camera, mode);
        }
    }

    public get planets(): Map<number, Planet> {
        return this._planets;
    }

}