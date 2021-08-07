import { Drawable } from './Drawable';
import { Graphics } from './Graphics';

export interface DrawCoordinates {
    x: number;
    y: number;
    width: number;
    height: number;
}

export abstract class Line extends Drawable {

    private _label?: string;
    private _frozen = false;
    private _backgroundColor?: string;

    private offscreen?: Graphics;

    /** @hidden */
    coords: DrawCoordinates = {
        x: 0,
        y: 0,
        width: 0,
        height: 0,
    };

    /**
     * Human-friendly label for this line. Used in sidebar.
     */
    get label() { return this._label; }
    set label(label: string | undefined) {
        this._label = label;
        this.reportMutation();
    }

    /**
     * Background color of this line. If undefined, the background
     * color defaults to an odd/even pattern.
     */
    get backgroundColor() { return this._backgroundColor; }
    set backgroundColor(backgroundColor: string | undefined) {
        this._backgroundColor = backgroundColor;
        this.reportMutation();
    }

    /**
     * If set to true, this line stays fixed on top, even while
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

    drawUnderlay(g: Graphics) {
        // Override odd/even striped pattern
        // managed by Timeline instance itself.
        if (this.backgroundColor) {
            g.fillRect({
                x: this.x,
                y: this.y,
                width: g.canvas.width,
                height: this.height,
                color: this.backgroundColor,
            });
        }
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
