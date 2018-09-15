export enum KeyboardLayout {
    CLASSICAL
};

export interface KeyboardLayoutMap {
    [index: string]: string[]

    readonly forward: string[],
    readonly backward: string[],
    readonly left: string[],
    readonly right: string[],
    readonly up: string[],
    readonly down: string[]
}

export const KeyboardLayoutMaps = new Map<KeyboardLayout, KeyboardLayoutMap>();

KeyboardLayoutMaps.set(KeyboardLayout.CLASSICAL, {
    forward: ['KeyW', 'ArrowUp'],
    backward: ['KeyS', 'ArrowDown'],
    left: ['KeyA', 'ArrowLeft'],
    right: ['KeyD', 'ArrowRight'],
    up: ['Space'],
    down: ['ShiftLeft', 'ShiftRight']
});