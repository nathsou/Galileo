export type EventHandler = (event: any) => any;

export default abstract class EventEmitter {

    eventHandlers: Map<string, EventHandler[]>;

    constructor() {
        this.eventHandlers = new Map<string, EventHandler[]>();
    }

    public on(ev: string, handler: EventHandler): void {
        if (!this.isListening(ev)) {
            this.eventHandlers.set(ev, []);
        }

        this.eventHandlers.get(ev).push(handler);
    }

    protected isListening(ev: string): boolean {
        return this.eventHandlers.has(ev);
    }

    protected emit(ev: string, value?: any, thisArg?: any): void {
        if (this.isListening(ev)) {
            for (const handler of this.eventHandlers.get(ev)) {
                handler.call(thisArg, value);
            }
        }
    }

    protected bindEvent(em: EventEmitter, ev: string): void {
        em.on(ev, value => this.emit(ev, value));
    }

    public removeListener(ev: string): void {
        this.eventHandlers.delete(ev);
    }

    protected removeListeners(): void {
        this.eventHandlers.clear();
    }
}