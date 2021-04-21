import { Drawable } from './Drawable';

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

    private offscreenCanvas = document.createElement('canvas');

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

    beforeDraw() {
        this.offscreenCanvas.width = this.timeline.mainWidth;
        this.offscreenCanvas.height = 20;
        const ctx = this.offscreenCanvas.getContext('2d')!;
        this.drawLineContent(ctx);
    }

    abstract drawLineContent(ctx: CanvasRenderingContext2D): void;

    drawContent(ctx: CanvasRenderingContext2D) {
        ctx.drawImage(this.offscreenCanvas, this.x, this.y);
    }

    getPreferredHeight() {
        return this.offscreenCanvas.height;
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
