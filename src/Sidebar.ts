import { Drawable } from './Drawable';

export abstract class Sidebar extends Drawable {

    private _width = 200;
    private _backgroundColor = 'white';
    private _clippedWidth = this.createAnimatableProperty(this._width);
    private _opened = true;

    /**
     * Pixel width of this sidebar.
     */
    get width() { return this._width; }
    set width(width: number) {
        this._opened = true;
        this._width = width;
        this._clippedWidth.value = width;
        this.reportMutation();
    }

    /**
     * Background color of the entire sidebar.
     */
    get backgroundColor() { return this._backgroundColor; }
    set backgroundColor(backgroundColor: string) {
        this._backgroundColor = backgroundColor;
        this.reportMutation();
    }

    /**
     * While a sidebar animation is underway (transitioning from open
     * to closed, or vice versa), this represents the current width
     * instead of the target width.
     */
    get clippedWidth() { return this._clippedWidth.value; }

    /**
     * Close the sidebar if it is currently opened, else open it.
     */
    toggle() {
        if (this.opened) {
            this.close();
        } else {
            this.open();
        }
    }

    /**
     * Open the sidebar.
     */
    open() {
        if (!this.opened) {
            this._opened = true;
            this._clippedWidth.setTransition(this.timeline.frameTime, this._width);
            this.reportMutation();
        }
    }

    /**
     * Close the sidebar.
     */
    close() {
        if (this.opened) {
            this._opened = false;
            this._clippedWidth.setTransition(this.timeline.frameTime, 0);
            this.reportMutation();
        }
    }

    /**
     * Returns whether the sidebar is currently opened.
     */
    get opened() {
        return this._opened;
    }
}
