
export default class Clock {

    private last_tick: number;

    constructor() {
        this.last_tick = Date.now();
    }

    public getDelta(): number {
        const now = Date.now();
        const delta = now - this.last_tick;
        this.last_tick = now;
        return delta;
    }
}