import { Drawable } from './Drawable';

export abstract class Sidebar extends Drawable {

    private _width = 200;
    private _backgroundColor = 'white';
    private _clippedWidth = this.createAnimatableProperty(this._width);
    private _opened = true;

    /**
     * The user-controlled pixel width of this sidebar.
     */
    get width() { return this._width; }
    set width(width: number) {
        this._opened = true;
        this._width = width;
        this._clippedWidth.value = width;
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
