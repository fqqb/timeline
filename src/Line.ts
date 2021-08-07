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
    private _borderWidth?: number;
    private _borderColor?: string;
    private _marginBottom = 0;
    private _marginTop = 0;

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
     * Border width of this line. If undefined, the width
     * is determined by the property 'lineBorderWidth'
     * of the Timeline instance.
     */
    get borderWidth() { return this._borderWidth; }
    set borderWidth(borderWidth: number | undefined) {
        this._borderWidth = borderWidth;
        this.reportMutation();
    }

    /**
     * Border color of this line. If undefined, the color
     * is determined by the property 'lineBorderColor'
     * of the Timeline instance.
     */
    get borderColor() { return this._borderColor; }
    set borderColor(borderColor: string | undefined) {
        this._borderColor = borderColor;
        this.reportMutation();
    }

    /**
     * Whitespace in points between the top of this line and
     * line content.
     */
    get marginTop() { return this._marginTop; }
    set marginTop(marginTop: number) {
        this._marginTop = marginTop;
        this.reportMutation();
    }

    /**
     * Whitespace in points between the bottom of this line
     * and line content.
     */
    get marginBottom() { return this._marginBottom; }
    set marginBottom(marginBottom: number) {
        this._marginBottom = marginBottom;
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

    /** @hidden */
    beforeDraw(g: Graphics) {
        const contentHeight = this.calculateContentHeight(g);
        this.offscreen = g.createChild(this.timeline.mainWidth, contentHeight);
        this.drawLineContent(this.offscreen);
    }

    /**
     * Implementations should return required content height
     * (excluding margins) during the current draw operation.
     *
     * @hidden
     */
    abstract calculateContentHeight(g: Graphics): number;

    /** @hidden */
    abstract drawLineContent(g: Graphics): void;

    /** @hidden */
    drawContent(g: Graphics) {
        if (this.offscreen) {
            g.copy(this.offscreen, this.x, this.y + this.marginTop);
        }
    }

    /** @hidden */
    getContentHeight() {
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
