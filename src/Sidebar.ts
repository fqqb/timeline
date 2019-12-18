import { AnimatableProperty } from './AnimatableProperty';
import { Timenav } from './Timenav';

export abstract class Sidebar {

    protected _width = 200;
    protected _backgroundColor = 'white';
    protected _clippedWidth: AnimatableProperty;
    protected _opened = true;

    private mutationListeners: Array<() => void> = [];

    constructor(protected readonly timenav: Timenav) {
        this._clippedWidth = timenav.createAnimatableProperty(this._width);
    }

    addMutationListener(mutationListener: () => void) {
        if (this.mutationListeners.indexOf(mutationListener) === -1) {
            this.mutationListeners.push(mutationListener);
        }
    }

    removeMutationListener(mutationListener: () => void) {
        const idx = this.mutationListeners.indexOf(mutationListener);
        if (idx !== -1) {
            this.mutationListeners.splice(idx, 1);
        }
    }

    protected reportMutation() {
        this.mutationListeners.forEach(listener => listener());
    }

    abstract draw(ctx: CanvasRenderingContext2D): void;

    /**
     * The user-controlled pixel width of this sidebar.
     */
    get width() { return this._width; }
    set width(width: number) {
        this._width = width;
        this._clippedWidth.value = Math.min(width, this._clippedWidth.value);
        this.reportMutation();
    }

    get backgroundColor() { return this._backgroundColor; }
    set backgroundColor(backgroundColor: string) {
        this._backgroundColor = backgroundColor;
        this.reportMutation();
    }

    get clippedWidth() { return this._clippedWidth.value; }

    toggle() {
        if (this.opened) {
            this.close();
        } else {
            this.open();
        }
    }

    open() {
        if (!this.opened) {
            this._opened = true;
            this._clippedWidth.setTransition(this.timenav.frameTime, this._width);
            this.reportMutation();
        }
    }

    close() {
        if (this.opened) {
            this._opened = false;
            this._clippedWidth.setTransition(this.timenav.frameTime, 0);
            this.reportMutation();
        }
    }

    get opened() {
        return this._opened;
    }

    get closed() {
        return !this._opened;
    }
}
