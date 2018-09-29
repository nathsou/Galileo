import EventEmitter from "../Utils/EventEmitter";

export default class InputHandler extends EventEmitter {

    private static _instance: InputHandler;

    constructor(dom_element: EventTarget = document) {
        super();

        [
            'keydown',
            'keyup',
            'mousemove',
            'pointerlockchange',
            'pointerlockerror'
        ].forEach(event => {
            dom_element.addEventListener(event, e => this.emit(event, e), false);
        });
    }

    public onKeyDown(handler: (e: KeyboardEvent) => any): void {
        this.on('keydown', handler);
    }

    public onKeyUp(handler: (e: KeyboardEvent) => any): void {
        this.on('keyup', handler);
    }

    public onMouseMove(handler: (e: MouseEvent) => any): void {
        this.on('mousemove', handler);
    }

    public onPointerLockChange(handler: (e: Event) => any): void {
        this.on('pointerlockchange', handler);
    }

    public onPointerLockError(handler: (e: Event) => any): void {
        this.on('pointerlockerror', handler);
    }

    public static get instance(): InputHandler {
        if (InputHandler._instance === undefined) {
            InputHandler._instance = new InputHandler();
        }

        return InputHandler._instance;
    }
}