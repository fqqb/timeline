import { FillStyle } from '../graphics/FillStyle';
import { Drawable } from './Drawable';
import { SidebarResizeEvent } from './SidebarResizeEvent';

/**
 * Sidebar where band headers are displayed.
 */
export abstract class Sidebar extends Drawable {

    private _width = 200;
    private _background: FillStyle = 'white';
    private _clippedWidth = this.createAnimatableProperty(this._width);
    private _opened = true;

    private resizeListeners: Array<(ev: SidebarResizeEvent) => void> = [];

    /**
     * Pixel width of this sidebar.
     */
    get width() { return this._width; }
    set width(width: number) {
        this._opened = true;
        this._width = width;
        this._clippedWidth.value = Math.max(0, width);
        this.fireResizeEvent();
        this.reportMutation();
    }

    /**
     * Background style of the entire sidebar.
     */
    get background() { return this._background; }
    set background(background: FillStyle) {
        this._background = background;
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
            this.fireResizeEvent();
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
            this.fireResizeEvent();
            this.reportMutation();
        }
    }

    /**
     * Register a listener that receives updates when the sidebar changes width.
     */
    addResizeListener(listener: (ev: SidebarResizeEvent) => void) {
        this.resizeListeners.push(listener);
    }

    /**
     * Unregister a previously registered listener to stop receiving
     * sidebar resize events.
     */
    removeResizeListener(listener: (ev: SidebarResizeEvent) => void) {
        this.resizeListeners = this.resizeListeners
            .filter(el => (el !== listener));
    }

    private fireResizeEvent() {
        const actualWidth = this.opened ? this.width : 0;
        const resizeEvent: SidebarResizeEvent = {
            width: actualWidth,
        };
        this.resizeListeners.forEach(l => l(resizeEvent));
    }

    /**
     * Returns whether the sidebar is currently opened.
     */
    get opened() {
        return this._opened;
    }
}
