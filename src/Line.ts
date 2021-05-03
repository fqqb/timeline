import { Drawable } from './Drawable';
import { Graphics } from './Graphics';

export interface DrawCoordinates {
    x: number;
    y: number;
    width: number;
    height: number;
}

export abstract class Line<T> extends Drawable {

    private _label?: string;
    private _frozen = false;
    private _data?: T;

    private offscreen?: Graphics;

    /** @hidden */
    coords: DrawCoordinates = {
        x: 0,
        y: 0,
        width: 0,
        height: 0,
    };

    /**
     * Custom data associated with this line.
     */
    get data() { return this._data; }
    set data(data: T | undefined) {
        this._data = data;
        this.reportMutation();
    }

    /**
     * Human-friendly label for this line. Typically used
     * in sidebars.
     */
    get label() { return this._label; }
    set label(label: string | undefined) {
        this._label = label;
        this.reportMutation();
    }

    /**
     * If set to true, this line should stay fixed on top, even while
     * scrolling vertically.
     *
     * Frozen lines precede non-frozen lines, regardless of the order in
     * which lines were added.
     */
    get frozen() { return this._frozen; }
    set frozen(frozen: boolean) {
        this._frozen = frozen;
        this.reportMutation();
    }

    beforeDraw(g: Graphics) {
        this.offscreen = g.createChild(this.timeline.mainWidth, 20);
        this.drawLineContent(this.offscreen);
    }

    abstract drawLineContent(g: Graphics): void;

    drawContent(g: Graphics) {
        if (this.offscreen) {
            g.copy(this.offscreen, this.x, this.y);
        }
    }

    getPreferredHeight() {
        return this.offscreen?.canvas.height || 0;
    }

    /**
     * The height of this line.
     */
    get height() { return this.coords.height; }

    /**
     * The width of this line.
     */
    get width() { return this.coords.width; }

    /**
     * The X-coordinate of this line.
     */
    get x() { return this.coords.x; }

    /**
     * The Y-coordinate of this line.
     */
    get y() { return this.coords.y; }
}
